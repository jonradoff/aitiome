# Axis: ComptoxAI + Alzheimer's Knowledge Base (KG link prediction)

**Verdict: NO-GO** — blocked operationally *and* circular against our gold standard.

- **Gate 1 — nodes present, but:** ComptoxAI keys Chemical nodes on DTXSID over ~780k DSSTox
  chemicals, so all 27 are almost certainly nodes. But the **public graph is currently empty**
  (`bolt+ssc://bolt.comptox.ai:7687` connects with no auth; `SHOW STORAGE INFO` → vertex_count 0),
  the REST API is 502, and **no graph dump / RDF export is distributed** (only OWL schema; a bulk
  export is "coming soon"). Using it means standing up your own Memgraph and rebuilding from 12
  sources — not a short spike.
- **Gate 2 — feasibility NO-GO:** no pretrained embeddings ship (neither ComptoxAI nor AlzKB release
  weights). ComptoxAI's ML layer is a **stub** (`comptox_ai/ml/graphsage.py` unimplemented; author
  comment: link-pred code "isn't working anyway"). AlzKB is the more tractable of the two — it ships
  a downloadable CYPHERL dump (v2.0.0, `cedars.box.com/v/alzkb-v2-0-0`) loadable into local Memgraph
  + PyKEEN — but it's **drug-centric** (DrugBank-keyed), so the lab-tox positives (MPP+, MPTP,
  paraquat, maneb, deguelin, 6-OHDA) are likely absent/edge-poor. Multi-day build either way.
- **Circularity (the deeper kill):** ComptoxAI's chemical→gene/disease edges are **CTD-derived** and
  AOP edges **AOP-Wiki-derived** — the *same curated tables* as our zero-error recovery predicate
  (CTD DirectEvidence + AOP stressor). "Recovering" a held-out chemical→PD edge largely re-derives
  the curation we're trying to be independent of. Genuinely independent signal would require masking
  *all* curated edges per compound and recovering from topology alone — exactly what the missing ML
  layer doesn't support.

**Access notes:** `github.com/JDRomano2/comptox_ai` (code only, no bundled data). AlzKB:
`github.com/EpistasisLab/AlzKB`, dump at `cedars.box.com/v/alzkb-v2-0-0`. Both migrated Neo4j→Memgraph.
