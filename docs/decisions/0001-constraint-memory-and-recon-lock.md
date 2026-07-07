# ADR-0001: Lock recon findings into `/CLAUDE.md` constraint memory

- **Status:** accepted
- **Date:** 2026-07-07
- **Rests on (recon finding):** `docs/build-kickoff.md` (master brief, Step 0), `docs/recovery-rule-spec.md`
  (the zero-error curated predicate), `docs/recon-learnings-summary.md` (goal evolution + resource table),
  `docs/recon/validation_set.csv` (verified ground truth).

## Context

The reconnaissance is complete and its findings are settled, non-negotiable inputs. Future Claude Code
sessions (two concurrent streams: core and visualization) must inherit these constraints without re-deriving
or accidentally contradicting them — especially the anti-diagnostic role of assay/bioactivity, the DSSTox-first
identifier rule, and the discovery-map-not-predictor stance.

## Decision

Author `/CLAUDE.md` as always-loaded constraint memory capturing: identity + the three co-equal win
conditions; the HARD recovery rule (curated diagnostic predicate, never gate on bioactivity); hard data rules;
verified ground truth (12 positives / 15 negatives incl. 6 adversarial decoys, `confidence_tier` on every
result); the AOP-3 anchor chain; the convergent-evidence model as grounding strands (not new gates);
discovery-as-honest-map; architecture invariants (transport-agnostic service layer + HTTP/MCP adapters,
core⟂viz `contract/` seam, fixtured demo resilience); the visual/UI standard as a primary win condition; and
the agent working agreement. Verified the ground-truth composition directly against `validation_set.csv`
before writing.

## Consequences

- Every session starts from the same constraints; the recovery rule and "never gate on bioactivity" are
  load-bearing and now impossible to miss.
- `docs/decisions/` is the running log; each build decision must cite the recon finding it rests on.
- `/CLAUDE.md` must be updated (not contradicted) if any recon finding is formally revisited with Jon.
