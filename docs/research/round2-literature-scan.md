# Deep-research round 2 — data sources, prior art, and presentation citations

> Commissioned by Jon (2026-07-08): a second scan across AD, PD, adjacent AI prior art, and — especially —
> prior *method-comparison* / PD-vs-AD work. Five parallel web-research agents; citations verified per agent
> (preprints and paywalled items flagged). Purpose: (1) data sources we neglected, (2) references to cite in
> the presentation / app, (3) what to sharpen. **Recon-adjacent items are flagged for Jon, not acted on.**

## ★ TL;DR — what changes

- **Two genuinely-neglected, honesty-strengthening data sources to ADD:** the **Grandjean & Landrigan 2014**
  confirmed-human-neurotoxicant list (a *third* independent curated vote that hardens the negatives/ablation),
  and **real AD epidemiology effect sizes** (we had none wired for AD). Plus grounding adds (GWAS Catalog,
  Human Protein Atlas) if we want them.
- **The single most important sharpening:** pre-empt the *"ML already predicts chemical→disease at 90%+ AUROC"*
  judge pushback. Those AUROCs are drug-keyed / well-covered chemical space; **Mack et al. 2024** shows ToxCast
  covers only ~40% neural-relevant targets and under-covers the oxidative-stress KEs behind 79% of neurotox —
  which is *why* bioactivity is anti-diagnostic here. Lead with this.
- **Positioning gift:** a Dec-2025 Harvard/Zitnik preprint (**PROTON**) is the near-perfect *foil* — a graph-AI
  *discovery-predictor* for neuro chemicals. Aitiome is the deliberate inverse: a *validated, adversarially-tested
  mechanism-reasoner*. And 2024-2026 LLM-for-AOP work (**ToxReason**, **Jeong&Choi ES&T**, **AOP-Smart**) explicitly
  warns that LLM tox prediction ≠ reliable reasoning — which Aitiome answers by construction.
- **Honesty guardrail from the lit:** do **not** claim first-mover on AOP-network coverage mapping (**Spinu NT-AOPn
  2019** did it across the same ~9 neuro AOPs). Our novelty = the falsification harness + curated recovery rule +
  adversarial decoys bound to specific AOs. State: "we found no prior adversarial mito-active-decoy neurodegeneration
  benchmark" (modest, likely-true).

## 1. Data sources to ADD (disciplined — grounding/corroboration/identity, never a bioactivity gate)

| Source | Role | Why / fit | Priority |
|---|---|---|---|
| **Grandjean & Landrigan 2014** (Lancet Neurol) — 12 confirmed human developmental neurotoxicants (Pb, MeHg, PCBs, As, toluene, Mn, fluoride, chlorpyrifos, DDT, tetrachloroethylene/TCE, PBDEs, +ethanol) | **corroboration — independent curated vote** | Small, authoritative, human-outcome, **source-independent from CTD/AOP-Wiki**. Overlaps our positives (Pb, Mn, chlorpyrifos, As, DDT), lists **zero decoys** → hardens negatives + the source-independence ablation. Near-zero cost. | **ADD now** |
| **AD epidemiology effect sizes** (see §3) | corroboration (epi strand) | We had FAERS/BBB/epi for PD but **no AD epi**; now have verified OR/HR with contested flags. | **ADD now** |
| **GWAS Catalog** (NHGRI-EBI) + **Nalls 2019** PD GWAS (90 loci) | grounding (disease end) | Independent human-genetic line grounding the AO; complements Bellenguez (AD). Free REST/bulk. Strengthens source-independence. | ADD (grounding) |
| **Human Protein Atlas — brain** | grounding | Confirms complex-I subunits + SOX6/AGTR1 markers are brain/DA-expressed; reinforces hero terminal frame. Open TSV/JSON. | Optional |
| **EPA ExpoCast / SEEM** exposure predictions | grounding (plausibility, beside BBB) | "Is meaningful human exposure even predicted?" Broad env coverage (not coverage-killed). Never a discriminator (decoys have exposure too). | Optional |
| **EPA ToxRefDB v3.0** (in vivo, curated) | corroboration | Curated in-vivo neuro/systemic endpoints for positives; NOT high-throughput bioactivity. | Optional |
| **CTD dementia-pathway chemical set** (742 chems → ≥1 of 9 dementia pathways; 15 hit all 9) | AD curated extension | AD analog of our CTD anchor; a ready curated env-AD shortlist + decoy-hardener. | Consider |
| **AD Knowledge Portal / Agora / ROSMAP (Mathys 2023, 152k microglia)** | grounding (gene/cell) | Deeper AD microglia grounding beyond Bellenguez. Gene-only → grounding, never a gate. | Consider |

**Hard SKIPs (confirmed bioactivity-confounder / circular — would break the anti-diagnostic claim):** TOXRIC,
PubChem BioAssay/Tox21, OECD QSAR Toolbox (structure/QSAR — already a rejected discovery axis), DNT in-vitro
battery for grading, Blood Exposome DB / eChemPortal (text-mined/portal-only), PrimeKG/Hetionet (drug-keyed),
Open Targets as an *independent* line (it's an aggregating KG — convenience view only, avoid double-counting).

## 2. AI prior art — positioning + cite/differentiate

| System | Cite / Differentiate | One-line contrast |
|---|---|---|
| **PROTON** (Noori…Zitnik, arXiv 2512.13724, Dec 2025, **preprint**) | DIFFERENTIATE (the foil) | Graph-AI *discovery-predictor* of novel neurotoxic chemicals; Aitiome is the *validated mechanism-reasoner* that recovers knowns + proves it doesn't overclaim. |
| **ToxReason** (Park et al., ACL 2026 Findings, arXiv 2604.06264) | CITE (supports) | Benchmark showing LLM tox *prediction ≠ reliable reasoning* (hallucinated mechanisms). Aitiome grounds every edge in curated evidence + tiers. |
| **Jeong & Choi 2024** (*Environ. Sci. Technol.*, LLMs-in-AOP-construction) | CITE (supports) | Names the verifiability/hallucination risks; Aitiome operationalizes the mitigation. |
| **AOP-Smart** (Niu & Yan, arXiv 2604.10874, **preprint**) | CITE (parallel) | RAG over AOP-Wiki to kill hallucination; Aitiome adds adversarial decoys + recovery rule + calibration. |
| **ComptoxAI** (Romano 2022, *Chem Res Toxicol*) / **AlzKB** (Binder 2024, *JMIR*) | CITE + DIFFERENTIATE | General predictive-tox KG / AD repurposing KG; Aitiome is narrow env-causation on the AOP scaffold, curated-diagnostic, with a falsification benchmark. (Recon already SKIP'd these for discovery.) |
| **GenRA** (EPA read-across) / **DeepTox** (Mayr 2016, Tox21 winner) | DIFFERENTIATE (the anti-pattern) | Bioactivity-similarity / assay-hitcall prediction — exactly what Aitiome falsifies as anti-diagnostic here. |
| **Hetionet/Rephetio** (Himmelstein 2017), **PrimeKG** (Chandak 2023) | DIFFERENTIATE | Drug/disease-keyed repurposing KGs; env compounds out-of-coverage. |
| **Spinu NT-AOPn** (Spinu 2019, *Arch Toxicol*; 2026 follow-up) | CITE (predecessor — do NOT claim first) | Prior graph-theoretic coverage map across ~9 neuro AOPs. Our differentiator is falsification + curated recovery, not the map. |

**Honest positioning line (deck-ready):** *"The field is racing toward discovery — graph-AI (PROTON) and
read-across (GenRA) predict novel toxic chemicals from structure/bioactivity, and a wave of LLM-for-AOP work is
emerging. Aitiome inverts the instinct: it recovers the known environmental neurotoxicants on the OECD-endorsed
AOP scaffold, grades only on curated diagnostic evidence, and proves via an adversarial falsification benchmark
that bioactivity is anti-diagnostic here. It is the honest, calibrated counterweight to the predictors — and a
direct answer to the hallucination/verifiability warnings (ToxReason, ES&T 2024) the LLM-AOP wave raises."*

## 3. AD epidemiology (verified effect sizes; contested flags are load-bearing for honesty)

Strong / usable: **DDE** OR 4.18 (2.54–5.82) case-control (Richardson 2014, *JAMA Neurol*); **Cadmium** AD-mortality
HR 3.83 (1.39–10.59) (Min&Min 2016, *Environ Health*), urinary Cd HR 1.58 (1.20–2.09) (2017 *STOTEN*); **Arsenic**
SMD 0.66 (0.02–1.20) biomarker meta (2026 *Exposure&Health*); **Organophosphates/chlorpyrifos** incident-AD HR 1.53
(1.05–2.23), any pesticide 1.42 (Hayden 2010, *Neurology*, Cache County); **pesticide class** OR 1.34 (1.08–1.67)
(Yan 2016, *Sci Rep*). **Lead** AD HR ~2.96 — *from a 2025 preprint; verify against peer-reviewed before citing as
settled.*
**Contested / weak (flag in-app, do not grade like the above):** **Aluminum** RR 2.14 (Rondeau 2000, PAQUID) but
no dose-response / disputed; **Manganese** no AD-incidence cohort, U-shaped essential metal; **Copper** non-monotonic
(only "free/non-Cp Cu" defensible); **PCBs** null for AD *diagnosis*, cognition-only (Medehouenou 2019).
**Context (not discrete chemicals):** PM2.5 AD OR 1.16 per 5 µg/m³ / dementia RR 1.28 per 10 (2025 umbrella; Lancet
Commission 2024 — air pollution 1 of 14 modifiable factors).

## 4. PD — updates + strong epi (mostly corroboration/citation; two recon flags)

- **AOP-3 is now a networked family** (587 complex-III, 588 complex-II, 589 complex-IV, **593 redox-cycling =
  paraquat's own AOP**), and **EFSA funded its expansion in 2024** (NP/EFSA/PREV/2024/02). All share our exact KE
  chain. **Under development, not endorsed** (only AOP-3 is). *(Empirical basis: Delp 2021, 21 respiratory-chain
  inhibitors in human DA neurons.)*
- Strong PD epi to cite: paraquat OR 2.5 (Tanner 2011), dieldrin OR 1.95 (Weisskopf 2010), chlorpyrifos OR 2.73
  (Narayan 2013), cumulative lead OR 3.21 (Weisskopf 2010), **TCE OR 1.70 (1.39–2.07)** Camp Lejeune (Goldman 2023,
  *JAMA Neurol*) + Krzyzanowski 2025 (*Neurology*). Weak/contested: manganese-welding (manganism ≠ idiopathic PD),
  methylmercury (no reliable PD OR — do not assert one).

## 5. Sharpening / suggestions (what to address)

1. **Pre-empt the AUROC pushback (highest priority).** Add a line/slide: prior chemical-disease ML reports 90%+
   AUROC (e.g. GDANet) — but on drug-keyed, well-covered space, never adversarial mito-active environmental decoys.
   Cite **Mack 2024** (ToxCast ~40% neural-relevant; 79% of neurotox KEs = oxidative stress, under-covered) as the
   structural reason bioactivity fails here. This is the strongest defense of our whole thesis.
2. **Curated-vs-inferred is CTD-canonical** (King 2012, Davis 2009) — cite as precedent for our diagnostic rule
   (we're a sharper, more conservative extension, not an invention).
3. **Don't claim first-mover on AOP mapping** (Spinu NT-AOPn). Frame novelty precisely: adversarial-decoy
   falsification + curated recovery + calibrated two-axis comparison; "no prior adversarial neurodegeneration
   benchmark found."
4. **Neuroinflammation is *shared* PD↔AD** (Kip & Parr-Brownlie 2022). Keep the honest framing: PD has a *specific
   chemically-initiated* MIE (complex-I); AD converges late on microglial neuroinflammation without a defining
   chemical MIE — not "mechanistically disjoint." (Our compare-matrix KE-188 bridge row is already aligned.)
5. **AD quantified falsification** — the honest completion is NOT a fabricated assay-AUROC. Two informed options:
   (a) compute the **AD source-independence ablation** (CTD-AD alone vs AOP-AD alone) — real, and shows AD leans on
   CTD; (b) cite Mack 2024 for why HTS falsification is structurally limited for neuro. Do both; do not invent scores.

## 6. Recon-adjacent — FLAG to Jon (additive-strengthening; NOT acted on)

- **PD AOP network 587/588/589/593.** The "registered neuro-AOP stressor" leg could legitimately recognize
  paraquat→AOP-593 and picoxystrobin→587. Additive; touches the recovery predicate → needs sign-off. Present as
  "network under development (EFSA-funded)," never as endorsed.
- **TCE as a PD positive.** Landmark 2023/2025 cohorts (Goldman; Krzyzanowski), mechanism = complex-I inhibition
  (fits AOP-3). Currently not in our 12. Strong candidate to add — but changes the validated set → sign-off + re-validation.

## Master citation list (verify preprints/paywalls before final use)
Exposome framing: Miller 2024 *Nat Neurosci* 27:1013; Miller & Jones 2014 *Tox Sci* 137:1. AD-exposome: Lefèvre-Arbogast/
Barouki/Miller 2024/25 *Alz&Dement* (doi:10.1002/alz.087443); Bakulski 2020 *JAD* 76:1215; Richardson 2014 *JAMA Neurol*;
Hayden 2010 *Neurology*; Livingston 2024 *Lancet*. PD: Terron/Bal-Price 2018 *Arch Toxicol* (AOP-3); Dorsey et al. 2025
*Lancet Neurol* (env toxicants & PD); Bloem/Okun/Klein 2021 *Lancet*; Ball 2019 *Front Neurol*; Tanner 2011 *EHP*; Goldman
2023 *JAMA Neurol* (TCE); Nalls 2019 *Lancet Neurol* (GWAS). AD AOP: Tsamou 2021/2022 *JAD* ("plausible" tau AOP). Method:
King 2012 *PLoS ONE* + Davis 2009 *NAR* (CTD curated/inferred); Mack 2024 *NeuroToxicology* 103:256 (ToxCast neural coverage);
Spinu 2019 *Arch Toxicol* (NT-AOPn). AI: Romano 2022 (ComptoxAI); Binder 2024 (AlzKB); Himmelstein 2017 (Hetionet);
Chandak 2023 (PrimeKG); Mayr 2016 (DeepTox); PROTON arXiv:2512.13724; ToxReason arXiv:2604.06264; AOP-Smart arXiv:2604.10874;
Jeong&Choi 2024 *ES&T* (doi:10.1021/acs.est.4c07524).
