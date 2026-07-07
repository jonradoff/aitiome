# LINCS L1000 Spike — Annotation-Independent Discovery Signal

**Spike question:** Can a compound's LINCS L1000 transcriptomic signature recover known
neurotoxicants *without their curated labels*, while separating them from the mito-active
adversarial negatives?

Disposable spike, separate from the main recon. Data: [`../data/lincs_coverage.csv`](../data/lincs_coverage.csv).

---

## VERDICT: **NO-GO — fails at the coverage gate (step 1).**

**LINCS L1000 does not profile the environmental-neurotoxicant chemical space this validation set
is built on.** Only **3 of 12 positives** have any signature; the other 9 are genuinely absent
(confirmed two independent ways — see below). That is too thin, and too structurally skewed, to
test blind signature recovery credibly. Per the spike's own stop rule ("if most positives aren't
profiled, that's an early no-go — say so and stop"), I stopped before the similarity (step 2) and
cytotoxicity-control (step 3) computations. Running them on n=3 positives — two of which are
near-identical rotenoids — could only produce a number that looks like an answer but isn't one.

### The coverage table (the number that decides it)

| Class | In LINCS L1000 | Covered |
|---|---|---|
| **Positives** | **3 / 12** | rotenone (77 sigs / 56 cells), deguelin (19 / 13), 6-OHDA "oxidopamine" (12 / 3) |
| — assay-recovered core (6) | **1 / 6** | only rotenone; paraquat, MPP+, methylmercury, chlorpyrifos, MnCl₂ **absent** |
| — curated-anchored (6) | 2 / 6 | deguelin, 6-OHDA; MPTP, maneb, dieldrin, lead **absent** |
| **Negatives** | **8 / 15** | paracetamol (46), furosemide (45), warfarin (72), ibuprofen (68), troglitazone (229), simvastatin (142), fenofibrate (22), sulfamethoxazole (3) |
| — **adversarial** (mito-active) (6) | **4 / 6** | troglitazone, simvastatin, fenofibrate, warfarin covered; prochloraz, propiconazole absent |

### Why this is a hard no-go, not a "thin but try it"

1. **Absence is real, not an ID artifact.** Matched by InChIKey and PubChem CID against the full
   L1000 metadata (Phase I `GSE92742` + Phase II `GSE70138`), *and* cross-checked live against the
   iLINCS `SignatureMeta` API by compound name **and** CID. All 9 missing positives returned **0
   signatures on every route**; rotenone returned 43 (sanity passes). LINCS L1000's library is
   drugs and tool compounds — it does not include the **pesticides (paraquat, chlorpyrifos, maneb,
   dieldrin), metals (Mn, methylmercury, lead), or MPTP/MPP+** that make up most of this positive set.
2. **The covered positives are structurally degenerate.** 2 of the 3 (rotenone, deguelin) are
   rotenoids — near-identical scaffolds and the same complex-I mechanism. "Rotenone retrieves
   deguelin" would be a structural-analog result, not evidence of transcriptomic recovery of
   *neurotoxicity as a class*. That leaves effectively one independent positive (6-OHDA).
3. **The asymmetry runs the wrong way.** Positives are 25% covered; negatives 53% — including
   **4 of the 6 mito-active adversarial negatives.** So the data available would pit ~1 independent
   positive against a well-covered set of exactly the confounders the test was meant to rule out.
   No blind-recovery metric computed on this could generalize.
4. **Reference quality also skews to the negatives.** Among covered compounds, most positives are
   non-touchstone (rotenone `is_touchstone=0`, 6-OHDA `=0`; only deguelin `=1`), while the covered
   negatives (troglitazone, warfarin, ibuprofen, fenofibrate) are touchstone `=1` — the curated
   reference set. The higher-quality L1000 signal sits on the negatives here.

### What this does and doesn't rule out

- It **rules out** using LINCS L1000 as the annotation-independent discovery signal *for this
  compound class* (environmental neurotoxicants). The modality doesn't cover them.
- It does **not** rule out transcriptomic discovery in general. If the build wants an
  annotation-independent axis, the honest next probes are platforms that actually assay this
  chemical space: **tox-focused transcriptomics** (Open TG-GATEs, DrugMatrix — though those are
  rat liver, not neuro), or **morphological profiling** (JUMP–Cell Painting, which has profiled far
  more pesticides/industrial chemicals than L1000). Rotenone/deguelin/6-OHDA being present means a
  *neuronal-model* transcriptomic set, if one exists for these stressors, would be the right place
  to look — but that's a new source, out of this spike's scope.
- The main-recon verdict is unaffected: the zero-error recovery predicate there is curated
  (`separation-analysis.md`), and this spike simply confirms that a *transcriptomic* substitute for
  those curated labels is **not available in L1000** for these compounds.

### Deliverable note

`data/lincs_coverage.csv` is produced (all 27 compounds, coverage + cell lines + touchstone flag).
**`data/lincs_similarity.csv` is intentionally NOT produced** — step 1 failed the gate, and a
pairwise similarity/retrieval matrix over 3 structurally-degenerate positives would be an
underpowered non-result. Reviving this spike requires a platform that covers the compound class,
not a different LINCS query.

---

## Access route (verified live 2026-07-03) — logged for the build

- **Coverage (no key):** GEO metadata — `GSE92742_Broad_LINCS_{pert,sig}_info.txt.gz` (Phase I) +
  `GSE70138_...` (Phase II) from `ftp.ncbi.nlm.nih.gov/geo/series/...`. `pert_info` carries
  `inchi_key` + `pubchem_cid` (join keys) + `is_touchstone`; `sig_info` gives per-signature
  `cell_id`/dose/time. See `data-source-map.md` for full detail.
- **Signature vectors (no key), had we proceeded:** iLINCS. `GET /api/SignatureMeta?filter=<JSON>`
  (search `compound`/`pubChemID`, `libraryid:"LIB_5"`) → collect `LINCSCP_` ids → `POST
  /api/ilincsR/downloadSignature {"sigID":...}` → 978-gene vectors (`Name_GeneSymbol`,
  `Value_LogDiffExp`, `Significance_pvalue`). Confirmed working; not exercised for similarity given
  the coverage no-go.
