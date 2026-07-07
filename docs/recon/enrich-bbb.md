# Enrichment Axis: BBB / brain-exposure (plausibility gate)

**Recommendation: Adopt as a gate** (supporting, not a discriminator). Universal coverage, low
effort, adds a PK/exposure evidence column and partially explains the adversarial rejections. Data:
`data/bbb_coverage.csv`.

- **Coverage:** 27/27 via RDKit **BOILED-Egg** descriptor proxy (TPSA + MolLogP); **9/27 B3DB
  ground-truth** (preferred where present). Metals (Mn/MeHg/Pb) flagged N/A for passive BBB.
- **Penetrance split:** positives (non-metal) **7/9 penetrant**; metals reach brain via transporters
  (DMT1/LAT1/Ca-channels); clean negatives 2/6; **adversarials 3/6**.

**Key findings:**
- BBB is a **plausibility gate, not a discriminator** — positives *and* adversarials are both mostly
  brain-accessible (the adversarials are lipophilic drugs/fungicides that do cross).
- **Sanity check passes:** 6-OHDA correctly flagged non-penetrant (TPSA 86.7) — it's injected in PD
  models precisely because it doesn't cross the BBB.
- **Partial adversarial explanation (the useful bit):** 3/6 adversarials have low effective brain
  exposure — warfarin (BBB−, highly protein-bound), fenofibrate (BBB−), troglitazone (non-penetrant),
  and simvastatin is additionally a known **P-gp efflux substrate**. So exposure/PK is a real
  orthogonal reason for *half* the adversarial rejections; the other half penetrate but aren't
  neurotoxic (mechanism rejects them).

- **Access:** B3DB (`github.com/theochem/B3DB`, `B3DB_classification.tsv`, no auth) for ground-truth
  logBB + BBB±; RDKit BOILED-Egg (TPSA≤79 & WLOGP∈[0.4,6]) for universal structural coverage. EPA
  **HTTK** R library (`Css,brain` / brain-ECF prediction) is the DTXSID-keyed on-theme option but
  needs R — deferred; the structure proxy suffices for the gate.
- **Orthogonality:** partly — structure/physicochemistry/PK, independent of curated annotation and
  bioactivity assays. **Effort: LOW.**
