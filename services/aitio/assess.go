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

// assessCompound is the PD-default assessment (byte-identical wrapper).
func (s *Service) assessCompound(c contract.Compound) contract.CompoundResult {
	return s.assessCompoundDisease(c, contract.DiseasePD)
}

func (s *Service) assessCompoundDisease(c contract.Compound, d contract.Disease) contract.CompoundResult {
	rec := decideDisease(c, d)

	res := contract.CompoundResult{
		Mode:           contract.ModeValidation,
		Disease:        d,
		Compound:       c,
		Role:           c.Role,
		ConfidenceTier: c.ConfidenceTier,
		Recovery:       rec,
		CrossDisease:   s.crossDiseaseVerdicts(c, d),
	}

	if rec.Call == "positive" {
		res.Pathway = s.pickPathwayDisease(c, d)
	}

	// Convergent-evidence enrichment is PD-specific (mito/DA-neuron grounding,
	// FAERS parkinsonism, BBB). AD enrichment is a later step; until then AD
	// results carry the recovery + trace but no PD-flavored strands (honest).
	if d == contract.DiseasePD {
		strands, rejection := s.enrich(c, rec, res.Pathway)
		res.Strands = strands
		res.Rejection = rejection
		res.Trace = s.buildTraceDisease(c, rec, res.Pathway, strands, rejection, d)
	} else {
		res.Trace = s.buildTraceDisease(c, rec, res.Pathway, nil, nil, d)
	}
	return res
}

// crossDiseaseVerdicts computes the compound's verdict on the OTHER disease axes,
// so a single-compound readout can surface the cross-disease story (e.g. lead is
// positive for both PD and AD) without leaving the selected disease context.
func (s *Service) crossDiseaseVerdicts(c contract.Compound, primary contract.Disease) []contract.DiseaseVerdict {
	var out []contract.DiseaseVerdict
	for _, d := range contract.Diseases {
		if d == primary {
			continue
		}
		rec := decideDisease(c, d)
		out = append(out, contract.DiseaseVerdict{
			Disease:   d,
			Label:     d.Short(),
			Call:      rec.Call,
			Rationale: rec.Rationale,
		})
	}
	return out
}

// pickPathway attaches the endorsed AOP for a PD positive (byte-identical wrapper).
func (s *Service) pickPathway(c contract.Compound) *contract.Pathway {
	return s.pickPathwayDisease(c, contract.DiseasePD)
}

// pickPathwayDisease attaches the AOP to reconstruct for a positive: the AOP the
// compound is a registered stressor of when it is in the scaffold, otherwise the
// disease's anchor AOP. For AD, only a disease-relevant AOP (or the AD anchor)
// is used — never the PD anchor. Returns nil if no disease-appropriate AOP is in
// the scaffold yet (AD pathway graphs are added in a later commit).
func (s *Service) pickPathwayDisease(c contract.Compound, d contract.Disease) *contract.Pathway {
	if d == contract.DiseasePD {
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
	// AD: prefer a scaffolded AD AOP the compound stresses, else the AD anchor.
	for _, id := range aopLegIDs(c, d) {
		if p, ok := s.pathways[id]; ok {
			return &p
		}
	}
	if p, ok := s.pathways[ADAnchorAOP]; ok {
		return &p
	}
	return nil
}

func (s *Service) buildTrace(c contract.Compound, rec contract.RecoveryDecision, p *contract.Pathway, strands []contract.EvidenceStrand, rej *contract.Rejection) []contract.TraceEvent {
	return s.buildTraceDisease(c, rec, p, strands, rej, contract.DiseasePD)
}

func (s *Service) buildTraceDisease(c contract.Compound, rec contract.RecoveryDecision, p *contract.Pathway, strands []contract.EvidenceStrand, rej *contract.Rejection, d contract.Disease) []contract.TraceEvent {
	tr := []contract.TraceEvent{
		{Kind: "resolve", Compound: c.Name, ResolvedForm: resolvedForm(c),
			Label: "Resolved " + c.Name + " (DTXSID-first, salt-form correct)"},
	}

	ctd := rec.Predicate.CTDPdDirectEvidence
	aop := rec.Predicate.NeuroAOPStressor
	ctdLabel := "CTD Parkinson's curated DirectEvidence"
	aopLabel := "Registered neuro-AOP stressor"
	aoLabel := "Resolves into the SOX6/AGTR1 vulnerable dopaminergic-neuron population"
	if d == contract.DiseaseAD {
		ctdLabel = "CTD Alzheimer's curated DirectEvidence"
		aopLabel = "Registered AD-relevant AOP stressor"
		aoLabel = "Resolves into the disease-associated microglia population (TREM2/APOE)"
	}
	tr = append(tr,
		contract.TraceEvent{Kind: "predicate_eval", Term: "ctd_pd_direct", Hit: &ctd, Label: ctdLabel},
		contract.TraceEvent{Kind: "predicate_eval", Term: "neuro_aop_stressor", Hit: &aop, Label: aopLabel},
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
		// Terminal frame: resolve into the disease's vulnerable cell population.
		if cells := aoCellTypes(p); len(cells) > 0 {
			tr = append(tr, contract.TraceEvent{Kind: "ao_resolve", CellTypes: cells, Label: aoLabel})
		}
	}

	// Convergent-evidence strands report as they land.
	for _, st := range strands {
		tr = append(tr, contract.TraceEvent{Kind: "strand", StrandKind: st.Kind, StrandStatus: st.Status, Label: st.Detail})
	}

	// Decoy rejection: each independent line, one at a time (the centerpiece).
	if rej != nil {
		for _, ln := range rej.Lines {
			tr = append(tr, contract.TraceEvent{Kind: "reject_line", StrandKind: ln.Kind, Line: ln.Detail, Label: ln.Detail})
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
