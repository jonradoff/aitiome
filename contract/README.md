# `contract/` — the core⟂visualization seam

This is the **only** coupling between the core (Go service + web) stream and the
visualization stream. It is versioned; changes are announced as version bumps
(`VERSION` + `docs/decisions/`). The viz module runs fully on `fixtures/` so it
reaches polish before the core is live; integration is a fixture→live flip.

## Layout
- `VERSION` — semver of the contract. Bump on any shape change.
- `schema/` — JSON Schema, the source of truth (D3: generate types, don't hand-maintain two).
- `goapi/` — Go types (imported by the service). Generated from `schema/` once codegen lands.
- `ts/` — TypeScript types (imported by web + viz). Generated from `schema/`.
- `fixtures/` — contract-shaped demo data for the showcase compounds + recorded trace streams.

Until codegen lands (a later commit), `goapi/` is hand-written and kept in lockstep
with `VERSION`. See `docs/build-kickoff.md` and `docs/recovery-rule-spec.md` for the
domain the shapes encode.
