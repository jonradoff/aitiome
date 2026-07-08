package aitio

import "testing"

// TestValidationHarness is the spine's proof: on the recon ground truth the
// engine recovers all 13 known neurotoxicants and rejects all 15 negatives
// (incl. all 6 adversarial mito-active decoys), with ZERO false positives and
// ZERO false negatives. If the curated predicate ever regresses, this fails.
func TestValidationHarness(t *testing.T) {
	svc, err := New()
	if err != nil {
		t.Fatalf("New: %v", err)
	}
	v := svc.RunValidation(nil)
	s := v.Summary

	if s.FalsePositives != 0 {
		t.Errorf("false positives: want 0, got %d", s.FalsePositives)
	}
	if s.FalseNegatives != 0 {
		t.Errorf("false negatives: want 0, got %d", s.FalseNegatives)
	}
	if s.PositivesRecovered != 13 || s.PositivesTotal != 13 {
		t.Errorf("positives recovered: want 13/13, got %d/%d", s.PositivesRecovered, s.PositivesTotal)
	}
	if s.NegativesRejected != 15 || s.NegativesTotal != 15 {
		t.Errorf("negatives rejected: want 15/15, got %d/%d", s.NegativesRejected, s.NegativesTotal)
	}
	if s.AdversarialRejected != 6 || s.AdversarialTotal != 6 {
		t.Errorf("adversarial decoys rejected: want 6/6, got %d/%d", s.AdversarialRejected, s.AdversarialTotal)
	}
}

// TestNeverGatedOnAssay asserts the anti-diagnostic invariant holds structurally:
// every decision declares diagnostic=true, gatedOnAssay=false, and the six
// mito-active adversarial decoys are called negative despite assay activity.
func TestNeverGatedOnAssay(t *testing.T) {
	svc, err := New()
	if err != nil {
		t.Fatalf("New: %v", err)
	}
	v := svc.RunValidation(nil)
	for _, r := range v.PerCompound {
		if !r.Recovery.Diagnostic || r.Recovery.GatedOnAssay {
			t.Errorf("%s: invariant broken (diagnostic=%v gatedOnAssay=%v)",
				r.Compound.Name, r.Recovery.Diagnostic, r.Recovery.GatedOnAssay)
		}
		if r.ConfidenceTier == "adversarial_negative" {
			if r.Recovery.Call != "negative" {
				t.Errorf("adversarial decoy %s was flagged positive", r.Compound.Name)
			}
			if !r.Recovery.Corroboration.AssayActive {
				t.Errorf("decoy %s expected to be assay-active (the whole point)", r.Compound.Name)
			}
		}
	}
}
