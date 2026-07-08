# Claude Science in the Aitiome pipeline

Aitiome's recovery decision is deterministic and rests on **curated** evidence - CTD Parkinson's
DirectEvidence and AOP-Wiki neuro-AOP stressor status. The embedded benchmark ships that evidence for
27 compounds. To assess a chemical *beyond* the benchmark, that curated evidence has to be assembled -
and assembling it correctly (curated-only, salt-form aware, citation-checked) is exactly what Claude
Science is built for.

So Claude Science is the **evidence-assembly and verification** front-end to the deterministic engine:

```
  Claude Science / curation agent           Aitiome engine
  ------------------------------            --------------------
  assemble + verify curated evidence  --->  deterministic grade
  (CTD DirectEvidence, AOP stressor,        (same predicate),
   identity, epidemiology) + citations       cited synthesis
```

## Two ways to run the assembly

### 1. Automated draft from the command line (the same web tools Claude Science uses)

`make curate NAME="<chemical>"` runs a Claude (Opus 4.8) agent with the web-search tool that assembles
a **curated-evidence draft** with citations and grades it through the engine:

```sh
make curate NAME=ziram
# or: go run ./services/cmd/curate --assess "ziram"
```

The draft is emitted as a `contract.CuratedInput` JSON. Example (abridged) for ziram, a PD-associated
dithiocarbamate not in the benchmark:

```json
{
  "name": "ziram", "dtxsid": "DTXSID0021464", "cas": "137-30-4",
  "verified": false, "source": "agent-draft",
  "pdDirect": 0, "aopStressorOf": [],
  "citations": [{"marker":"C7","detail":"Wang et al. 2011, ziram+paraquat OR 1.82 for PD","url":"https://pmc.ncbi.nlm.nih.gov/articles/PMC3643971/"}],
  "notes": "pdDirect set to 0 conservatively: ziram-PD links found are via inferred CTD gene-network analyses, not a confirmed curated DirectEvidence record. Verify at ctdbase.org for ziram vs MESH:D010300."
}
```

**The honesty guardrail is enforced in code, not by trust.** A `curate` draft is always
`verified=false`, and the engine grades an unverified input as `analogy_only` (a hypothesis) with a
rationale that says "verify against CTD DirectEvidence and AOP-Wiki before treating it as recovered."
An agent's web-research guess is never presented as a curated diagnostic positive - the LLM never
enters the decision path.

### 2. Verify in Claude Science (the step that makes it real)

Take the draft into Claude Science and verify each curated field against the primary sources, using
its connectors and reviewer agent. The Claude Science task:

> "Verify this curated-evidence draft for {chemical}. For pdDirect: query the Comparative Toxicogenomics
> Database for a CURATED chemical-disease DirectEvidence association (marker/mechanism or therapeutic)
> between {chemical} and Parkinson Disease (MESH:D010300); inferred/gene-network associations do not
> count. For aopStressorOf: check AOP-Wiki for whether {chemical} is a registered stressor of any
> endorsed neuro-AOP. Return the corrected fields with citations, and set verified=true only for fields
> you could substantiate against the primary source."

Set `verified: true` and `source: "claude-science"` on the fields you confirmed, then grade the verified
record - now it can register as a real curated tier:

```sh
curl -s localhost:8787/assess-curated -H 'content-type: application/json' \
  -d @verified-ziram.json | jq '{call:.recovery.call, tier:.confidenceTier}'
```

Claude Science's reproducibility model (every result ships its code, environment, and message history)
means the verification is auditable - exactly the provenance a mechanism-first reviewer wants.

### 3. The epidemiology tier as a Claude Science artifact

The human-epidemiology strand is, by design, an in-window Claude Science literature-curation task (not
an API pull). Run the extraction there (OR/CI per compound, with the reviewer agent checking
citations), export the artifact, and cite the app's epidemiology strand to it.

## Interfaces

- **HTTP:** `POST /assess-curated` with a `CuratedInput` body.
- **MCP:** `assess_curated` (input: a JSON `CuratedInput` string) - so an external agent can run the same
  bridge.
- **CLI:** `make curate NAME=...` / `go run ./services/cmd/curate [--assess] "<name>"`.

## Why this matters for the demo

It answers the sharpest generalization question - "what if I hand you a new chemical?" - honestly and
live: "we run the Claude Science curation workflow to assemble the curated evidence, verify it against
the primary sources, and the deterministic engine grades it. Until it's verified, it's a hypothesis,
and we say so." Claude Science does the genuinely hard part; the engine stays disciplined.
