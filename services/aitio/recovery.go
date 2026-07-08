package aitio

import (
	"fmt"

	contract "aitiome/contract/goapi"
)

// decide applies the HARD recovery predicate for Parkinson's (the default axis).
// Thin wrapper over decideDisease so the PD path stays byte-identical:
//
//	positive  <=>  ( curated CTD Parkinson's DirectEvidence )  OR  ( registered neuro-AOP stressor )
//
// Curated signals are diagnostic. Assay/bioactivity activity is corroboration
// only and NEVER gates the call (docs/recovery-rule-spec.md). tp=12, fp=0, fn=0
// on the recon set — proven by the validation harness.
func decide(c contract.Compound) contract.RecoveryDecision {
	return decideDisease(c, contract.DiseasePD)
}

// decideDisease applies the per-disease recovery predicate (ADR-0005, Option B):
//
//	positive_for(D)  <=>  ( curated CTD DirectEvidence for D )  OR  ( registered stressor of a D-relevant AOP )
//
// PD keeps the historical broad neuro-AOP leg; AD scopes the AOP leg to AD AOPs
// {12,48,429,475}. The discipline is identical for both: curated is diagnostic,
// assay is anti-diagnostic and never gates.
func decideDisease(c contract.Compound, d contract.Disease) contract.RecoveryDecision {
	ctd := curatedLeg(c, d)
	aop := aopLeg(c, d)
	positive := ctd || aop

	call := "negative"
	if positive {
		call = "positive"
	}

	corr := contract.Corroboration{
		AssayActive:     c.MechActiveTotal > 0 || c.ToxcastActive > 0,
		MitoActive:      c.MitoActive,
		MechActiveTotal: c.MechActiveTotal,
		AntiDiagnostic:  true,
	}

	return contract.RecoveryDecision{
		Call:          call,
		Disease:       d,
		Predicate:     contract.RecoveryPredicate{CTDPdDirectEvidence: ctd, NeuroAOPStressor: aop},
		Diagnostic:    true,
		GatedOnAssay:  false,
		Corroboration: corr,
		Rationale:     rationaleDisease(c, d, ctd, aop, positive),
	}
}

func rationaleDisease(c contract.Compound, d contract.Disease, ctd, aop, positive bool) string {
	if positive {
		switch {
		case ctd && aop:
			if d == contract.DiseaseAD {
				return "Curated convergence: CTD Alzheimer's DirectEvidence AND registered AD-relevant AOP stressor."
			}
			return "Curated convergence: CTD Parkinson's DirectEvidence AND registered neuro-AOP stressor."
		case ctd:
			if d == contract.DiseaseAD {
				return "Curated CTD Alzheimer's DirectEvidence (diagnostic)."
			}
			return "Curated CTD Parkinson's DirectEvidence (diagnostic)."
		default:
			if d == contract.DiseaseAD {
				return fmt.Sprintf("Registered stressor of AD-relevant AOP(s) %v (diagnostic).", aopLegIDs(c, d))
			}
			return fmt.Sprintf("Registered stressor of neuro AOP(s) %v (diagnostic).", c.AOPStressorOf)
		}
	}
	// Negative. Call out the anti-diagnostic corroboration when present — the
	// specificity point: bioactive, even mito-active, but no curated signal.
	if c.MitoActive > 0 || c.MechActiveTotal > 0 {
		return fmt.Sprintf(
			"No curated diagnostic signal despite bioactivity (%d mito, %d mechanistic assay hits). "+
				"Correctly NOT flagged — the engine reasons on curated mechanism, not activity.",
			c.MitoActive, c.MechActiveTotal)
	}
	if d == contract.DiseaseAD {
		return "No curated Alzheimer's DirectEvidence and not a registered AD-relevant AOP stressor."
	}
	return "No curated Parkinson's DirectEvidence and not a registered neuro-AOP stressor."
}
