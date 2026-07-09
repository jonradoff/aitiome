# Aitiome

**An honest mechanistic-reasoning engine for the environmental exposome of neurodegeneration.**

**Live:** https://aitiome.fly.dev (custom domain https://aitiome.metavert.io pending one DNS record).

Given a chemical, Aitiome reconstructs the OECD-endorsed causal pathway from molecular initiating
event to a neurodegeneration hallmark, grounds each step in queryable evidence, rates confidence,
and proves itself two ways: it recovers the known neurotoxicants, and it refuses to be fooled by
bioactive compounds that are not neurotoxic. It is not a system that claims to discover novel
neurodegeneration-causing chemicals, and it is transparent about exactly where AI-driven discovery
is and is not possible on this chemical class.

> Built for **Built with Claude: Life Sciences** (judged with the Gladstone Institutes). The design
> rests on a completed multi-round data reconnaissance; those findings are settled inputs, recorded
> in [`docs/`](docs/) and locked into [`CLAUDE.md`](CLAUDE.md).

---

## The idea, and how the evidence reshaped it

We set out to build a discovery engine: an AI that scans the environmental chemical universe and
surfaces novel candidate drivers of Parkinson's and Alzheimer's, validated by recovering known
neurotoxicants. Rigorous reconnaissance changed the shape of that goal in two decisive ways, and the
honesty about them is the point.

1. **There is no shippable unsupervised-discovery signal for this compound class on public data.**
   We tested seven independent discovery axes (transcriptomics, morphology, structure/QSAR, full
   bioactivity fingerprints, knowledge graphs, physics-based docking). Every one was either
   *coverage-killed* (environmental toxicants are not profiled in the drug-centric databases) or
   *confounder-killed* (general bioactivity is not neurotoxicity, and the confound is general
   bioactivity, not merely cytotoxicity). That is a robust, reproducible negative result, and mapping
   it is itself a contribution.

2. **The discriminating signal is curated, not assay-based.** The zero-error recovery predicate on
   the validation set is `(CTD curated Parkinson's DirectEvidence) OR (registered neuro-AOP stressor)`.
   Both terms are curated. Mitochondrial and general-bioactivity similarity score *worse than chance*
   against the adversarial decoys, so activity can never be the discriminator.

So Aitiome became the thing the data supports: an engine that reconstructs endorsed mechanism, proves
it recovers known neurotoxicants, correctly rejects bioactive imposters on three independent lines of
evidence, and ships an honest map of where discovery works and where it does not. The full drift
narrative and the per-resource findings are in
[`docs/recon-learnings-summary.md`](docs/recon-learnings-summary.md).

## Three co-equal win conditions

1. **Validation that works.** Visibly recover the known neurotoxicants on the endorsed pathway
   scaffold, and correctly reject the adversarial decoys.
2. **A signature visualization.** One hero visual: the recovery-and-specificity reveal resolving into
   the actual vulnerable dopaminergic-neuron population.
3. **Honest, calibrated framing.** Confidence tiers on every result, calibrated language, and the
   negative-results discovery map surfaced as a first-class feature, not hidden.

---

## What the engine does

### The recovery rule (the core discipline)

```
positive  <=>  ( CTD curated Parkinson's DirectEvidence )  OR  ( registered neuro-AOP stressor )
```

Curated signals are **diagnostic**. Assay/bioactivity activity is **corroboration only and
anti-diagnostic**: it illustrates mechanism for known positives but cannot discriminate, so the engine
**never gates a positive call on it**. Every decision object carries `diagnostic = true` and
`gatedOnAssay = false`; that invariant is enforced in tests.

### Validation results (on the reconnaissance ground truth)

| | recovered | rejected | adversarial decoys rejected | false positives | false negatives |
|---|---|---|---|---|---|
| **12 positives / 15 negatives** | **12 / 12** | **15 / 15** | **6 / 6** | **0** | **0** |

- **12 positives**, surfaced with a confidence tier on every result: 6 `assay_mechanism_recovered`
  (rotenone, MPP+, paraquat, manganese chloride, methylmercury chloride, chlorpyrifos) and 6
  `curated_anchored_only` (MPTP, maneb, lead acetate, deguelin, dieldrin, 6-hydroxydopamine).
- **15 negatives**, including **6 adversarial, mitochondria-active decoys** designed to fool an
  activity model (troglitazone, prochloraz, propiconazole, simvastatin, fenofibrate, warfarin).
- Every curated discriminator is 0/15 on the negatives.

### The pathway (AOP-3 anchor)

The MVP scaffold is **AOP-3**, an OECD-endorsed adverse outcome pathway:

```
MIE 888  binding of inhibitor, complex I
  -> KE 887  complex-I inhibition
  -> KE 177  mitochondrial dysfunction
  -> KE 890  nigrostriatal dopaminergic degeneration
  -> AO 896  parkinsonian motor deficits          (with the 188 <-> 890 neuroinflammation loop)
```

The molecular initiating event is grounded gene-level in the **MitoCarta3.0 Complex-I Q-site subunits**;
the adverse outcome is grounded in the **Kamath 2022 SOX6/AGTR1 vulnerable dopaminergic-neuron
population**, which is also the hero visual's terminal frame.

### Convergent evidence, and the triple-independent decoy rejection

Beyond the curated recovery decision, each compound is grounded and its confidence enriched by
independent strands: curated mechanism, assay corroboration, mechanistic/cell-type grounding, FAERS
pharmacovigilance, human epidemiology, and blood-brain-barrier exposure. **These strands ground and
calibrate; they are never new recovery gates.**

The specificity centerpiece is that the decoys are rejected by multiple independent lines at once.
Truthfully per compound: **warfarin and fenofibrate** fail all three (no curated signal + BBB
non-penetrance + zero FAERS parkinsonism signal), while **simvastatin and troglitazone** fail two each
(the data does not support claiming a third, and the app says so).

### The falsification harness (why bioactivity cannot do this)

The strongest evidence that the engine is not "just detecting bioactivity" is computed live from the
validation set (`make validate`, `/benchmark`). The AUROC of every bioactivity signal separating the 12
positives from the 6 adversarial decoys:

| signal | AUROC vs decoys | AUROC vs all negatives |
|---|---|---|
| Mitochondrial assays | 0.16 | 0.41 |
| Membrane potential (MMP) | 0.12 | 0.39 |
| Oxidative stress | 0.20 | 0.40 |
| Mechanistic assays (total) | 0.39 | 0.57 |
| ToxCast active (all) | 0.15 | 0.45 |

Every signal is **at or below chance (0.5)**: the decoys are, if anything, more bioactive than the real
neurotoxicants, because the true positives are environmental toxicants under-represented in ToxCast.
Bioactivity is anti-diagnostic here; the curated rule is perfect on the same set. The harness also
encodes the adversarial challenges as tests (no bioactivity threshold separates the decoys; both
predicate terms are load-bearing; every result invariant holds). See `learnings.md`.

### Discovery, represented as an honest map

The discovery view ships the seven axes tested during recon, each with its coverage- or
confounder-killed verdict, plus the two live-but-unproven leads (a neural-specific assay subset,
AUROC 0.72 but underpowered; and a bounded Boltz-2 Q-site engagement benchmark). Discovery is
represented as a map, never as a predictor.

### Claude evidence-reasoner

A Claude-backed `EvidenceReasoner` writes a calibrated, cited prose account of each assessment. It is
hard-bounded to **explain, never decide**: the call and tier are fixed inputs it may not change, it
cites the engine's evidence strands by `[E#]` marker (nothing invented), it keeps assay anti-diagnostic,
and it never claims causation. Model is configurable per role (default Opus 4.8; a deterministic direct
reasoner is the always-available fallback, so the endpoint works offline).

---

## Built with Claude, end to end

Aitiome is a full-stack Claude project. The three Claude surfaces do genuinely different jobs, and they
fuse into one pipeline - with a hard rule that **Claude never enters the decision path**.

- **Claude Code - built the system.** The whole thing was built with Claude Code across two parallel
  streams (the Go engine and the Three.js visualization) coupled only by a versioned `contract/`: the
  deterministic recovery core, the falsification harness, the hero visual, the dual HTTP/MCP interface,
  the tests, and the fly.io deploy.
- **Claude API (Opus 4.8) - reasons and curates.** Two roles: the in-app `EvidenceReasoner` writes the
  calibrated, `[E#]`-cited synthesis of each assessment (it explains, it never changes the call); and a
  command-line curation agent (`make curate`) uses Claude with the web-search tool to assemble a
  curated-evidence draft for a chemical outside the benchmark.
- **Claude Science - assembles and verifies the evidence.** The recovery decision needs *curated*
  evidence (CTD DirectEvidence, AOP-Wiki stressor status). Assembling and verifying that correctly -
  curated-only, salt-form-aware, citation-checked - is what Claude Science is built for, and its
  reproducibility model (every result ships its code, environment, and message history) makes the
  assembly auditable.

Together they assess a chemical **beyond** the 27-compound benchmark:

```
  Claude Science / curation agent        Aitiome engine              Claude API
  assemble + verify curated evidence  ->  deterministic grade    ->   cited synthesis
  (CTD DirectEvidence, AOP stressor)      (same predicate)             (explains, never decides)
```

An unverified draft is graded as a hypothesis (`analogy_only`), never a curated positive - so a
web-research guess never becomes a diagnostic call. The bridge is `POST /assess-curated` (and the
`assess_curated` MCP tool); the full workflow, including the Claude Science verification task, is in
[`docs/claude-science.md`](docs/claude-science.md).

---

## Architecture

The system is split into a **core** and a **visualization** stream coupled only by a **versioned
`contract/`** (typed schema + fixtures). The visualization runs entirely on contract fixtures, so it
reaches polish without the core being live; integration is a fixture-to-live flip.

```
                 +------------------------------------------------------+
                 |  contract/  (the seam: types + fixtures, versioned)  |
                 |  goapi (Go) . ts (TypeScript) . fixtures/ . VERSION  |
                 +------------------------------------------------------+
                       ^                                        ^
        imports        |                                        |  imports (types + fixtures)
                       |                                        |
   +-------------------------------------+          +-------------------------------------+
   |  services/  (Go)                    |          |  web/  (React + TypeScript + Three) |
   |                                     |          |                                     |
   |  aitio (one service package)        |          |  hero/  GLSL cascade + neuron       |
   |   resolver . aop . recovery         |   /api   |  components/  evidence, trace,      |
   |   evidence . validation . reasoner  | <------- |    validation, discovery, MCP,      |
   |                                     |  proxy   |    provenance, specificity          |
   |  cmd/httpd  (HTTP adapter)   -------+--- live -+->  data layer (live first,          |
   |  cmd/mcpd   (MCP adapter, stdio) ---+          |    fixtures fallback)               |
   +-------------------------------------+          +-------------------------------------+
```

**Transport-agnostic service layer.** All domain logic lives in one Go package, `services/aitio`. The
HTTP server (`cmd/httpd`) and the MCP server (`cmd/mcpd`) are thin adapters over the identical service
methods, so the same engine serves a human web UI and an external agent. This dual human + agentic
interface is a core pillar.

**Data is embedded and deterministic.** The engine loads the reconnaissance-derived inputs (validation
set, AOP scaffold, MitoCarta subunits, brain cell gene sets, FAERS/epidemiology/BBB coverage) via
`go:embed`. The recovery decision is deterministic over curated data; there is no LLM in the decision
path (by design). The LLM is used only for the optional prose synthesis.

**Correctness spine.** Identity resolution is **DTXSID-first with the salt-form-correct record**, not
PubChem-synonym guessing. Entering the paraquat dichloride CAS `1910-42-5` resolves to the paraquat
record tested as that salt, avoiding the trap that silently returns "no data" on the parent cation.

## Features

- **Validation harness** over the 27-compound ground truth: 12/12 recovered, 15/15 rejected, 6/6
  adversarial decoys rejected, 0 false positives, 0 false negatives.
- **Grounded pathway reconstruction** of the endorsed AOP-3 cascade, with gene- and cell-type-level
  grounding on the MIE and adverse outcome.
- **Convergent-evidence display** with per-strand status, plus the truthful triple-independent decoy
  rejection.
- **Reasoning trace** stream that drives the hero animation and is shown as an auditable log.
- **Provenance drawer**: click any evidence strand to see its finding, source, and access route.
- **Honest discovery map** of the seven tested axes and two live leads.
- **Claude reasoning synthesis** (cited, calibrated, explains but never decides).
- **Interactive resolver** with an intelligent typeahead over the curated benchmark (name / CAS / DTXSID /
  InChIKey, salt-form correct; ranks the showcase set first) — suggests only what will resolve, while free-typed
  out-of-set text still returns the honest "not in the curated benchmark" rejection.
- **Hero visualization** (Three.js + GLSL): an exposome particle field, evidence-weighted glowing
  cascade edges, the neuron terminal igniting for positives, and the rejection rings for decoys.
- **MCP server** exposing the same engine as tools for an external agent.
- Dark mode by default with light-mode parity.

## Data sources

CTD (curated `DirectEvidence` only), AOP-Wiki (OECD-endorsed neuro AOPs), EPA ToxCast / invitroDB via
NICEATM ICE (corroboration only), MitoCarta3.0, Kamath 2022 SN snRNA-seq, openFDA FAERS, curated
epidemiology, and B3DB / BOILED-Egg for brain exposure. Access routes are recorded per source in
[`docs/recon/data-source-map.md`](docs/recon/data-source-map.md) and surfaced in the provenance drawer.

---

## Run it

```sh
./run.sh                     # builds + starts the engine, then the web app
# open http://localhost:5273
```

Click a **known neurotoxicant** to watch the endorsed cascade reconstruct and ignite the vulnerable
dopaminergic-neuron terminal. Click a **bioactive decoy** to see it withheld and rejected on
independent lines. The all-27 grid, convergent evidence, reasoning trace, provenance drawer,
specificity centerpiece, discovery map, and MCP panel are all live.

### Engine only

```sh
make run-http                # HTTP API on :8787
make run-mcp                 # MCP server over stdio
make test                    # Go tests (harness fp=fn=0, salt-form guard, decoy rejection, synthesis)
make validate                # judge-facing red-team report (bioactivity AUROC vs decoys, invariants)
make fixtures                # regenerate contract/fixtures from the live engine
make curate NAME=ziram       # Claude+web curation agent -> engine grade (a hypothesis until verified in Claude Science)
```

Requires Go 1.26+ and Node 22+. For the optional Claude synthesis, copy `.env.example` to `.env` and
set `ANTHROPIC_API_KEY` (default reasoner model `claude-opus-4-8`, configurable via
`AITIO_MODEL_REASONER`). Everything else works without a key.

### Deploy (single binary: API + web UI)

The engine also serves the built web UI, so the whole app ships as one binary / one container.

```sh
cd web && npm run build && cd ..
go build -o bin/httpd ./services/cmd/httpd
AITIO_WEB_DIR=web/dist ./bin/httpd            # serves API + UI on :8787

docker build -t aitiome . && docker run -p 8787:8787 -e ANTHROPIC_API_KEY=sk-ant-... aitiome
```

Production runs on fly.io. See [`docs/deploy.md`](docs/deploy.md) for the fly launch + secret + custom
domain steps.

### HTTP endpoints

`/health` `/compounds` `/resolve?id=` `/assess?id=` `/synthesis?id=` `/validation` `/benchmark` `/sources`
`/pathway[?aop=3]` `/discovery-map` `POST /assess-curated`

### MCP tools

`health` `list_compounds` `resolve_compound` `assess_compound` `assess_curated` `synthesize_assessment`
`run_validation` `benchmark` `sources` `get_pathway` `discovery_map`

## Project layout

```
contract/     the versioned core<->viz seam: goapi (Go), ts (TypeScript), fixtures/, VERSION
services/     Go: aitio service package + cmd/httpd (HTTP) + cmd/mcpd (MCP) adapters
web/          React + TypeScript + Three.js app (hero/ + components/), runs live or on fixtures
docs/         the reconnaissance assets, the master brief, and decision records (docs/decisions/)
learnings.md  a running log of what we learn building + red-teaming (findings, open critiques)
CLAUDE.md     always-loaded constraint memory: the settled recon findings and the hard rules
run.sh        one command to build and start everything
```

## Honesty guardrails

Aitiome outputs **evidence-ranked mechanistic hypotheses, never claims of causation.** Confidence tiers
appear on every result. The recovery decision is curated and never gated on bioactivity. The discovery
limits are surfaced, not hidden. The design builds openly on the field's published roadmap (Miller,
Barouki, Samieri; *Nature Neuroscience* 2024) and positions itself honestly as the validated, calibrated
prototype that roadmap called for.

## License / attribution

Research prototype. Data sources retain their own licenses and citation requirements (notably CTD,
which is non-commercial and citation-required, and NeurotoxKb, CC BY-NC-ND). See
[`docs/recon/data-source-map.md`](docs/recon/data-source-map.md).
