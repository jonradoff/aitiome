# Round-3 literature & data-availability scan (2026-07-09) — is neural-specific exposome-scale data here yet?

> Commissioned to stress-test the recon conclusion that the **untargeted-discovery half** of the Miller/
> Lefèvre-Arbogast 2024 call is not shippable on public data for this chemical class. Hyper-current pass,
> prioritizing 2025–2026 sources. This is a **settled-input check**, not a re-litigation: findings that would
> revisit a recon finding are flagged, not silently applied.

## Bottom line

**The recon limit holds — and is *more* defensible in mid-2026, with fresher citations to prove it.** The
frontier advanced on every axis (bigger transcriptomic libraries, a graph foundation model, the largest
exposome–phenome atlas ever built, active Complex-I docking methods), but every advance is defeated by the
**same two kill-conditions** recon identified:

- **Coverage-kill persists.** The screening data that grew in 2025–26 (ToxCast HTTr on U-2 OS osteosarcoma,
  JUMP Cell Painting on U2OS) has **no neuronal readout**; the neural-specific battery that matured (OECD
  DNT-IVB, GD 377) is **scoped to *developmental* neurotoxicity** — prenatal/childhood, not adult PD/AD.
- **Confounder-kill persists.** New neural ML posts high headline AUCs on curated hazard labels, not against
  adversarial mito-active-but-non-neurotoxic decoys at exposome scale.

**Important correction (verified 2026-07-09):** an earlier draft said the exposome-wide approach "has never been
pointed at PD/AD." **That is false and was corrected before shipping.** Exposure-wide *epidemiology* of
neurodegeneration exists and is valuable — Paul & Ritz ran a **288-pesticide-wide association study of Parkinson's**
in the PEG cohort (*Nat Commun* 2023; 53 associated, 10 confirmed dopaminergic-toxic in an iPSC screen), and a
NHANES **cognition ExWAS** exists (Jang et al., *Exposome* 2025). The *precise, defensible* statement is: the two
flagship multi-disease exposome atlases — incl. Patel & Manrai's 619-exposure × 305-phenotype NHANES atlas (*Nat
Med* 2026) — carry **no** neurodegeneration phenotype, **and** none of this prior art is a predictor of whether an
*arbitrary* chemical is a neurotoxicant from structure/bioactivity (the distinct thing recon showed is
coverage-/confounder-killed). Population exposure–disease inference ≠ per-chemical neurotoxicity prediction.
"Honest map, not a predictor" stands — and the Paul & Ritz PWAS→iPSC design is a direct precedent for a
**candidate-ranking pipeline** (see round-4 planning).

## Findings

### 1. Neural-specific high-throughput data — still developmental-only, still not exposome-scale
- **OECD DNT-IVB matured but is developmental-scoped.** Sachana, Högberg & Mangas, *Front. Toxicol.* (20 Mar
  2026) reviews GD 377's regulatory role; ~400 chemicals total (EFSA ~200, NIEHS ~250, EPA ~250 incl. ~160
  PFAS). Disqualifiers for us: strictly developmental (not adult PD/AD) and not exposome-scale; the one
  functional readout (MEA network-formation) uses rat cortical neurons, not dopaminergic/AD-relevant human cells.
  **CONFIRMS the limit (WRONG-TARGET).**
- **Neural-relevant ToxCast target mapping is now formally published** (Mack-type analysis, PMC11895836, 2024):
  only a minority of ToxCast assays hit neural-relevant targets. This is the citation to pre-empt "ToxCast
  covers neuro." **CONFIRMS.**

### 2. Wet-lab / consortium response to the Miller 2024 call — nuanced
- **Exposure-wide screens of PD/cognition DO exist (claim corrected).** Paul & Ritz, *Nat Commun* 2023 — a
  hypothesis-free **288-pesticide-wide association study of Parkinson's** (PEG cohort; 53 associated; 10 directly
  dopaminergic-toxic in an iPSC neuron screen). Jang et al., *Exposome* 2025 — a **229-chemical-biomarker cognition
  ExWAS** in NHANES. These are population exposure→disease inference, not per-chemical structure/bioactivity
  prediction — but they refute any "nobody has screened PD/AD" framing.
- **The flagship multi-disease atlases still omit neuro.** Patel & Manrai's "atlas of exposome–phenome
  associations," *Nature Medicine* 2026 (medRxiv 2025.06.05.25329055): 619 exposures × 305 phenotypes, NHANES —
  categories are anthropometric/aging/blood/bone/lipids/metabolic/etc., **no PD/AD/dementia/cognition phenotype.**
  So the *large-scale, multi-disease* exposome-atlas tier genuinely has not been aimed at neurodegeneration.
  **PARTIALLY CONFIRMS — narrow claim only.**
- **Brain-aging exposome is ecological, not per-chemical.** "The exposome of brain aging across 34 countries,"
  *Nature Medicine* (3 Apr 2026). 73 *country-level* factors × brain age in 18,701 people (incl. AD/FTLD/MCI);
  physical exposures → faster structural brain aging. Validates the thesis, but exposures are country-level
  aggregates, not individual chemical measurements — a citation for *why the problem matters*, not a data source.
  **CONFIRMS.**

### 3. Environmental-chemical profiling coverage — grew, but not in neurons
- **ToxCast HTTr expanded in 2025 on U-2 OS (osteosarcoma)** and MCF7 (+1,751 chems) — more general-bioactivity
  coverage of environmental chemicals, but non-neuronal. Expands the *confounder*, not neural signal. **CONFIRMS.**
- **JUMP Cell Painting** (~116k–136k compounds, U2OS) stays drug-library-centric; the **OASIS** initiative
  signals *future* agchem/pesticide inclusion but nothing released. **CONFIRMS; watch OASIS.**

### 4. Mechanism-targeted computation — corroborates our MIE anchor and our honest Boltz-2 lead
- **Complex-I Q-site docking is now an active method — directly on our MIE.** "Leveraging Consensus Docking for
  Human Mitochondrial Complexes I and III," *Chem. Res. Toxicol.* 2025. Targets the deep quinone (Qd) site
  between NDUFS2/NDUFS7 that accommodates rotenone/piericidin; screens fungicides/acaricides. A proof-of-concept
  mechanistic screen — independently validates our NDUFS2/NDUFS7 Q-site anchor and the Boltz-2 Q-site lead.
  **CONFIRMS but ACTIONABLE (corroborating citation).**
- **Boltz-2 and successors: powerful, general, unvalidated for our decoys.** Independent evaluations find Boltz-2
  affinity "insensitive to key binding-site mutations and even target exchange" — reinforcing the honest-lead
  caveat (bounded, explicit-N, non-load-bearing). Do not overclaim discrimination. **CONFIRMS the limit.**
- **PROTON (Noori & Zitnik, arXiv:2512.13724, Dec 2025)** — 578M-param graph transformer over NeuroKG; few-shot
  on 28 epidemiological pesticides. Authors' own framing: "hypothesis-generating paired with experimental loops,
  not autonomous discovery," requires curated seed sets. Remains the discovery-predictor **foil**. **CONFIRMS
  positioning.**

### 5. New curated evidence — one candidate positive, and a fresh "inferred = noise" exemplar
- **CTD 2025 update** (Nucleic Acids Res 53(D1):D1328) — infrastructure improved (Evidence column), no evident
  batch of *new* curated PD/AD DirectEvidence beyond our 13. Worth a fresh `pull-ctd-*` re-run for increments.
- **Perchloroethylene (PCE / tetrachloroethylene) — candidate 14th PD positive, NOT YET ADDED.** Dorsey et al.,
  *Lancet Neurology* 2025 name PCE alongside TCE as an established dry-cleaning/degreasing PD toxicant. Per the
  **hard data rule**, review-mention is insufficient — a positive requires curated **CTD-PD DirectEvidence**.
  Verification is **pending**: CTD's batch-query API is now behind an ALTCHA bot-wall (2026-07-09), so it could
  not be checked programmatically this pass. **Action: manually confirm CTD marker/mechanism DirectEvidence for
  Parkinson Disease before adding.** If it clears, PCE is a natural, defensible spine expansion exactly like the
  round-2 TCE addition (13→14). Do **not** add on review-mention alone. See `docs/excluded-sources.md` watch list.
- **CTD-dementia data-mining paper is inferred, NOT positives.** Cockell et al., bioRxiv (23 Dec 2025,
  PMC12776105): 1,008 chemicals screened, 742 "enriched" — explicitly hypothesis-generating associations, topped
  by pre-existing knowns (BaP, BPA, arsenite, paraquat, cadmium). This is exactly the acetaminophen-80-inferred-
  links trap. **Do NOT curate; adopt as a live validating citation for the "inferred = noise" rule.**
- **New/near-endorsement neuro-AOPs.** OECD AOP-483 (energy deposition → learning/memory) approved Mar 2025 —
  radiation-initiated, no chemical MIE. A published-not-yet-endorsed **nanoparticle → Alzheimer's** AOP
  (PMC11709940, Jan 2025) is genuine new chemical-exposure AD mechanistic context to cite "under development"
  (same tiering as the PD AOP-593 network). No new AD AOP has reached full OECD endorsement to replace the
  {12,48,429,475} anchor.

## Actions taken this pass (recon-aligned; no ground-truth fabrication)
1. **Discovery map copy upgraded** with the 2026 "call still unmet" framing (P-ExWAS atlas + 34-country brain-
   aging) and the Complex-I Qd-site docking corroboration of the Boltz-2 lead — `services/aitio/discovery.go`.
2. **References added** (P-ExWAS atlas, brain-aging exposome, Complex-I consensus docking, CTD-dementia inferred,
   DNT-IVB review) and the CTD citation refreshed to the 2025 update — `web/src/references.ts`.
3. **Excluded-sources updated** — CTD-dementia inferred exemplar, non-neural HTTr/JUMP bioactivity, DNT
   developmental scope, and PCE logged as a candidate pending DirectEvidence verification — `docs/excluded-sources.md`.

## Watch list
- **A P-ExWAS run with a PD/AD outcome** — the first real test of the recon conclusion. Watch the Nat Med atlas
  team / UK Biobank / All-of-Us exposome-metabolomics.
- **JUMP-CP OASIS agchem extension** — the one profiling effort that could add environmental coverage.
- **AD AOPs progressing toward OECD endorsement** (nanoparticle→AD) — would upgrade the AD leg from
  "under development" to endorsed-anchored.
- **Boltz successor validation on binding-site specificity** — gates whether any Boltz-based Q-site screen is trustworthy.
- **PCE CTD-PD DirectEvidence** — verify manually, then add if it clears.
