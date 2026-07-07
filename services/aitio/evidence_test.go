package aitio

import "testing"

// TestDecoyTripleRejection verifies the specificity centerpiece, honestly:
// warfarin and fenofibrate are rejected by THREE independent lines at once
// (curated absence + BBB non-penetrance + zero FAERS parkinsonism signal), while
// every adversarial decoy is rejected by at least the curated line — and none is
// ever rejected using assay/bioactivity as a gate.
func TestDecoyTripleRejection(t *testing.T) {
	svc, err := New()
	if err != nil {
		t.Fatalf("New: %v", err)
	}

	tripleExpected := map[string]bool{"warfarin": true, "fenofibrate": true}
	for name, want := range tripleExpected {
		r, ok := svc.Assess(nil, name)
		if !ok {
			t.Fatalf("%s did not resolve", name)
		}
		if r.Rejection == nil || r.Rejection.Count < 3 {
			got := 0
			if r.Rejection != nil {
				got = r.Rejection.Count
			}
			t.Errorf("%s: want >=3 independent rejection lines, got %d", name, got)
		}
		kinds := map[string]bool{}
		for _, ln := range r.Rejection.Lines {
			kinds[ln.Kind] = true
		}
		for _, k := range []string{"curated_mechanism", "bbb", "faers"} {
			if want && !kinds[k] {
				t.Errorf("%s: missing rejection line %q", name, k)
			}
		}
	}

	// Every adversarial decoy: negative call, at least the curated rejection line,
	// and it is genuinely bioactive (the imposter signal we do NOT gate on).
	v := svc.RunValidation(nil)
	var decoys int
	for _, r := range v.PerCompound {
		if r.ConfidenceTier != "adversarial_negative" {
			continue
		}
		decoys++
		if r.Recovery.Call != "negative" {
			t.Errorf("decoy %s flagged positive", r.Compound.Name)
		}
		if r.Rejection == nil || r.Rejection.Count < 1 {
			t.Errorf("decoy %s has no rejection lines", r.Compound.Name)
		}
	}
	if decoys != 6 {
		t.Errorf("want 6 adversarial decoys, got %d", decoys)
	}
}

// TestGroundingStrandOnPositives ensures positives carry the mito/cell-type
// grounding strand (the hero visual's terminal frame + mechanism depth).
func TestGroundingStrandOnPositives(t *testing.T) {
	svc, err := New()
	if err != nil {
		t.Fatalf("New: %v", err)
	}
	r, _ := svc.Assess(nil, "rotenone")
	var grounded bool
	for _, st := range r.Strands {
		if st.Kind == "mito_celltype_grounding" && st.Status == "supports" {
			grounded = true
		}
		if st.IsGate {
			t.Errorf("strand %q must never be a gate", st.Kind)
		}
	}
	if !grounded {
		t.Error("rotenone missing mito_celltype_grounding strand")
	}
}
