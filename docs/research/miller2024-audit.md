# Audit: what the Miller/Barouki/Samieri 2024 exposome paper calls for, vs. what Aitiome does

> Commissioned by Jon (2026-07-09): audit the paper we cite as the field's call-to-action, and map it
> honestly against what Aitiome actually does. Paper: **Lefèvre-Arbogast S, Chaker J, Mercier F, Barouki R,
> Coumoul X, Miller GW, David A, Samieri C. "Assessing the contribution of the chemical exposome to
> neurodegenerative disease." Nature Neuroscience. 2024;27(5):812–821** (PMID 38684891; doi:10.1038/s41593-024-01627-1).
> Full text is paywalled; the calls below are from the verbatim abstract + two companion papers by the same
> group (Alzheimer's & Dementia 2025) + a National Academies workshop with Miller's framing. Tiered accordingly.

## ★ Two corrections this audit forced
1. **Citation fix:** we had it as *27:1013–1023, "Miller GW, et al."* — wrong. Correct is **27(5):812–821**,
   first author **Lefèvre-Arbogast** (Miller is a co-author). Fixed in `web/src/references.ts` and the app.
2. **Framing fix:** the paper's flagship call is for a **GWAS-analogous, untargeted, HRMS-driven,
   discovery-oriented** exposome-wide search — *not* for a curated, validation-first, anti-bioactivity engine.
   So Aitiome does **not** straightforwardly "fulfill" their call; it serves the **mechanism-and-evidence
   half** and deliberately declines the **untargeted-discovery half**. The app copy now says exactly this.

## What the paper calls for (abstract-verified where noted)
Central thesis (verbatim, abstract): *"What has been missing is a systematic approach analogous to
genome-wide association studies … it is now possible to study hundreds to thousands of chemical features under
the exposome framework"* and to *"generate exposomic data to complement genomic data."*

| # | The call | Category |
|---|---|---|
| A1 | A **systematic, GWAS-analogous exposome-wide** approach (ExWAS) — hypothesis-generating | discovery + integration |
| A2 | **Complement genomic data with exposomic data** | integration |
| A3 | **Untargeted, unbiased high-resolution mass spectrometry** of the internal exposome | discovery + measurement |
| A4 | Study **overlooked chemicals** (flame retardants, PFAS, plasticizers, neonicotinoids) and **overlooked pathways** (neurovascular, non-neuronal cells) | mechanism + discovery |
| A5 | Address **chemical mixtures** (additive/synergistic), not single compounds | mechanism + integration |
| A6 | **Connect exposures to disease mechanism** (oxidative stress, mitochondrial dysfunction, neurotransmission, amyloid-β, neuroinflammation) | **mechanism** |
| A7 | **Integrate epidemiology with experimental toxicology** (triangulation) | integration + mechanism |
| A8 | **Model-system ↔ human-cohort** iterative validation | integration/validation |

Notable absences in the accessible text: they do **not** verbatim invoke "**adverse outcome pathway (AOP)**"
or "**machine learning/AI**" as named methods, and they do **not** argue for **curated evidence over
bioactivity screening** or for **calibration/anti-overclaim** — their posture is the opposite (untargeted,
discovery-mode). (Flagged: full-text may contain more; paywalled.)

## Aitiome vs. each call
| Call | Aitiome | Verdict |
|---|---|---|
| A1 GWAS-analogous ExWAS (untargeted search) | We do **not** run an untargeted search. We reconstruct + grade mechanism for compounds with curated evidence, and ship a **negative-results discovery map** showing why untargeted discovery isn't shippable for this class on public data. | **Deliberate contrast** — we are the validated complement, not the search. |
| A2 Complement genome with exposome | We ground the adverse outcome in disease GWAS genes (Bellenguez; Kamath) alongside exposome chemicals, but do not integrate patient genomes. | Partial |
| A3 Untargeted HRMS | Not addressed — we don't measure exposures; we reason over curated chemical→disease evidence. | Out of scope (by design) |
| A4 Overlooked chemicals + pathways | Cover metals/pesticides/solvents; the AD arm adds the **non-neuronal / microglial neuroinflammation** pathway they flag. | Partial ✓ |
| A5 Chemical mixtures | Not addressed — single-compound grading. | Gap (honest limit) |
| A6 **Connect exposures to disease mechanism** | **Core strength** — reconstruct the OECD-endorsed AOP (complex-I→mito→nigrostriatal→PD; NMDAR/microglia→AD), ground each edge (MitoCarta, Kamath, Bellenguez, DAM). | **Directly addressed ✓✓** |
| A7 Integrate epidemiology + experimental tox | Addressed per compound — curated CTD/AOP + epidemiology strand + FAERS + BBB + assay corroboration. | **Directly addressed ✓** |
| A8 Model↔cohort validation | We validate against a curated adversarial benchmark (recovery + falsification), not model↔cohort loops. | Adjacent |

## Honest positioning (for the deck / "Who it is for")
The Miller/Barouki/Samieri program's dominant asks are **integration (A2, A7, A8)** and **untargeted discovery
(A1, A3)**. Aitiome squarely serves **A6 (connect exposures to mechanism)** and **A7 (integrate epidemiology +
mechanistic evidence)**, and partially **A4**. It **deliberately declines A1/A3/A5** — the untargeted,
mixture-scale, HRMS-driven discovery — because (a) the reconnaissance found no shippable unsupervised-discovery
signal for this chemical class on public data, and (b) untargeted activity screening is precisely the
anti-diagnostic failure mode Aitiome falsifies. So Aitiome is the **curated, validated, calibrated counterpart**
to an exposome-wide discovery search: it answers "of the chemicals already implicated, which reconstruct a
credible endorsed pathway, and how strong is the evidence?" — and it maps, rather than hides, the discovery gap
the paper's flagship method is meant to fill. That is a precise complement to the vision, not a claim to fulfill it.

## Follow-ups
- If we ever want to move toward A2/A7 more literally, GWAS Catalog + Open Targets (already scoped in
  `excluded-sources.md` as grounding-only) are the disciplined additions.
- A5 (mixtures) and A3 (HRMS) are genuine out-of-scope limits — state them plainly if asked.
