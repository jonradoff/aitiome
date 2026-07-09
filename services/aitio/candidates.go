package aitio

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"sort"
	"strings"

	contract "aitiome/contract/goapi"
)

// candidateFile is the on-disk shape of data/candidates_{pd,ad}.json. Scores are
// DERIVED here from the evidence strands (never stored) so the ranking is fully
// auditable. See docs/decisions/0006-candidate-pipeline.md.
type candidateFile struct {
	Candidates []contract.Candidate `json:"candidates"`
	Backtest   *struct {
		HeldOut  string                       `json:"heldOut"`
		Method   string                       `json:"method"`
		Evidence []contract.CandidateEvidence `json:"evidence"`
	} `json:"backtest"`
}

// candidateLineWeights are the published, transparent value-of-information ranker
// weights. Only NON-bioactivity lines score — general bioactivity is barred here
// because it is anti-diagnostic (scores at/below chance vs the adversarial decoys).
var candidateLineWeights = []contract.CandidateWeight{
	{Line: "AOP", Weight: 5, Label: "Registered in-scope AOP stressor (gate-clearing)"},
	{Line: "MECH", Weight: 3, Label: "Mechanistic grounding (complex-I / mito / amyloid)"},
	{Line: "IPSC", Weight: 2, Label: "iPSC neuron toxicity"},
	{Line: "EPI", Weight: 2, Label: "Human epidemiology"},
	{Line: "XDIS", Weight: 2, Label: "Cross-disease (already a positive on the other axis)"},
	{Line: "ZF", Weight: 1, Label: "Zebrafish aminergic loss"},
	{Line: "INFERRED", Weight: 0.5, Label: "Association / CTD-inferred only"},
}

func candidateLineWeight(line string) float64 {
	up := strings.ToUpper(strings.TrimSpace(line))
	for _, w := range candidateLineWeights {
		if w.Line == up {
			return w.Weight
		}
	}
	return 0
}

func candidateStrengthMul(s string) float64 {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "strong":
		return 1.0
	case "moderate":
		return 0.6
	case "weak":
		return 0.3
	}
	return 0.5
}

// scoreEvidence is the transparent additive VOI score: sum of (line weight ×
// strength), plus a convergence bonus of +1 per independent line beyond the
// first. Decoys carry no qualifying strand → 0.
func scoreEvidence(ev []contract.CandidateEvidence) float64 {
	if len(ev) == 0 {
		return 0
	}
	var sum float64
	distinct := map[string]bool{}
	for _, e := range ev {
		sum += candidateLineWeight(e.Line) * candidateStrengthMul(e.Strength)
		distinct[strings.ToUpper(strings.TrimSpace(e.Line))] = true
	}
	if len(distinct) > 1 {
		sum += float64(len(distinct) - 1)
	}
	return math.Round(sum*10) / 10
}

func loadCandidateFile(name string) (candidateFile, error) {
	var cf candidateFile
	b, err := dataFS.ReadFile(name)
	if err != nil {
		return cf, err
	}
	if err := json.Unmarshal(b, &cf); err != nil {
		return cf, fmt.Errorf("parse %s: %w", name, err)
	}
	return cf, nil
}

// Candidates returns the VOI-ranked candidate queue for a disease axis plus the
// held-out prioritization backtest. It is a triage layer, never a predictor:
// entry requires a real non-bioactivity strand, only the curated gate promotes a
// candidate, and the adversarial decoys are carried as a permanent control that
// must rank last.
func (s *Service) Candidates(ctx context.Context, d contract.Disease) contract.CandidateQueue {
	if !d.Valid() {
		d = contract.DiseasePD
	}
	name := "data/candidates_pd.json"
	if d == contract.DiseaseAD {
		name = "data/candidates_ad.json"
	}
	q := contract.CandidateQueue{
		Disease:  d,
		Headline: "Chemicals with real but incomplete evidence, ranked by value-of-information — what a wet lab or curator should look at next. A triage queue, never a prediction.",
		Weights:  candidateLineWeights,
		Note:     "Entry requires at least one non-bioactivity strand; only the curated gate (CTD DirectEvidence or a registered in-scope AOP stressor) promotes a candidate to a positive. General bioactivity is barred — it is anti-diagnostic here. The adversarial decoys are carried as a permanent negative control and must rank last (they score 0). See ADR-0006.",
	}

	cf, err := loadCandidateFile(name)
	if err != nil || len(cf.Candidates) == 0 {
		return q
	}

	cands := cf.Candidates
	for i := range cands {
		cands[i].Disease = d
		cands[i].Score = scoreEvidence(cands[i].Evidence)
	}
	sort.SliceStable(cands, func(i, j int) bool {
		if cands[i].IsControl != cands[j].IsControl {
			return !cands[i].IsControl // controls always last
		}
		return cands[i].Score > cands[j].Score
	})
	q.Candidates = cands

	// Held-out prioritization backtest: score a known positive on its non-curated
	// strands alone and show it outranks every decoy — prioritization skill, not
	// causal discovery.
	if cf.Backtest != nil {
		hs := scoreEvidence(cf.Backtest.Evidence)
		decoyMax := 0.0
		for _, c := range cands {
			if c.IsControl && c.Score > decoyMax {
				decoyMax = c.Score
			}
		}
		passed := hs > decoyMax
		verdict := fmt.Sprintf("Did not clear the decoys (%.1f vs %.1f) — the ranker would not have surfaced this positive from non-curated evidence.", hs, decoyMax)
		if passed {
			verdict = fmt.Sprintf("Prioritized at %.1f on non-curated evidence alone — above every adversarial decoy (max %.1f). The ranker recovers a known positive it was not told about: prioritization skill, not causal discovery.", hs, decoyMax)
		}
		q.Backtest = &contract.CandidateBacktest{
			HeldOut:       cf.Backtest.HeldOut,
			HeldOutScore:  hs,
			DecoyMaxScore: decoyMax,
			Passed:        passed,
			Method:        cf.Backtest.Method,
			Verdict:       verdict,
			Evidence:      cf.Backtest.Evidence,
		}
	}
	return q
}
