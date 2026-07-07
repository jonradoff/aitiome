# Axis: EPA HTTr (High-Throughput Transcriptomics, TempO-Seq)

**Verdict: NO-GO at Gate 1 (coverage).** Access is clean and key-free — the blocker is that the
positives aren't screened.

- **Gate 1 — coverage:** **4/12 positives** (rotenone, maneb, dieldrin, chlorpyrifos); only **2/6
  assay-recovered** (rotenone, chlorpyrifos). paraquat, MPP+, MPTP, MnCl₂, methylmercury, lead,
  deguelin, 6-OHDA **absent** (confirmed by DTXSID + chem-name match across MCF7/HepaRG/U-2 OS
  sample keys — not a salt-form artifact). Negatives well covered: **5/6 adversarials** (all but
  simvastatin), 14/27 total via MCF7 (superset). Same asymmetry as L1000 — the ToxCast library is
  pesticide/drug-heavy but light on these mitochondrial/dopaminergic tool compounds and metals.
- **Cell-context flag:** MCF7 (breast), HepaRG (liver), U-2 OS (bone) — all **non-neuronal**. Even
  covered positives report a generic epithelial/hepatic stress signature, not dopaminergic toxicity.
- Gates 2–3 not run (gated out).

**Access route (verified live, no auth):** AWS Open Data `s3://epa-ccte-httr/` (us-east-1,
`--no-sign-request`). Prefixes: `httr_mcf7_ph1/` (~1,770 chem), `httr_heparg2d_toxcast/` (1,202),
`httr_u2os_toxcast/` (1,204). **Coverage oracle:** `*_metadata_sample_info*.csv` at each prefix
(cols incl. `dtxsid`, `casrn`, `chem_name`, `conc`, `stype`, `qc_flag`). Signature-level
conc-response: `res_<screen>/httr_sig_cr.bson.gz` (BSON; join `chem_id`→`httr_chem.bson.gz`→`dtxsid`).
Covered compounds have full 8-pt conc-response × 3 reps. Analysis code: `github.com/USEPA/CompTox-httrpathway`.
```bash
aws s3 cp --no-sign-request s3://epa-ccte-httr/httr_mcf7_ph1/httr_mcf7_ph1_metadata_sample_info.csv .
```
