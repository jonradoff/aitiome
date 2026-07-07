# ADR-0004: Reasoner model choice (Fable probe) and evidence provenance

- **Status:** accepted
- **Date:** 2026-07-07
- **Rests on (recon finding):** the model-per-role invariant in `/CLAUDE.md` and D1
  (default to the most capable model, but watch for back-off waste);
  `docs/recon/data-source-map.md` (the access routes surfaced as provenance).

## Context

D1 asked us to prefer Fable where it sticks and to monitor whether it backs off on
life-sciences prompts, wasting credits. Separately, the judges reward auditability:
each evidence strand should expose how it was obtained.

## Decision

- **Reasoner default stays `claude-opus-4-8`.** Empirical probe: requesting
  `claude-fable-5` for the life-sciences synthesis returns an **empty text response**
  (no API error; the model produces no usable prose on this content), so the engine
  falls back to the deterministic direct reasoner. Opus 4.8 produces rich, calibrated
  prose on the identical code path. Fable therefore adds no value here and wastes a
  round-trip. The model is still env-configurable (`AITIO_MODEL_REASONER`) and the
  server logs any requested-vs-served divergence, so this can be revisited if Fable's
  handling of this content changes.
- **Provenance is first-class.** `EvidenceStrand` gains a `Provenance` access-route
  string (verbatim from the recon data-source map), set per strand kind in the engine
  and surfaced in a UI provenance drawer. Contract bumped to **v1.1.0** (additive:
  provenance, plus the synthesis/citation types from ADR-adjacent work).

## Consequences

- No wasted Fable calls on the demo path; Opus is the reasoner.
- Every strand is clickable to reveal its source and access route (auditability).
- Contract consumers on v1.0.0 remain compatible (fields are additive).
