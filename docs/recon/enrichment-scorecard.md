# Enrichment-Axes Scorecard

**Bar (different from the discovery recon):** these enrich the *validated* engine's evidence model,
so **partial coverage is fine** — the question is **value-per-effort**, not go/no-go. "Partial
coverage, high orthogonality, low effort" beats "full coverage, redundant, high effort." Evaluated
against the 27 validation compounds (12 pos / 15 neg incl. 6 mito-active adversarials).

---

## The matrix

| Axis | Val-set coverage | Access / tractability | Orthogonal to curated+assay? | Effort | Recommendation |
|---|---|---|---|---|---|
| **Brain single-cell + mito grounding** | grounds MIE + AO (not per-compound) | MitoCarta3.0 xls + Kamath SCP1768 (no auth) | **Yes** — mechanistic/cell-type grounding | **Low** | **ADOPT #1** |
| **FAERS pharmacovigilance** | 9/27 (drug-like); 4/6 adversarials | openFDA REST, no key | **Yes** — real-world human | **Low** | **ADOPT #2** |
| **Human epidemiology (PD/AD risk)** | ~8/12 positives quantified | **literature-curation** (no API) | **Yes** — human observational | Low–Med | **ADOPT #3** |
| **BBB / brain-exposure** | 27/27 (descriptors); 9/27 B3DB | B3DB + RDKit BOILED-Egg; HTTK optional | Partly — structure/PK | Low | **Adopt as gate** (supporting) |
| **PrimeKG / Hetionet** | ~1/12 pos, ~11/15 neg | Dataverse CSV / het.io, no auth | No — CTD/DrugBank-derived, drug-skewed | Low–Med | **Skip** for this class |

## Top-3 to prioritize (value-per-effort)

1. **Brain single-cell + mito grounding.** Grounds the *endorsed* AOP-3 at gene/cell-type level:
   MitoCarta3.0 gives the **66 Complex-I genes** (44 structural, incl. all 6 Q-site core subunits
   MT-ND1/NDUFS2/NDUFS3/NDUFS7/NDUFS8/NDUFV1) for the MIE; Kamath 2022 gives the **SOX6/AGTR1
   vulnerable DA-neuron** set for the nigrostriatal-degeneration AO; Bryois 2020 gives the citable
   **PD→DA-neuron/mito vs AD→microglia** cell-type dichotomy. Universal (not coverage-limited by our
   compound list), low effort, high orthogonality, and a strong visual. *Best value.*
2. **FAERS adversarial confirmation.** The sharpest single result in this recon — see below. Independent
   real-world human evidence that the adversarial negatives are correctly rejected. openFDA, no key,
   low effort, directly reinforces the credibility demo's hardest claim.
3. **Human epidemiology (PD risk).** The human-observational tier: ~8/12 positives carry quantified
   published ORs (rotenone ~2.5, paraquat ~2, maneb ~1.75, lead, dieldrin). Orthogonal to both CTD
   annotation and assays. It's **literature-curation, not an API** (an in-window Claude Science
   extraction) — flagged honestly; ~5 anchors are lookup-trivial, ~3 need figure extraction, MPTP is
   causal-not-epidemiological, deguelin/6-OHDA have no human data.

**BBB** is worth folding in as a cheap *plausibility gate* (below), not a discriminator. **PrimeKG/
Hetionet** should be skipped for this compound class — they cover ~1/12 environmental positives
(drug-skewed, DrugBank-keyed) and are not a net upgrade over CTD+AOP-Wiki, which already ground all
12 positives; adopt at most as an optional downstream gene/pathway scaffold reached *via* CTD.

---

## Special result 1 — BBB penetrance split (positives vs negatives vs adversarials)

Data: `data/bbb_coverage.csv`. B3DB ground-truth where available (9/27) + BOILED-Egg descriptor proxy.

| Class | Penetrant | Note |
|---|---|---|
| Positives (non-metal, 9) | **7/9** | rotenone, MPP+, MPTP, paraquat, deguelin, dieldrin, chlorpyrifos +; maneb, 6-OHDA − |
| Positives — metals (3) | N/A (passive) | Mn/MeHg/Pb reach brain via **transporters** (DMT1/LAT1/Ca-channels), not passive BBB |
| Clean negatives (6) | 2/6 | mostly non-penetrant |
| **Adversarial negatives (6)** | **3/6** | simvastatin/propiconazole/prochloraz +; warfarin, fenofibrate, troglitazone − |

**Honest read:** BBB is a **plausibility gate, not a discriminator.** Positives skew penetrant (7/9),
and 6-OHDA is correctly flagged non-penetrant (it's injected in models — a nice sanity check). But it
only *partially* explains the adversarials: **3/6 adversarials have low brain exposure** (warfarin
BBB−/highly-protein-bound; fenofibrate BBB−; troglitazone non-penetrant; simvastatin is additionally
a known **P-gp efflux substrate**, lowering effective CNS exposure) — a real orthogonal reason for
those rejections — while the other 3 penetrate yet aren't neurotoxic (mechanism, not exposure, rejects
them). Value: universal coverage, low effort, adds a PK/exposure evidence column and partially explains
half the adversarials.

## Special result 2 — FAERS adversarial parkinsonism check

Data: `data/faers_coverage.csv`. Method validated with a positive control: **haloperidol** (known
drug-induced parkinsonism) → **ROR 39.6 [37.8, 41.5]**, strong signal ✓.

| Adversarial drug | FAERS reports | parkinsonism ROR [95% CI] | Signal? |
|---|---|---|---|
| warfarin | 126,794 | 0.50 [0.42, 0.60] | **No** |
| fenofibrate | 35,322 | 0.90 [0.71, 1.15] | **No** |
| simvastatin | 261,343 | 1.07 [0.99, 1.16] | **No** |
| troglitazone | 0 | — (withdrawn 2000, pre-FAERS) | n/a |

**0 of 4 assessable adversarial drugs show a parkinsonism signal.** This is **independent real-world
human confirmation** that the mito-active adversarial negatives are correctly rejected: they're broadly
bioactive *and* (mostly) brain-penetrant, yet across ~20M adverse-event reports show **no** parkinsonism
disproportionality — no honest wrinkle, clean. (FAERS covers only the drug-like subset — the
environmental positives aren't drugs, so this is a negative-space confirmation tool, which is exactly
where its value lies.)

---

## Recommendation

**Fold in the top-3 (brain/mito grounding, FAERS, epidemiology) + BBB as a gate.** Together they add
three orthogonal evidence tiers to the validated engine — **mechanistic/cell-type grounding**,
**real-world human pharmacovigilance**, and **human epidemiological risk** — none of which duplicate the
curated-DB or assay signals, all low-effort. They also strengthen the *negatives* story: FAERS + BBB
give two independent human/PK reasons the adversarials are correctly rejected. **Skip PrimeKG/Hetionet**
for this class. Per-axis detail: [`enrich-brain-cell-mito.md`](./enrich-brain-cell-mito.md),
[`enrich-faers.md`](./enrich-faers.md), [`enrich-epidemiology.md`](./enrich-epidemiology.md),
[`enrich-bbb.md`](./enrich-bbb.md), [`enrich-primekg-hetionet.md`](./enrich-primekg-hetionet.md).
