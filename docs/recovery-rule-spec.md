# Aitiome — Recovery & Scoring Rule Spec (v1, data-derived from bio-recon)

> This spec is grounded in the bio-recon separation analysis (27 compounds: 12 positives / 15 negatives, 6 of them adversarial). It defines what the engine may and may not claim. Read the "core finding" first — it constrains everything else.

## Core finding

Discrimination between known neurotoxicants and non-neurotoxicants — including bioactive, **mitochondrially-active** non-neurotoxicants — comes **entirely from curated annotations, not from assay-derived mechanism.**

- **Diagnostic signals** (0/6 false positives on adversarial negatives): curated CTD Parkinson's `DirectEvidence`, registered stressor of a neuro AOP, NeurotoxKb presence.
- **Confirmatory-only / non-discriminating:** assay activity. Mitochondrial-assay activity is *anti-diagnostic* (fp=7 > tp=3); neuronal-assay activity fp=5. No dopaminergic-specific assay signal appears in any positive — the only active DA-specific assays across all 27 compounds belong to a negative (prochloraz). Dopaminergic specificity exists **only** in the curated layer.

## Validation mode (known compounds)

**Zero-error recovery predicate:**
```
positive  ⟺  ( CTD curated Parkinson's DirectEvidence )  OR  ( registered stressor of a neuro AOP )
```
tp=12, fp=0, fn=0 on the recon set. Each term is individually zero-FP but misses ~4 positives; their union covers all 12. NeurotoxKb is a redundant confirming vote.

**What validation may claim — and may NOT:**
- ✗ Do **not** claim the engine "independently recovers the mechanism from assay data." It does not; the data contradicts it.
- ✗ Do **not** gate a positive call on mitochondrial (or any) assay activity. Adversarial negatives hit those same assays.
- ✓ **Pathway-reconstruction fidelity:** given a known neurotoxicant, the engine assembles the *correct endorsed AOP chain* (e.g. AOP-3: MIE 888 → 887 complex-I inhibition → 177 mito dysfunction → 890 nigrostriatal dopaminergic degeneration → 896 parkinsonian deficits), grounded and traceable. This tests mechanism *assembly*, not label lookup.
- ✓ **Adversarial specificity:** the engine correctly *rejects* the 6 mito-active non-neurotoxicants (troglitazone, prochloraz, propiconazole, simvastatin, fenofibrate, warfarin) by requiring curated convergence rather than assay activity. This is the strong, non-obvious result — make it the demo centerpiece.
- Assay mechanism data's role: **corroboration/illustration** for known positives (rotenone's 5 mito + 5 membrane-potential hits illustrate the chain), never a discriminator.

## Discovery mode (novel candidates) — DIFFERENT, HARDER, UNVALIDATED

Novel candidates lack curated PD/AOP annotations *by definition*, so **the validation predicate does not transfer**, and assay-mito over-calls (the adversarial negatives prove it). Therefore:

- Novel scoring must rest on **structural / AOP-scaffold mechanistic similarity** to known stressors plus multi-signal convergence — and **must be benchmarked against the adversarial-negative set as the permanent false-positive control.**
- This path is **not validated by recon.** Treat novel outputs as calibrated, analogy-based **hypotheses flagged for follow-up**, with explicit, prominent uncertainty. Never "drivers," never "predictions," never a bare score without the benchmark context.

## Build implications

- **Two explicit engine modes, never conflated:** Validation (curated convergence + pathway reconstruction + adversarial specificity) vs. Discovery (analogy-based, benchmarked, uncertain).
- **Confidence tiers surfaced on every result:** `assay_mechanism_recovered` vs `curated_anchored_only` for knowns; `analogy_only` (lowest, with prominent uncertainty) for novels.
- **Hard rules:** curated `DirectEvidence` only (inferred CTD never touches a grade); never gate on mito activity; DTXSID/salt-form-correct identifier resolution (DSSTox-first, not PubChem-synonym guessing).
- **Demo honesty:** adversarial-negative rejection is the specificity centerpiece; novel candidates shown with heavy uncertainty and the adversarial benchmark visible alongside.

## Calibrated demo framing

- "The engine reconstructs the endorsed mechanistic pathway for known neurotoxicants — and, the harder test, correctly refuses to flag mito-active compounds that *aren't* neurotoxic, because it reasons on convergent curated mechanism, not on activity."
- "For novel candidates it proposes mechanistic analogies as hypotheses, benchmarked against adversarial non-neurotoxicants to control false positives — explicitly leads for lab follow-up, not claims."
