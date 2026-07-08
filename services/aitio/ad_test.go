package aitio

import (
	"context"
	"testing"

	contract "aitiome/contract/goapi"
)

// TestPDUnchangedByDiseaseAxis is the regression guard: the PD validation must
// still be 12 recovered / 15 rejected / 6 adversarial rejected / fp=0 / fn=0.
func TestPDUnchangedByDiseaseAxis(t *testing.T) {
	s := mustService(t)
	v := s.RunValidation(context.Background())
	got := v.Summary
	if got.PositivesRecovered != 12 || got.PositivesTotal != 12 {
		t.Fatalf("PD positives: got %d/%d, want 12/12", got.PositivesRecovered, got.PositivesTotal)
	}
	if got.NegativesRejected != 15 || got.NegativesTotal != 15 {
		t.Fatalf("PD negatives: got %d/%d, want 15/15", got.NegativesRejected, got.NegativesTotal)
	}
	if got.FalsePositives != 0 || got.FalseNegatives != 0 {
		t.Fatalf("PD errors: fp=%d fn=%d, want 0/0", got.FalsePositives, got.FalseNegatives)
	}
	// PD leg is disease-agnostic (Option B): any neuro-AOP membership counts.
	if v2 := s.RunValidationDisease(context.Background(), contract.DiseasePD); v2.Summary != got {
		t.Fatalf("RunValidationDisease(PD) must equal RunValidation")
	}
}

// TestADRecovery: the AD axis recovers its curated/AOP-anchored positives and
// rejects the assay-active decoys (polyphenols + AD drugs), with zero errors.
func TestADRecovery(t *testing.T) {
	s := mustService(t)
	if len(s.compoundsAD) == 0 {
		t.Fatal("AD validation set did not load")
	}
	v := s.RunValidationDisease(context.Background(), contract.DiseaseAD)
	g := v.Summary
	if g.FalsePositives != 0 || g.FalseNegatives != 0 {
		t.Fatalf("AD errors: fp=%d fn=%d, want 0/0", g.FalsePositives, g.FalseNegatives)
	}
	if g.PositivesRecovered != g.PositivesTotal || g.PositivesTotal < 10 {
		t.Fatalf("AD positives: got %d/%d, want all recovered (>=10)", g.PositivesRecovered, g.PositivesTotal)
	}
	if g.NegativesRejected != g.NegativesTotal {
		t.Fatalf("AD negatives: got %d/%d rejected", g.NegativesRejected, g.NegativesTotal)
	}
	if g.AdversarialRejected != g.AdversarialTotal || g.AdversarialTotal < 6 {
		t.Fatalf("AD adversarial: got %d/%d rejected, want all (>=6)", g.AdversarialRejected, g.AdversarialTotal)
	}
}

// TestADDiseaseSpecificity: PD-only positives (e.g. rotenone, AOP-3 stressor)
// must NOT read AD-positive — the AD AOP leg is scoped to AD AOPs {12,48,429,475}.
func TestADDiseaseSpecificity(t *testing.T) {
	s := mustService(t)
	rotenone, ok := s.Resolve(context.Background(), "rotenone")
	if !ok {
		t.Fatal("rotenone not resolvable")
	}
	if ad := decideDisease(rotenone, contract.DiseaseAD); ad.Call != "negative" {
		t.Fatalf("rotenone AD call = %q, want negative (AOP-3 is not an AD AOP)", ad.Call)
	}
	if pd := decideDisease(rotenone, contract.DiseasePD); pd.Call != "positive" {
		t.Fatalf("rotenone PD call = %q, want positive", pd.Call)
	}
}

// TestLeadCrossDisease: lead is the cross-disease example — positive for BOTH,
// PD via the broad neuro-AOP leg and AD via the endorsed AOP-12 leg.
func TestLeadCrossDisease(t *testing.T) {
	s := mustService(t)
	// Use the PD-set lead record (has AOPStressorOf incl. 12/499/500).
	lead, ok := s.Resolve(context.Background(), "lead acetate")
	if !ok {
		t.Fatal("lead acetate not resolvable")
	}
	if pd := decideDisease(lead, contract.DiseasePD); pd.Call != "positive" {
		t.Fatalf("lead PD call = %q, want positive", pd.Call)
	}
	if ad := decideDisease(lead, contract.DiseaseAD); ad.Call != "positive" {
		t.Fatalf("lead AD call = %q, want positive (AOP-12 leg)", ad.Call)
	}
	// The AD assessment should carry a PD cross-disease verdict.
	res, ok := s.AssessDisease(context.Background(), "lead acetate", contract.DiseaseAD)
	if !ok {
		t.Fatal("AssessDisease(lead, AD) failed")
	}
	if res.Disease != contract.DiseaseAD {
		t.Fatalf("primary disease = %q, want ad", res.Disease)
	}
	foundPD := false
	for _, cd := range res.CrossDisease {
		if cd.Disease == contract.DiseasePD && cd.Call == "positive" {
			foundPD = true
		}
	}
	if !foundPD {
		t.Fatalf("expected a PD-positive cross-disease verdict on lead, got %+v", res.CrossDisease)
	}
}

func mustService(t *testing.T) *Service {
	t.Helper()
	s, err := New()
	if err != nil {
		t.Fatalf("New(): %v", err)
	}
	return s
}
