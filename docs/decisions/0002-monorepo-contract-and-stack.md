# ADR-0002: Monorepo layout, contract v1 seam, and stack choices

- **Status:** accepted
- **Date:** 2026-07-07
- **Rests on (recon finding):** `docs/build-kickoff.md` — the two parallel streams
  coupled only by a versioned `contract/`; the dual human + agentic (HTTP + MCP)
  interface pillar; DSSTox-first resolution and the curated recovery predicate as
  day-one components; the convergent-evidence model and discovery-map as first-class
  deliverables. Ground truth verified against `docs/recon/validation_set.csv`.

## Context

Gate 0 required a runnable monorepo shape, a v1 data contract, the first commits,
and a verified Claude integration approach, with two concurrent Claude Code streams
(core, visualization) coupled only through `contract/`.

## Decision

- **Layout:** `contract/` (versioned seam: `schema/` source-of-truth → generated
  `goapi/` + `ts/`, plus `fixtures/`), `services/` (one Go service package `aitio`
  with thin `cmd/httpd` and `cmd/mcpd` adapters), `web/` and `viz/` (viz semi-independent,
  own dev server, runs on fixtures). Git-worktree split: core owns `contract/`; viz
  consumes it; changes are version bumps.
- **Contract v1:** pathway graph (AOP-3 nodes/edges), recovery decision (curated
  predicate only; assay is corroboration, never a gate), convergent evidence strands
  (grounding, not gates), rankings, validation result (12 recover / 15 reject,
  fp=fn=0), discovery map, and the animation/trace event stream. `confidence_tier`
  on every result.
- **Stack:** Go backend (SDK-friendly), React+TS web, Three.js viz.
  - **MCP:** `mark3labs/mcp-go` — the widely-adopted, SOTA Go MCP library, already
    proven in our own prior Go services (decision D2).
  - **Model per role (D1):** configurable via env; reasoning roles default to Opus 4.8
    because life-sciences prompts make Fable back off to Opus (avoids wasted round-trips).
    Fable 5 is available per role to test where it sticks; spend/back-off is monitored.
  - **Codegen (D3):** JSON Schema is the single source of truth; Go + TS types are
    generated from it (minimize hand-maintenance across two streams).
- **Claude integration:** two surfaces. (1) **Claude Science** (verified: public beta,
  interactive workbench, reviewer-agent, reproducible artifacts) as the human-in-the-loop
  evidence-assembly/curation substrate — e.g. the epidemiology strand is curated there
  and snapshotted to fixtures. (2) **Claude API** via the official Go SDK for the
  in-app `EvidenceReasoner` and runtime reasoning. There is no programmatic "Claude
  Science API"; this matches the brief's own framing of epidemiology as in-window
  curation, not an API pull.
- **First commit:** the trivial `Health` operation exposed identically over HTTP and
  MCP, proving the dual-adapter pattern before any feature code.

## Consequences

- Viz reaches polish on fixtures independent of the live core; integration is a flip.
- The recovery predicate's "never gate on assay/bioactivity" invariant is encoded in
  the contract shape (`RecoveryDecision.diagnostic=true`, strands `isGate:false`).
- Model-per-role config lets us react if Fable back-off wastes credits, without code changes.
- Secrets live only in gitignored `.env`; `.env.example` documents the shape.
