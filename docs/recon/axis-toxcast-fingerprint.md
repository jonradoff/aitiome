# Axis: Full ToxCast multi-assay bioactivity fingerprint

**Verdict: NO-GO** — separates bioactive-from-inert, but not neurotoxicant-from-bioactive (fails
the adversarial gate; cytotox control doesn't rescue). Probe: `probes/axes/toxcast_fingerprint.py`.
Data: `data/toxcast_fp_coverage.csv`, `data/toxcast_fp_similarity.csv`, `data/toxcast_fp_metrics.csv`.
Reuses cached ICE/invitroDBv4.2 data — no new fetch.

- **Gate 1 — coverage:** 19/27 with ≥30 usable assays — **6/12 positives** (all 6 assay-recovered:
  rotenone, MPP+, paraquat, MnCl₂, methylmercury, chlorpyrifos) and **6/6 adversarial negatives**.
  Good enough to test Gates 2–3 (and ideal for the confounder question — all adversarials present).
- **Gate 2 — blind recovery:** AUROC_all **0.756** (cytotox-controlled 0.769), p@3 0.72. Looks
  promising — but this is separation from the *inert* clean negatives (acetaminophen, sucrose,
  sulfamethoxazole all score ~0, being ToxCast-quiet).
- **Gate 3 — vs adversarial negatives: FAIL.** AUROC_hard **0.528 raw → 0.556** after excluding 119
  cytotoxicity/viability assays. Essentially chance. The adversarials score *higher* on average than
  positives (mean 0.515 vs 0.505).

**The ranking makes it vivid** (kNN-to-positives, raw): paraquat 0.675 › **prochloraz-ADV 0.619** ›
methylmercury 0.590 › **troglitazone-ADV 0.572** › chlorpyrifos 0.556 › **fenofibrate-ADV 0.541** ›
rotenone 0.538 › **propiconazole-ADV 0.531** › **simvastatin-ADV 0.524**. Positives and adversarials
are fully interleaved.

**Why it fails, and why cytotox control doesn't save it:** the fingerprint encodes broad bioactivity
(nuclear-receptor, stress-pathway, mitochondrial hits) shared by *all* bioactive compounds. The
adversarials were chosen precisely because they're bioactive-yet-non-neurotoxic, so they share this
signal. Excluding viability/burst assays (the obvious cytotoxicity confound) barely moves AUROC_hard
(+0.03) — **the confound is general bioactivity, not just cytotoxicity.** This extends the main-recon
result (single mito assays over-call, fp=7) to the full multi-assay profile: multi-assay similarity
is *bioactivity* similarity, not *neurotoxicity* similarity.

**Access:** none — cached ICE JSONs (`cache/ice/`); see `data-source-map.md` §3b.
