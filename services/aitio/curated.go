package aitio

import (
	"context"
	"strings"

	contract "aitiome/contract/goapi"
)

// AssessCurated grades externally-assembled curated evidence (from Claude Science
// or the command-line curation agent) with the SAME deterministic predicate used
// on the benchmark. This is the bridge that lets Aitiome assess a chemical NOT in
// the embedded set: Claude Science assembles the curated evidence, the engine
// decides.
//
// Honesty guardrail: the recovery LOGIC is identical, but an UNVERIFIED draft is
// labeled a hypothesis (analogy_only) and its rationale says so - an agent's
// web-research guess is never presented as a curated diagnostic positive. Only
// evidence Verified against the primary sources (or in Claude Science) grades as
// a real curated tier.
func (s *Service) AssessCurated(ctx context.Context, in contract.CuratedInput) contract.CompoundResult {
	c := contract.Compound{
		Name:            in.Name,
		DTXSID:          in.DTXSID,
		CAS:             in.CAS,
		PDDirect:        in.PDDirect,
		ADDirect:        in.ADDirect,
		AOPStressorOf:   in.AOPStressorOf,
		AOP3Stressor:    containsID(in.AOPStressorOf, MVPAnchorAOP),
		MitoActive:      in.MitoActive,
		MechActiveTotal: in.MechActiveTotal,
	}

	rec := decide(c)
	if in.Verified {
		c.ConfidenceTier = verifiedTier(rec, c)
		c.Role = roleFromCall(rec.Call)
	} else {
		// Unverified agent draft: grade as a hypothesis, never a diagnostic call.
		c.ConfidenceTier = "analogy_only"
	}

	res := s.assessCompound(c)

	// Make the verification status explicit and honest in the result.
	if !in.Verified {
		res.Recovery.Rationale = "UNVERIFIED DRAFT (" + src(in.Source) + "): " + res.Recovery.Rationale +
			" This is a hypothesis from assembled evidence, not a curated diagnostic call. Verify against CTD DirectEvidence and AOP-Wiki (e.g. in Claude Science) before treating it as recovered."
	} else {
		res.Recovery.Rationale = "Verified curated evidence (" + src(in.Source) + "): " + res.Recovery.Rationale
	}
	// Carry provided citations onto the mechanism strand's provenance where useful.
	if len(in.Citations) > 0 && len(res.Strands) > 0 {
		res.Strands[0].Provenance = strings.TrimSpace(res.Strands[0].Provenance + "  Assembled evidence: " + joinCitations(in.Citations))
	}
	return res
}

func verifiedTier(rec contract.RecoveryDecision, c contract.Compound) contract.ConfidenceTier {
	if rec.Call == "positive" {
		if c.MechActiveTotal > 0 {
			return "assay_mechanism_recovered"
		}
		return "curated_anchored_only"
	}
	return "clean_negative"
}

func roleFromCall(call string) contract.Role {
	if call == "positive" {
		return contract.RolePositive
	}
	return contract.RoleNegative
}

func containsID(ids []string, id string) bool {
	for _, x := range ids {
		if strings.TrimSpace(x) == id {
			return true
		}
	}
	return false
}

func src(s string) string {
	if strings.TrimSpace(s) == "" {
		return "source unspecified"
	}
	return s
}

func joinCitations(cs []contract.Citation) string {
	parts := make([]string, 0, len(cs))
	for _, c := range cs {
		if c.URL != "" {
			parts = append(parts, c.URL)
		}
	}
	return strings.Join(parts, ", ")
}
