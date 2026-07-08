package aitio

import contract "aitiome/contract/goapi"

// adAOPs scopes the AD AOP leg (Option B, ADR-0005): registered stressor status
// on an AD-relevant AOP. AOP-12 and AOP-48 are WPHA/WNT-endorsed; AOP-429 and
// AOP-475 are the non-endorsed Tau/amyloid overlay. PD keeps its historical
// broad "any registered neuro-AOP stressor" leg (unchanged), so PD stays
// byte-identical while AD gets genuine disease-specificity.
var adAOPs = map[string]bool{"12": true, "48": true, "429": true, "475": true}

// endorsedADAOPs is the subset whose AOP status is OECD-endorsed (drives the
// per-verdict endorsement signal for AD; PD is always endorsed via AOP-3).
var endorsedADAOPs = map[string]bool{"12": true, "48": true}

// ADAnchorAOP is the AD reference frame when a positive is not itself a stressor
// of a scaffolded AD AOP: AOP-12 (endorsed; neurodegeneration + memory in aging).
const ADAnchorAOP = "12"

// curatedLeg reports the curated CTD DirectEvidence leg for a disease.
func curatedLeg(c contract.Compound, d contract.Disease) bool {
	if d == contract.DiseaseAD {
		return c.ADDirect > 0
	}
	return c.PDDirect > 0
}

// aopLeg reports the registered-AOP-stressor leg for a disease.
func aopLeg(c contract.Compound, d contract.Disease) bool {
	if d == contract.DiseaseAD {
		for _, id := range c.AOPStressorOf {
			if adAOPs[id] {
				return true
			}
		}
		return false
	}
	// PD: unchanged — any registered neuro-AOP stressor (recon-preserving).
	return len(c.AOPStressorOf) > 0
}

// aopLegIDs returns the disease-relevant AOP ids the compound is a stressor of.
func aopLegIDs(c contract.Compound, d contract.Disease) []string {
	var out []string
	for _, id := range c.AOPStressorOf {
		if d == contract.DiseaseAD {
			if adAOPs[id] {
				out = append(out, id)
			}
		} else {
			out = append(out, id)
		}
	}
	return out
}
