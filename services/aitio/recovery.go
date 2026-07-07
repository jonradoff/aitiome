package aitio

import (
	"fmt"

	contract "aitiome/contract/goapi"
)

// decide applies the HARD recovery predicate:
//
//	positive  <=>  ( curated CTD Parkinson's DirectEvidence )  OR  ( registered neuro-AOP stressor )
//
// Curated signals are diagnostic. Assay/bioactivity activity is corroboration
// only and NEVER gates the call (docs/recovery-rule-spec.md). tp=12, fp=0, fn=0
// on the recon set — proven by the validation harness.
func decide(c contract.Compound) contract.RecoveryDecision {
	ctd := c.PDDirect > 0
	aop := len(c.AOPStressorOf) > 0
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
		Predicate:     contract.RecoveryPredicate{CTDPdDirectEvidence: ctd, NeuroAOPStressor: aop},
		Diagnostic:    true,
		GatedOnAssay:  false,
		Corroboration: corr,
		Rationale:     rationale(c, ctd, aop, positive),
	}
}

func rationale(c contract.Compound, ctd, aop, positive bool) string {
	if positive {
		switch {
		case ctd && aop:
			return "Curated convergence: CTD Parkinson's DirectEvidence AND registered neuro-AOP stressor."
		case ctd:
			return "Curated CTD Parkinson's DirectEvidence (diagnostic)."
		default:
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
	return "No curated Parkinson's DirectEvidence and not a registered neuro-AOP stressor."
}
