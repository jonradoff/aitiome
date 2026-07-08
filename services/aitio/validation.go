package aitio

import (
	"context"

	contract "aitiome/contract/goapi"
)

// RunValidation assesses every compound in the ground-truth set and tallies the
// scoreboard: positives recovered, negatives rejected, adversarial decoys
// rejected, and the false-positive / false-negative counts. On the recon set
// this is 12 recovered / 15 rejected / 6 adversarial rejected / fp=0 / fn=0.
func (s *Service) RunValidation(ctx context.Context) contract.ValidationResult {
	return s.RunValidationDisease(ctx, contract.DiseasePD)
}

// RunValidationDisease runs the harness for a given disease axis over that
// disease's ground-truth set. PD is byte-identical to the original RunValidation.
func (s *Service) RunValidationDisease(ctx context.Context, d contract.Disease) contract.ValidationResult {
	set := s.compoundsFor(d)
	per := make([]contract.CompoundResult, 0, len(set))
	var sum contract.ValidationSummary

	for _, c := range set {
		r := s.assessCompoundDisease(c, d)
		per = append(per, r)

		isAdversarial := c.ConfidenceTier == "adversarial_negative"
		called := r.Recovery.Call // "positive" | "negative"

		switch c.Role {
		case contract.RolePositive:
			sum.PositivesTotal++
			if called == "positive" {
				sum.PositivesRecovered++
			} else {
				sum.FalseNegatives++
			}
		case contract.RoleNegative:
			sum.NegativesTotal++
			if isAdversarial {
				sum.AdversarialTotal++
			}
			if called == "negative" {
				sum.NegativesRejected++
				if isAdversarial {
					sum.AdversarialRejected++
				}
			} else {
				sum.FalsePositives++
			}
		}
	}

	return contract.ValidationResult{Summary: sum, PerCompound: per}
}
