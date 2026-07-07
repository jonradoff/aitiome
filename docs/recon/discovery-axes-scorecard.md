# Discovery-Axes Scorecard

**Question:** which candidate discovery axis (if any) gives an honest, discriminating,
confounder-surviving signal on our compound class — and does combining axes beat any single one?

**Evaluation:** three gates per axis — Gate 1 coverage (are the 27 validation compounds present?),
Gate 2 blind recovery (does the signal rank held-out positives above negatives, labels hidden?),
Gate 3 confounder control (do the 6 mito-active **adversarial** negatives falsely score high, and
does controlling for cytotoxicity restore separation?). Metrics: `AUROC_all` (positives vs all
negatives), **`AUROC_hard`** (positives vs adversarial negatives only — the gate that matters),
precision@k. Same 12-pos / 15-neg set as the main recon.

---

## VERDICT: **No profiling/similarity axis gives a powered, confounder-surviving discovery signal on this class.**

Eight axes evaluated. They fail in two families, with one qualified exception and one prepped bet:
- **Coverage failures (L1000, HTTr, HTPP):** the environmental-toxicant positives (pesticides,
  metals, MPTP/MPP+, 6-OHDA) simply aren't in the ToxCast/pharma-profiled chemical space. These
  platforms cover the drug-like **negatives** (incl. adversarials) far better than the positives.
- **Confounder failures (Structure, full-ToxCast):** universal/native coverage, but the signal
  can't separate positives from the **bioactive-but-non-neurotoxic** adversarial negatives.
- **Qualified exception — Neural-specific / DNT battery:** the *only* profiling axis whose signal
  survives **and improves under** cytotoxicity control (AUROC_hard 0.51→0.72 when viability endpoints
  are excluded), with a directionally clean top-ranking (the 4 most neurally-active compounds are all
  positives). **But underpowered** — perm-p 0.155, bootstrap CI [0.33, 0.95] at N=7+6, and 2/6
  positives fail. A lead to *power*, not a signal to ship.
- **Prepped physics bet — Boltz-2:** the one axis whose basis is neither annotation nor
  bioactivity-similarity. Feasibility GO; benchmark fully prepped (`data/boltz2_ligands.csv` +
  `findings/boltz2_input_template.yaml`); needs the user's cloud GPU to execute — not runnable here.

## The matrix

| Axis | Gate 1 Coverage (pos) | Gate 2 blind recovery | Gate 3 vs adversarials (raw → controlled) | Verdict |
|---|---|---|---|---|
| **Structure / QSAR** | ✅ 12/12 (universal) | ❌ AUROC_all **0.47**, p@3 0.39 | ❌ AUROC_hard **0.42** (no signal to control) | **NO-GO** — positives share mechanism, not scaffold |
| **ToxCast fingerprint** | ✅ 6/12 pos, 6/6 adv (19/27) | ⚠️ AUROC_all **0.76** (vs inert only) | ❌ AUROC_hard **0.53 → 0.56** | **NO-GO** — separates bioactive-from-inert, not neurotox-from-bioactive |
| **Neural-specific (DNT battery)** | ✅ 7/12 pos, 6/6 adv (14/27) | ⚠️ AUROC_all 0.57 → **0.76** (viab-excl) | ⚠️ AUROC_hard **0.51 → 0.72** (viab-excl); **perm-p 0.155**, CI [0.33,0.95] | **QUALIFIED** — best point estimate, control *helps*, but underpowered (N=7+6); 2/6 pos fail |
| **EPA HTTr** (TempO-Seq) | ❌ 4/12 pos (2/6 recovered) | — (gated out) | — | **NO-GO** — coverage; non-neuronal cells |
| **EPA HTPP** (Cell Painting) | ❌ 4/12 pos (2/6 recovered) | — | — | **NO-GO** — coverage; non-neuronal U-2 OS |
| **LINCS L1000** (prior spike) | ❌ 3/12 pos | — | — | **NO-GO** — coverage |
| **ComptoxAI / AlzKB** (KG) | ⚠️ nodes present | — (blocked) | — | **NO-GO** — public graph empty, stub ML, **circular** (CTD/AOP-derived) |
| **Boltz-2** (target engagement) | n/a (physics) | prepped, not run (no GPU/account here) | — (benchmark ready to run) | **Feasibility GO** — cloud GPU, Q-site crop; the one annotation-independent bet |

## Why the two covered axes fail the confounder gate (the important part)

**Structure/QSAR has no signal at all.** AUROC 0.47 (ECFP4) / 0.35 (MACCS) — at or below chance.
Mean structural similarity-to-positives is 0.065 for positives vs 0.071/0.073 for adversarial/clean
negatives — **positives are *less* similar to each other than negatives are to them.** The positive
set is a mechanism class (mitochondrial/dopaminergic), not a scaffold class; the only real hits are
trivial analog pairs (MPP+~paraquat 0.76, rotenone~deguelin 0.58). Structure can't recover a
mechanism-defined class.

**ToxCast fingerprint captures bioactivity, not neurotoxicity.** It separates positives from *inert*
clean negatives well (AUROC_all 0.76 — acetaminophen/sucrose/sulfamethoxazole score ~0), but against
the adversarial negatives it collapses to chance (**AUROC_hard 0.53**). The "positive-like" ranking
is thoroughly interleaved: paraquat(0.675) › **prochloraz-ADV(0.619)** › methylmercury(0.590) ›
**troglitazone-ADV(0.572)** › chlorpyrifos(0.556) › **fenofibrate-ADV(0.541)** › rotenone(0.538).
Mean score: positives 0.505, adversarials 0.515 (adversarials score *higher*). **Excluding 119
cytotoxicity/viability assays barely moves it (0.53→0.56)** — so the confound is not generic
cytotoxicity, it's shared broad bioactivity (nuclear-receptor, stress-pathway hits). This directly
extends the main-recon finding (single mito assays over-call): the *full* profile over-calls too.

## Convergence: **not warranted — no two axes pass their gates.**

The multi-signal hypothesis requires ≥2 axes clearing Gate 2+3; none do. Structure is at chance and
ToxCast's only signal is the bioactivity confound, so combining them cannot separate positives from
adversarial negatives (a null + a confounded signal). Per the no-manufactured-numbers rule, we did
not compute a combined score that could only mislead. Convergence of *these* axes is a dead end.

## Final recommendation: **build the curated-anchored project; the discovery-mode signal is not proven — it's two honest bets.**

**Is there a viable Discovery-mode signal today? No — not one you can ship.** Every profiling/
similarity axis is either coverage-killed or confounder-killed; the two that point the right way
(neural-specific, Boltz-2) are respectively underpowered and unrun. So:

1. **Build the honest project: curated-anchored validation + the negative-results map.** The
   zero-error recovery predicate is curated (`separation-analysis.md`); this scorecard is the durable
   evidence for *why* an unsupervised discovery signal doesn't drop in for free on this class. That
   negative-results map is itself a credible, defensible contribution.
2. **Two discovery leads worth in-window work (neither proven, both honest):**
   - **Neural-specific / DNT battery** — the only profiling signal that survives cytotox control.
     Underpowered at N=7+6 (perm-p 0.155). Worth *powering* with a larger neurally-profiled reference
     set before trusting it. Don't build on it as-is.
   - **Boltz-2 Q-site engagement** — physics, not annotation or bioactivity-similarity; won't be
     circular and won't reduce to bioactive-vs-inert. Prepped and one cloud run from an answer.
     Benchmark against the 6 adversarial negatives as the false-positive control.
3. **Do not** revive transcriptomic / phenotypic / structural / full-bioactivity / KG axes for this
   compound class — the failures are structural (chemical-space coverage, bioactivity confound,
   curation circularity), not tuning problems.

Per-axis detail: [`axis-neural-specific.md`](./axis-neural-specific.md), [`axis-boltz2.md`](./axis-boltz2.md),
[`axis-structure.md`](./axis-structure.md), [`axis-toxcast-fingerprint.md`](./axis-toxcast-fingerprint.md),
[`axis-httr.md`](./axis-httr.md), [`axis-htpp.md`](./axis-htpp.md), [`axis-comptoxai.md`](./axis-comptoxai.md).
Data: `data/neural_specific_*.csv`, `data/boltz2_ligands.csv`, `data/structure_*.csv`, `data/toxcast_fp_*.csv`, `data/lincs_coverage.csv`.
