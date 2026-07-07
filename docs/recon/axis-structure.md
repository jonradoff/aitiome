# Axis: Structure / QSAR

**Verdict: NO-GO** (universal coverage, but blind recovery at chance). Probe: `probes/axes/structure_qsar.py`.
Data: `data/structure_coverage.csv`, `data/structure_similarity.csv`, `data/structure_metrics.csv`.

- **Gate 1 — coverage:** 27/27 (all SMILES resolved). The universal-coverage fallback.
- **Gate 2 — blind recovery:** **FAIL.** ECFP4 (Morgan r2, 2048b) Tanimoto: AUROC_all **0.467**,
  p@3 0.39. MACCS: AUROC_all 0.35. At or below chance.
- **Gate 3 — vs adversarial negatives:** AUROC_hard 0.42 — but moot, there's no signal to confound.

**Why:** mean structural similarity-to-positives = **0.065 (positives) vs 0.071 (adversarial) vs
0.073 (clean)** — positives are *less* similar to each other than negatives are to them. The
positive set is a **mechanism class** (mitochondrial complex-I / dopaminergic), not a scaffold
class: rotenoids (rotenone, deguelin), bipyridiniums (paraquat, MPP+), organochlorines (dieldrin),
organophosphate (chlorpyrifos), metals (Mn, MeHg, Pb). The only real structural neighbours are
trivial analog pairs — **MPP+~paraquat 0.76, rotenone~deguelin 0.58** — everything else < 0.3.
Structural similarity to known positives cannot recover a mechanism-defined class, and the "hits"
it does find are scaffold-degenerate.

**Access:** none needed — RDKit on the already-resolved SMILES (`data/identifiers.csv`).
