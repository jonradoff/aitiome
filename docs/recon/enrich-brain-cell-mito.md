# Enrichment Axis: Brain single-cell + mitochondrial grounding

**Recommendation: ADOPT #1.** Grounds the *endorsed* AOP-3 at gene/cell-type level. Universal (not
per-compound), low effort, high orthogonality, strong visual. Data: `data/mitocarta_complexI.csv`,
`data/brain_cell_genesets.csv`.

## (a) MitoCarta3.0 — Complex-I grounding for the MIE

- Source: Broad **MitoCarta3.0** (`Human.MitoCarta3.0.xls`, 1,136 human mitochondrial genes; cached).
- Extracted **66 Complex-I genes** (MitoPathways `Complex I`, word-boundary matched to exclude
  Complex II/III/IV): **44 structural** (NDUF*/MT-ND*) + 22 assembly factors. **All 6 AOP-3 Q-site
  core subunits present**: MT-ND1, NDUFS2, NDUFS3, NDUFS7, NDUFS8, NDUFV1.
- Use: ground AOP-3's MIE ("binding of inhibitor, complex I") to the concrete gene set rotenone/
  MPP+/deguelin act on — turns the abstract MIE into a named subunit list + submito-localization.

## (b) Substantia-nigra snRNA-seq — DA-neuron vulnerability grounding for the AO

- Source: **Kamath et al. 2022, Nat Neurosci** (SCP1768/SCP1769, GEO GSE178265). Published gene lists
  / SCP annotations — no raw-data processing needed.
- **Vulnerable DA-neuron population = SOX6⁺/AGTR1⁺** (ventral SNpc, selectively degenerates in PD);
  resistant = CALB1⁺. Marker sets in `data/brain_cell_genesets.csv` (DA identity: TH, SLC6A3,
  SLC18A2, NR4A2, DDC, ALDH1A1, KCNJ6; vulnerable: SOX6, AGTR1, DDT, GFRA2, PART1).
- Use: ground AOP-3's AO ("degeneration of nigrostriatal DA neurons") to the specific vulnerable
  cell population — connects the pathway endpoint to a real, imaged human cell type.
  *Accuracy flags:* confirm SCP1768/1769 on the live page (a scrape showed a spurious "SCP374");
  pull the 3 unconfirmed CALB1 subtype names from the supplementary table, not memory.

## (c) PD-DA-mito vs AD-microglia cell-type dichotomy

- Source: **Bryois et al. 2020, Nat Genet** (MAGMA/LDSC cell-type enrichment) + Kamath 2022.
- **PD heritability → DA/monoaminergic neurons + mitochondrial/lysosomal-protein-folding** (SNCA,
  PRKN, PINK1, PARK7, LRRK2, VPS35, GBA1, ATP13A2); **AD heritability → microglia/immune** (TREM2,
  TYROBP, CD33, C1Q, AIF1/IBA1, CX3CR1, APOE). Both gene sets in `data/brain_cell_genesets.csv`.
- Use: represent *why* PD and AD are different mechanistic stories — a citable, visual cell-type
  contrast that distinguishes the neurodegeneration axes the engine reasons over.

**Orthogonality:** neither curated chemical-DB annotation nor in-vitro assay — this is independent
mechanistic/anatomical grounding of the pathway endpoints. **Effort: LOW** (gene symbols + SCP
annotations are download-ready; the only work is pulling full supplementary marker tables).
