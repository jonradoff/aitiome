# AD validation set — candidates (from real curated CTD‑AD DirectEvidence + AOP stressors)

> Built with the **same rigor and provenance as PD**: the diagnostic leg is real curated CTD
> `DirectEvidence (marker/mechanism)` for **MeSH D000544 (Alzheimer Disease)**, pulled from the CTD
> bulk file (`scripts/pull-ctd-ad.sh`; provenance in `docs/research/ctd_ad_directevidence.tsv` —
> 132 AD DirectEvidence rows, 50 marker/mechanism). The AOP leg is registered stressor status on an
> AD‑relevant AOP. **Not yet locked** — identities (DTXSID/salt‑form) need resolution and a Claude
> Science verification pass, exactly as the honesty discipline requires. This is the Gate‑1 artifact.

## ⚑ Decision point for Jon (a real rigor finding, surfaced not worked around)

Applying PD's exact predicate to AD exposed something PD never hit: **CTD's AD `marker/mechanism`
DirectEvidence is heavy with *endogenous metabolites and ROS*, not just environmental xenobiotics** —
e.g. **Glucose (50‑99‑7)**, 24/27‑hydroxycholesterol, homocysteine, kynurenine, serotonin, ceramides,
hydrogen peroxide, nitric oxide, reactive oxygen species. These are curated because glucose
hypometabolism, oxysterols, oxidative stress etc. are *mechanistically* in AD — but they are **not
environmental exposures**, and one of them (**D‑glucose**) is an *inert negative* in our PD set.

The strict predicate would therefore call **D‑glucose AD‑positive**. That is not wrong (the curated
association is real) but it is **out of the benchmark's scope**, which — like PD — is **environmental
xenobiotic exposures**, not endogenous biology. Proposed rule (applied equally to both diseases, so it
stays "equivalent rigor"): **benchmark positives are restricted to xenobiotic/exogenous chemicals;
endogenous metabolites/ROS with curated evidence are documented and excluded from the eval set, not
silently dropped.** The engine's per‑compound predicate can still surface the curated association for
an endogenous molecule (honest), but it won't count as a benchmark positive. *Flagging because it's a
scope decision adjacent to the recovery‑rule spec — confirm the rule or adjust.*

## Positives — environmental xenobiotics with a curated AD basis (target 12, parity with PD)

| # | name | CAS | AD basis | tier (proposed) | note / evidence | verify |
|---|---|---|---|---|---|---|
| 1 | **p,p′‑DDE** | 72-55-9 | CTD marker/mechanism | curated_anchored_ad | DDT metabolite; strongest env‑AD assoc (Richardson 2014 *JAMA Neurol*); APOE‑ε4 interaction | DTXSID + salt |
| 2 | **cadmium chloride** | 10108-64-2 | CTD marker/mechanism (Cadmium) | curated_anchored_ad | AD‑mortality HR 3.83 (Min 2016) | salt‑form vs CTD "Cadmium" |
| 3 | **cupric chloride** | 7447-39-4 | CTD marker/mechanism (Copper / cupric chloride) | curated_anchored_ad | free‑Cu AD assoc (Squitti 2014) | salt‑form |
| 4 | **aluminum chloride** | 7446-70-0 | CTD marker/mechanism (Aluminum / AlCl₃) | curated_anchored_ad | **CONTESTED epidemiology** but curated marker/mechanism — honest hard case, tier notes the dispute | flag contested |
| 5 | **zinc chloride** | 7646-85-7 | CTD marker/mechanism (Zinc) | curated_anchored_ad | metal dyshomeostasis in AD | salt‑form |
| 6 | **ferrous sulfate** | 7720-78-7 | CTD marker/mechanism (Iron) | curated_anchored_ad | iron accumulation AD (KE‑relevant) | salt‑form |
| 7 | **ozone** | 10028-15-6 | CTD marker/mechanism | curated_anchored_ad | air pollutant (discrete O₃) | — |
| 8 | **acrolein** | 107-02-8 | CTD marker/mechanism | curated_anchored_ad | environmental aldehyde / tobacco smoke; lipid‑peroxidation | — |
| 9 | **sodium fluoride** | 7681-49-4 | CTD marker/mechanism (Fluorides / NaF) | curated_anchored_ad | fluoride neurotoxicity | — |
| 10 | **lead acetate** | 301-04-2 | **AOP‑12 registered stressor** (NOT in CTD‑AD) | aop_anchored_ad | AOP‑12 (endorsed) stressor; cohort AD HR≈3 (Wang 2026); **also a PD positive → cross‑disease** | confirm AOP‑12 stressor |
| 11 | **streptozocin** | 18883-66-4 | CTD marker/mechanism | model_toxin_ad | ICV‑STZ AD induction model — the "MPTP of AD" (lab toxin, curated) | — |
| 12 | **kainic acid** | 487-79-6 | CTD marker/mechanism | curated_anchored_ad | excitotoxic; AOP‑48 (endorsed excitotoxicity) relevant | — |

*Cross‑disease is a feature:* **lead** is positive for both PD and AD by different legs (PD curated /
AD AOP‑12) — a clean demo of the OR‑predicate generalizing.

## Negatives / adversarial decoys (assay‑active or bioactive, NOT curated AD causes)

| name | CAS | why it could fool an activity model | why NOT a curated AD cause |
|---|---|---|---|
| **curcumin** | 458-37-7 | potent Aβ‑aggregation inhibitor (ThT); binds plaques | dietary; aggregation *inhibitor*/PAINS; no CTD‑AD marker/mechanism |
| **EGCG** | 989-51-5 | strongest polyphenol Aβ inhibitor; remodels fibrils | dietary; PAINS/assay‑interference; not curated |
| **resveratrol** | 501-36-0 | Aβ modulator; broadly redox‑active | dietary "protectant"; not curated |
| **donepezil** | 120014-06-4 | strong selective AChE inhibition (the canonical AD readout) | FDA AD **treatment** (therapeutic, not marker/mechanism) |
| **galantamine** | 357-70-0 | AChE inhibition + nicotinic modulation | AD **treatment** |
| **methylene blue** | 61-73-4 | prototype tau‑aggregation inhibitor | AD therapeutic candidate (LMTX) |
| simvastatin | 79902-63-9 | bioactive; mitochondrial/metabolic | AD prevention *candidate*; **reused from PD decoys** (parallel benchmarks) |
| diethyl phthalate | 84-66-2 | heavily assayed plasticizer | no AD DirectEvidence; **reused clean negative** |
| sodium chloride | 7647-14-5 | inert | inert reference **(reused)** |

**Dropped as a decoy after checking the data:** **lithium** (7439‑93‑2) — the facet‑5 scan proposed it
as a GSK3β‑inhibitor decoy, but CTD lists it as AD `marker/mechanism`, so under our predicate it is
*curated‑associated*, not a clean decoy. Honest outcome of checking rather than assuming — excluded.

## Endogenous / out‑of‑scope curated AD molecules (documented, excluded from the eval set)

Curated AD `marker/mechanism` in CTD but **not environmental xenobiotics** (endogenous biology):
**D‑glucose** (also our PD inert negative), 24‑/27‑hydroxycholesterol, homocysteine, kynurenine,
serotonin, ceramides, desmosterol, hydrogen peroxide, nitric oxide, reactive oxygen species,
folic acid, vitamin B12. Excluded per the scope rule above; listed for transparency.

## To lock this set (Claude Science verification pass)
1. Resolve each identity DTXSID‑first, salt‑form‑correct (the paraquat‑dichloride discipline).
2. Confirm each positive's CTD‑AD `marker/mechanism` row (provenance file) and lead's AOP‑12 stressor status.
3. Confirm decoys have **no** AD `marker/mechanism` (donepezil/galantamine = therapeutic only).
4. Assign final tiers; promote to `services/aitio/data/validation_set_ad.csv`.
