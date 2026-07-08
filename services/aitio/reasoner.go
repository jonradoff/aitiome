package aitio

import (
	"bufio"
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"sync"
	"time"

	sdk "github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/option"

	contract "aitiome/contract/goapi"
)

// EvidenceReasoner turns a completed assessment into a calibrated prose account.
// Hard boundary: it EXPLAINS mechanism; it never makes or changes the recovery
// call (the call and tier are fixed inputs). This mirrors the recovery-rule spec:
// the decision is curated and deterministic; language is layered on top.
//
// The interface has a trivial deterministic implementation (direct) for the
// cached/demo path and a Claude-backed implementation for richer prose. Model is
// configurable per role (default Opus 4.8; Fable where it sticks).
type EvidenceReasoner interface {
	Synthesize(ctx context.Context, r contract.CompoundResult, cites []contract.Citation) (string, string, error) // prose, model
}

// --- citation registry (the [E#] pattern) ---

func buildCitations(r contract.CompoundResult) []contract.Citation {
	cites := make([]contract.Citation, 0, len(r.Strands))
	for i, st := range r.Strands {
		ref, link := citationRefFor(st.Kind, st.Detail, r.Compound.Name)
		cites = append(cites, contract.Citation{
			Marker:    fmt.Sprintf("E%d", i+1),
			Kind:      st.Kind,
			Detail:    st.Detail,
			Source:    st.Source,
			Reference: ref,
			URL:       link,
		})
	}
	return cites
}

func markerFor(cites []contract.Citation, kind string) string {
	for _, c := range cites {
		if c.Kind == kind {
			return "[" + c.Marker + "]"
		}
	}
	return ""
}

// --- direct (deterministic) reasoner ---

type directReasoner struct{}

func (directReasoner) Synthesize(_ context.Context, r contract.CompoundResult, cites []contract.Citation) (string, string, error) {
	return directProse(r, cites), "template", nil
}

func directProse(r contract.CompoundResult, cites []contract.Citation) string {
	name := r.Compound.Name
	if r.Recovery.Call == "positive" {
		var b strings.Builder
		fmt.Fprintf(&b, "%s is recovered as a %s positive. The call rests on curated mechanism alone %s: %s ",
			name, string(r.ConfidenceTier), markerFor(cites, "curated_mechanism"), r.Recovery.Rationale)
		if m := markerFor(cites, "mito_celltype_grounding"); m != "" {
			fmt.Fprintf(&b, "The endorsed AOP-3 cascade reconstructs from complex-I inhibition through mitochondrial dysfunction to nigrostriatal dopaminergic degeneration, resolving into the SOX6/AGTR1 vulnerable-neuron population %s. ", m)
		}
		var support []string
		for _, c := range cites {
			switch c.Kind {
			case "faers", "epidemiology", "bbb":
				support = append(support, humanKind(c.Kind)+" "+"["+c.Marker+"]")
			}
		}
		if len(support) > 0 {
			fmt.Fprintf(&b, "Independent strands corroborate without gating the call: %s. ", strings.Join(support, ", "))
		}
		b.WriteString("Assay activity is illustrative, not diagnostic. This is an evidence-ranked mechanistic hypothesis, not a claim of causation.")
		return b.String()
	}

	// negative / decoy
	var b strings.Builder
	if r.Compound.MechActiveTotal > 0 {
		fmt.Fprintf(&b, "%s is correctly not flagged. It is bioactive (%d mitochondrial, %d mechanistic assay hits) %s, exactly the profile that fools an activity-based model. ",
			name, r.Compound.MitoActive, r.Compound.MechActiveTotal, markerFor(cites, "assay_corroboration"))
	} else {
		fmt.Fprintf(&b, "%s is correctly not flagged. ", name)
	}
	fmt.Fprintf(&b, "There is no curated diagnostic signal %s", markerFor(cites, "curated_mechanism"))
	var lines []string
	if r.Rejection != nil {
		for _, ln := range r.Rejection.Lines {
			switch ln.Kind {
			case "bbb":
				lines = append(lines, "low brain exposure "+markerFor(cites, "bbb"))
			case "faers":
				lines = append(lines, "no real-world parkinsonism signal "+markerFor(cites, "faers"))
			}
		}
	}
	if len(lines) > 0 {
		fmt.Fprintf(&b, ", and independently %s", strings.Join(lines, ", "))
	}
	b.WriteString(". The specificity holds because the engine reasons on curated mechanism, not activity.")
	return b.String()
}

func humanKind(kind string) string {
	switch kind {
	case "faers":
		return "real-world pharmacovigilance"
	case "epidemiology":
		return "human epidemiology"
	case "bbb":
		return "brain-exposure plausibility"
	default:
		return kind
	}
}

// --- Claude-backed reasoner ---

type claudeReasoner struct {
	client sdk.Client
	model  string
}

const reasonerSystem = `You are the evidence-reasoning voice of Aitiome, an honest mechanistic-reasoning engine for the environmental exposome of neurodegeneration.

HARD RULES:
- The recovery CALL and confidence TIER are already decided by a curated, deterministic predicate. They are FIXED INPUTS. You must NOT change, hedge away, or second-guess them.
- You EXPLAIN the mechanistic reasoning in calibrated, carefully-hedged language. Never claim causation; say "evidence-ranked mechanistic hypothesis".
- Curated mechanism is the ONLY basis for the call. Assay/bioactivity is corroboration only and anti-diagnostic; never present it as decisive.
- Cite the provided evidence strands by their [E#] markers. Do not invent citations, sources, numbers, or genes beyond what is provided.
- 110 to 160 words. One paragraph. Output the final prose only, no preamble.`

func (c claudeReasoner) Synthesize(ctx context.Context, r contract.CompoundResult, cites []contract.Citation) (string, string, error) {
	var ev strings.Builder
	for _, cite := range cites {
		fmt.Fprintf(&ev, "[%s] %s (%s) - %s\n", cite.Marker, humanKind(cite.Kind), cite.Source, cite.Detail)
	}
	user := fmt.Sprintf(
		"Compound: %s (%s)\nFIXED call: %s\nFIXED tier: %s\nCurated rationale: %s\nAOP pathway attached: %v\nEvidence strands:\n%s\nWrite the calibrated synthesis, citing [E#].",
		r.Compound.Name, r.Compound.DTXSID, r.Recovery.Call, string(r.ConfidenceTier), r.Recovery.Rationale, r.Pathway != nil, ev.String())

	resp, err := c.client.Messages.New(ctx, sdk.MessageNewParams{
		Model:     sdk.Model(c.model),
		MaxTokens: 600,
		System:    []sdk.TextBlockParam{{Text: reasonerSystem}},
		Messages:  []sdk.MessageParam{sdk.NewUserMessage(sdk.NewTextBlock(user))},
	})
	if err != nil {
		return "", "", fmt.Errorf("claude reasoner: %w", err)
	}
	var out strings.Builder
	for _, block := range resp.Content {
		if tb, ok := block.AsAny().(sdk.TextBlock); ok {
			out.WriteString(tb.Text)
		}
	}
	used := string(resp.Model)
	// D1: watch for the requested model backing off (e.g. Fable to Opus on
	// life-sciences prompts) so we can adjust config rather than waste credits.
	if used != "" && used != c.model {
		log.Printf("reasoner: requested %s, served %s", c.model, used)
	}
	if strings.TrimSpace(out.String()) == "" {
		return "", used, fmt.Errorf("claude reasoner: empty response")
	}
	return strings.TrimSpace(out.String()), used, nil
}

// --- construction + service method ---

func newReasoner() (llm EvidenceReasoner, model string) {
	loadDotEnv()
	key := strings.TrimSpace(os.Getenv("ANTHROPIC_API_KEY"))
	if key == "" || os.Getenv("AITIO_LLM_SYNTHESIS") == "0" {
		return nil, ""
	}
	m := strings.TrimSpace(os.Getenv("AITIO_MODEL_REASONER"))
	if m == "" {
		m = "claude-opus-4-8"
	}
	return claudeReasoner{client: sdk.NewClient(option.WithAPIKey(key)), model: m}, m
}

type synthCacheKey struct{ id string }

// Synthesize returns a calibrated prose account of an assessment. Uses the
// Claude-backed reasoner when a key is configured, falling back to the
// deterministic direct reasoner on any error - so the endpoint always works.
func (s *Service) Synthesize(ctx context.Context, id string) (contract.Synthesis, bool) {
	c, ok := s.Resolve(ctx, id)
	if !ok {
		return contract.Synthesis{}, false
	}
	r := s.assessCompound(c)
	cites := buildCitations(r)

	key := synthCacheKey{id: strings.ToLower(c.Name)}
	if v, ok := s.synthCache.Load(key); ok {
		return v.(contract.Synthesis), true
	}

	prose, model, source := directProse(r, cites), "template", "direct"
	if s.reasoner != nil {
		cctx, cancel := context.WithTimeout(ctx, 25*time.Second)
		defer cancel()
		if p, m, err := s.reasoner.Synthesize(cctx, r, cites); err == nil {
			prose, model, source = p, m, "claude"
		} else {
			log.Printf("reasoner fell back to direct: %v", err)
		}
	}

	out := contract.Synthesis{
		Compound: c.Name, Call: r.Recovery.Call, Tier: string(c.ConfidenceTier),
		Prose: prose, Citations: cites, Model: model, Source: source,
	}
	s.synthCache.Store(key, out)
	return out, true
}

// loadDotEnv is a best-effort loader so local runs pick up .env without a shell
// export. Never overrides an already-set variable.
var dotEnvOnce sync.Once

func loadDotEnv() {
	dotEnvOnce.Do(func() {
		for _, path := range []string{".env", "../.env", "../../.env"} {
			f, err := os.Open(path)
			if err != nil {
				continue
			}
			sc := bufio.NewScanner(f)
			for sc.Scan() {
				line := strings.TrimSpace(sc.Text())
				if line == "" || strings.HasPrefix(line, "#") {
					continue
				}
				k, v, ok := strings.Cut(line, "=")
				if !ok {
					continue
				}
				k, v = strings.TrimSpace(k), strings.TrimSpace(v)
				if os.Getenv(k) == "" {
					_ = os.Setenv(k, v)
				}
			}
			f.Close()
			return
		}
	})
}
