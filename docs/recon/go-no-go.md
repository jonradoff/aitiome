# Go / No-Go: Validation-First Demo Feasibility

**Date:** 2026-07-03 · **Recon scope:** pre-event data reconnaissance for Aitiome
**Question:** Can we assemble a validation set of known neurotoxicants with clean, mappable
assay/mechanism coverage, anchored to endorsed neuro AOPs, cleanly enough that a system
recovering them is a credible demo?

---

## VERDICT: **GO** — with a scoped demo set and four caveats to design around.

The endorsed MVP anchor exists and is fully populatable, the positive→negative separation is
clean on curated data, and 6 of 12 positives have strong multi-source mechanism coverage.
The honest limits: ToxCast is data-poor for ~half the positives, and identifier/salt-form
resolution is a real hazard. Neither breaks the demo if you scope to the covered set below.

### The numbers behind it

| Signal | Positives (n=12) | Negatives (n=15) |
|---|---|---|
| Resolved to CID **and** DTXSID | 12 / 12 | 15 / 15 |
| AOP-Wiki stressor of ≥1 neuro AOP | 7 / 12 | 0 / 15 |
| CTD **curated** Parkinson's assoc. (`DirectEvidence`) | 8 / 12 | 0 / 15 |
| In NeurotoxKb | 7 / 12 | 0 / 15 |
| ToxCast **usable** assays ≥ 50 | 5 / 12 | 10 / 15 |
| ToxCast active assays ≥ 20 | 4 / 12 | 7 / 15 |
| Ground-truth neuro-null **and** well-tested (usable negatives) | — | **12 / 15** |

Every curated discriminating signal separates the classes with **zero negative false-positives**
(AOP stressor, curated PD, NeurotoxKb all **0/15** for negatives). Note the negatives now include
7 with ≥20 ToxCast actives — deliberately bioactive, to prove the discrimination is *neuro-mechanism*,
not *active-vs-inert* (see negatives section).

### Confidence tiering (in the data — `validation_set.csv:confidence_tier`)

The build should surface this split as an honesty feature:

- **Positives — `assay_mechanism_recovered` (6):** rotenone, paraquat, MPP+, methylmercury,
  chlorpyrifos, MnCl₂ — anchored **and** independently recovered by ToxCast mechanism assays.
- **Positives — `curated_anchored_only` (6):** MPTP, maneb, dieldrin, lead, deguelin, 6-OHDA —
  real neurotoxicants anchored by curated PD / AOP stressor links, but **ToxCast data-poor**, so
  the mechanism is *asserted from the knowledge base, not recovered from assays.* Do not claim
  assay-level mechanism recovery for these.

### The recovery rule is data-derived (zero error) — and it is curated, not assay-based

Empirically ([`separation-analysis.md`](./separation-analysis.md)), the exact predicate that
splits the 27 compounds 12/15 with **zero error** is:

> **positive ⟺ ( CTD curated Parkinson's `DirectEvidence` ) OR ( registered stressor of a neuro AOP )**

Both terms are **curated**; each is zero-false-positive, and their union covers all 12 positives.
Critically, **assay activity is NOT diagnostic**: a mitochondrial-assay rule scores fp=7 (the
adversarial negatives hit those assays), and **there is no dopaminergic-specific assay signal** —
of 6 DA-specific ToxCast assays, the only actives belong to *prochloraz, a negative*. ToxCast
corroborates mechanism for true positives; it does **not** discriminate. Implication for the
novel-candidate goal: the curated predicate won't exist for novel compounds and assay-mito
over-calls, so novel scoring needs structural/AOP-scaffold similarity with the adversarial set as
the false-positive benchmark.

### The MVP anchor is real and endorsed — **GO**

**AOP 3** — *"Inhibition of the mitochondrial complex I of nigro-striatal neurons leads to
parkinsonian motor deficits"* — status **`WPHA/WNT Endorsed`** (OECD). The full causal chain
is present in the RDF:

```
MIE 888  Binding of inhibitor, NADH-ubiquinone oxidoreductase (complex I)
KE  887  Inhibition, complex I
KE  177  Increase, Mitochondrial dysfunction
KE  890  Degeneration of dopaminergic neurons of the nigrostriatal pathway
KE  188  Neuroinflammation      KE 889  Proteostasis, impaired
AO  896  Parkinsonian motor deficits
```

- **rotenone, MPP+, deguelin are all listed stressors of AOP 3 itself.**
- **rotenone lights up the exact mechanism in ToxCast:** 254 active assays including
  **5 mitochondrial** and **5 mitochondrial-membrane-potential** endpoints, plus 44 neuronal.
- The dopaminergic family extends cleanly: **paraquat → AOP 593** (redox cycling → nigrostriatal
  degeneration), and **AOP 587** (complex III → parkinsonian) is the mechanistic sibling.

A demo that recovers rotenone/MPP+ onto AOP 3 via complex-I/mitochondrial assay evidence, and
paraquat onto AOP 593 via its oxidative signature, is directly supported by the data.

### The demo-ready subset (lead with these)

**6 positives** with mechanism + disease + AOP anchoring:
`rotenone` (STRONG), `paraquat` (STRONG), `methylmercury` (STRONG), `chlorpyrifos` (STRONG),
`MPP+` (MODERATE, complex-I, AOP-3 stressor), `manganese chloride` (MODERATE).

**Negatives — 12 defensible, drug-like/industrial-weighted, in two tiers:**

- **`CLEAN_NEGATIVE` (6)** — ground-truth neuro-null (no curated PD/AD, absent NeurotoxKb, not an
  AOP stressor) with no mechanism-adjacent assay hits:
  - *bioactive:* `fulvestrant` (95 tested / 20 active) — richly assayed yet neuro-null (most persuasive).
  - *well-tested quiet:* `acetaminophen` (497/0), `furosemide` (174/2), `sulfamethoxazole` (128/0),
    `diethyl phthalate` (120/2), plus `sucrose` (inert, kept for contrast only).
- **`ADVERSARIAL_NEGATIVE` (6)** — the sharper test: bioactive, **even mitochondrially active**, yet
  genuinely not neurotoxicants: `prochloraz` (230 active, 3 mito / 4 mmp), `troglitazone` (205,
  5 mito / 7 mmp), `propiconazole` (184, 3/2), `simvastatin` (160, 2/4), `fenofibrate` (114, 2/1),
  `warfarin` (26, 0/1). These prove the demo must reject compounds that hit the *anchor mechanism
  assays* but lack the dopaminergic/AOP/curated convergence — see caveat below.

Excluded as weak: `ibuprofen` / `D-glucose` (carry a curated Alzheimer's link → not neuro-null),
`sodium chloride` (untested in ToxCast → fails "well-studied").

Full per-compound detail incl. `confidence_tier`: [`../data/validation_set.csv`](../data/validation_set.csv)
and [`../data/coverage_matrix.csv`](../data/coverage_matrix.csv).

---

## Where it's thin — four caveats to design around (report loudly)

**1. ToxCast is data-poor for ~half the positives.** Six positives have no usable ToxCast
mechanism evidence: `MPTP` (only 6 assays — it's a pro-toxicant reagent; use its metabolite
**MPP+** instead), `maneb` (698 assays but **all QC-Omit** — dithiocarbamate assay
interference), `dieldrin` (517 all QC-Omit), `lead acetate` (0), `deguelin` (0), `6-OHDA` (0).
These can still be *anchored* via CTD curated PD associations and AOP stressor links, but they
**cannot be recovered by mitochondrial/assay mechanism alone.** → Don't build the mechanism-
recovery narrative on them; keep them as disease/AOP-anchored positives or drop from the demo.

**2. Identifier / salt-form resolution is a genuine hazard.** ToxCast tested specific salts,
not parent ions. Paraquat's real data (32 active) is under **paraquat dichloride CAS
1910-42-5 / a different DTXSID**, not the parent `DTXSID3034799` (4 inactive assays). Same for
MPP+ and MnCl₂. Auto-resolving CAS from PubChem synonyms silently picked wrong forms in this
recon (MPP+, Mn). → The build must map each compound to the **ToxCast-tested DSSTox record**;
the working form per compound is recorded in `validation_set.csv:toxcast_cas`. Budget in-window
time for a curated identifier crosswalk — this is the single biggest correctness risk.

**3. CTD *inferred* associations are noise; only curated `DirectEvidence` discriminates.**
Acetaminophen (a clean negative) shows **80 inferred** Parkinson's + 91 inferred Alzheimer's
associations purely from study volume. Curated `DirectEvidence` gives a clean 8/12 vs 0/15
split; inferred gives none. → Use `DirectEvidence != ''` as the CTD signal; treat inferred as
context only. Likewise, CTD raw gene-interaction counts are confounded by study volume (generic
stress/apoptosis genes light up for everything) — don't use them as a mechanism discriminator.

**4. Mitochondrial/neuronal assay activity is NOT specific to neurotoxicity — the demo must
require convergent evidence.** Expanding the negatives to heavily-assayed bioactive drugs surfaced
this: of 12 usable neuro-null negatives, **6 are "adversarial"** — bioactive compounds that light
up the very assays the anchor leans on. `troglitazone` (a diabetes drug) hits **5 mitochondrial +
7 membrane-potential** assays; `prochloraz`/`propiconazole` (fungicides) and `simvastatin` similarly
hit mito + neuronal assays — yet none are neurotoxicants (0 curated PD/AD, absent NeurotoxKb, not
AOP stressors). → **A recovery rule based on mito/assay activity alone would false-positive these.**
The demo must gate on *convergence* — AOP-3 stressor linkage **and** curated PD **and**
dopaminergic-specific signal — not on hitting mitochondrial assays. This is a feature to
demonstrate (correctly rejecting adversarial negatives), and the 6-compound adversarial set is
purpose-built to show it. Clean-negative pool is now ample (12 neuro-null, ≥8 as requested).

### Non-blocking notes

- **EPA CCTE API key** (email `ccte_api@epa.gov`) — still worth provisioning for the build
  (raw AC50s, richer assay annotation). **Not a blocker for the recon or the demo:** NICEATM
  **ICE** (`ice.ntp.niehs.nih.gov/api/v1/search`, no key) serves the same invitroDBv4.2 ToxCast
  hitcalls and is what produced all ToxCast numbers here. Note the documented `api-ccte.epa.gov`
  host did not resolve from this environment — use `https://comptox.epa.gov/ctx-api`.
- **NeurotoxKb licensing:** CC BY-NC-ND 4.0 (non-commercial, **no-derivatives**). Fine as a
  validation lookup; do **not** ship a derived/redistributed NeurotoxKb dataset.
- Neuro AOP inventory: **31 AOPs** with a neurodegeneration/learning-memory adverse outcome,
  **7 OECD-endorsed**. Ranked shortlist in [`../data/aop_shortlist.csv`](../data/aop_shortlist.csv);
  analysis in [`target-pathways.md`](./target-pathways.md).

---

## Bottom line

Build the validation-first demo on **AOP 3 (endorsed, complex-I → parkinsonian)** with
rotenone + MPP+ as the mechanism-recovery hero cases, paraquat on AOP 593, and methylmercury /
chlorpyrifos / MnCl₂ as breadth (the 6 `assay_mechanism_recovered` positives). Present the 6
`curated_anchored_only` positives honestly as knowledge-base-anchored, not assay-recovered. For
negatives, pair the 6 clean ones with the 6 **adversarial** ones and show the system correctly
rejecting bioactive-but-non-neurotoxic compounds — that's the most convincing part of the demo.
Spend early in-window effort on the **DSSTox salt-form crosswalk** (spec in
[`data-source-map.md`](./data-source-map.md#risk-1-highest-dsstox-salt-form-resolution--build-a-dtxsid-first-crosswalk))
— that, not data availability, is what will bite. Everything needed is key-free and cached here.
