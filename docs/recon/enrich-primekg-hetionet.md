# Enrichment Axis: PrimeKG / Hetionet (mechanism-grounding substrate)

**Recommendation: SKIP for this compound class** (optional downstream gene/pathway scaffold at most).
Drug-skewed — covers the negatives we care least about, misses the environmental positives.

- **Coverage — inverted vs our interest:**
  - **PrimeKG** (~129K nodes, 4.05M edges, DrugBank-keyed drug nodes): **~1/12 positives** are drug
    nodes (rotenone = DB11457; paraquat marginal; pesticides/metals/MPTP/MPP+/6-OHDA absent) vs
    **~10–13/15 negatives** (mostly approved drugs).
  - **Hetionet** (47K nodes; only **1,552 approved-drug Compound nodes**): **~1/12 positives**,
    ~10–12/15 negatives. Worse absolute compound coverage.
- **Not a net upgrade over CTD + AOP-Wiki for our class.** CTD is chemical-first (MeSH/CAS-keyed) and
  already grounds **all 12** positives with chemical→gene/disease/pathway associations; AOP-Wiki gives
  the causal MIE→KE→AO chain these association-KGs don't encode. On environmental neurotoxicants CTD's
  coverage is ~10× better. What PrimeKG/Hetionet add is drug-repurposing structure (Compound-treats-
  Disease, pharmacologic class, side effects) — largely irrelevant here, benefiting the drug-like
  negatives only.
- **The one honest upside:** their dense Gene↔Pathway↔BP↔Disease backbone is a clean gene-network
  *scaffold* reachable **after** a CTD chemical→gene resolution — a downstream enrichment substrate,
  not a chemical entry point. For that role PrimeKG > Hetionet.
- **Access:** PrimeKG via Harvard Dataverse `10.7910/DVN/IXA7BM` (`kg.csv`, no auth) or PyTDC
  (`from tdc.resource import PrimeKG`); now **superseded by OptimusKG** (optimuskg.ai). Hetionet via
  `hetio/hetionet` (JSON/Neo4j, no auth) + live `neo4j.het.io`. **Effort: LOW to load; MEDIUM real
  cost is ID-bridging** — 11/12 positives have no DrugBank node to map to, which is unavoidable.
