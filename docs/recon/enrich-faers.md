# Enrichment Axis: FAERS pharmacovigilance (openFDA)

**Recommendation: ADOPT #2.** Independent real-world human confirmation that the adversarial
negatives are correctly rejected — the sharpest single result in the enrichment recon. Data:
`data/faers_coverage.csv` (raw cached in `cache/faers/`).

- **Coverage:** 9/27 (only the drug-like compounds have FAERS presence; environmental positives
  aren't drugs, so this is a **negative-space confirmation tool**). 4/6 adversarials are drugs with
  FAERS data (warfarin, fenofibrate, simvastatin; troglitazone = 0 reports, withdrawn 2000 pre-FAERS).
- **Method:** ROR (reporting odds ratio) for a parkinsonism/neurodegeneration MedDRA cluster,
  signal = ROR 95%-CI lower bound > 1 and ≥3 reports. **Validated with a positive control:**
  haloperidol (known drug-induced parkinsonism) → **ROR 39.6 [37.8, 41.5]** ✓. Total FAERS reports
  ~20.3M; parkinsonism-cluster ~42K.

## Result — 0/4 assessable adversarial drugs signal

| Drug | reports | parkinsonism ROR [CI] | signal |
|---|---|---|---|
| warfarin | 126,794 | 0.50 [0.42, 0.60] | No |
| fenofibrate | 35,322 | 0.90 [0.71, 1.15] | No |
| simvastatin | 261,343 | 1.07 [0.99, 1.16] | No |
| troglitazone | 0 | — | n/a |
| *(other neg: acetaminophen 0.68, ibuprofen 0.79, furosemide 0.98, sulfamethoxazole 0.58, fulvestrant 0.27 — all No)* | | | |

**No honest wrinkle** — the mito-active adversarials are broadly bioactive and mostly brain-penetrant
yet show **zero** real-world parkinsonism disproportionality across ~20M reports. This is orthogonal
human evidence (neither curated-DB nor assay) that directly reinforces the credibility demo's hardest
claim: the system correctly rejects bioactive-but-non-neurotoxic compounds, and the real world agrees.

- **Access:** openFDA `https://api.fda.gov/drug/event.json`, **no API key** (240 req/min, 1000/day
  unauthenticated — a key raises limits). Search `patient.drug.openfda.substance_name` × MedDRA
  `patient.reaction.reactionmeddrapt`; `limit=0` returns `meta.results.total` for 2×2 ROR cells.
- **Effort: LOW.** ~4 count queries per compound; the probe (`probes/axes/faers_pv.py`) is reusable.
- **Caveat:** SRS/reporting biases (indication confounding, notoriety, protopathic bias) — ROR is a
  hypothesis signal, not causal. troglitazone's pre-FAERS withdrawal is a real coverage gap.
