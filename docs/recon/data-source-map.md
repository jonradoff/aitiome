# Data Source Map

Per-source access reference, **verified against live endpoints/docs on 2026-07-03**.
This is the durable artifact that makes in-window (Go/TS) connector-building fast.

**Summary of key/auth status:**

| Source | Access | API key? | Blocker for today |
|---|---|---|---|
| PubChem PUG-REST | REST, no auth | **No** | none |
| AOP-Wiki | SPARQL + RDF/XML bulk | **No** | none |
| EPA CCTE (ToxCast) | REST | **YES — request now** | email `ccte_api@epa.gov` |
| **NICEATM ICE** | REST, no auth | **No** | **none — no-key ToxCast substitute (used for all ToxCast numbers here)** |
| CTD | Bulk report files | **No** | captcha wall on interactive tools (use bulk files) |
| NeurotoxKb | Bulk CSV/SDF download | **No** | none (475 compounds, v1.0) |
| LINCS L1000 (GEO + iLINCS) | Bulk metadata + iLINCS REST | **No** | **poor coverage of this compound class — see §6 (spike NO-GO)** |

> **ACTION TODAY:** Only EPA CCTE needs a key. It is issued by a human over email, so
> request it immediately: mail `ccte_api@epa.gov`, state name/affiliation + intended use
> (mention "ToxCast bioactivity, moderate programmatic volume for a research prototype").
> Key is passed as the `x-api-key` header. Everything else is key-free.

---

## ⚠️ Correctness risks — read before building any connector

Two data-shape traps produced silently-wrong numbers during this recon. Both are **day-one build
tasks**, not edge cases.

### RISK 1 (highest): DSSTox salt-form resolution — build a DTXSID-first crosswalk

**ToxCast tests specific salt/registry forms, and the parent record is often the wrong one.**
Concrete case from this recon: **paraquat.** The parent cation `DTXSID3034799` / CAS `4685-14-7`
returns **4 assays, all inactive** in ToxCast. The compound's real bioactivity — **53 assays,
32 active** — lives under **paraquat *dichloride*, CAS `1910-42-5`** (a different DTXSID). Same
class of split hit MPP+ and MnCl₂. Resolving CAS from **PubChem synonyms** silently picked the
wrong form (MPP+ resolved to `48134-75-4` → 0 ToxCast records; MnCl₂ resolved to blank).

**Why it happens:** one chemical concept maps to many DSSTox substance records (parent ion, each
salt, hydrates). ToxCast/invitroDB samples are registered against *specific* records. PubChem's
`name → CID → synonyms` path does not know which record ToxCast assayed.

**Spec — identifier crosswalk for the build (do this first):**
1. **Anchor on DTXSID, not CAS.** For each target, resolve to the DSSTox substance record(s) via
   EPA DSSTox / CompTox, not via PubChem synonym guessing.
   - Get candidate DTXSIDs from PubChem `xrefs/RegistryID` (source `EPA DSSTox`) **and** from
     CTD's `CTD_chemicals.tsv.gz` (`DTXSID` column, joinable by CAS/MeSH/InChIKey) as a
     cross-check — they should agree; where they don't, inspect.
2. **Pick the ToxCast-tested record explicitly.** Query bioactivity for each candidate DTXSID/CAS
   (parent *and* common salts) and keep the record that actually has assay data. Don't assume the
   parent. For a curated target list this is cheap and one-time.
3. **Persist the mapping.** Store `{name → CID, InChIKey, parent_DTXSID, toxcast_DTXSID,
   toxcast_CAS}` as a fixed table; never re-resolve at query time. (This recon's working forms are
   in `data/validation_set.csv:toxcast_cas`; the per-compound salt overrides are in
   `probes/04_toxcast_ice.py:TOXCAST_CAS`.)
4. **Validate:** any target returning 0 usable ToxCast assays is a red flag to re-check the
   salt form before concluding "no data."

### RISK 2: CTD — only curated `DirectEvidence` is evidence; inferred is noise

**Hard rule: treat a CTD chemical–disease association as evidence ONLY when `DirectEvidence`
is non-empty** (`marker/mechanism` or `therapeutic`). The empty-`DirectEvidence` "inferred"
associations are gene-network extrapolations that scale with how heavily a chemical is studied,
not with real disease linkage. **Example:** acetaminophen — a *clean negative* — shows **80
inferred** Parkinson's + **91 inferred** Alzheimer's associations purely from study volume, vs
**0 curated**. Using inferred counts would misclassify it as a positive. Curated `DirectEvidence`
gives clean class separation (8/12 positives, 0/15 negatives); inferred gives none. Likewise,
raw `CTD_chem_gene_ixns` counts are study-volume-confounded — not a mechanism discriminator.
All coverage counts in `data/validation_set.csv` use curated-only; inferred columns
(`pd_inferred`, `ad_inferred`) are retained as **context only** and never drive a grade.

---

## 1. PubChem PUG-REST — identifier resolution (the join key)

- **Base:** `https://pubchem.ncbi.nlm.nih.gov/rest/pug`
- **Auth:** none. (Distinct from NCBI E-utilities, which *do* use keys — PUG-REST does not.)
- **Shape:** `{base}/{domain}/{namespace}/{identifier}/{operation}/{output}`; output is the trailing segment (`TXT`/`CSV`/`JSON`/`SDF`).
- **Rate limits:** ≤ **5 req/s**, ≤ **400 req/min**, ≤ **300 s** cumulative processing time/min.
  Every response carries `x-throttling-control: Request Count status: Green (0%), Request Time ..., Service ...`. Parse it: slow at Yellow, pause at Red. Safe steady state = serial with ~0.2 s spacing; **batch** to stay under the running-time cap.
- **Batch:** comma-separated ids in URL, or POST with body `cid=6758,15939` (use POST beyond ~a few hundred ids / 2000 URL chars).
- **PUG-REST vs PUG-View:** use PUG-REST for the crosswalk; PUG-View (`/rest/pug_view`) is per-compound annotation only, no batch — keep it out of the bulk path.

### Working queries
```
# name -> CID
https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/rotenone/cids/TXT           -> 6758
# CAS -> CID (CAS is just a synonym; use the name namespace)
https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/4685-14-7/cids/TXT          -> 15939
# CID -> properties  (NOTE renamed props, see gotcha)
https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/6758/property/ConnectivitySMILES,SMILES,InChIKey,MolecularFormula/CSV
# CID -> DTXSID  (grep ^DTXSID from the RegistryID xref list)
https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/6758/xrefs/RegistryID/TXT    -> DTXSID6021248
# CID -> CAS  (grep ^\d{2,7}-\d{2}-\d$ from synonyms)
https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/6758/synonyms/TXT            -> 83-79-4
```

### Gotchas
- **Property rename (silent trap):** `CanonicalSMILES` → **`ConnectivitySMILES`** (2D), `IsomericSMILES` → **`SMILES`** (stereo). Old names accepted on *input* but returned CSV/JSON headers use the new names. `InChIKey`, `MolecularFormula` unchanged.
- **CID→DTXSID crosswalk** is the bridge into EPA CCTE: DTXSID lives in `xrefs/RegistryID` under source `EPA DSSTox`. The `?sourcename=` filter does **not** work server-side — grep `^DTXSID` client-side. Exactly **one** DTXSID per compound (verified). Rotenone CID 6758 → DTXSID6021248; Paraquat CID 15939 → DTXSID3034799.

---

## 2. AOP-Wiki — endorsed neuro AOP scaffold

- **SPARQL endpoint:** `https://aopwiki.rdf.bigcat-bioinformatics.org/sparql` — LIVE (Virtuoso, SPARQL 1.1), **no auth**. SNORQL UI at the base host. Graph currently holds **587 AOPs**.
- **Bulk (authoritative source XML, aopwiki.org, no key):**
  - Quarterly citable: `https://aopwiki.org/downloads/aop-wiki-xml-YYYY-MM-DD.gz` (latest **2026-07-01**)
  - Nightly: `https://aopwiki.org/downloads/aop-wiki-xml.gz` (no backups kept — archive the file you use)
  - TSV convenience (nightly): `aop_ke_mie_ao.tsv`, `aop_ke_ker.tsv`, `aop_ke_ec.tsv`
  - XSD: `https://raw.githubusercontent.com/swandle06/AopXml/2.7.0/assets/schema/current.xsd`
  - Source is **nested XML**, not RDF. aopwiki.org does not serve RDF itself.
- **Bulk (derived RDF/Turtle — what loads the SPARQL endpoint):** Zenodo concept DOI **`10.5281/zenodo.13353286`** (all versions), or `github.com/marvinm2/AOPWikiRDF` releases. **For any bulk work, load this dump into your own Fuseki/Virtuoso** rather than hammering the shared public endpoint.
- **License:** CC-BY-SA 4.0 (per-AOP `dcterms:license`). Attribution + share-alike.
- **Rate limits:** none published; shared university infrastructure — serial, low concurrency, `LIMIT`, cache. Self-host for bulk.

### RDF data model (verified predicates)
- Namespace `aopo:` = `http://aopkb.org/aop_ontology#`. AOP URIs `https://identifiers.org/aop/{id}`; events `https://identifiers.org/aop.events/{id}`.
- Classes: `aopo:AdverseOutcomePathway` (587), `aopo:KeyEvent`, `aopo:KeyEventRelationship`, `aopo:BiologicalEvent`.
- Structure: `aopo:has_molecular_initiating_event` (MIE), `aopo:has_key_event` (KE), `aopo:has_key_event_relationship` (KER), `aopo:has_adverse_outcome` (AO). MIE/KE/AO objects are all `aopo:KeyEvent`; the AO is the terminal KE.
- Event → ontology anchoring: `aopo:hasBiologicalEvent` → `aopo:hasObject`/`hasAction`/`hasProcess` → GO/PATO/MeSH/MMO terms.
- **OECD endorsement status (key field):** predicate `ncit:C25688` (`http://ncicb.nci.nih.gov/xml/owl/EVS/Thesaurus.owl#C25688`, "Status") as a plain literal. Distinct values in the graph:
  - `"WPHA/WNT Endorsed"` — **42 AOPs** (OECD Working Party endorsed)
  - `"Under Development"` — 85, `"Under Review"` — 19, remainder no status triple.

### Identifying neuro AOPs
No dedicated "neuro" flag. Two routes: (a) **controlled-vocab** — filter AO KEs by `hasBiologicalEvent` GO/MeSH terms; (b) **practical** — case-insensitive regex on AO `dc:title`. Confirmed neuro AO events include `aop.events/896` "Parkinsonian motor deficits", `1514`/`352` "Neurodegeneration", `341`/`637` "Impairment, Learning and memory", `1941` "Memory Loss". Titles are inconsistently formatted ("N/A, Neurodegeneration", mixed case) — regex case-insensitively, dedupe, and search **KE** titles too (dopaminergic-loss is often an intermediate KE, not the AO).

### Working query (tested live)
```sparql
PREFIX aopo: <http://aopkb.org/aop_ontology#>
PREFIX ncit: <http://ncicb.nci.nih.gov/xml/owl/EVS/Thesaurus.owl#>
PREFIX dc:   <http://purl.org/dc/elements/1.1/>
SELECT ?aop ?aopTitle ?ao ?aoTitle ?status WHERE {
  ?aop a aopo:AdverseOutcomePathway ; dc:title ?aopTitle ;
       aopo:has_adverse_outcome ?ao .
  ?ao dc:title ?aoTitle .
  OPTIONAL { ?aop ncit:C25688 ?status }
}
ORDER BY ?aop
```
Add `FILTER(REGEX(?aoTitle,"neuro|dopamin|parkinson|memory|learning|neurodegen","i"))` for neuro; add `FILTER(?status = "WPHA/WNT Endorsed")` for OECD-endorsed only.

### MVP anchor — CONFIRMED
- **AOP 3**: "Inhibition of the mitochondrial complex I of nigro-striatal neurons leads to parkinsonian motor deficits." URI `https://identifiers.org/aop/3`, page `https://aopwiki.org/aops/3`.
- MIE: binding of inhibitor, NADH-ubiquinone oxidoreductase (complex I). AO: KE 896 "Parkinsonian motor deficits", via dopaminergic neurodegeneration KEs.
- **OECD status: `WPHA/WNT Endorsed`.** Created 2016-11-29, modified 2025-10-04. This is exactly the endorsed MVP scaffold the demo needs.

---

## 3. EPA CCTE / CompTox — ToxCast bioactivity (**needs API key**)

- **Base:** use `https://comptox.epa.gov/ctx-api` (the ctx-python default). **Live check 2026-07-03:** the documented `https://api-ccte.epa.gov` host **did not resolve (DNS)** from our environment; the `comptox.epa.gov/ctx-api` mirror returned a clean `401 {"title":"API Header Not Found",...}` confirming the key requirement, and `/bioactivity/health` returned 200.
- **Auth:** free API key, **request via email `ccte_api@epa.gov`** (no self-service). Passed as `x-api-key` header. **Provision today.** For the recon we did **not** need it — see ICE below.
- **Rate limits:** not numerically published; clients expose a `rate_limit` param — self-throttle, prefer POST batch endpoints, small delays. Data is CC0/public-domain.

### Bioactivity endpoints (paths confirmed from USEPA/ctxR source)
| Purpose | Path |
|---|---|
| Data by chemical | `/bioactivity/data/search/by-dtxsid/{DTXSID}` |
| Data by assay | `/bioactivity/data/search/by-aeid/{aeid}` |
| Summary by assay | `/bioactivity/data/summary/search/by-aeid/{aeid}` |
| All assay annotations | `/bioactivity/assay/` |
| Annotation by assay | `/bioactivity/assay/search/by-aeid/{aeid}` |
| Health | `/bioactivity/health` |

Batch = POST variants of the by-dtxsid / by-aeid endpoints.

### Response shape & mechanism mapping
- Per hit (by-dtxsid): `dtxsid`, `aeid`, `assayComponentEndpointName`, **`hitc`** (hitcall; invitrodb v4.x = continuous 0–1, **active = `hitc >= 0.9`**), **`ac50`** (µM), `spid`, `m4id`, `top`, cytotox-burst flags.
- **Count active assays per chemical** = count records with `hitc >= 0.9` (computed client-side; no convenience endpoint).
- **Map assay → mechanism/gene** via annotation endpoint: fields `intendedTargetFamily`, `intendedTargetType`, `biologicalProcessTarget`, `gene`/`geneSymbol`, `organism`, `tissue`, `cellFormat`.
  - Mechanism themes: filter `intendedTargetFamily`/`biologicalProcessTarget` for mitochondrial toxicity / mitochondrial depolarization (membrane potential), oxidative stress; neurite/neuronal via those fields + `tissue` + endpoint-name patterns (`neurite`, `NFA`, `NHEERL`).
- Workflow: pull active hits by DTXSID → join each `aeid` to annotation → subset by mechanism.

### Client note (gotcha)
- **`ctx-python` (pip `ctx-python`, `import ctxpy`) has NO Bioactivity class yet** — only Chemical/Exposure/Hazard/ChemicalList. For ToxCast use **raw REST** (requests) or the **R `ctxR`** package (`get_bioactivity_details/summary`, `get_all_assays`, `get_annotation_by_aeid`). For this Python recon → **raw REST**.

### Bulk alternative (no key)
- invitrodb **v4.2** feeds the API (Sept 2024); latest bulk **v4.3** (Aug 2025). No v5 as of now. MySQL dump + summary/level-5 + annotation files on Figshare `https://epa.figshare.com/articles/dataset/ToxCast_Database_invitroDB_/6062623` and Clowder (edap-cluster). Loader: `github.com/USEPA/comptox-toxcast-invitrodb`. **Fallback if the key doesn't arrive in time** — the level-5 summary + assay annotation files give the same hitcall/mechanism data offline.

### Working curl
```bash
curl -s -H "x-api-key: $CCTE_KEY" -H "accept: application/json" \
  "https://api-ccte.epa.gov/bioactivity/data/search/by-dtxsid/DTXSID6021248"   # rotenone
curl -s -H "x-api-key: $CCTE_KEY" -H "accept: application/json" \
  "https://api-ccte.epa.gov/bioactivity/assay/search/by-aeid/42"               # mechanism/gene for an assay
```

---

## 3b. NICEATM ICE — no-key ToxCast substitute (invitroDBv4.2)

**This is how we got every ToxCast number in the recon, without a CCTE key.** ICE (Integrated
Chemical Environment, NIEHS/NTP) curates and re-serves invitroDB (ToxCast) data through an open
REST API. Same underlying hitcalls the CCTE API would return (`reference: "invitroDBv4.2"`).

- **Endpoint:** `GET https://ice.ntp.niehs.nih.gov/api/v1/search?chemid={CAS or DTXSID}` — no auth.
- **Rate limit:** unpublished but real — POST and bursts return **HTTP 429**; occasional
  transient non-JSON (HTML) responses under load. Throttle to ~1 req / 2.5 s, retry on 429 / non-JSON.
- **Response:** `{"endPoints": [ {assay, endpoint, value, unit, assaySource, inVitroAssayFormat,
  reference, dtxsid, substanceName, casrn, qsarReadyId, ...}, ... ]}`. One chemical can return
  thousands of records (rotenone ≈ 4,400).
- **Reading ToxCast hitcalls:** filter `reference` contains `"invitroDB"`, then rows with
  `endpoint == "Call"`. `value` ∈ {`Active`, `Inactive`, `Flag-Omit`, `QC-Omit`}.
  - **usable** = Active + Inactive; **active** = Active. `Flag-Omit`/`QC-Omit` are QC-failed —
    exclude from denominators (e.g. maneb = 698 calls but **all QC-Omit** → 0 usable).
  - AC50 / ACC come as separate `endpoint` rows (`"AC50"`, `"ACC"`) per assay.
- **Mechanism themes:** classify by assay name + `assaySource` + `inVitroAssayFormat`:
  - mitochondrial/complex-I: `CCTE_Simmons_MITO*` (Seahorse OCR/respiration), `APR_HepG2_Mito*`
  - mito membrane potential: `APR_*MitoMembPot*`, `TOX21_MMP*`
  - oxidative stress: `TOX21_ARE*` (Nrf2/ARE)
  - neuronal/neurite: `CCTE_Shafer_MEA*` (microelectrode array), `CCTE_Mundy_HCI_*` (neurite/HCI),
    `IUF_NPC*` (neural progenitor). Sources "CCTE Shafer Lab", "CCTE Mundy Lab", "Leibniz/IUF".
- **Salt-form gotcha (critical):** `chimid` accepts CAS or DTXSID, but ToxCast tested specific
  salts. Paraquat's real data (32 active) is under **paraquat dichloride CAS 1910-42-5**, not the
  parent `DTXSID3034799` (4 inactive). Query the tested form; per-compound working forms are in
  `data/validation_set.csv:toxcast_cas`.
- **Working query:**
  ```bash
  curl -s "https://ice.ntp.niehs.nih.gov/api/v1/search?chemid=83-79-4" \   # rotenone
    | jq '[.endPoints[] | select(.reference|test("invitroDB")) | select(.endpoint=="Call")]
          | group_by(.value) | map({(.[0].value): length}) | add'
  # -> {"Active":254,"Flag-Omit":128,"Inactive":256}
  ```
- ICE also carries ToxRefDB (in vivo), exposure, and physchem endpoints in the same response —
  filter by `reference` to separate sources.
- **Scope vs CCTE key:** ICE gives the **binary hitcall** (Active/Inactive) and per-assay AC50/ACC
  rows, sufficient for coverage + mechanism-theme counts (all ToxCast numbers here came from ICE).
  If the build wants **raw continuous hitcall probabilities (`hitc` 0–1) and full AC50 potency for
  confidence weighting / ranking**, use the CCTE bioactivity API (`hitc`, `ac50` fields) — that's
  the reason to still provision the `x-api-key` (requested separately). ICE for coverage; CCTE for
  quantitative confidence weighting.

## 4. CTD — chemical→gene, chemical→disease

- **Interactive tools/`downloads/`/`batchQuery.go` are now behind an anti-automation CAPTCHA wall** for non-browser clients — scripted batch queries are fragile/blocked. **Use the static bulk report files** under `https://ctdbase.org/reports/` (not captcha-gated). Data release built 2026-06-29.
- **Large-file caveat:** the 154 MB disease file repeatedly truncated / reset mid-download from a plain client and ignores `-C -` resume. Use a resilient downloader (browser, or a client tolerant of resets); verify gunzip integrity before parsing.
- **License:** free for research/education only; **citation required**, hyperlink-back for online apps, notify CTD of use. **Commercial use prohibited without written permission.** NLM-derived records must be identified as such. `https://ctdbase.org/about/legal.jsp`.

### Bulk files (each ships `.tsv.gz` / `.csv.gz` / `.xml.gz`)
| File | ~size (.tsv.gz) | Columns (verbatim headers) |
|---|---|---|
| `CTD_chemicals.tsv.gz` | 10 MB | `ChemicalName, ChemicalID, CasRN, PubChemCID, PubChemSID, DTXSID, InChIKey, Definition, ParentIDs, TreeNumbers, ParentTreeNumbers, MESHSynonyms, CTDCuratedSynonyms` |
| `CTD_chem_gene_ixns.tsv.gz` | 41 MB | `ChemicalName, ChemicalID, CasRN, GeneSymbol, GeneID, GeneForms, Organism, OrganismID, Interaction, InteractionActions, PubMedIDs` |
| `CTD_chemicals_diseases.tsv.gz` | 154 MB | `ChemicalName, ChemicalID, CasRN, DiseaseName, DiseaseID, DirectEvidence, InferenceGeneSymbol, InferenceScore, OmimIDs, PubMedIDs` |
| `CTD_genes_diseases.tsv.gz` | large | `GeneSymbol, GeneID, DiseaseName, DiseaseID, DirectEvidence, InferenceChemicalName, InferenceScore, OmimIDs, PubMedIDs` |

Curated-only subsets also exist: `CTD_curated_chemicals_diseases`, `CTD_curated_genes_diseases`, `CTD_curated_cas_nbrs`. Enrichment: `CTD_chem_go_enriched`, `CTD_chem_pathways_enriched`.

### Join keys & semantics
- `ChemicalID` = bare MeSH accession (e.g. `D012402`, **no** `MESH:` prefix); `DiseaseID` = full CURIE **with** prefix (`MESH:D010300`). Normalize prefixes when joining. `CasRN` and `DTXSID` (in `CTD_chemicals`) also available as join keys.
- **`DirectEvidence`**: `marker/mechanism` and/or `therapeutic` = curated direct association. **Empty** = inferred (via shared gene → `InferenceGeneSymbol` + `InferenceScore`, higher = stronger).
- Confirmed disease IDs: **`MESH:D010300` = Parkinson Disease**, **`MESH:D000544` = Alzheimer Disease**.
- **AOP key-event bridge:** chemical → `CTD_chem_gene_ixns` (MIE/early-KE genes) → `CTD_genes_diseases` (gene→disease, direct+inferred) → outcome (`MESH:D010300`). `InteractionActions` uses `degree^type` vocab (`increases^expression`, `decreases^activity`; vocab at `/reports/CTD_chem_gene_ixn_types.csv`).

### Working example — Rotenone (`D012402`, CAS `83-79-4`)
```bash
# curated + inferred disease rows (grep bulk file, avoids captcha)
zcat CTD_chemicals_diseases.tsv.gz | awk -F'\t' '$1=="Rotenone"'
#   direct only:            ... '$1=="Rotenone" && $6!=""'
#   Parkinson / Alzheimer:  ... '$1=="Rotenone" && ($5=="MESH:D010300"||$5=="MESH:D000544")'
# human gene interactions
zcat CTD_chem_gene_ixns.tsv.gz | awk -F'\t' '$1=="Rotenone" && $7=="Homo sapiens"'
```
Live-confirmed: Rotenone has ~20,101 total gene-interaction rows.

---

## 5. NeurotoxKb — dedicated neurotoxicity knowledge base

- **URL:** `https://cb.imsc.res.in/neurotoxkb/` — LIVE. **Version 1.0** (5 Jan 2021); no 2.0 exists. IMSc Chennai (Samal group).
- **Access: bulk download, no API, no scraping needed.** Compound pages render client-side via AJAX (a plain GET returns an empty shell), so **do not scrape** — use the bulk files. Base: `https://cb.imsc.res.in/neurotoxkb/images/Batch_Download/`
  - `NeurotoxKb_ChemicalBasicInformation.csv` — names + all identifiers (**tab-delimited despite `.csv`**)
  - `NeurotoxKb_CategoryandClassification.csv`, `NeurotoxKb_experimentalEvidence.csv`, `NeurotoxKb_PhysicochemicalProperties.csv`, `NeurotoxKb_ADMET.csv`, `NeurotoxKb_MolecularDescriptors.csv`, `NeurotoxKb_2D_Structures.sdf`, `NeurotoxKb_3D_Structures.sdf`
- **Coverage:** **475 potential neurotoxicants** (mammal-specific), curated from 835 studies. Basic-info columns: `Id  cid  cas  ctdid  Name  IUPAC  InChIKey  InChI  SMILES` — carries **PubChem CID, CAS, and CTD ID** (direct crosswalk to both PubChem and CTD). Evidence file: neurotoxic endpoints + species + MeSH + PMIDs. **No free-text mechanism/target-organ column** — infer from endpoints/MeSH/cited papers.
- **License:** **CC BY-NC-ND 4.0** — non-commercial, **no-derivatives** (redistributing a modified/derived dataset is restricted; matters for reuse). Cite Ravichandran et al., *Chemosphere* 278:130387 (2021), PMID 33838427.
- **robots.txt:** no Disallow/Crawl-delay (only Cloudflare content-signal comments asserting AI-training reservations — relevant since this feeds a model). Bulk files satisfy the need in a handful of requests.

### Target-compound presence (verified against the 475-row catalog)
- **Present:** Paraquat (15939), MPTP (1388), Maneb (3032581), Manganese (Mn 23930 + MnCl₂/MnO₂/cymantrene), Methylmercury (6860 + chloride 409301 + others), Lead (Pb 5352425 + carbonate/nitrate/acetate/triethyllead).
- **ABSENT — report loudly:** **Rotenone is not in NeurotoxKb.** **MPP+** (the active MPTP metabolite) is not in NeurotoxKb (only parent MPTP). See go-no-go for how this affects the validation set.

### Compound page (only if per-page detail needed)
- Pattern: `https://cb.imsc.res.in/neurotoxkb/chemical/CID:<PubChemCID>` (e.g. `.../CID:15939`). But data is AJAX-injected — needs a headless browser. No sitemap; the bulk CSV `cid` column is the definitive enumeration.

## 6. LINCS L1000 — transcriptomic signatures (SPIKE, no key) — poor coverage of this class

Probed as an annotation-independent discovery signal. **Result: NO-GO on coverage for this
compound set** (only 3/12 positives profiled) — see [`lincs-spike.md`](./lincs-spike.md). Access
itself is clean and key-free; logged here for reuse.

- **Coverage / metadata (no key):** GEO bulk metadata, small text files:
  - Phase I `GSE92742`: `…/geo/series/GSE92nnn/GSE92742/suppl/GSE92742_Broad_LINCS_pert_info.txt.gz`
    (cols incl. `pert_id, pert_iname, is_touchstone, inchi_key, canonical_smiles, pubchem_cid`) and
    `…_sig_info.txt.gz` (`sig_id, pert_id, pert_iname, pert_type, cell_id, pert_idose, pert_itime`).
  - Phase II `GSE70138`: `…/GSE70nnn/GSE70138/suppl/GSE70138_Broad_LINCS_{pert,sig}_info_2017-03-06.txt.gz`.
  - **Join on `inchi_key` or `pubchem_cid`.** `is_touchstone=1` = curated reference-quality
    perturbagen. Per-signature exemplar/"gold" (`is_exemplar`, `distil_ss`) is **not** in these
    files — it lives in the Level-5 GCTx column metadata (large; not needed for coverage).
- **Signature vectors (no key):** **iLINCS** REST, base `https://www.ilincs.org/api` (HTTP→HTTPS).
  - Search: `GET /SignatureMeta?filter=<URL-encoded LoopBack JSON>` — filter on
    `{"where":{"compound":"rotenone","libraryid":"LIB_5"}}` (LIB_5 = the L1000 chemical library,
    `LINCSCP_` ids; LIB_2 is legacy CMAP — avoid). Also searchable by `pubChemID`. Returns
    `signatureid`, `cellline`, `concentration`, `time`, `pubChemID`, `GeneTargets`.
  - Vector: `POST /ilincsR/downloadSignature` body `{"sigID":"LINCSCP_…"}` → 978 landmark-gene
    objects: `Name_GeneSymbol`, `Value_LogDiffExp` (the signed weight for cosine/Pearson),
    `Significance_pvalue`, `ID_geneid` (Entrez). ~150 KB/signature. No auth, no rate limit observed.
  - **Consensus per compound:** iLINCS returns one vector *per cell line × dose × time*; average
    `Value_LogDiffExp` per gene across a compound's signatures for a consensus vector.
- **Quirks / gotchas:**
  - **Coverage bias (the blocker):** L1000's library is drugs and tool compounds. Environmental
    toxicants — **pesticides, metals, MPTP/MPP+** — are largely **absent** (0 signatures by name and
    CID). Great for drug-like negatives, poor for this positive class. Confirm coverage before
    designing anything on L1000.
  - Salt-form/InChIKey mismatch applies here too (same trap as ToxCast) — cross-check by CID and
    name, not InChIKey alone.
  - Deprecated/legacy neighbours still up but not needed: L1000CDS2 (legacy), L2S2 (up/down gene-set
    search), SigCom LINCS (successor to L1000CDS2 — live but search endpoints were flaky in testing).
    CLUE.io is the canonical connectivity service but **requires a free API key**.

## 7. Discovery-axis sources (multi-axis spike) — access routes

Evaluated as candidate annotation-independent discovery axes; all NO-GO on our compound class
(see [`discovery-axes-scorecard.md`](./discovery-axes-scorecard.md)). Access routes preserved.

- **EPA HTTr** (TempO-Seq transcriptomics), no auth: AWS Open Data `s3://epa-ccte-httr/`
  (`--no-sign-request`, us-east-1). Coverage oracle = `<screen>/…_metadata_sample_info*.csv`
  (`dtxsid` col). Signatures = `res_<screen>/httr_sig_cr.bson.gz` (BSON, join via `httr_chem.bson.gz`).
  Screens MCF7/HepaRG/U-2 OS — all non-neuronal. Coverage of our positives: 4/12. See `axis-httr.md`.
- **EPA HTPP** (Cell Painting), no auth: `https://comptox.epa.gov/dashboard-api/ccdapp2/htpp/search/by-dtxsid?id=<DTXSID>`
  (query-string param, not path). Empty `_embedded.Htpp` ⇒ not screened. Feature dict `/htpp-annotations`.
  U-2 OS (non-neuronal). Coverage 4/12 positives. See `axis-htpp.md`.
- **ComptoxAI**: `bolt+ssc://bolt.comptox.ai:7687` (Memgraph, no auth) — **currently empty**; REST 502;
  no graph dump distributed; `github.com/JDRomano2/comptox_ai` ships code only (stub ML). **AlzKB**
  (the usable one): dump CYPHERL v2.0.0 at `cedars.box.com/v/alzkb-v2-0-0`, `github.com/EpistasisLab/AlzKB`,
  local Memgraph + PyKEEN. Both CTD/AOP-derived → circular vs our curated predicate. See `axis-comptoxai.md`.
- **Boltz-2** (target engagement), open MIT: `pip install boltz[cuda]` (needs ~48 GB GPU — not this Mac);
  hosted: Rowan `rowansci.com` (free tier) or Boltz API `boltz.bio` (~$0.025/pred, scriptable). Crop
  Complex I to Q-site subunits ND1/NDUFS2/NDUFS7. See `axis-boltz2.md`.
- **Structure/QSAR** & **full-ToxCast fingerprint**: no new source — RDKit on resolved SMILES, and
  cached ICE data (§3b) respectively.

## 8. Final discovery axes — neural-specific subset & Boltz-2

- **Neural-specific ToxCast subset** (Axis A) — no new source; reuses cached ICE/invitroDBv4.2 (§3b).
  The nervous-system endpoint set (95 assays) = DNT in-vitro battery + neuro-target binding:
  `assaySource ∈ {CCTE Shafer Lab (MEA network), CCTE Mundy Lab (neurite/HCI), Leibniz/IUF (NPC),
  Univ. Konstanz}` OR assay name matches MEA/neurite/neuron/NPC/synap/axon/cortical/NHEERL OR
  neuro-target regex (DAT/DRD/5HT/GABA/CHRM/glutamate/adrenergic/MAOB). Viability endpoints
  (viab/cell_number/LDH/AlamarBlue/…) are split out for the cytotox control — **excluding them
  improves separation here** (unlike the full fingerprint). Enumerated in `data/neural_specific_assays.csv`.
  For a fuller/authoritative DNT set, pull the invitrodb assay-annotation file (`intended_target_family`
  = 'neurodevelopment'/'cell morphology', tissue/organism = neural) from the invitrodb bulk release (§3).
- **Boltz-2** (Axis B) — target engagement, physics-based.
  - **Compute path:** local needs ~48 GB CUDA GPU (not this Mac). Cheap cloud: **Rowan**
    `rowansci.com` (free tier, auto-GPU, no-code) or **Boltz API** `boltz.bio` (~$0.025/pred,
    scriptable). `pip install boltz[cuda]` for self-hosted.
  - **Target source:** human Complex I **PDB 5XTD** (cryo-EM, confirmed human via RCSB). Q-site
    subunits from UniProt (no auth): **MT-ND1 P03886** (318aa), **NDUFS2 O75306** (463aa),
    **NDUFS7 O75251** (213aa) — cached `cache/boltz/qsite_subunits.json`.
  - **Cropping:** 3 full subunits = 994 aa > Boltz-2 ~768-token limit → crop ND1 to Q-cavity TM
    helices, or use NDUFS2+NDUFS7 (676aa) + pocket-conditioning on N2/Q-cavity contacts.
  - **Ready-to-run inputs:** `findings/boltz2_input_template.yaml` (YAML: 3 subunits + ligand +
    `properties: affinity`) and `data/boltz2_ligands.csv` (19 ligands: sanity pair + 12 pos + 6 adv).
    Outputs to rank on: `affinity_probability_binary`, `affinity_pred_value`. Caveat: affinity head
    ignores Fe-S/FMN cofactors + membrane → relative ranking only, meaningful for organic Q-site-class
    ligands (rotenone/deguelin), not metals/MPP+.

## 9. Enrichment axes — access routes

Evidence-enrichment axes for the validated engine (value-per-effort, partial coverage OK). See
[`enrichment-scorecard.md`](./enrichment-scorecard.md). Adopt top-3 + BBB gate; skip PrimeKG/Hetionet.

- **Brain/mito grounding** (ADOPT #1), no auth:
  - **MitoCarta3.0** — `https://personal.broadinstitute.org/scalvo/MitoCarta3.0/Human.MitoCarta3.0.xls`
    (1,136 mito genes; sheet "A Human MitoCarta3.0"; `MitoCarta3.0_MitoPathways` col — match `Complex I`
    with a word-boundary regex to exclude Complex II/III/IV). 66 CI genes → `data/mitocarta_complexI.csv`.
  - **Kamath 2022 SN snRNA-seq** — Broad Single Cell Portal **SCP1768** (snRNA) / **SCP1769** (Slide-seq),
    GEO **GSE178265**; published marker/DE supplementary tables (no raw processing). Gene sets →
    `data/brain_cell_genesets.csv`. Cell-type dichotomy cite: Bryois 2020 Nat Genet.
- **FAERS** (ADOPT #2), no key: `https://api.fda.gov/drug/event.json` (240/min, 1000/day unauth;
  key raises limits). `search=patient.drug.openfda.substance_name:"X" AND <MedDRA cluster>` with
  `limit=0` → `meta.results.total` for 2×2 ROR. Reusable probe: `probes/axes/faers_pv.py`.
- **Human epidemiology** (ADOPT #3): **no structured API** — literature-curation / in-window Claude
  Science extraction. Locate via PubMed/Europe PMC; extract OR+CI from meta-analysis full text.
  Curated anchors → `data/epidemiology_coverage.csv`.
- **BBB** (adopt as gate): **B3DB** `github.com/theochem/B3DB` → `B3DB/B3DB_classification.tsv`
  (logBB + BBB±, no auth) for ground-truth; RDKit **BOILED-Egg** (TPSA≤79 & MolLogP∈[0.4,6]) for
  universal coverage. EPA **HTTK** R lib (`Css,brain`) is the DTXSID-keyed option (needs R; deferred).
- **PrimeKG / Hetionet** (skip for this class): PrimeKG Harvard Dataverse `10.7910/DVN/IXA7BM` (`kg.csv`)
  or PyTDC; now superseded by **OptimusKG** (optimuskg.ai). Hetionet `hetio/hetionet` + `neo4j.het.io`.
  Both DrugBank-keyed → ~1/12 environmental positives covered.
