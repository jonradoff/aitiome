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

## Play with it (one command)
```sh
./run.sh               # builds + starts the engine, then the web app
# open http://localhost:5273
```
Click a **known neurotoxicant** to watch the endorsed AOP-3 cascade reconstruct and
ignite the SOX6/AGTR1 vulnerable-neuron terminal; click a **bioactive decoy** to see
it withheld and rejected on independent lines. The all-27 grid, the convergent
evidence, the reasoning trace, the honest discovery map, and the MCP interface are
all live.

## Engine only
```sh
make run-http          # HTTP API on :8787  (/health /compounds /resolve /assess /validation /pathway /discovery-map)
make run-mcp           # MCP server over stdio (health, resolve_compound, assess_compound, run_validation, get_pathway, discovery_map)
make test              # Go tests: validation harness (fp=fn=0), salt-form guard, decoy rejection
make fixtures          # regenerate contract/fixtures from the live engine
```

Requires Go 1.26+ and Node 22+. Optional: `cp .env.example .env` and add
`ANTHROPIC_API_KEY` for the (optional) LLM evidence-reasoner role.
