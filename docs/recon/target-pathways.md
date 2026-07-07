# Target Pathways — Endorsed Neuro AOPs, Ranked by Populatability

Companion to [`go-no-go.md`](./go-no-go.md). Data: [`../data/aop_shortlist.csv`](../data/aop_shortlist.csv),
[`../data/aop_neuro.csv`](../data/aop_neuro.csv), [`../data/aop3_events.csv`](../data/aop3_events.csv).

**Build-ready scaffold:** [`aop_scaffold.json`](./aop_scaffold.json) — clean node/edge export of
the 7 endorsed neuro AOPs + dopaminergic siblings (3/587/593). Each AOP has `key_events`
(MIE/KE/AO nodes with IDs + titles) and `key_event_relationships` (upstream→downstream edges with
KER IDs) + endorsement status. The build loads this directly; no RDF parsing needed in-window.
AOP 3's graph is verified complete (MIE 888 → 887 → 177 → 890 → 896, with the 188↔890
neuroinflammation feedback loop).

## What "populatable" means here

A neuro AOP is a good demo scaffold if we can actually light it up with available data:
endorsed (credible), has an MIE (anchored mechanism), has chemical stressors (chem→pathway
linkage exists in the KB), and our validation compounds appear as its stressors. Score =
`3·endorsed + 2·has_MIE + 1·has_stressors + min(3, our_stressor_count)`.

## Inventory

- **31** AOPs have a neurodegeneration / learning-memory / parkinsonian adverse outcome
  (AO-title match; see probe regex). **7** are OECD-endorsed (`WPHA/WNT Endorsed`).
- Across the whole graph: 587 AOPs, 42 endorsed. Neuro is a well-represented slice.

## Top of the shortlist

| AOP | Title (abbrev) | Endorsed | MIE | KE | Our stressors | Score |
|---|---|---|---|---|---|---|
| **3** | Complex-I inhibition → parkinsonian motor deficits | ✅ | 1 | 7 | rotenone, MPP+, deguelin | **9** |
| 17 | Electrophile binding to thiols → learning/memory impairment (dev.) | ✅ | 1 | 10 | methylmercury | 7 |
| 12 | NMDAR antagonism (dev.) → neurodegeneration + L/M impairment | ✅ | 1 | 8 | lead | 7 |
| 54 | Na+/I- symporter inhibition → L/M impairment | ✅ | 1 | 10 | — | 6 |
| 483 | Energy deposition → L/M impairment | ✅ | 1 | 8 | — | 6 |
| 499 | MEK-ERK1/2 activation → cognition deficits (neurotransmitter) | ☐ | 1 | 4 | Mn, lead | 5 |
| 500 | MEK-ERK1/2 activation → cognition deficits (ROS/apoptosis) | ☐ | 1 | 7 | Mn, lead | 5 |
| 490 | IP3R/RyR co-activation → reduced IQ (non-cholinergic) | ☐ | 2 | 12 | chlorpyrifos | 4 |
| 593 | Redox cycling by mitochondria → nigrostriatal DA degeneration | ☐ | 1 | 5 | paraquat | 4 |
| 587 | Complex-III inhibition → parkinsonian motor deficits | ☐ | 1 | 4 | — | 3 |

## The MVP anchor — AOP 3 — assessed

**Fully populatable and endorsed.** This is the demo's spine.

**Event scaffold (all present in RDF):**
```
MIE 888  Binding of inhibitor, NADH-ubiquinone oxidoreductase (complex I)
KE  887  Inhibition, NADH-ubiquinone oxidoreductase (complex I)
KE  177  Increase, Mitochondrial dysfunction
KE  890  Degeneration of dopaminergic neurons of the nigrostriatal pathway
KE  188  Neuroinflammation
KE  889  Proteostasis, impaired
AO  896  Parkinsonian motor deficits
```

**Does the mitochondrial/complex-I → dopaminergic → parkinsonian chain light up?** Yes, for the
right compounds:

| Compound | AOP-3 stressor | ToxCast active | mito assays active | mito-membrane-potential active | Verdict |
|---|---|---|---|---|---|
| **rotenone** | ✅ | 254 | **5** | **5** | Hero case — mechanism recovers cleanly |
| **MPP+** | ✅ | 8 | 0 | 0 | Anchored + bioactive; mechanism thin in ToxCast |
| **deguelin** | ✅ | 0 | 0 | 0 | Anchored only (no ToxCast) — mechanistic positive control on paper |
| MPTP | ☐ | 0 | 0 | 0 | Pro-toxicant reagent; use MPP+ instead |

Rotenone is the clean win: its ToxCast profile independently recovers the complex-I /
mitochondrial-dysfunction mechanism that AOP 3 asserts. MPP+ is anchored as a stressor and is
bioactive but its ToxCast battery is thin (39 assays), so its mitochondrial signal comes from
the AOP/CTD side, not assays. deguelin is a paper-only anchor (rotenoid, AOP-3 stressor, but
untested in ToxCast).

**Sibling pathways for breadth:** AOP 593 (redox cycling → nigrostriatal DA degeneration) is
paraquat's home — paraquat shows 32 ToxCast actives, all neuronal, consistent with oxidative
rather than direct complex-I action. AOP 587 (complex III → parkinsonian) rounds out the
dopaminergic-mitochondrial family but has no stressor among our set. Together, AOPs **3 / 593 /
587** form a coherent "mitochondrial → dopaminergic neurodegeneration → parkinsonism" cluster
that a demo can present as one mechanistic story with rotenone/MPP+ and paraquat as the
recovered known toxicants.

## Populatability gaps

- Endorsed AOPs 54 and 483 have MIEs and stressors but **none of our validation compounds** —
  they're populatable in principle but not by this compound set (NIS inhibitors; ionizing-energy
  deposition). Out of scope for a neurotoxicant-recovery demo.
- The strongest non-endorsed neuro AOPs (499/500/490/593) are where our metals and OP compounds
  land. If the demo wants to show recovery beyond the single endorsed anchor, these are the next
  tier — but flag their **non-endorsed** status explicitly (they're scaffolds under development,
  not OECD-validated).
- KE→assay mapping was assessed at the mechanism-theme level (mito / membrane-potential /
  oxidative / neuronal via ToxCast assay-name + source classification), not per-individual-KE
  ontology term. A full KE→assay ontology join (via each KE's GO/MeSH `hasBiologicalEvent`
  object) is a worthwhile in-window deepening but was not needed to establish feasibility.
