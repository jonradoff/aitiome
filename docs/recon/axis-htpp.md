# Axis: EPA HTPP (High-Throughput Phenotypic Profiling / Cell Painting, U-2 OS)

**Verdict: NO-GO at Gate 1 (coverage).** Clean key-free access; positives not screened.

- **Gate 1 — coverage:** **4/12 positives** (rotenone, maneb, dieldrin, chlorpyrifos); only **2/6
  assay-recovered** (rotenone, chlorpyrifos). paraquat, MPP+, MnCl₂, methylmercury, MPTP, lead,
  deguelin, 6-OHDA **absent** (salt-form alternates checked — genuinely absent). Negatives: **5/6
  adversarials** covered (all but warfarin), 10/15 total. Same positive-coverage gap as HTTr/L1000.
- **Cell-context flag:** U-2 OS = human osteosarcoma (bone), **non-neuronal**, no DAT/VMAT — covered
  positives report generic mitochondrial/organelle-stress morphology, not dopaminergic toxicity.
- Gates 2–3 not run (gated out).

**Access route (verified live, no auth):** CCTE public REST proxy
`https://comptox.epa.gov/dashboard-api/ccdapp2/htpp/search/by-dtxsid?id=<DTXSID>` (query-string, not
path — `.../by-dtxsid/DTXSID...` 404s). Returns per-feature conc-response (`endpoint` f_XXX,
`channel` DNA/AGP/Mito/ER/RNA, `hitCall`, `bmd`, `maxConc`); empty `_embedded.Htpp` ⇒ not screened.
Feature dictionary: `/htpp-annotations`. Screened-chemical list (UI export): dashboard chemical-list
`HTPP2023_U2OS_SCREEN` (~1,205 chems). Supplement (Nyffeler 2023): figshare DOI
`10.23645/epacomptox.21183481` (now a link-only pointer to Clowder/EDAP — unreliable anonymously; use
the per-DTXSID REST oracle).
```bash
curl -s "https://comptox.epa.gov/dashboard-api/ccdapp2/htpp/search/by-dtxsid?id=DTXSID4020458" | jq '._embedded.Htpp | length'
```
