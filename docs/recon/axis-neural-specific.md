# Axis A: Neural-specific ToxCast subset (DNT battery + neuro-target endpoints)

**Verdict: QUALIFIED — directionally the strongest axis, but underpowered (not statistically
separable from chance at this N).** Not a clean go; not a flat no-go. Probe:
`probes/axes/neural_specific.py`. Data: `data/neural_specific_{coverage,similarity,assays,metrics}.csv`.

## The endpoint set (documented)

95 nervous-system-relevant endpoints assembled from the cached ICE/invitroDB data:
- **CCTE Shafer Lab** — MEA (microelectrode array) acute + developmental **network-formation** assays
  (firing rate, bursting, correlation, network spikes).
- **CCTE Mundy Lab** — **neurite outgrowth** / high-content neuronal imaging (neuron count, neurite
  length/count, synaptogenesis, cell-body).
- **Leibniz/IUF** — **NPC** (neural progenitor) proliferation, migration, differentiation, neurite.
- **Univ. Konstanz (UKN)** — neural developmental assays.
- **neurotransmitter-target binding** (NVS/Tox21) — DAT, DRD, 5-HT/HTR, GABA, CHRM/CHRN, glutamate
  (GRIN/GRIA), adrenergic, MAO-B.
Full list + viability-control flags in `data/neural_specific_assays.csv` (23 of 95 are
viability/cytotox endpoints, split out for the Gate-3 control).

## Gates

- **Gate 1 — coverage:** 14/27 (**7/12 positives, 6/6 adversarials**). The covered positives are the
  6 assay-recovered ones + MPTP (barely). The 6 curated-anchored positives have ~no neural data.
- **Gate 2 — blind recovery:** cosine kNN-to-positives AUROC_all 0.571 raw → **0.762
  viability-excluded**; p@5 0.80. Neural-active-fraction AUROC_all 0.714.
- **Gate 3 — vs adversarial negatives (the crux):** cosine AUROC_hard **0.512 raw → 0.722
  viability-excluded**; neural-active-fraction AUROC_hard **0.679**.

## The one genuinely encouraging thing — and the honest limit

**Excluding viability endpoints IMPROVES separation (0.51 → 0.72).** This is the opposite of the
full ToxCast fingerprint, where cytotox control didn't help (0.53 → 0.56). It means the neural
*network/neurite* signal — after removing generic cell-death — carries real positive-vs-adversarial
information the full profile lacked. The ranking is directionally clean at the top: the four most
neurally-active compounds are **all positives** (methylmercury 0.88, rotenone 0.69, chlorpyrifos
0.64, paraquat 0.64), each outranking every adversarial (prochloraz 0.50, troglitazone 0.39,
propiconazole 0.38, simvastatin 0.28).

**But it is not statistically real at this N.** Permutation test on the crux (positives vs
adversarials): **AUROC 0.679, perm-p = 0.155, bootstrap 95% CI [0.33, 0.95].** The interval spans
from below-chance to near-perfect — the point estimate is the best we've seen, but with 7 positives
and 6 adversarials it **cannot be distinguished from chance.** And it isn't clean even directionally:
**2 of 6 assay-recovered positives (MPP+ 0.21, MnCl₂ 0.17) fall into the adversarial range** —
their neural coverage/activity is thin, so they look like the negatives.

## Caveats to carry forward

- **DNT ≠ neurodegeneration.** This battery is *developmental* neurotoxicity (neurite outgrowth,
  network formation in immature neurons), not adult dopaminergic neurodegeneration. Mechanistically
  related but not identical — a compound can hit the DNT battery for reasons orthogonal to the AOP-3
  parkinsonian outcome, and vice versa.
- **Coverage ceiling:** only the 6 assay-recovered positives carry neural data; the curated-anchored
  positives (MPTP, maneb, lead, deguelin, 6-OHDA) are untested here, so the axis can never cover the
  half of the positive set that most needs an annotation-independent signal.

## Bottom line

The single profiling axis whose signal *survives and improves under* cytotoxicity control, with a
directionally clean top-ranking — but **underpowered (perm-p 0.155) and incomplete (2/6 positives
fail, curated-anchored half uncovered).** Not a signal to build on now. The honest follow-up: if the
in-window build can expand the DNT reference set (more neurally-profiled known neurotoxicants — e.g.
via the full invitrodb DNT dataset or new profiling), this is the one axis worth powering properly.
Reported with explicit N (7 pos / 6 adv) and CI; no overreach.
