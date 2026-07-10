# Round-4 literature scan (2026-07-09) — verify the candidate pipeline, cover all bases

> Post-build audit of the shipped candidate pipeline. Three concurrent scans: (A) adversarial fact-check of
> every claim we shipped into the candidate data; (B) prior-art / novelty audit of the pipeline; (C) hyper-current
> gap-and-threat sweep. Bottom line: **nothing shipped is factually false**, one clean overclaim was corrected,
> two attributions tightened, prior art conceded, and one genuine gap (emerging classes) given a stated position.

## A. Adversarial fact-check of shipped claims — all VERIFIED, three framing fixes

Every chemical, odds ratio, DOI, and CAS number checked out against primary sources. Fixes applied:

1. **AOP-587 label (picoxystrobin).** AOP-Wiki AOP-587's registered adverse outcome is *"parkinsonian motor
   deficits"* — nigrostriatal dopaminergic degeneration is an intermediate key event, not the AO. Copy tightened
   to "complex-III inhibition → nigrostriatal dopaminergic degeneration → parkinsonian motor deficits." Confirmed:
   the two AOP-587 stressors are **antimycin A + picoxystrobin**; AOP-3's six are MPP+, rotenone, deguelin,
   pyrimidifen, **fenpyroximate, tebufenpyrad** (both ours — VERIFIED). *(AOP-Wiki aops/3, aops/587)*
2. **Dieldrin & β-HCH AD odds ratios re-attributed.** OR 2.09 (1.22–3.56) and 2.06 (1.04–3.10) are **not** the
   Yan 2016 meta-estimates — Yan *quotes* them from **Singh NK et al., Hum Exp Toxicol 2013** (PMID 22899726), a
   single small north-Indian case-control (70 AD / 75 controls). Yan's own pooled OR was 1.34. Source re-attributed
   to Singh 2013, wording changed from "meta-analysis" to "single case-control," strength downgraded strong→moderate.
3. **p,p'-DDT amyloidogenic claim** kept its explicit "in vitro" qualifier (correct as shipped — no change).

Verified as-shipped and unchanged: Paul & Ritz 2023 iPSC ranks (propargite most toxic → diquat → folpet → naled),
trifluralin's mitochondrial mechanism, dicofol PWAS+iPSC, naled/endosulfan in the 10-hit set, the Dorsey 2025
PCE/TCE shared-metabolite statement, and all seven CAS numbers.

## B. Prior-art / novelty audit — concede the concept, claim only the discipline

Chemical prioritization for toxicity testing is a **mature field**. Direct prior art we now cite/concede:
- **ToxPi** (Marvel/Reif, BMC Bioinformatics 2018) — transparent weighted-additive multi-criteria scoring with
  bootstrapped CIs. Our ranker is mechanically a ToxPi-family index; cited as the lineage.
- **OECD IATA** — the standard framework for combining heterogeneous evidence lines to a testing decision.
- **GenRA / read-across, ToxCast/Tox21 prioritization** — the established "predict/prioritize the untested
  chemical" tools (ToxCast bioactivity is exactly what we deliberately EXCLUDE — anti-diagnostic here).
- **ENRICH** (Rager et al., *Environmental Research* 2025, PMID 39638029) — a Chemical Prioritization Index
  (1,827→250 chemicals) for biomonitoring. Round-4b correction: NOT "Environment International 2024"; it is
  general/developmental neuroactivity (not PD/AD-specific) and DOES incorporate HTS bioactivity — so "we exclude
  bioactivity" differentiates us from ENRICH (which includes it), not from PROTON.
- **PROTON** (Noori & Zitnik 2025) — a learned graph ranker with a held-out iPSC validation; the strongest foil.
- **Shan/Homberg npj Parkinson's 2023** — the tiered PD toxin-screening framework our queue instantiates.

**Two actions taken:**
- **Renamed "VOI" → "evidence-weighted priority."** "Value of information" has a formal decision-theoretic meaning
  (EVSI; Hagiwara 2023 *Risk Analysis*; Yokota & Thompson) that our transparent additive index does not implement.
  Using "VOI" was a clean, avoidable overclaim. A formal VOI layer (EVSI over test cost/uncertainty) is noted as
  future work in the queue copy and ADR-0006.
- **Queue copy now concedes the prior art** and claims only the narrow, defensible bundle: non-bioactivity-only
  ranking (on evidentiary grounds), gate/ranker separation (no score promotes), the adversarial-decoy in-queue
  control, and the held-out backtest of the ranker.

## C. Gap-and-threat sweep — recon survives; one gap given a stated position

- **No new OECD-endorsed PD/AD AOP since mid-2025.** AOP-3 remains the only endorsed PD AOP; still no endorsed AD
  AOP — our "AD leg weaker, honestly flagged" stance is still accurate. The EFSA parkinsonian AOP network and a
  proposed nanoparticle→AD AOP (Schneider 2025) are pre-endorsement — consistent with our "under development"
  tiering. *(CITE)*
- **Strengthening citations (no build change):** TCE ambient-Medicare study (*Neurology* 2025) independently
  confirms our 13th PD positive; manganese welder dose-response corroborates that positive; Jang 2025 ExWAS
  externally validates the AD queue (thallium, β-HCH, heptachlor epoxide, DDT, lead, cadmium).
- **Circularity attack + rebuttal:** CTD's own 2025 update concedes legacy-chemical overrepresentation. Rebuttal
  (logged): we separate diagnostic-curation from discovery, quantify that bioactivity is at/below chance (so we're
  not just riding study-intensity), and contrast the Bakulski/Cockell 2025 CTD-*gene-enrichment* screen that labels
  74% of all chemicals "positive" — the inferred approach we reject.
- **The one genuine gap → stated position (shipped):** PFAS, microplastics, PM2.5/air pollution, glyphosate. Silence
  reads as a coverage hole. Now given an explicit **watch-tier** position (`docs/excluded-sources.md` §F): real
  association/accumulation signal, but no endorsed neuro-AOP and (for the classes) no single resolvable identity.
  **Glyphosate** (which has a chemical identity) was added to the AD candidate queue at the association tier
  (animal + mechanistic only, human epidemiology thin; Bhatt et al. 2024).

## Net
No recon finding is contradicted; the recovery predicate, the anti-diagnostic-bioactivity result, and the
honest-map stance all survive, better defended. Changes this pass were: 3 shipped-data corrections, 1 rename of an
overclaimed term, prior-art concession + citations (ToxPi, IATA, Singh 2013), and a stated watch-tier position.
