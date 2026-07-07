package aitio

import (
	"encoding/csv"
	"fmt"
	"strings"

	contract "aitiome/contract/goapi"
)

// Convergent-evidence strands. These GROUND the pathway and enrich confidence;
// they are NEVER new recovery gates (IsGate=false everywhere). The decoy story is
// hardened by requiring nothing of them — yet several decoys independently fail
// them too (curated absence + BBB non-penetrance + zero FAERS parkinsonism signal).

type faersRow struct {
	reports, parkinsonism int
	ror                   string
	signal                bool
	covered               bool
}
type bbbRow struct {
	call      string // BBB+/BBB-/+/-
	penetrant bool
	covered   bool
}
type epiRow struct {
	estimate, source, kind string
	covered                bool
}

type evidenceStore struct {
	faers map[string]faersRow
	bbb   map[string]bbbRow
	epi   map[string]epiRow
}

func loadEvidence() (*evidenceStore, error) {
	es := &evidenceStore{
		faers: map[string]faersRow{},
		bbb:   map[string]bbbRow{},
		epi:   map[string]epiRow{},
	}

	rows, col, err := readCSV("data/faers_coverage.csv")
	if err != nil {
		return nil, err
	}
	for _, r := range rows {
		name := normalizeID(get(r, col, "name"))
		es.faers[name] = faersRow{
			reports:      atoi(get(r, col, "faers_reports")),
			parkinsonism: atoi(get(r, col, "parkinsonism_reports")),
			ror:          get(r, col, "ROR"),
			signal:       parseBool(get(r, col, "signal")),
			covered:      true,
		}
	}

	rows, col, err = readCSV("data/bbb_coverage.csv")
	if err != nil {
		return nil, err
	}
	for _, r := range rows {
		name := normalizeID(get(r, col, "name"))
		call := get(r, col, "bbb_call")
		es.bbb[name] = bbbRow{call: call, penetrant: strings.Contains(call, "+"), covered: true}
	}

	rows, col, err = readCSV("data/epidemiology_coverage.csv")
	if err != nil {
		return nil, err
	}
	for _, r := range rows {
		name := normalizeID(get(r, col, "compound"))
		es.epi[name] = epiRow{
			estimate: get(r, col, "pd_risk_estimate"),
			source:   get(r, col, "source"),
			kind:     get(r, col, "evidence_type"),
			covered:  true,
		}
	}
	return es, nil
}

// enrich assembles the convergent-evidence strands for a result and, for
// negatives, the independent rejection lines. Every strand carries IsGate=false.
func (s *Service) enrich(c contract.Compound, rec contract.RecoveryDecision, p *contract.Pathway) ([]contract.EvidenceStrand, *contract.Rejection) {
	key := normalizeID(c.Name)
	var strands []contract.EvidenceStrand
	add := func(kind, status, detail, source string) {
		strands = append(strands, contract.EvidenceStrand{Kind: kind, Status: status, Detail: detail, Source: source, IsGate: false})
	}

	if rec.Call == "positive" {
		add("curated_mechanism", "supports", rec.Rationale, "CTD curated DirectEvidence / AOP-Wiki")
		if p != nil && pathwayGrounded(p) {
			add("mito_celltype_grounding", "supports",
				"MIE grounded in MitoCarta Complex-I Q-site subunits; adverse outcome in the Kamath SOX6/AGTR1 vulnerable dopaminergic-neuron population.",
				"MitoCarta3.0 + Kamath 2022 Nat Neurosci")
		}
		if c.MechActiveTotal > 0 {
			add("assay_corroboration", "supports",
				fmt.Sprintf("%d mechanistic assay hits illustrate the chain (corroboration only — anti-diagnostic, not a discriminator).", c.MechActiveTotal),
				"EPA ToxCast via NICEATM ICE")
		} else {
			add("assay_corroboration", "not_assessable", "Thin in ToxCast (research reagent / metal).", "EPA ToxCast via NICEATM ICE")
		}
	} else {
		add("curated_mechanism", "absent",
			"No curated Parkinson's DirectEvidence and not a registered neuro-AOP stressor.",
			"CTD curated DirectEvidence / AOP-Wiki")
		if c.MechActiveTotal > 0 {
			add("assay_corroboration", "supports",
				fmt.Sprintf("Bioactive: %d mechanistic assay hits (incl. %d mitochondrial). This is the imposter signal the engine correctly does NOT act on.", c.MechActiveTotal, c.MitoActive),
				"EPA ToxCast via NICEATM ICE")
		}
	}

	// FAERS strand.
	if f, ok := s.evidence.faers[key]; ok && f.covered {
		if f.signal {
			add("faers", "supports", fmt.Sprintf("Parkinsonism disproportionality signal (ROR %s) across %d reports.", f.ror, f.reports), "openFDA FAERS")
		} else if f.reports > 0 {
			add("faers", "absent", fmt.Sprintf("Zero parkinsonism signal across %d FAERS reports (ROR %s, not elevated).", f.reports, dash(f.ror)), "openFDA FAERS")
		} else {
			add("faers", "not_assessable", "No assessable FAERS reports.", "openFDA FAERS")
		}
	}

	// Epidemiology strand (positives).
	if e, ok := s.evidence.epi[key]; ok && e.covered && !strings.HasPrefix(e.kind, "lab-tool") {
		add("epidemiology", "supports", fmt.Sprintf("%s (%s).", e.estimate, e.source), "Published cohorts / meta-analyses")
	}

	// BBB plausibility strand (supporting gate, not a discriminator).
	if b, ok := s.evidence.bbb[key]; ok && b.covered {
		switch {
		case rec.Call == "positive" && b.penetrant:
			add("bbb", "supports", "Brain-penetrant — plausible CNS exposure.", "B3DB / BOILED-Egg (structure-based)")
		case rec.Call == "positive" && !b.penetrant:
			add("bbb", "not_assessable", "Non-penetrant by structure (e.g. lesioning agent delivered directly / enters via transporters).", "B3DB / BOILED-Egg (structure-based)")
		case rec.Call == "negative" && !b.penetrant:
			add("bbb", "refutes", "Low brain exposure (BBB-negative): an orthogonal pharmacokinetic reason it cannot be a driver.", "B3DB / BOILED-Egg (structure-based)")
		default:
			add("bbb", "not_assessable", "Brain-penetrant, but penetrance is not a discriminator here.", "B3DB / BOILED-Egg (structure-based)")
		}
	}

	// Rejection = the independent lines that each, on their own, withhold a
	// positive call. Assembled truthfully per compound (not every decoy shows all
	// three — that honesty is the point).
	if rec.Call == "negative" {
		var lines []contract.EvidenceStrand
		for _, st := range strands {
			if (st.Kind == "curated_mechanism" && st.Status == "absent") ||
				(st.Kind == "bbb" && st.Status == "refutes") ||
				(st.Kind == "faers" && st.Status == "absent") {
				lines = append(lines, st)
			}
		}
		return strands, &contract.Rejection{Lines: lines, Count: len(lines)}
	}
	return strands, nil
}

func pathwayGrounded(p *contract.Pathway) bool {
	for _, n := range p.Nodes {
		if n.Grounding != nil && (len(n.Grounding.Genes) > 0 || len(n.Grounding.CellTypes) > 0) {
			return true
		}
	}
	return false
}

func dash(s string) string {
	if strings.TrimSpace(s) == "" {
		return "n/a"
	}
	return s
}

// --- small CSV helpers ---

func readCSV(path string) ([][]string, map[string]int, error) {
	b, err := dataFS.ReadFile(path)
	if err != nil {
		return nil, nil, fmt.Errorf("read %s: %w", path, err)
	}
	all, err := csv.NewReader(strings.NewReader(string(b))).ReadAll()
	if err != nil {
		return nil, nil, fmt.Errorf("parse %s: %w", path, err)
	}
	if len(all) < 2 {
		return nil, nil, fmt.Errorf("%s: no data rows", path)
	}
	return all[1:], index(all[0]), nil
}

func get(row []string, col map[string]int, name string) string {
	if i, ok := col[name]; ok && i < len(row) {
		return strings.TrimSpace(row[i])
	}
	return ""
}
