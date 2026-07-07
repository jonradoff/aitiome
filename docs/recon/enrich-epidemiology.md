# Enrichment Axis: Human epidemiology (PD/AD risk)

**Recommendation: ADOPT #3.** The human-observational evidence tier — orthogonal to both curated-DB
annotation and in-vitro assay. **Literature-curation, not an API** (an in-window Claude Science
extraction task). Data: `data/epidemiology_coverage.csv`.

- **Coverage:** ~8/12 positives carry quantified published PD risk estimates; the rest are
  causal-but-not-epidemiological (MPTP/MPP+) or pure lab tools (deguelin, 6-OHDA).

| Compound | PD risk (published) | evidence type |
|---|---|---|
| rotenone | OR ~2.5 (Tanner 2011 FAME, EHP) | quantified-epi |
| paraquat | OR ~2–2.5 (Tanner 2011; Pezzoli & Cereda 2013 meta) | quantified-epi |
| maneb | OR ~1.75 (→2–4 combined; Costello 2009 AJE) | quantified-epi |
| lead acetate | elevated w/ bone lead (Weisskopf 2010 AJE) | quantified-epi |
| manganese | manganism/parkinsonism, occupational (Racette) | quantified-epi (figure uncertain) |
| chlorpyrifos | elevated (OP class; Costello/Wang) | quantified-epi (class-level) |
| dieldrin | elevated in PD brain (Fleming 1994 Ann Neurol) | quantified-epi (figure uncertain) |
| methylmercury | inconsistent PD associations | quantified-epi (weak) |
| MPTP / MPP+ | causal parkinsonism (Langston 1983 Science) | qualitative-causal (no OR) |
| deguelin, 6-OHDA | none — lab tools | lab-tool-no-epi |

- **No structured/API source carries quantified human ORs.** CTD is qualitative (DirectEvidence, no
  effect sizes); EPA/ToxCast is assay; openFDA is drug pharmacovigilance (different modality). The
  numbers live only in meta-analysis/cohort paper text/tables → **in-window literature extraction**,
  not a pull. PubMed/Europe PMC locates the papers; the OR+CI still needs reading the full text.
- **Orthogonality:** confirmed — human population risk with quantified magnitude/direction, distinct
  from mechanism (assay) and curation (CTD). The epidemiological validation layer above mechanism.
- **Effort: LOW–MEDIUM.** ~5 anchors (rotenone, paraquat, maneb, lead, dieldrin) are lookup-trivial;
  ~3 (manganese, methylmercury, chlorpyrifos-specific) need a figure-extraction pass; 2 lab tools and
  MPTP-as-causal are tags. **Do not hard-code the uncertain ORs** — extract or tag "published
  association, figure uncertain."
