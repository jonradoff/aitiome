# Curated-evidence drafts (staged for Claude Science verification)

These are **unverified drafts** produced by the command-line curation agent
(`make curate NAME=<chemical>` / `go run ./services/cmd/curate`). Each is a
`contract.CuratedInput` for a chemical **not** in the 27-compound benchmark,
assembled by Claude (Opus 4.8) with the web-search tool.

They are the *input* to the honest pipeline, not a result:

```
these drafts  ->  verify in Claude Science / against CTD & AOP-Wiki  ->  engine grades as curated
```

Every draft has `verified: false` and `source: agent-draft`, so the engine grades
it as a **hypothesis** (`analogy_only`), never a curated positive. The agent is
deliberately conservative: it sets `pdDirect=0` / `aopStressorOf=[]` unless it can
substantiate a *curated* CTD DirectEvidence or a registered neuro-AOP stressor,
and records in `notes` exactly what a human should verify.

## Staged candidates (PD-associated pesticides, outside the benchmark)

| draft | identity | agent verdict | to verify in Claude Science |
|---|---|---|---|
| `ziram.json` | DTXSID0021464 | hypothesis (pdDirect 0) | CTD DirectEvidence for ziram vs Parkinson (MESH:D010300); AOP-Wiki Stressor:316 linkage |
| `diquat.json` | (see file) | hypothesis | CTD DirectEvidence; neuro-AOP stressor status |
| `benomyl.json` | (see file) | hypothesis | CTD DirectEvidence; the benomyl ALDH-inhibition parkinsonism AOP |

## Verify one, then grade it

Confirm each curated field against the primary source (the exact Claude Science
task is in [`../claude-science.md`](../claude-science.md)), set `verified: true`
and `source: "claude-science"` on the fields you confirmed, then:

```sh
curl -s localhost:8787/assess-curated -H 'content-type: application/json' \
  -d @ziram.verified.json | jq '{call:.recovery.call, tier:.confidenceTier}'
```
