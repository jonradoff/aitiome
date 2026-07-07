# Aitiome (AITIO)

An honest mechanistic-reasoning engine for the environmental exposome of
neurodegeneration. Given a chemical, it reconstructs the OECD-endorsed causal
pathway (molecular initiating event → key events → a neurodegeneration hallmark),
grounds each edge in queryable evidence, rates confidence, and — the hard test —
correctly refuses to flag bioactive-but-non-neurotoxic decoys.

> Read `CLAUDE.md` for the binding project constraints and `docs/build-kickoff.md`
> for the master brief. The reconnaissance in `docs/` is settled input.

## Layout
- `contract/` — the versioned core⟂visualization seam (types + fixtures). The only coupling.
- `services/` — Go: transport-agnostic service layer with thin **HTTP** and **MCP** adapters.
- `web/` — human web UI (React + TS). *(added in a later phase)*
- `viz/` — semi-independent Three.js visualization module, own dev server, runs on fixtures. *(later)*
- `docs/` — recon assets, the master brief, and ADRs (`docs/decisions/`).

## Run (current: Commit 1 — dual-adapter proof)
```sh
cp .env.example .env   # then add your ANTHROPIC_API_KEY
make run-http          # GET http://localhost:8787/health
make run-mcp           # MCP server over stdio, exposes the `health` tool
make smoke             # verify both adapters return the same Health payload
```

Requires Go 1.26+. Node 22+ is used later for `web/` and `viz/`.
