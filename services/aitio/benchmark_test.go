package aitio

import (
	"math"
	"testing"

	contract "aitiome/contract/goapi"
)

// TestCuratedRuleIsPerfect: the actual engine decision separates the validation
// set with zero errors. This is the sanity check, not the contribution.
func TestCuratedRuleIsPerfect(t *testing.T) {
	svc := mustNew(t)
	b := svc.Benchmark(nil)
	c := b.CuratedRule
	if c.TP != 12 || c.TN != 15 || c.FP != 0 || c.FN != 0 || c.Accuracy != 1.0 {
		t.Fatalf("curated rule confusion = %+v, want tp12/tn15/fp0/fn0/acc1", c)
	}
}

// TestBioactivityCollapsesVsDecoys is the falsification result and the empirical
// answer to "you're just detecting bioactivity". Computed live from our own data:
// every bioactivity signal is at or below chance (AUROC <= 0.5) against the
// adversarial decoys. It is not merely a weak discriminator, it is anti-diagnostic:
// the decoys look MORE like neurotoxicants by activity than the real ones do,
// because the true positives are environmental toxicants under-represented in
// ToxCast. No activity rule can substitute for curated mechanism here.
func TestBioactivityCollapsesVsDecoys(t *testing.T) {
	svc := mustNew(t)
	b := svc.Benchmark(nil)

	for _, d := range b.Bioactivity {
		if math.IsNaN(d.AUROCvsAdversarial) {
			t.Errorf("%s: AUROC undefined", d.Name)
			continue
		}
		if d.AUROCvsAdversarial > 0.5 {
			t.Errorf("%s: AUROC vs adversarial decoys = %.2f (> chance); this signal must not discriminate the decoys", d.Name, d.AUROCvsAdversarial)
		}
		t.Logf("%-28s vs decoys=%.2f  vs all-neg=%.2f", d.Name, d.AUROCvsAdversarial, d.AUROCvsAllNegatives)
	}
	// The curated rule is perfect on the same set; that is the contrast.
	if b.CuratedRule.Accuracy != 1.0 {
		t.Errorf("curated rule accuracy = %.2f, want 1.00", b.CuratedRule.Accuracy)
	}
}

// TestNoBioactivityThresholdSeparatesDecoys: for every bioactivity signal, no
// single threshold recovers all 12 positives without also flagging a decoy. So
// there is no activity rule that matches the curated rule's separation.
func TestNoBioactivityThresholdSeparatesDecoys(t *testing.T) {
	svc := mustNew(t)
	pos, adv := scoresByClass(svc)
	for name, get := range bioSignals() {
		p := scores(pos, get)
		a := scores(adv, get)
		if acc := bestThresholdAcc(p, a); acc >= 1.0 {
			t.Errorf("%s: a threshold perfectly separated positives from decoys (acc=%.2f); it must not", name, acc)
		}
	}
}

// TestBothPredicateTermsLoadBearing (ablation): neither curated term alone
// recovers all positives, and neither term ever fires on a negative. Both terms
// are necessary; both are 0/15 on the negatives.
func TestBothPredicateTermsLoadBearing(t *testing.T) {
	svc := mustNew(t)
	var ctdFN, aopFN, ctdFP, aopFP int
	for _, c := range svc.compounds {
		ctd := c.PDDirect > 0
		aop := len(c.AOPStressorOf) > 0
		if c.Role == contract.RolePositive {
			if !ctd {
				ctdFN++
			}
			if !aop {
				aopFN++
			}
		} else {
			if ctd {
				ctdFP++
			}
			if aop {
				aopFP++
			}
		}
	}
	if ctdFN == 0 {
		t.Error("CTD term alone recovered every positive; the AOP term would be redundant (it is not)")
	}
	if aopFN == 0 {
		t.Error("AOP term alone recovered every positive; the CTD term would be redundant (it is not)")
	}
	if ctdFP != 0 || aopFP != 0 {
		t.Errorf("a curated term fired on a negative: ctdFP=%d aopFP=%d (both must be 0/15)", ctdFP, aopFP)
	}
	t.Logf("ablation: CTD-only misses %d positives, AOP-only misses %d; both terms 0/15 on negatives", ctdFN, aopFN)
}

// --- helpers ---

func mustNew(t *testing.T) *Service {
	t.Helper()
	svc, err := New()
	if err != nil {
		t.Fatalf("New: %v", err)
	}
	return svc
}

func bioSignals() map[string]func(contract.Compound) float64 {
	return map[string]func(contract.Compound) float64{
		"mito":       func(c contract.Compound) float64 { return float64(c.MitoActive) },
		"mmp":        func(c contract.Compound) float64 { return float64(c.MMPActive) },
		"oxstress":   func(c contract.Compound) float64 { return float64(c.OxStressActive) },
		"mech_total": func(c contract.Compound) float64 { return float64(c.MechActiveTotal) },
		"toxcast":    func(c contract.Compound) float64 { return float64(c.ToxcastActive) },
	}
}

func scoresByClass(svc *Service) (pos, adv []contract.Compound) {
	for _, c := range svc.compounds {
		if c.Role == contract.RolePositive {
			pos = append(pos, c)
		} else if c.ConfidenceTier == "adversarial_negative" {
			adv = append(adv, c)
		}
	}
	return
}

// bestThresholdAcc: best accuracy of a rule "score >= t => positive" over all
// candidate thresholds, classifying pos (label 1) vs neg (label 0).
func bestThresholdAcc(pos, neg []float64) float64 {
	cands := map[float64]bool{}
	for _, v := range pos {
		cands[v] = true
	}
	for _, v := range neg {
		cands[v] = true
	}
	total := len(pos) + len(neg)
	if total == 0 {
		return 0
	}
	best := 0.0
	for t := range cands {
		correct := 0
		for _, v := range pos {
			if v >= t {
				correct++
			}
		}
		for _, v := range neg {
			if v < t {
				correct++
			}
		}
		if acc := float64(correct) / float64(total); acc > best {
			best = acc
		}
	}
	return best
}
