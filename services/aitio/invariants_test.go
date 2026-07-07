package aitio

import (
	"testing"

	contract "aitiome/contract/goapi"
)

// TestResultInvariants asserts the load-bearing properties on EVERY compound, so
// a regression anywhere in the pipeline fails loudly. These are the guarantees we
// claim to the judges, checked mechanically rather than by inspection.
func TestResultInvariants(t *testing.T) {
	svc := mustNew(t)
	for _, c := range svc.compounds {
		r := svc.assessCompound(c)
		name := c.Name

		// 1. Confidence tier surfaced on every result.
		if r.ConfidenceTier == "" {
			t.Errorf("%s: missing confidence tier", name)
		}
		// 2. The decision is diagnostic and never gated on assay.
		if !r.Recovery.Diagnostic || r.Recovery.GatedOnAssay {
			t.Errorf("%s: diagnostic=%v gatedOnAssay=%v (want true/false)", name, r.Recovery.Diagnostic, r.Recovery.GatedOnAssay)
		}
		// 3. Corroboration is always flagged anti-diagnostic.
		if !r.Recovery.Corroboration.AntiDiagnostic {
			t.Errorf("%s: corroboration not flagged anti-diagnostic", name)
		}
		// 4. No strand is ever a recovery gate.
		for _, st := range r.Strands {
			if st.IsGate {
				t.Errorf("%s: strand %q is a gate; strands must never gate", name, st.Kind)
			}
		}
		// 5. Every positive reconstructs a pathway; every positive has the
		//    curated_mechanism strand supporting.
		if r.Recovery.Call == "positive" {
			if r.Pathway == nil {
				t.Errorf("%s: positive has no reconstructed pathway", name)
			}
			if !hasStrand(r.Strands, "curated_mechanism", "supports") {
				t.Errorf("%s: positive missing supporting curated_mechanism strand", name)
			}
		}
		// 6. Every negative has the curated_mechanism strand absent, and every
		//    adversarial decoy has at least one independent rejection line.
		if r.Recovery.Call == "negative" {
			if !hasStrand(r.Strands, "curated_mechanism", "absent") {
				t.Errorf("%s: negative missing 'absent' curated_mechanism strand", name)
			}
			if c.ConfidenceTier == "adversarial_negative" {
				if r.Rejection == nil || r.Rejection.Count < 1 {
					t.Errorf("%s: adversarial decoy has no rejection lines", name)
				}
			}
		}
		// 7. Every result carries a non-empty trace ending in a verdict.
		if len(r.Trace) == 0 || r.Trace[len(r.Trace)-1].Kind != "verdict" {
			t.Errorf("%s: trace missing or does not end in a verdict", name)
		}
	}
}

func hasStrand(strands []contract.EvidenceStrand, kind, status string) bool {
	for _, s := range strands {
		if s.Kind == kind && s.Status == status {
			return true
		}
	}
	return false
}
