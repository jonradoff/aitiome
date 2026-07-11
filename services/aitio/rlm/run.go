package rlm

import (
	"context"
	"log"
	"time"

	sdk "github.com/anthropics/anthropic-sdk-go"
)

// SystemSummary is the scored outcome for one system on one chemical. The field
// set is chosen to drive the presentation comparison table directly: yield
// (Accepted), groundedness (Rejected + rejection reasons in RejectedObjects),
// completeness (RoleCoverage), honesty (Counterevidence), breadth (DistinctSources),
// effort (Calls + WebSearches), latency (DurationSec), and efficiency (CostUSD,
// and cost-per-object derived at render time).
type SystemSummary struct {
	System              string           `json:"system"`
	Accepted            int              `json:"accepted"`
	Rejected            int              `json:"rejected"`
	RoleCoverage        map[string]int   `json:"role_coverage"`
	Counterevidence     int              `json:"counterevidence"`
	DistinctSources     int              `json:"distinct_sources"`
	DiagnosticRecovered bool             `json:"diagnostic_recovered"`
	UniqueVsRAG         int              `json:"unique_vs_rag"`
	ProductiveLeaves    int              `json:"productive_leaves"` // distinct RLM sub-investigations that contributed ≥1 object (0 for RAG/RAG+)
	Calls               int              `json:"model_calls"`
	CostUSD             float64          `json:"cost_usd"`
	WebSearches         int64            `json:"web_searches"`
	DurationSec         float64          `json:"duration_sec"`
	Objects             []EvidenceObject `json:"objects"`
	RejectedObjects     []EvidenceObject `json:"rejected_objects"`
	CostReport          string           `json:"-"`
}

// Comparison is the full per-chemical result across all four systems.
type Comparison struct {
	Chemical  string          `json:"chemical"`
	Disease   string          `json:"disease"`
	DTXSID    string          `json:"dtxsid,omitempty"`
	Systems   []SystemSummary `json:"systems"`
	TotalCost float64         `json:"total_cost_usd"`
}

type systemFn = func(context.Context, sdk.Client, string, string, *Cost) []EvidenceObject

// RunComparison runs one chemical through RAG, RAG+, RLM-1, and RLM-ADV (in that
// order, sequentially), validating + merging each on the shared deterministic
// rule, and returns per-system metrics and cost. Nothing here touches the live
// recovery gate — this produces evidence bundles, not disease calls.
func RunComparison(ctx context.Context, client sdk.Client, chem, disease, dtxsid string, only map[string]bool, seed []SystemSummary, onProgress func(Comparison)) Comparison {
	target := ChemIdentity{Name: chem, DTXSID: dtxsid}
	systems := []struct {
		name string
		fn   systemFn
	}{
		{"RAG", RunRAG},
		{"RAG+", RunRAGPlus},
		{"RLM-1", RunRLM1},
		{"RLM-ADV", RunRLMADV},
	}
	// Resume support: pre-populate with systems completed in a prior run, and skip
	// re-running them. Canonical order (RAG, RAG+, RLM-1, RLM-ADV) is preserved.
	cmp := Comparison{Chemical: chem, Disease: disease, DTXSID: dtxsid}
	done := map[string]bool{}
	for _, s := range seed {
		cmp.Systems = append(cmp.Systems, s)
		cmp.TotalCost += s.CostUSD
		done[s.System] = true
	}
	for _, s := range systems {
		if done[s.name] {
			continue
		}
		if len(only) > 0 && !only[s.name] {
			continue
		}
		cost := NewCost()
		t0 := time.Now()
		log.Printf("[rlm] %-7s running on %s...", s.name, chem)
		raw := s.fn(ctx, client, chem, disease, cost)
		log.Printf("[rlm] %-7s done in %s — %d raw objects, %d calls, $%.4f",
			s.name, time.Since(t0).Round(time.Second), len(raw), cost.TotalCalls(), cost.Dollars())
		accepted, rejected := Validate(raw, target)
		merged := Merge(accepted)
		cmp.Systems = append(cmp.Systems, SystemSummary{
			System:              s.name,
			Accepted:            len(merged),
			Rejected:            len(rejected),
			RoleCoverage:        RoleCoverage(merged),
			Counterevidence:     countCounter(merged),
			DistinctSources:     distinctSources(merged),
			DiagnosticRecovered: RoleCoverage(merged)["diagnostic"] > 0,
			ProductiveLeaves:    distinctTasks(merged),
			Calls:               cost.TotalCalls(),
			CostUSD:             cost.Dollars(),
			WebSearches:         cost.WebSearches,
			DurationSec:         time.Since(t0).Seconds(),
			Objects:             merged,
			RejectedObjects:     rejected,
			CostReport:          cost.Report(),
		})
		cmp.TotalCost += cost.Dollars()
		// Persist after each system so an interruption never loses completed work.
		if onProgress != nil {
			onProgress(cmp)
		}
	}
	// UniqueVsRAG: evidence a system assembled that the RAG baseline did not.
	// Only meaningful when RAG is the first system present (the baseline).
	if len(cmp.Systems) > 0 && cmp.Systems[0].System == "RAG" {
		ragKeys := map[string]bool{}
		for _, o := range cmp.Systems[0].Objects {
			ragKeys[MergeKey(o)] = true
		}
		for i := 1; i < len(cmp.Systems); i++ {
			n := 0
			for _, o := range cmp.Systems[i].Objects {
				if !ragKeys[MergeKey(o)] {
					n++
				}
			}
			cmp.Systems[i].UniqueVsRAG = n
		}
	}
	return cmp
}

func countCounter(objs []EvidenceObject) int {
	n := 0
	for _, o := range objs {
		if o.EvidenceRole == "counterevidence" || o.Direction == "contradicts" || o.Direction == "limits" {
			n++
		}
	}
	return n
}

// distinctTasks counts the distinct RLM sub-investigations (leaf task IDs) that
// contributed at least one object — a data-quality signal for the RLM systems (it
// stays 0 for RAG/RAG+, whose objects carry no task tag).
func distinctTasks(objs []EvidenceObject) int {
	seen := map[string]struct{}{}
	for _, o := range objs {
		if o.Task != "" {
			seen[o.Task] = struct{}{}
		}
	}
	return len(seen)
}

// distinctSources counts the unique primary sources cited across the evidence set
// (keyed by DOI, else PMID, else URL) — a breadth-of-literature signal for the
// comparison table.
func distinctSources(objs []EvidenceObject) int {
	seen := map[string]struct{}{}
	for _, o := range objs {
		key := o.Source.DOI
		if key == "" {
			key = o.Source.PMID
		}
		if key == "" {
			key = o.Source.URL
		}
		if key != "" {
			seen[key] = struct{}{}
		}
	}
	return len(seen)
}
