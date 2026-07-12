package rlm

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	sdk "github.com/anthropics/anthropic-sdk-go"
)

// budgets (hard caps — brief §4). Depth is fixed at 1.
const (
	maxSearchesLeaf = 2 // leaves cover one narrow subproblem; 2 keeps them fast + reliable under slow web search
	maxSearchesRAG  = 4
	maxSearchesRAGP = 4 // 5 searches stalled past 15m under slow/throttled web search
	// Token ceilings sized so a full JSON evidence array completes without
	// truncation. JSON is token-dense (~2.5 chars/token), so a 10k-char array is
	// ~4k tokens — the old 4000 cap truncated mid-array and failed the parse.
	// RAG/RAG+ emit the WHOLE evidence set in one call, so they need the most room;
	// a leaf covers a single subproblem and needs less.
	maxTokensLeaf = 8000
	maxTokensRAG  = 16000
	maxTokensOrch = 4000 // room for 6 detailed sub-investigations (1500 truncated them)
	leafConcurrency = 2 // web_search appears org-rate-limited; 4 concurrent leaves starve each other (single-pass RAG succeeds, concurrent leaves time out). 2 reduces contention.
	maxBranches     = 6 // bound RLM leaf count → runtime + cost for overnight batches
	// Per-call watchdogs. Single-pass systems emit the whole evidence set (long) so
	// they get the most; leaves are narrow and degrade fast if web search stalls; the
	// planner/critic use no web tools and should be quick.
	singlePassTimeout = 20 * time.Minute // 2 low-signal RAG+ (chlorpyrifos/troglitazone) search exhaustively; give headroom
	leafTimeout       = 10 * time.Minute
	orchTimeout       = 3 * time.Minute
)

// evidenceSchema is the shared leaf contract — identical across RAG and RLM so
// they're scored on the same output (brief §5.2).
const evidenceSchema = `You assemble MECHANISTIC EVIDENCE linking a chemical to a neurodegenerative disease (Parkinson's=PD, Alzheimer's=AD). Use web_search to find PRIMARY sources (cite from the search result excerpts), then output ONLY a JSON array of evidence objects (in a ` + "```json```" + ` block). Do at most a few searches, then STOP searching and emit the JSON. Each object:
{
 "claim": "one specific, atomic claim",
 "chemical_identity": {"dtxsid": "", "name": "<the target chemical>", "form": ""},
 "disease": "PD" | "AD",
 "pathway_edge": {"source_node": "", "target_node": ""},
 "evidence_role": "diagnostic" | "corroboration" | "grounding" | "counterevidence",
 "study_context": {"species": "", "tissue": "", "dose": "", "route": ""},
 "direction": "supports" | "contradicts" | "limits" | "unresolved",
 "source": {"doi": "", "pmid": "", "url": "", "quoted_span": "<exact sentence copied verbatim from the source>"},
 "confidence_basis": ["primary source"],
 "limitations": ["..."],
 "verification_status": "source-resolved"
}
HARD RULES:
- Every object MUST carry a resolvable source (real DOI, PMID, or URL) AND an exact quoted_span copied verbatim. No source+span -> omit the object.
- chemical_identity MUST be the target chemical; resolve salts/parents/metabolites to it and note the form.
- evidence_role: diagnostic = curated causal (CTD DirectEvidence or a registered AOP stressor); corroboration = supportive-but-non-diagnostic (assay/bioactivity); grounding = mechanistic/cell-type; counterevidence = disconfirming, limiting, non-replication, or a therapeutic/probe confounder.
- Do NOT convert co-mention into causation: a mechanistic claim needs an explicit edge and study context.
- Prefer primary literature over reviews. Output the JSON array only, nothing after it.`

// SystemResult holds one system's assembled + validated evidence for a chemical.
type SystemResult struct {
	System   string           `json:"system"`
	Raw      []EvidenceObject `json:"-"`
	Accepted []EvidenceObject `json:"accepted"`
	Rejected []EvidenceObject `json:"rejected"`
	Cost     *Cost            `json:"-"`
	Calls    int              `json:"calls"`
	Err      string           `json:"error,omitempty"`
}

type planItem struct {
	TaskID      string `json:"task_id"`
	Instruction string `json:"instruction"`
}

// RunRAG is the baseline: one web-grounded Sonnet investigation, single pass.
func RunRAG(ctx context.Context, client sdk.Client, chem, disease string, cost *Cost) []EvidenceObject {
	user := fmt.Sprintf("Assemble the complete evidence set linking %s to %s. Search broadly, read the primary sources, then emit the evidence objects.", chem, disease)
	txt, err := investigate(ctx, client, ModelSonnet, evidenceSchema, user, maxTokensRAG, maxSearchesRAG, cost, "RAG", singlePassTimeout)
	if err != nil {
		log.Printf("[rlm] RAG error: %v", err)
		return nil
	}
	return extractEvidence(txt)
}

// RunRAGPlus is the strong baseline: one Sonnet investigation, but explicitly
// multi-query + role-complete + counterevidence-seeking (avoids a straw man).
func RunRAGPlus(ctx context.Context, client sdk.Client, chem, disease string, cost *Cost) []EvidenceObject {
	user := fmt.Sprintf(`Assemble the complete evidence set linking %s to %s. Run SEVERAL distinct searches to cover every evidence role: identity; curated/diagnostic status (CTD DirectEvidence, registered AOP stressor); mechanistic edges (MIE->KE->AO); human epidemiology and exposure; and — critically — counterevidence (negative/failed studies, non-replication, contradicting mechanisms, therapeutic/probe confounders). Rank sources by primacy; prefer primary studies over reviews. Then emit the evidence objects.`, chem, disease)
	txt, err := investigate(ctx, client, ModelSonnet, evidenceSchema, user, maxTokensRAG, maxSearchesRAGP, cost, "RAG+", singlePassTimeout)
	if err != nil {
		log.Printf("[rlm] RAG+ error: %v", err)
		return nil
	}
	return extractEvidence(txt)
}

const plannerSystem = `You are the ROOT planner of a recursive evidence compiler (RLM). Decompose a chemical-disease evidence-assembly task into 6-8 bounded, INDEPENDENT sub-investigations that can run in parallel. Output ONLY a JSON array of {"task_id": "...", "instruction": "a focused, self-contained investigation instruction"}.
Cover these angles: (1) identity resolution — parent/salts/metabolites, DTXSID/CAS; (2) curated/diagnostic status — CTD DirectEvidence and registered/endorsed AOP stressor; (3) mechanistic reconstruction — MIE, key events, adverse outcome, edges; (4) human relevance — epidemiology, occupational/environmental exposure, dose/route; (5) compartment relevance — BBB/CNS plausibility and vulnerable cell type; (6) counterevidence — negative studies, non-replication, contradicting mechanisms, therapeutic/probe confounders; (7) gap analysis — distance to a curated gate and the most discriminating next experiment. Output the JSON array inside a ` + "```json" + ` fenced block and nothing else.`

const criticSystem = `You are an ADVERSARIAL critic in a recursive evidence compiler. Given a chemical, a disease, and the claims assembled so far, design 3-5 sub-investigations whose PURPOSE is to REFUTE or LIMIT the case: search specifically for negative/failed studies, non-replication, contradicting mechanisms, therapeutic/probe confounders, and parent/salt/metabolite identity errors. Do not look for supporting evidence. Output ONLY a JSON array of {"task_id": "...", "instruction": "..."} inside a ` + "```json" + ` fenced block.`

// RunRLM1 is shallow (depth-1) RLM: an Opus planner decomposes the case, Sonnet
// leaves investigate each subproblem in parallel, then a deterministic merge.
func RunRLM1(ctx context.Context, client sdk.Client, chem, disease string, cost *Cost) []EvidenceObject {
	plan := makePlan(ctx, client, plannerSystem, fmt.Sprintf("Chemical: %s\nDisease: %s\nEmit the sub-investigation plan.", chem, disease), cost, "planner")
	return runLeaves(ctx, client, chem, disease, "RLM-1", plan, cost)
}

// RunRLMADV is RLM-1 plus a dedicated adversarial recursion: after the base pass,
// an Opus critic proposes refutation/identity sub-investigations that Sonnet runs.
func RunRLMADV(ctx context.Context, client sdk.Client, chem, disease string, cost *Cost) []EvidenceObject {
	base := RunRLM1(ctx, client, chem, disease, cost)
	claims := claimDigest(base)
	critic := makePlan(ctx, client, criticSystem, fmt.Sprintf("Chemical: %s\nDisease: %s\nClaims so far:\n%s\nEmit the adversarial sub-investigations.", chem, disease, claims), cost, "critic")
	adv := runLeaves(ctx, client, chem, disease, "RLM-ADV", critic, cost)
	return append(base, adv...)
}

func makePlan(ctx context.Context, client sdk.Client, system, user string, cost *Cost, label string) []planItem {
	txt, err := callJSON(ctx, client, ModelOpus, system, user, maxTokensOrch, cost, label)
	if err != nil {
		log.Printf("[rlm] %s error: %v", label, err)
		return nil
	}
	// Robust parse: locate the array (fence/bracket-aware), tolerate truncation by
	// salvaging complete items, and decode element-by-element so one bad item is
	// skipped rather than voiding the whole plan.
	body := arrayBody(txt)
	var items []json.RawMessage
	if err := json.Unmarshal([]byte(body), &items); err != nil {
		items = salvageObjects(body)
	}
	var plan []planItem
	for _, it := range items {
		var p planItem
		if json.Unmarshal(it, &p) == nil && strings.TrimSpace(p.Instruction) != "" {
			plan = append(plan, p)
		}
	}
	if len(plan) == 0 {
		log.Printf("[rlm] %s: no plan items parsed from %d-char response; head: %.160q", label, len(txt), head(txt, 160))
	}
	if len(plan) > maxBranches {
		plan = plan[:maxBranches]
	}
	return plan
}

// runLeaves fans out one Sonnet investigation per plan item (bounded concurrency)
// and collects the evidence objects, tagging each with its task. It tracks per-leaf
// outcomes (productive / empty / errored) and logs a health summary so the data
// quality of each RLM pass is visible — important when slow web search degrades some
// leaves to zero.
func runLeaves(ctx context.Context, client sdk.Client, chem, disease, phase string, plan []planItem, cost *Cost) []EvidenceObject {
	var (
		mu         sync.Mutex
		out        []EvidenceObject
		wg         sync.WaitGroup
		productive int // leaves that returned ≥1 object
		empty      int // leaves that completed but parsed 0 objects
		errored    int // leaves that errored/timed out
	)
	sem := make(chan struct{}, leafConcurrency)
	for _, p := range plan {
		wg.Add(1)
		go func(p planItem) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()
			user := fmt.Sprintf("Sub-investigation: %s\nChemical: %s  Disease: %s\nInvestigate ONLY this sub-problem, then emit the evidence objects.", p.Instruction, chem, disease)
			txt, err := investigate(ctx, client, ModelSonnet, evidenceSchema, user, maxTokensLeaf, maxSearchesLeaf, cost, "leaf:"+p.TaskID, leafTimeout)
			if err != nil {
				log.Printf("[rlm] %s leaf %q errored: %v", phase, p.TaskID, err)
				mu.Lock()
				errored++
				mu.Unlock()
				return
			}
			objs := extractEvidence(txt)
			for i := range objs {
				objs[i].Task = p.TaskID
			}
			mu.Lock()
			if len(objs) > 0 {
				productive++
			} else {
				empty++
			}
			out = append(out, objs...)
			mu.Unlock()
		}(p)
	}
	wg.Wait()
	log.Printf("[rlm] %s leaf health: %d planned → %d productive, %d empty, %d errored/timeout; %d objects",
		phase, len(plan), productive, empty, errored, len(out))
	return out
}

func claimDigest(objs []EvidenceObject) string {
	var b strings.Builder
	for i, o := range objs {
		if i >= 20 {
			break
		}
		fmt.Fprintf(&b, "- [%s] %s\n", o.EvidenceRole, o.Claim)
	}
	return b.String()
}
