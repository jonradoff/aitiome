# Principled exclusions — data sources & methods we deliberately DID NOT use, and why

> For the report/presentation. Aitiome's credibility rests as much on what it *refuses* to use as on what
> it uses. Every exclusion below is a deliberate, defensible choice tied to the core discipline: the recovery
> decision rests only on **curated diagnostic** evidence (CTD DirectEvidence + registered AOP stressors);
> nothing that reintroduces **general bioactivity** as a discriminator, or that is **circular** with our
> curation, is allowed to touch a grade. Sources for the round-2 assessments: `docs/research/round2-literature-scan.md`;
> round-3 (hyper-current, 2026-07-09): `docs/research/round3-literature-scan.md`;
> discovery axes: `docs/recon-learnings-summary.md` + the in-app discovery map (`/discovery-map`).

## Exclusion reason codes
- **COVERAGE-KILLED** — environmental compounds of interest are absent/sparse in the resource (it was built on
  drugs / well-studied chemicals), so it cannot see our class.
- **CONFOUNDER-KILLED** — it measures *general bioactivity / structural similarity*, which we proved is
  **anti-diagnostic** here (scores at or below chance vs the adversarial mito-active decoys). Using it as a
  discriminator would import the exact error the whole project falsifies.
- **CIRCULAR** — its edges/labels derive from the same CTD/AOP curation we already use, so it would be one
  source read twice (inflates apparent independence).
- **DRUG-KEYED** — indexed by pharmaceuticals; environmental exposures are out of coverage/scope.
- **WRONG-TARGET** — measures a different adverse outcome (e.g. developmental neurotox ≠ adult neurodegeneration).
- **LOW-SIGNAL/ACCESS** — text-mined co-occurrence or portal-only with high integration cost and little
  diagnostic value.

## A. Discovery methods rejected in reconnaissance (the "discovery is a map, not a predictor" result)
Seven independent axes were tested for an annotation-independent *discovery* signal on this chemical class; all
were killed. **These are shipped as a first-class negative-results map, not hidden.**

| Axis | Verdict | Why |
|---|---|---|
| **LINCS L1000** (transcriptomic signatures) | COVERAGE-KILLED | Environmental toxicants (pesticides, metals) largely absent from the perturbation library. |
| **EPA HTTr** (whole-transcriptome) | COVERAGE-KILLED | Non-neuronal cells; our compounds sparsely covered. |
| **EPA HTPP** (Cell Painting morphology) | COVERAGE-KILLED | Same coverage gap; morphology ≠ neurodegeneration. |
| **Structure / QSAR** (similarity) | CONFOUNDER-KILLED | Positives span unrelated scaffolds; structural similarity ≠ neurotoxicity. |
| **Full ToxCast fingerprint** (multi-assay) | CONFOUNDER-KILLED | General bioactivity — the decoys collapse into the positives (the anti-diagnostic core result). |
| **ComptoxAI / AlzKB** (knowledge-graph link prediction) | COVERAGE-KILLED + CIRCULAR | Public graph empty / stub ML; edges are CTD/AOP-derived (same provenance as our predicate). |
| **Boltz-2 Q-site** (physics docking) | bounded lead only | Optional, non-load-bearing; kept as a lead with explicit N, never a claim. |

## B. Bioactivity as a discriminator — the central deliberate refusal
- **EPA ToxCast / Tox21 / invitroDB** hit-calls, **DeepTox**-style assay-activity ML, **GenRA** bioactivity
  read-across. **CONFOUNDER-KILLED.** We *use* ToxCast only as **corroboration** (illustrating mechanism for
  known positives) and prove — live, via the falsification benchmark — that every bioactivity signal is at or
  below chance against the adversarial decoys. Independent support: **Mack et al. 2024** (*NeuroToxicology*) —
  ToxCast covers only ~40% neural-relevant targets and under-covers the oxidative-stress key events behind ~79%
  of neurotoxicity; EPA's own concordance work shows HTS misses real neurotoxicants (false-inactive bias).

## C. Data sources assessed in the round-2 scan and NOT added (with reason)
| Source | Reason | Note |
|---|---|---|
| **TOXRIC** | CONFOUNDER-KILLED | Bioactivity/endpoint aggregator built for ML benchmarking — reintroduces the confounder. |
| **PubChem BioAssay / Tox21** | CONFOUNDER-KILLED | The canonical general-bioactivity resource; would break the anti-diagnostic claim. |
| **OECD QSAR Toolbox** | CONFOUNDER-KILLED | Structure/QSAR — already a rejected discovery axis (§A). |
| **Blood Exposome DB** | LOW-SIGNAL | Text-mined co-occurrence, not curated causality (same risk as CTD *inferred* links, which we also ban). |
| **Exposome-Explorer** | COVERAGE-KILLED | Scoped to dietary/pollutant biomarkers; almost no overlap with our pesticide/metal class. |
| **eChemPortal** | LOW-SIGNAL/ACCESS | Regulatory hazard labels, portal-only, no API; low diagnostic signal for this task. |
| **PrimeKG / Hetionet** | DRUG-KEYED | Drug-repurposing KGs; environmental compounds out of coverage. |
| **DNT in-vitro battery** | WRONG-TARGET + CONFOUNDER | Developmental neurotox ≠ adult nigrostriatal degeneration; still assay data; ~120-chem coverage. |
| **Open Targets** (as an *independent* line) | CIRCULAR-risk | Aggregating KG; use only as a convenience view over primary sources, never double-counted as independent. |
| **CTD *inferred* associations** | LOW-SIGNAL (banned in recon) | Inference-by-study-volume (acetaminophen has 80 inferred PD links); only curated DirectEvidence counts. **Live 2025 exemplar:** Cockell et al. (bioRxiv, 23 Dec 2025, PMC12776105) data-mined CTD to "enrich" 742 dementia-associated chemicals — explicitly hypothesis-generating, topped by pre-existing knowns (BaP, BPA, arsenite, paraquat, cadmium). Exactly the trap the DirectEvidence-only rule avoids; cite it, don't curate it. |
| **ToxCast HTTr (U-2 OS / MCF7) & JUMP Cell Painting (U2OS), 2025 releases** | CONFOUNDER-KILLED | Coverage of environmental chemicals grew in 2025-26, but on non-neuronal cell lines — this expands *general bioactivity* (the confounder), not neural-specific signal. Watch JUMP-CP OASIS for a future agchem extension. |

## D. What we DID add from round 2 (contrast — the disciplined inclusions)
Grandjean & Landrigan 2014 (independent curated neurotoxicant vote); real AD epidemiology (contested items
flagged); AD disease-associated-microglia grounding. Considered-and-optional (grounding, non-gating): GWAS
Catalog / Human Protein Atlas / EPA ExpoCast / ToxRefDB. Every inclusion is curated-diagnostic or honest
grounding — never a new bioactivity gate.

## E. Round-3 (2026-07-09) — pending candidate, held to the DirectEvidence gate
- **Perchloroethylene (PCE / tetrachloroethylene) — candidate 14th PD positive, NOT ADDED (pending verification).**
  Dorsey et al., *Lancet Neurology* 2025 name PCE alongside TCE as an established dry-cleaning/degreasing PD
  toxicant. Per the hard rule, review-mention is insufficient: a positive requires curated **CTD-PD DirectEvidence
  (marker/mechanism)**. Verification is pending — CTD's batch-query API is behind an ALTCHA bot-wall as of this
  pass, so it could not be checked programmatically. **If manual verification clears, PCE is a defensible spine
  expansion (exactly like the round-2 TCE addition, 13→14). Do not add on review-mention alone.**
- The recon discovery conclusion was re-tested against 2025–26 literature and **holds** — but with a precise
  caveat (an earlier "never pointed at PD/AD" draft was corrected before shipping): exposure-wide *epidemiology*
  of PD/cognition exists (Paul & Ritz, *Nat Commun* 2023, 288-pesticide-wide PD screen; Jang et al., *Exposome*
  2025, NHANES cognition ExWAS), yet the flagship multi-disease exposome atlases carry no neuro phenotype, and
  none of it is an arbitrary-chemical neurotoxicity predictor. Population exposure–disease inference ≠ per-chemical
  prediction. See `docs/research/round3-literature-scan.md`.

## One-line framing for the deck
*"We tested seven discovery axes and a dozen more data sources and rejected most of them — on principle.
Anything that would smuggle general bioactivity back in as a discriminator, or that is circular with our own
curation, is disqualified. The exclusions are the discipline."*
