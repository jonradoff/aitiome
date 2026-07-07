# Separation Analysis — the data-derived recovery predicate

Companion to [`go-no-go.md`](./go-no-go.md). Table: [`../data/separation_table.csv`](../data/separation_table.csv)
(27 compounds × candidate signals). Produced by `probes/08_separation.py` from cached data.

## The predicate that yields the 12 / 15 split with zero error

Evaluated every candidate signal and combination against the ground-truth labels (target:
tp=12, fp=0, fn=0):

| Rule | tp | fp | fn | exact? |
|---|---|---|---|---|
| curated PD (`DirectEvidence`) only | 8 | 0 | 4 | no (misses Mn, MeHg, lead, deguelin) |
| neuro-AOP stressor only | 8 | 0 | 4 | no (misses MPTP, maneb, dieldrin, 6-OHDA) |
| NeurotoxKb only | 7 | 0 | 5 | no |
| mito-assay active only | 3 | **7** | 9 | no — **worse than useless** |
| neuro-assay active only | 6 | **5** | 6 | no |
| **curated PD OR neuro-AOP stressor** | **12** | **0** | **0** | ✅ **EXACT** |
| curated PD OR AOP-stressor OR NeurotoxKb | 12 | 0 | 0 | ✅ (NeurotoxKb term redundant) |

### The recovery rule (data-derived, not guessed)

```
is_recovered_positive  ⟺  ( CTD DirectEvidence links compound → Parkinson's (MESH:D010300) )
                          OR
                          ( compound is a registered stressor of any neuro AOP in AOP-Wiki )
```

Both terms are **curated knowledge-base signals**. Each alone has **zero false positives** but
misses ~4 positives; their **union covers all 12 positives and zero negatives**. NeurotoxKb
presence is also zero-FP but its positives are a subset — keep it as a third corroborating vote,
not a needed term. This is the minimal exact predicate over the 27-compound set.

## Diagnostic vs confirmatory — which signals actually separate the classes

The distinction that matters: does a signal separate positives from the **adversarial
negatives** (bioactive non-neurotoxicants), or is it merely true of positives while *also* firing
on those negatives?

| Signal | Positives | **Adversarial negs** | Verdict |
|---|---|---|---|
| curated PD `DirectEvidence` | 8/12 | **0/6** | **DIAGNOSTIC** |
| neuro-AOP stressor | 8/12 | **0/6** | **DIAGNOSTIC** |
| NeurotoxKb presence | 7/12 | **0/6** | **DIAGNOSTIC** |
| mitochondrial / MMP assay active | 3/12 | **4/6** | **CONFIRMATORY only — anti-diagnostic** |
| neuronal assay active | 6/12 | **5/6** | **CONFIRMATORY only — anti-diagnostic** |

**Mitochondrial-assay activity is not just non-diagnostic, it points the wrong way** (fp=7 > tp=3):
troglitazone, prochloraz, propiconazole, simvastatin all hit mito/MMP assays and are not
neurotoxicants. Any recovery rule that leans on mito-assay activity will false-positive the
adversarial set. Mito/neuronal activity is legitimate **corroboration of mechanism for a compound
already known to be a positive** — never a discriminator.

## Is there an assay-level *dopaminergic-specific* signal? — Essentially no.

We looked for a readout specific to dopaminergic neurons (not generic mitochondrial toxicity)
that positives have and adversarial negatives lack. Concretely, in the cached data:

**ToxCast / invitroDB dopaminergic-specific assays — only 6 exist, and the sole actives are on a
NEGATIVE.** The full DA-specific assay inventory tested across our set:
`NVS_TR_hDAT` (dopamine transporter), `NVS_TR_rVMAT2` (vesicular monoamine transporter),
`NVS_GPCR_hDRD1`, `NVS_GPCR_hDRD2s` (D1/D2 receptors), `NVS_ENZ_rMAOBC`, `NVS_ENZ_rMAOBP` (MAO-B).
Across all 27 compounds, the **only** compound with an *active* DA-specific assay is
**prochloraz — an adversarial negative** (active on hDAT + rVMAT2). **No positive has an active
dopaminergic-specific ToxCast assay.** So this signal is absent-to-anti-diagnostic: it cannot
support the positives, and where it fires it fires on a non-neurotoxicant. (These are single-target
binding assays, not dopaminergic-neuron functional models — ToxCast has essentially no
dopaminergic-neurodegeneration assay coverage.)

**CTD dopaminergic genes — confounded by study volume, not clean.** Strict DA-gene interaction
counts (TH, SLC6A3/DAT, DRD1-5, SLC18A2/VMAT2, DDC, COMT, MAOA/B, SNCA, NR4A2, …): rotenone hits
10 and paraquat 8 — but **acetaminophen (8) and fulvestrant (8), both negatives, rival them.** The
Parkinson's-monogenic subset (SNCA, LRRK2, PRKN, PINK1, PARK7, VPS35) shows the same leak
(acetaminophen 4, fulvestrant 2). Raw CTD gene counts scale with how heavily a chemical is
studied, so they are corroborative context, **not** a clean discriminator.

### Conclusion on dopaminergic specificity

**There is no assay-level dopaminergic-specific signal in the available data that supports the
positives.** Dopaminergic/neurodegeneration specificity in this recon comes **entirely from the
curated discriminators** — CTD curated Parkinson's associations and AOP-Wiki stressor membership
(which is itself curated onto the dopaminergic AOPs 3/587/593). The assay layer (ToxCast) supplies
*mechanistic corroboration* (rotenone's complex-I/mito actives line up with AOP 3's MIE/KEs) but
**no dopaminergic specificity and no discrimination against bioactive non-neurotoxicants.**

## What this means for the build

1. **For recovering KNOWN neurotoxicants** (the validation demo): use the exact curated predicate
   above. It is clean, auditable, and zero-error. Show ToxCast mito/neuronal activity as
   *corroborating mechanism* for the 6 `assay_mechanism_recovered` positives — labelled as
   corroboration, not as the reason for recovery.
2. **Do not gate recovery on assay activity.** The adversarial negatives exist precisely to prove
   this: a mito-activity rule scores fp=7. Convergence (curated anchor **+** corroborating assay)
   is the honest framing.
3. **For proposing NOVEL candidates** (Aitiome's actual goal — these lack curated PD/AOP
   annotations by definition): the zero-error predicate **does not transfer**, and assay
   mito-activity over-calls. Novel-candidate scoring must lean on structural / target similarity
   to known AOP-3/593 stressors and the AOP scaffold, with the **adversarial-negative set as the
   false-positive benchmark**. Expect this to be the hard part of the in-window build; the recon's
   honest message is that assays alone won't carry it.
