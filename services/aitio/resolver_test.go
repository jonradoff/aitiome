package aitio

import "testing"

// TestValidationSetIntegrity locks the ground truth: 27 compounds, 12 positives
// (6 assay_mechanism_recovered + 6 curated_anchored_only), 15 negatives incl. 6
// adversarial decoys. If the embedded data drifts, this fails loudly.
func TestValidationSetIntegrity(t *testing.T) {
	svc, err := New()
	if err != nil {
		t.Fatalf("New: %v", err)
	}
	compounds := svc.ListCompounds(nil)
	if len(compounds) != 27 {
		t.Fatalf("want 27 compounds, got %d", len(compounds))
	}

	tiers := map[string]int{}
	var pos, neg int
	for _, c := range compounds {
		tiers[string(c.ConfidenceTier)]++
		switch c.Role {
		case "positive":
			pos++
		case "negative":
			neg++
		default:
			t.Errorf("%s: unexpected role %q", c.Name, c.Role)
		}
	}
	if pos != 12 || neg != 15 {
		t.Fatalf("want 12 positives / 15 negatives, got %d / %d", pos, neg)
	}
	if got := tiers["assay_mechanism_recovered"]; got != 6 {
		t.Errorf("assay_mechanism_recovered: want 6, got %d", got)
	}
	if got := tiers["curated_anchored_only"]; got != 6 {
		t.Errorf("curated_anchored_only: want 6, got %d", got)
	}
	if got := tiers["adversarial_negative"]; got != 6 {
		t.Errorf("adversarial_negative: want 6, got %d", got)
	}
}

// TestParaquatSaltForm is the day-one correctness guard (data-source-map.md RISK
// 1). Paraquat's real ToxCast bioactivity lives under paraquat DICHLORIDE
// (CAS 1910-42-5), not the parent cation (CAS 4685-14-7). The resolver must:
//   (a) resolve the parent name/CAS to the record, and
//   (b) that record must carry the tested salt-form CAS, and
//   (c) the tested CAS must itself resolve back to the same record.
func TestParaquatSaltForm(t *testing.T) {
	svc, err := New()
	if err != nil {
		t.Fatalf("New: %v", err)
	}
	byName, ok := svc.Resolve(nil, "paraquat")
	if !ok {
		t.Fatal("paraquat did not resolve by name")
	}
	if byName.ToxcastCAS != "1910-42-5" {
		t.Errorf("paraquat ToxcastCAS: want 1910-42-5 (dichloride), got %q", byName.ToxcastCAS)
	}
	if byName.CAS != "4685-14-7" {
		t.Errorf("paraquat parent CAS: want 4685-14-7, got %q", byName.CAS)
	}
	bySalt, ok := svc.Resolve(nil, "1910-42-5")
	if !ok {
		t.Fatal("paraquat dichloride CAS did not resolve")
	}
	if bySalt.Name != byName.Name {
		t.Errorf("salt-form CAS resolved to %q, want %q", bySalt.Name, byName.Name)
	}
}

// TestResolveByEveryIdentifier spot-checks DTXSID-first resolution across id types.
func TestResolveByEveryIdentifier(t *testing.T) {
	svc, err := New()
	if err != nil {
		t.Fatalf("New: %v", err)
	}
	for _, id := range []string{"rotenone", "DTXSID6021248", "83-79-4", "JUVIOZPCNVVQFO-HBGVWJBISA-N"} {
		c, ok := svc.Resolve(nil, id)
		if !ok {
			t.Errorf("%q did not resolve", id)
			continue
		}
		if c.Name != "rotenone" {
			t.Errorf("%q resolved to %q, want rotenone", id, c.Name)
		}
	}
}
