# Aitiome — MCP Server

**One engine, two interfaces.** Aitiome exposes the *same* deterministic neurodegeneration-exposome
engine that powers the web app as a set of **Model Context Protocol** tools an external agent can drive.
The web UI and the MCP server are sibling adapters (`cmd/httpd` and `cmd/mcpd`) over a single Go service
package (`services/aitio`) — the human and the agent call identical methods and get identical answers.

- **Live app:** https://aitiome.fly.dev
- **Presentation:** https://aitiome.fly.dev/presentation.pdf
- **Repo:** https://github.com/jonradoff/aitiome
- Built for **Built with Claude: Life Sciences** by Jon Radoff.

> This document is generated from the MCP adapter source
> ([`services/cmd/mcpd/main.go`](services/cmd/mcpd/main.go)). Tool names, parameters, and descriptions are
> taken verbatim from the code. Example *outputs* are illustrative — clearly marked where so — because the
> live engine computes them from embedded reconnaissance data.

---

## Overview

The MCP server is a **thin adapter with no domain logic**. Every tool call forwards to a method on the
`aitio` service and returns the result as JSON text. Three properties define what the agent is talking to:

- **Read-only.** All 13 tools are read-only. Nothing the agent does mutates state, spends budget by
  default, or changes a grade. (`assess_curated` *grades* agent-supplied evidence but persists nothing.)
- **The recovery decision is a deterministic curated gate — never bioactivity, never an LLM.** A chemical
  is called positive if and only if it has **CTD curated Parkinson's `DirectEvidence`** OR is a
  **registered in-scope neuro-AOP stressor**. Assay/bioactivity activity is *corroboration only and
  anti-diagnostic*; it can illustrate mechanism but never make or change a call. There is no model in the
  decision path. Every decision object carries `diagnostic = true` and `gatedOnAssay = false`.
- **Every result is graded and cited.** Each assessment surfaces a `confidence_tier`, the evidence strands
  that ground it, and (where the source supports it) a citation and access route.

The optional Claude evidence-reasoner (used by `synthesize_assessment`) **explains, it never decides** —
the call and tier are fixed inputs it may not alter, and it has a deterministic fallback so the tool works
without an API key.

---

## Connecting

The MCP server is a standalone Go binary built from `services/cmd/mcpd`. It speaks **MCP over stdio**
(`server.ServeStdio` in the code) — an MCP client launches the process and communicates over its
stdin/stdout.

### Build it

```sh
# from the repo root
go build -o mcpd ./services/cmd/mcpd
```

Or via the Makefile target, which builds and runs in one step:

```sh
make run-mcp                 # MCP server over stdio
```

On start the process logs `aitiome mcpd serving on stdio` to stderr and then serves. It loads all
reconnaissance data via `go:embed`, so no external data files or network access are required for the
core tools. Requires Go 1.26+.

### Client configuration

Point any MCP client (Claude Desktop, an agent framework, etc.) at the built binary. A typical
`mcpServers` entry:

```json
{
  "mcpServers": {
    "aitiome": {
      "command": "/absolute/path/to/aitiome/mcpd",
      "args": [],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-..."
      }
    }
  }
}
```

The `ANTHROPIC_API_KEY` is **optional** and only used by the Claude-backed synthesis path
(`synthesize_assessment`). Without it, that tool falls back to a deterministic reasoner and every other
tool works unchanged. (The reasoner model defaults to `claude-opus-4-8` and is configurable via
`AITIO_MODEL_REASONER`.)

---

## Tool reference

All 13 tools are read-only. The `disease` parameter, where present, is optional and defaults to `pd`
(Parkinson's); the other accepted value is `ad` (Alzheimer's).

| Tool | Params | Purpose |
|---|---|---|
| `health` | — | Engine status, loaded contract version, validation-compound count. |
| `list_compounds` | `disease?` | The disease axis's ground-truth validation set with identity + confidence tier. |
| `diseases` | — | Available disease axes with anchor AOP, endorsement status, calibration note, compound count. |
| `resolve_compound` | `id` (req) | Resolve any identifier to the one salt-form-correct record. |
| `assess_compound` | `id` (req), `disease?` | The flagship: resolve → curated gate → reconstruct AOP cascade → tier + trace + cross-disease verdict. |
| `run_validation` | `disease?` | Run the full validation harness over the axis's ground truth; report the scoreboard (expect fp=0, fn=0). |
| `list_candidates` | `disease?` | The evidence-weighted-priority triage queue: real-but-incomplete-evidence chemicals with distance-to-gate + next experiment. |
| `synthesize_assessment` | `id` (req) | Calibrated prose synthesis citing evidence strands as `[E#]`; explains, never decides. |
| `assess_curated` | `input` (req, JSON) | Grade externally-assembled curated evidence with the same predicate; unverified → hypothesis. |
| `sources` | — | Primary data sources + methods as research-style citations with links. |
| `benchmark` | — | The falsification harness: curated rule fp=fn=0 vs bioactivity AUROC (at/below chance) against the decoys. |
| `discovery_map` | `aop?` — (no) — see note | The honest negative-results discovery map: seven axes, each coverage/confounder-killed, plus two live leads. |
| `get_pathway` | `aop?` | Reconstruct an endorsed OECD AOP as a positioned, grounded graph. Defaults to the AOP-3 anchor. |

> Note: `discovery_map` takes no parameters. `get_pathway` is the tool that accepts an optional `aop`.

### Per-tool detail

**`health`** — no params. Returns engine status, the loaded `contract` version, and the count of
validation compounds loaded.

**`list_compounds`** — `disease?` (`"pd"` default / `"ad"`). Returns the ground-truth validation set for
that axis: each compound's identity and its `confidence_tier`.

**`diseases`** — no params. Returns the catalog of disease axes: Parkinson's (endorsed AOP-3 anchor) and
Alzheimer's (endorsed AOP-12/48 anchor + non-endorsed Tau/amyloid overlay), each with its anchor AOP,
endorsement status, calibration note, and compound count.

**`resolve_compound`** — `id` (required: name, CAS, DTXSID, InChIKey, or CID). Resolves to the one
salt-form-correct record (DTXSID-first; avoids the PubChem-synonym salt-form trap). Returns a tool error
on an unresolvable identifier.

**`assess_compound`** — `id` (required), `disease?`. The flagship. Resolves identity, applies the curated
recovery predicate (never gated on assay/bioactivity), reconstructs the grounded AOP cascade for
positives, and emits the trace-event stream. Returns the full `CompoundResult` with confidence tier and
the cross-disease verdict for the other axis.

**`run_validation`** — `disease?`. Runs the full validation harness over the axis's ground truth (PD: 12
neurotoxicants + 15 negatives incl. 6 adversarial decoys; AD: curated AD-linked chemicals + AD-assay-active
decoys) and returns the scoreboard (expect fp=0, fn=0).

**`list_candidates`** — `disease?`. Returns the value-of-information-ranked candidate queue: chemicals
with real but incomplete evidence, each with its evidence strands, promotion distance, and recommended
next experiment. A triage layer, **not a predictor** — only the curated gate promotes; the adversarial
decoys are carried as a control and rank last. Includes a held-out prioritization backtest.

**`synthesize_assessment`** — `id` (required). Returns a calibrated prose synthesis of a compound's
assessment, citing evidence strands as `[E#]`. It explains the mechanistic reasoning; it never makes or
changes the recovery call. Uses the Claude evidence-reasoner when configured, with a deterministic
fallback.

**`assess_curated`** — `input` (required, a JSON `CuratedInput` string). Grades externally-assembled
curated evidence for a chemical **not** in the embedded benchmark — the shape a curation agent / Claude
Science produces. Uses the same deterministic predicate; an **unverified** draft is graded as a hypothesis
(`analogy_only`), never a curated diagnostic positive. Input shape:

```json
{ "name": "...", "dtxsid": "...", "pdDirect": 0, "aopStressorOf": [], "verified": false, "source": "claude-science" }
```

`name` is required; invalid or empty input returns a tool error.

**`sources`** — no params. Returns the primary data sources and methods as research-style citations with
links (CTD, AOP-Wiki, MitoCarta3.0, Kamath 2022, EPA ToxCast/ICE, openFDA FAERS, B3DB, DSSTox).

**`benchmark`** — no params. Returns the falsification harness computed live from the validation set: the
curated rule's perfect separation (fp=fn=0) next to the AUROC of every bioactivity signal against the
adversarial decoys, which is at or below chance. The empirical answer to "you're just detecting
bioactivity".

**`discovery_map`** — no params. Returns the honest negative-results discovery map: seven axes tested for
an annotation-independent discovery signal on this chemical class, each coverage- or confounder-killed,
plus the two live leads (neural-specific subset, Boltz-2 Q-site). Discovery is a map, not a predictor.

**`get_pathway`** — `aop?` (e.g. `"3"`; omit for the AOP-3 anchor). Reconstructs an endorsed OECD AOP as
a positioned, grounded graph: nodes = key events (MIE → KE → AO), edges = key-event relationships. The
MIE is grounded in MitoCarta Complex-I Q-site subunits; the AO in SOX6/AGTR1 vulnerable dopaminergic
neurons. Returns a tool error on an unknown AOP id.

---

## Worked examples

The three examples below show what the engine does and how an agent uses it. **Tool inputs are exact;
outputs are illustrative** JSON shaped to match the engine's guarantees — run the tools for the live
values.

### 1. `assess_compound` — rotenone (PD): the flagship

Rotenone is a known Complex-I-inhibiting Parkinsonian neurotoxicant. The point of this call is to show
the *decision discipline*: the curated gate fires, the endorsed AOP cascade reconstructs, and bioactivity
appears only as corroboration — never as the reason for the call.

**Call**

```json
{
  "name": "assess_compound",
  "arguments": { "id": "rotenone", "disease": "pd" }
}
```

**Result (illustrative)**

```json
{
  "compound": {
    "name": "rotenone",
    "casrn": "83-79-4",
    "dtxsid": "DTXSID1024154",
    "inchikey": "JUVIOZPCNVVQFO-HBGVWJBISA-N"
  },
  "disease": "pd",
  "decision": {
    "positive": true,
    "diagnostic": true,
    "gatedOnAssay": false,
    "predicate": "(CTD curated PD DirectEvidence) OR (registered neuro-AOP stressor)",
    "matched": ["ctd_pd_direct_evidence", "aop3_stressor"]
  },
  "confidence_tier": "assay_mechanism_recovered",
  "pathway": {
    "aop": "3",
    "nodes": [
      { "id": "888", "type": "MIE", "label": "binding of inhibitor, complex I" },
      { "id": "887", "type": "KE",  "label": "complex-I inhibition" },
      { "id": "177", "type": "KE",  "label": "mitochondrial dysfunction" },
      { "id": "890", "type": "KE",  "label": "nigrostriatal dopaminergic degeneration" },
      { "id": "896", "type": "AO",  "label": "parkinsonian motor deficits" }
    ]
  },
  "evidence": [
    { "id": "E1", "strand": "curated",       "status": "diagnostic",    "finding": "CTD PD DirectEvidence (marker/mechanism)" },
    { "id": "E2", "strand": "aop_stressor",  "status": "diagnostic",    "finding": "registered stressor of AOP-3 (complex-I)" },
    { "id": "E3", "strand": "assay",         "status": "corroboration", "finding": "mitochondrial/MMP assay activity — illustrative, NOT the decision" },
    { "id": "E4", "strand": "epidemiology",  "status": "corroboration", "finding": "human PD association, OR ~10" },
    { "id": "E5", "strand": "bbb",           "status": "supporting",    "finding": "brain-penetrant" }
  ],
  "crossDisease": { "disease": "ad", "positive": false },
  "trace": [ "resolve", "gate:curated_hit", "reconstruct:aop3", "ground:MIE", "ground:AO", "tier:assay_mechanism_recovered" ]
}
```

**Read it this way.** `decision.positive` is `true` because `matched` lists the curated hits — and
`gatedOnAssay` is `false`. Strand `E3` (assay activity) is tagged `corroboration`: it enriches confidence
and illustrates mechanism but is explicitly *not* what made the call. That is the whole thesis in one
object.

### 2. `list_candidates` — the evidence-weighted-priority triage queue (PD)

This is Aitiome as a *triage pipeline*, not a validator: chemicals with real-but-incomplete evidence,
ranked by a transparent, additive, **non-bioactivity** index, each with how far it is from the curated
gate and what experiment would close the gap.

**Call**

```json
{
  "name": "list_candidates",
  "arguments": { "disease": "pd" }
}
```

**Result (illustrative)**

```json
{
  "disease": "pd",
  "ranker": {
    "type": "transparent_additive",
    "learned_weights": false,
    "weights": { "AOP": 5, "MECH": 3, "IPSC": 2, "EPI": 2, "XDIS": 2, "ZF": 1, "INFERRED": 0.5 },
    "convergence_bonus": "+1 per convergent line"
  },
  "candidates": [
    {
      "rank": 1,
      "name": "fenpyroximate",
      "score": 11,
      "strands": ["aop3_stressor_candidate", "ipsc", "epi"],
      "distanceToGate": "needs verified in-scope AOP stressor registration OR CTD PD DirectEvidence",
      "nextExperiment": "confirm AOP-3/AOP-593 complex-I MIE engagement in DA neurons",
      "promoted": false
    },
    {
      "rank": 2,
      "name": "perchloroethylene (PCE)",
      "score": 8,
      "strands": ["epi", "mech"],
      "distanceToGate": "manual CTD-PD DirectEvidence verification (CTD batch API ALTCHA-walled)",
      "nextExperiment": "curate CTD-PD DirectEvidence to promote to 14th positive",
      "promoted": false,
      "note": "the flagship stuck candidate"
    }
  ],
  "controls": {
    "adversarial_decoys": [
      { "name": "troglitazone",  "score": 0, "rank": "last" },
      { "name": "prochloraz",    "score": 0, "rank": "last" },
      { "name": "propiconazole", "score": 0, "rank": "last" },
      { "name": "simvastatin",   "score": 0, "rank": "last" },
      { "name": "fenofibrate",   "score": 0, "rank": "last" },
      { "name": "warfarin",      "score": 0, "rank": "last" }
    ],
    "note": "carried as a permanent control — MUST rank last (score 0)"
  },
  "backtest": {
    "held_out_positive": "TCE/DDE",
    "recovered_from_non_curated_strands": true,
    "above_all_decoys": true,
    "claim": "prioritization skill, NOT causal discovery"
  }
}
```

**Read it this way.** Each candidate is scored from its **non-bioactivity** strands only, carries an
explicit `distanceToGate` and a `nextExperiment`, and is **not** promoted (`promoted: false`) until the
curated gate fires. The 6 adversarial decoys are carried as a permanent control at score 0, ranked last.
The `backtest` recovers a known positive from non-curated strands alone, above every decoy — evidence of
prioritization skill, not causal discovery.

### 3. `benchmark` — the falsification result

The single strongest answer to "you're just detecting bioactivity." Computed live from the validation
set: the curated rule separates perfectly, while every bioactivity signal is at or below chance against
the adversarial decoys.

**Call**

```json
{ "name": "benchmark", "arguments": {} }
```

**Result (illustrative)**

```json
{
  "curatedRule": {
    "predicate": "(CTD curated PD DirectEvidence) OR (registered neuro-AOP stressor)",
    "tp": 12, "fp": 0, "fn": 0, "tn": 15,
    "separation": "perfect"
  },
  "bioactivityAUROC": {
    "note": "AUROC of each bioactivity signal, 12 positives vs 6 adversarial decoys; 0.5 = chance",
    "signals": [
      { "signal": "Mitochondrial assays",      "aurocVsDecoys": 0.16, "aurocVsAllNegatives": 0.41 },
      { "signal": "Membrane potential (MMP)",  "aurocVsDecoys": 0.12, "aurocVsAllNegatives": 0.39 },
      { "signal": "Oxidative stress",          "aurocVsDecoys": 0.20, "aurocVsAllNegatives": 0.40 },
      { "signal": "Mechanistic assays (total)","aurocVsDecoys": 0.39, "aurocVsAllNegatives": 0.57 },
      { "signal": "ToxCast active (all)",      "aurocVsDecoys": 0.15, "aurocVsAllNegatives": 0.45 }
    ]
  },
  "conclusion": "Every bioactivity signal is at or below chance vs the decoys — the decoys are, if anything, more bioactive than the true neurotoxicants. Bioactivity is anti-diagnostic here; the curated rule is perfect on the same set."
}
```

**Read it this way.** `curatedRule` is perfect (`fp=0, fn=0`). Every entry in `bioactivityAUROC` is at or
below 0.5 against the decoys — an activity model would do *worse than a coin flip*. This is why the engine
never gates on assay activity: on this chemical class, bioactivity cannot discriminate, and the curated
signal can.

---

## Design notes for agent authors

- **Read-only and deterministic.** No tool mutates state. The core tools are deterministic: the *same
  input yields the same output*, every run. (Only `synthesize_assessment` is non-deterministic, and only
  when a Claude key is configured — its prose varies; the underlying call and tier do not.)
- **Identifiers are flexible.** `resolve_compound`, `assess_compound`, and `synthesize_assessment` accept
  a name, CAS, DTXSID, InChIKey, or CID. Resolution is **DTXSID-first and salt-form-correct** — entering
  the paraquat dichloride CAS resolves to the salt actually tested, not a guessed parent cation.
- **`disease` is optional, defaults to PD.** Where a tool takes `disease`, omit it for Parkinson's or pass
  `"ad"` for Alzheimer's. PD is the fully-quantified axis; AD is calibrated more conservatively (its
  weaker spots are surfaced, not hidden).
- **Results are JSON text.** Every tool returns its result as a single JSON string (the adapter marshals
  the service value). Parse it as JSON.
- **Errors are tool errors, not exceptions.** A missing required arg, an unresolvable identifier, an
  unknown AOP, or invalid `CuratedInput` JSON returns an MCP tool error with a human-readable message —
  not a crash.
- **The decision is never yours to move.** No tool lets an agent change a recovery call by supplying
  bioactivity or prose. `assess_curated` grades agent-supplied *curated* evidence, but an unverified draft
  is graded as a hypothesis (`analogy_only`), never a diagnostic positive. The gate is the gate.
