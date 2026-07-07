# Gate 0 — Recon Plan & Compound Set (awaiting approval)

Access to all five sources is **verified live** (2026-07-03). Full details in
[`data-source-map.md`](./data-source-map.md). This is the plan + the compound set to approve
before any bulk probing.

## Access verdict — 4 of 5 sources are key-free and ready now

| Source | Ready? | Note |
|---|---|---|
| PubChem PUG-REST | ✅ now | no auth; the identifier join hub (CID ↔ CAS ↔ SMILES/InChIKey ↔ **DTXSID**) |
| AOP-Wiki | ✅ now | SPARQL live, no auth; 587 AOPs, **42 OECD-endorsed**; MVP anchor **AOP 3 is endorsed** |
| CTD | ✅ now (bulk) | interactive tools are captcha-walled → use bulk report files (no key) |
| NeurotoxKb | ✅ now | bulk CSV/SDF, no key; 475 compounds |
| **EPA CCTE (ToxCast)** | ⏳ **needs key** | **email `ccte_api@epa.gov` today** — human-issued, `x-api-key` header |

**The one time-sensitive action:** request the CCTE API key now. Fallback if it's slow:
invitrodb v4.3 level-5 + assay-annotation bulk files give the same hitcall/mechanism data
offline (no key). So the ToxCast dimension is not blocked either way — only faster with the key.

**Key confirmed win:** the MVP anchor exists and is endorsed — AOP 3, "Inhibition of
mitochondrial complex I of nigro-striatal neurons → parkinsonian motor deficits," status
`WPHA/WNT Endorsed`. Its MIE is complex-I inhibition — exactly rotenone/MPP+'s mechanism.

## Candidate POSITIVES (known neurotoxicants)

Anchored on the Parkinsonian/dopaminergic + mitochondrial cluster. IDs pre-filled where known; probes will resolve/verify all.

**Core (the demo anchor — mechanism = complex I / oxidative stress):**
| Compound | CID | CAS | Mechanism theme | Note |
|---|---|---|---|---|
| Rotenone | 6758 | 83-79-4 | Complex I inhibition | MIE of AOP 3; **absent from NeurotoxKb** (flagged) |
| MPP+ | (resolve) | 36913-39-0 | Complex I inhibition | active metabolite; **absent from NeurotoxKb** |
| MPTP | 1388 | 28289-54-5 | Pro-toxicant → MPP+ | present in NeurotoxKb |
| Paraquat | 15939 | 4685-14-7 | Redox cycling / oxidative stress | present |
| Maneb | 3032581 | 12427-38-2 | Mitochondrial / co-exposure w/ paraquat | present |

**Extended (broader established neurotoxicants):**
| Compound | CID | Mechanism theme |
|---|---|---|
| Manganese (as MnCl₂) | 23930 | Manganism / parkinsonism |
| Methylmercury | 6860 | Developmental neurotox / oxidative |
| Lead (as lead acetate) | 5352425 | Neurodevelopmental |
| Deguelin | — | Rotenoid complex-I inhibitor (mechanistic positive control) |
| Dieldrin | — | Organochlorine, PD-associated, oxidative |
| Chlorpyrifos | — | Organophosphate developmental neurotoxicant (well-covered in ToxCast) |
| 6-Hydroxydopamine | — | Classic dopaminergic toxin (may be thin in ToxCast — research reagent) |

## Candidate NEGATIVES — two defensible strategies (pick one, or blend)

"Clean negative" = **well-studied-and-null**, not un-studied. Both tiers below will be
filtered to require real ToxCast coverage AND null across CTD-PD/AD + NeurotoxKb + AOP-neuro.

- **Tier A — inert reference nulls:** D-glucose, sucrose, sodium chloride, L-ascorbic acid,
  glycerol, sorbitol, citric acid, sodium saccharin.
  *Pro:* unambiguously non-neurotoxic. *Con:* some are so inert they may have LOW active-assay
  counts, weakening the "substantial coverage" claim.
- **Tier B — bioactive-but-non-neuro "hard negatives":** acetaminophen (hepatotox),
  warfarin (anticoagulant), ibuprofen (NSAID), and similar — extensively assayed, clearly
  bioactive, but no curated neurodegeneration association.
  *Pro:* tests demo *specificity* far better (bioactive yet neuro-null). *Recommended.*

Every negative gets its null-status flagged with the evidence (assay count, zero PD/AD marker
rows, NeurotoxKb absence) so the set is auditable.

## Plan of work (after approval)

1. **Resolve & crosswalk** (PubChem, key-free): every compound → CID, CAS, InChIKey, SMILES, **DTXSID**. Cache each response.
2. **AOP-Wiki** (SPARQL, key-free): pull the neuro AOP shortlist + MIE/KE/KER/AO for endorsed ones; score each by populatability; deep-dive AOP 3.
3. **CTD** (bulk files, key-free): per compound, curated + inferred PD (`MESH:D010300`) / AD (`MESH:D000544`) associations and key-event gene interactions.
4. **NeurotoxKb** (bulk, key-free): presence + endpoints/MeSH per compound.
5. **ToxCast** (needs key / bulk fallback): active-assay total + mechanism-theme subset (mitochondrial/complex-I, oxidative stress, membrane potential, neurite) per DTXSID.
6. **Assemble** `validation_set.csv`, `coverage_matrix.csv`, `aop_shortlist.csv`.
7. **Checkpoint:** preliminary go/no-go after the source map + first positive-coverage pass (steps 1–4 done, ToxCast partial) — before going deep.

All responses cached to `cache/`; throttled per source; nothing re-hits an API on re-run.
