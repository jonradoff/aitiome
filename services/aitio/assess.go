package aitio

import (
	"context"
	"sort"

	contract "aitiome/contract/goapi"
)

// Assess runs the validation-mode assessment for one identifier: resolve →
// curated recovery decision → (for positives) reconstruct the grounded AOP
// cascade → emit the trace-event stream. Convergent-evidence strands and decoy
// rejection lines are layered on in a later step (enrichment).
func (s *Service) Assess(ctx context.Context, id string) (contract.CompoundResult, bool) {
	c, ok := s.Resolve(ctx, id)
	if !ok {
		return contract.CompoundResult{}, false
	}
	return s.assessCompound(c), true
}

func (s *Service) assessCompound(c contract.Compound) contract.CompoundResult {
	rec := decide(c)

	res := contract.CompoundResult{
		Mode:           contract.ModeValidation,
		Compound:       c,
		Role:           c.Role,
		ConfidenceTier: c.ConfidenceTier,
		Recovery:       rec,
	}

	if rec.Call == "positive" {
		p := s.pickPathway(c)
		res.Pathway = p
	}
	res.Trace = s.buildTrace(c, rec, res.Pathway)
	return res
}

// pickPathway attaches the endorsed AOP to reconstruct for a positive: the AOP
// the compound is actually a registered stressor of when it is in the scaffold,
// otherwise the AOP-3 anchor as the mechanistic reference frame.
func (s *Service) pickPathway(c contract.Compound) *contract.Pathway {
	if c.AOP3Stressor {
		p := s.pathways[MVPAnchorAOP]
		return &p
	}
	for _, id := range c.AOPStressorOf {
		if p, ok := s.pathways[id]; ok {
			return &p
		}
	}
	p := s.pathways[MVPAnchorAOP]
	return &p
}

func (s *Service) buildTrace(c contract.Compound, rec contract.RecoveryDecision, p *contract.Pathway) []contract.TraceEvent {
	tr := []contract.TraceEvent{
		{Kind: "resolve", Compound: c.Name, ResolvedForm: resolvedForm(c),
			Label: "Resolved " + c.Name + " (DTXSID-first, salt-form correct)"},
	}

	ctd := rec.Predicate.CTDPdDirectEvidence
	aop := rec.Predicate.NeuroAOPStressor
	tr = append(tr,
		contract.TraceEvent{Kind: "predicate_eval", Term: "ctd_pd_direct", Hit: &ctd,
			Label: "CTD Parkinson's curated DirectEvidence"},
		contract.TraceEvent{Kind: "predicate_eval", Term: "neuro_aop_stressor", Hit: &aop,
			Label: "Registered neuro-AOP stressor"},
	)

	if rec.Call == "positive" && p != nil {
		nodes := append([]contract.PathwayNode(nil), p.Nodes...)
		sort.SliceStable(nodes, func(i, j int) bool { return nodes[i].Layer < nodes[j].Layer })
		for _, n := range nodes {
			ev := contract.TraceEvent{Kind: "node_enter", EventID: n.EventID, Title: n.Title, Label: n.Title}
			tr = append(tr, ev)
		}
		for _, e := range p.Edges {
			tr = append(tr, contract.TraceEvent{Kind: "edge_fire", KerID: e.KerID,
				Confidence: e.Confidence})
		}
		// Terminal frame: resolve into the vulnerable DA-neuron population.
		if cells := aoCellTypes(p); len(cells) > 0 {
			tr = append(tr, contract.TraceEvent{Kind: "ao_resolve", CellTypes: cells,
				Label: "Resolves into the SOX6/AGTR1 vulnerable dopaminergic-neuron population"})
		}
	}

	tr = append(tr, contract.TraceEvent{Kind: "verdict", Call: rec.Call,
		Tier: string(c.ConfidenceTier), Label: verdictLabel(rec.Call, c.ConfidenceTier)})
	return tr
}

func resolvedForm(c contract.Compound) string {
	if c.ToxcastCAS != "" && c.ToxcastCAS != c.CAS {
		return c.Name + " (tested as CAS " + c.ToxcastCAS + ")"
	}
	return c.Name
}

func aoCellTypes(p *contract.Pathway) []string {
	for _, n := range p.Nodes {
		if n.Grounding != nil && len(n.Grounding.CellTypes) > 0 {
			return n.Grounding.CellTypes
		}
	}
	return nil
}

func verdictLabel(call string, tier contract.ConfidenceTier) string {
	if call == "positive" {
		return "Recovered — " + string(tier)
	}
	return "Correctly not flagged — " + string(tier)
}
