# ADR-0005: Add Alzheimer's as an equal-rigor second disease axis

- **Status:** proposed (Gate-1 review)
- **Date:** 2026-07-08
- **Rests on (recon + research):** `docs/ad-extension-plan.md` (the plan);
  `docs/research/ad-aop-literature-scan.md` (the Day-0 deep scan that revised the scaffold premise);
  `docs/research/ctd_ad_directevidence.tsv` (real curated CTD AD DirectEvidence, MeSH D000544, pulled
  via `scripts/pull-ctd-ad.sh`); `docs/recon/aop_neuro.csv` (endorsement status); the recovery-rule spec
  and `CLAUDE.md` "AD is a scaffold extension" note now being acted on at Jon's direction.

## Context

Aitiome shipped Parkinson's-only (AOP-3). Jon directed (2026-07-08) that Alzheimer's be built as a
**first-class axis with rigor equivalent to PD — neither more aggressive nor more conservative** —
honesty carried by *calibration*, not by reduced effort. A five-facet deep-research pass was run first
(per Jon: "I'm not convinced we've turned up everything") and it **corrected a premise in the plan.**

## Decision

1. **Add AD as a per-disease axis**, run through the *identical* machinery as PD: the curated-diagnostic
   recovery predicate (curated CTD DirectEvidence **OR** registered AOP stressor), the validation harness,
   the falsification/AUROC, the source-independence ablation, and the confidence tiers. Same method; the
   evidence lands where it lands.
2. **Scaffold (corrected by the scan):** anchor AD on the **endorsed** AOP-12 (neurodegeneration + memory
   in aging; registered stressor **lead**; narrative invokes amyloid/tau/neuroinflammation) and **AOP-48**
   (endorsed adult excitotoxicity → memory), with a **non-endorsed** AOP-429 (Tau/sporadic-AD) + AOP-475
   overlay for AD-specific terminus. The load-bearing cross-disease bridge is **KE-188 (neuroinflammation)**
   — the identical node in PD's AOP-3 and AD's AOP-429. Mitochondrial dysfunction is an **honest gap**
   (PD KE-177 vs AOP-429 placeholder KE-1816 "EMPTY"; cf. Jaylet 2024), surfaced on the discovery/negative map.
3. **Diagnostic leg = real curated CTD-AD DirectEvidence** (same provenance PD used): 132 AD rows,
   50 marker/mechanism. Environmental xenobiotic positives include DDE (72-55-9), cadmium, copper,
   aluminum (contested — kept as an honest hard case), zinc, iron, ozone, acrolein, sodium fluoride;
   plus **lead via the AOP-12 leg** (not in CTD-AD) — a cross-disease positive. See
   `docs/curated-drafts/ad-validation-candidates.md`.
4. **Scope rule (applied equally to both diseases):** benchmark positives are **environmental xenobiotics**.
   CTD's AD marker/mechanism set includes **endogenous metabolites/ROS** (D-glucose — our PD inert negative —
   plus oxysterols, homocysteine, ROS, etc.). These are documented and **excluded from the eval set**, not
   silently dropped; the per-compound predicate may still surface the curated association honestly.
5. **Endorsement/confidence is a reported signal, not a handicap:** AD carries an `endorsed`/`non-endorsed
   (exploratory)` badge per scaffold edge and a calibrated tier. No endorsed AOP has an amyloid/tau
   *terminal* AO, so AD-specificity rests on the non-endorsed overlay + curated CTD-AD — this is disclosed.
6. **AlzKB stays NO-GO** (recon): chemical→AD portals are gene-only or circular; grounding genesets
   (Bellenguez GWAS microglia, DAM, Sun/Gerrits human states, amyloid/tau spine, KE-188 effectors) are
   display/evidence only, never a recovery gate — the same anti-diagnostic discipline as PD.

## Consequences

- Contract → **v1.2.0** (additive): a `Disease` dimension; per-disease recovery/validation/benchmark;
  per-disease confidence tier + scaffold-endorsement flag. **PD outputs must stay byte-identical**
  (regression-tested) — AD is purely additive.
- New engine data: `validation_set_ad.csv` (after identity resolution), AD AOPs (12/48/429/475) in the
  scaffold, AD grounding genesets (added to `brain_cell_genesets.csv`).
- UI gains a disease toggle + dual per-compound verdict + endorsement badges (equal-polish AD hero:
  microglia terminal frame). PD default unchanged.
- The AD arm is honestly tiered by calibration; the PD/AD asymmetry and the mito-dysfunction gap are
  shown as features, consistent with win-condition #3.

## Open (Gate-1) items for Jon
- Confirm the **endogenous-metabolite scope rule** (§4).
- Confirm building AD on the **endorsed AOP-12/48 anchor** (vs. resting only on 429/475).
- The AD validation set needs the **Claude Science verification pass** (identity + CTD/AOP confirmation)
  before it is promoted from candidate to engine data.
