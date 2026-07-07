# Axis B: Boltz-2 target engagement (feasibility + prepared benchmark)

**Verdict: Feasibility GO — but not executable in this environment.** The one axis whose basis is
physics (structure→binding), not annotation or bioactivity-similarity. I prepped a one-step,
ready-to-run benchmark; the actual run needs the user's cloud account, and **no binding numbers are
fabricated** (no-manufactured-numbers rule). Data: `data/boltz2_ligands.csv`,
`findings/boltz2_input_template.yaml`, `cache/boltz/qsite_subunits.json`.

## Feasibility (verified)

- **Access — GREEN, no local run possible here.** Boltz-2 is open MIT (code + weights,
  `pip install boltz[cuda]`) but needs **~48 GB GPU + CUDA**; no Apple-Silicon/MPS support, so this
  Mac cannot run it. Cheap cloud paths: **Rowan** (`rowansci.com`, free tier, auto-GPU, no-code) or
  the **Boltz API** (`boltz.bio`, ~$0.025/prediction, scriptable, Claude Code plugin). ~30–45 s/
  complex on an A100 for pose+affinity. Since this environment has no GPU and no Rowan/Boltz
  credentials, I could not execute the sanity run — that step is the user's to run.
- **Output usable for the gate:** `affinity_probability_binary` (0–1, rank binder vs non-binder) and
  `affinity_pred_value` (log10 IC50).

## Target prep (done — real structures)

- **Target:** AOP-3 MIE = human mitochondrial **Complex I ubiquinone (Q-site) cavity**. Structure
  source **PDB 5XTD** (cryo-EM, *human* respiratory Complex I — confirmed live via RCSB).
- **Q-site subunits fetched from UniProt** (`cache/boltz/qsite_subunits.json`): **MT-ND1** (P03886,
  318 aa), **NDUFS2** (O75306, 463 aa), **NDUFS7** (O75251, 213 aa). The Q-cavity sits at the
  ND1/NDUFS2/NDUFS7 junction near Fe-S cluster N2, where rotenone/piericidin bind.
- **Cropping:** 3 full subunits = **994 aa > Boltz-2's ~768-token crop.** Options documented in the
  template: (a) crop ND1 to its Q-cavity TM helices + full NDUFS2 + NDUFS7; or (b) use NDUFS2+NDUFS7
  (676 aa) with **pocket conditioning** on the N2/Q-cavity contact residues. The structural crop is a
  judgement call for the user; the template ships the full sequences + guidance.

## Prepared benchmark (ready to run)

- **`findings/boltz2_input_template.yaml`** — Boltz-2 YAML with the 3 subunit sequences + rotenone +
  `properties: affinity`. Swap the ligand SMILES per compound.
- **`data/boltz2_ligands.csv`** — 19 ligands with SMILES: **sanity pair** (rotenone = Q-site binder
  vs acetaminophen = non-engager), all **12 positives**, and the **6 adversarial negatives**.
- **Run plan:** (1) sanity — does `affinity_probability_binary(rotenone) > acetaminophen`? (2) if yes,
  score all 12 positives + 6 adversarials; (3) **the gate** — does predicted engagement separate
  positives from the 6 adversarials (AUROC), where every profiling/similarity axis failed? Report with
  explicit N and confidence; even small-N is meaningful if directionally clean.

## Caveats to flag in any result

Boltz-2's affinity head ignores cofactors (FMN, 8 Fe-S clusters), membrane, and multimeric context —
all central to Complex I. Absolute affinities are unreliable; only **relative ranking** (known
inhibitor vs off-target) is a defensible claim. Several positives (metals: Mn, MeHg, lead; MPP+) are
not classical Q-site small molecules — engagement prediction is only meaningful for the organic
Q-site-class positives (rotenone, deguelin, and mechanistically the rotenoids), so expect the benchmark
to be informative for a *subset* of positives, not all 12.

## Bottom line

Genuinely feasible and the only annotation-independent, non-bioactivity-similarity axis left standing.
Not runnable here (no GPU/account), but fully prepped: one Rowan/Boltz-API run executes the sanity
check + the adversarial benchmark. This is the discovery bet worth making in-window — with the
adversarial negatives as the false-positive control and the missing-cofactor caveat stated plainly.
