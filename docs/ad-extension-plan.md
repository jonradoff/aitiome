# Plan: Extending Aitiome to Alzheimer's (AD) — a second, honestly-tiered disease axis

> Status: **PROPOSED — awaiting Jon's sign-off at the gates in §8.** Do not implement past the plan.
> Rests on recon findings (`docs/recon/aop_neuro.csv`, `recon-learnings-summary.md`,
> `axis-comptoxai.md`) — it does not contradict them; it acts on the documented "AD is a
> scaffold extension" note (`CLAUDE.md`, `judge-qa.md:220`) at Jon's explicit direction.

## 1. The fact that shapes the whole plan (revised after the Day‑0 deep research)

Parkinson's is anchored on **AOP‑3, a WPHA/WNT‑endorsed AOP** that terminates in parkinsonian
motor deficits, with a complete MIE→KE→AO chain and registered chemical stressors. That is why the
PD arm can show clean recovery + a sharp adversarial falsification.

**AD's footing is weaker than PD's but stronger than I first assumed** (the Day‑0 scan corrected my
earlier "no endorsed AD AOP" claim — see `docs/research/ad-aop-literature-scan.md`, "Revision flag"):

| AOP | Title | Endorsed? | Fit for environmental AD |
|---|---|---|---|
| **12** | NMDAR antagonism (dev) → **neurodegeneration + memory impairment in aging** | ✅ **Endorsed** | Endorsed narrative explicitly invokes **amyloid + tau + neuroinflammation**; registered stressor **lead** — the strongest *endorsed* AD‑relevant anchor |
| **48** | Glutamate excitotoxicity → neuronal cell death → L&M impairment (adult) | ✅ **Endorsed** | Endorsed adult memory AO; stressors domoic acid, glufosinate |
| **429** | Cholesterol/glucose dysmetabolism → Tau → memory loss (**sporadic AD**) | ❌ proposal | The one *named* AD AOP + a catalog of 60+ environmental MIE plug‑ins (Tsamou) — non‑endorsed |
| **475** | iGluR binding → drebrin loss → L&M impairment | ❌ Under Dev | AD‑specific overlay; joins 429 at KE‑1944/386 |

**The honest nuances that keep the tiering:** (a) **no** AOP has amyloid/tau as its *terminal* adverse
outcome — AD‑specificity comes from the non‑endorsed 429/475 overlay + curated CTD‑AD DirectEvidence;
(b) AOP‑12's MIE is a *developmental* NMDAR event manifesting as aging neurodegeneration; (c) the
environmental→AD causal literature is genuinely thinner and more contested than PD's. **The
load‑bearing cross‑disease bridge is KE‑188 (neuroinflammation)** — the *identical* node in PD's AOP‑3
(188↔890 loop) and AD's AOP‑429. Mitochondrial dysfunction is an honest *gap*, not a bridge (PD uses
KE‑177; AOP‑429 uses a separate placeholder KE‑1816 "EMPTY"; cf. Jaylet 2024, *Front. Toxicol.*).

Net: AD's *floor* is now "an **endorsed** aging‑neurodegeneration/memory AOP with a registered chemical
stressor," not "nothing endorsed." The arm is still tiered below PD (no endorsed amyloid/tau terminus),
but by calibration — not by being less‑built.

### What "as serious as PD" means here (the governing principle)

AD gets a **first‑class, equal‑rigor, equal‑polish arm** — same engine depth, same validation harness,
same falsification treatment, same curation effort, same hero quality. It is **not** a "one more thing"
feature bolted on. **Effort parity: yes, absolutely.**

The one thing we do **not** fake is **evidence parity**. PD genuinely has an endorsed AOP and a thicker
causal literature; AD (today) does not. Aitiome's entire reason to exist is *honest calibration*, so the
AD arm reflects that reality in its **confidence tier and endorsement badge** — not by being smaller or
less‑built, but by being **accurately labeled**. A judge who probes AD should find a fully‑engineered,
rigorously‑validated arm whose confidence is *calibrated down where the evidence is genuinely thinner* —
that is the product working as designed, not a weakness.

So the AD win condition is a strong claim, not a hedge: **build the fullest, most rigorous AD arm the
real evidence supports, with the same machinery and polish as PD, and let calibrated confidence — not
reduced effort — carry the honesty.** Manufacturing evidence to force a cosmetic "12/12" for AD would
*violate* the core pillar and mechanism‑first judges would catch it; a serious, well‑built, honestly‑
calibrated AD arm is the stronger move. The PD/AD asymmetry, surfaced explicitly, is itself a feature.

## 2. Scientific scaffold for AD (a full, multi‑pathway spine — built, not sketched)

To take AD seriously we build the **strongest converging scaffold the evidence supports** (Day‑0 scan),
anchored on the **endorsed** AOPs where they exist and marking endorsement status explicitly per edge:

```
environmental stressor (MIE — e.g. lead, DDE, cadmium)
  → [ENDORSED spine]  AOP‑12 (neurodegeneration + memory in aging; registered stressor: lead)
                      AOP‑48 (adult glutamate excitotoxicity → neuronal death → memory impairment)
  → neuroinflammation ── KE‑188 ── the IDENTICAL node shared with PD AOP‑3 (the cross‑disease bridge)
      grounded in AD‑microglia biology:  TREM2 / APOE / INPP5D → NLRP3 → IL1B
  → [NON‑ENDORSED overlay]  AOP‑429 (Tau, sporadic AD) + AOP‑475 (drebrin / glutamate)
      join the spine at KE‑1944 (synaptic dysfunction) / KE‑386 (decreased neuronal network function)
  → memory loss (AO)

  honest GAP (shown, not hidden): mitochondrial dysfunction is KE‑177 in PD but a placeholder
  KE‑1816 "EMPTY" in AOP‑429 — NOT a linked node (cf. Jaylet 2024, Front. Toxicol.). Negative‑map material.
```

Endorsement is a **per‑edge signal**: the AOP‑12/48 spine renders `endorsed`; the 429/475 overlay renders
`non‑endorsed (exploratory)`; the mito discontinuity renders as an explicit `unlinked` lead. Terminal hero
frame: **AD‑microglia** (TREM2/APOE/INPP5D…), the recon's "PD→DA‑neuron‑mito vs AD→microglia" dichotomy
made visual. Every AD result carries the endorsement/confidence badge; the asymmetry is shown, never hidden.

## 3. Recovery predicate — generalized, discipline preserved

Today (`services/aitio/recovery.go`): `positive ⇔ PDDirect>0 OR len(AOPStressorOf)>0`.

Generalize to per‑disease, keeping curated=diagnostic / assay=anti‑diagnostic **unchanged**:

```
positive_for(D) ⇔ ( curated CTD DirectEvidence for D's MeSH, marker/mechanism )
                  OR ( registered stressor of an AOP whose AO ∈ D's outcome set )

PD:  MeSH D010300 ; AOPs {3, 464, 587–589, 593, ...}    (parkinsonian motor deficits)
AD:  MeSH D000544 ; AOPs {12, 48 (ENDORSED), 429, 475}  (aging neurodegen/memory endorsed; Tau/amyloid overlay non‑endorsed)
```

- A compound gets an **independent verdict per disease** (positive for PD, AD, both, or neither).
- **Confidence tier folds in scaffold endorsement.** An AD positive is capped below the PD ceiling —
  e.g. AD max tier = `exploratory‑curated`, never `endorsed‑anchored`. This is enforced in code.
- **Circularity is weaker for AD** (thin AOP leg ⇒ AD recovery leans mostly on CTD‑AD alone). The
  source‑independence ablation will *show* this honestly (AD: CTD‑alone ≈ union), rather than
  claiming the PD "two independent curations converge" result for AD.

## 4. Data to add / curate (with sources and honesty flags)

| # | Asset | What | Source | Effort | Load‑bearing? |
|---|---|---|---|---|---|
| 1 | **CTD AD DirectEvidence** (`ad_direct`) | Real curated marker/mechanism DirectEvidence counts for MeSH D000544 (current column is a placeholder) | CTD `CTD_chemicals_diseases.tsv`, DirectEvidence only | Med | **Yes — the AD diagnostic leg** |
| 2 | **AD‑AOP stressors** | Registered stressors of AOP‑429/475 | AOP‑Wiki | Low | Yes (likely sparse — honest if empty) |
| 3 | **AD validation set** | Positives (environmental, curated AD DirectEvidence) + negatives + AD decoys, with explicit N + tiers | curate CLI + Claude Science verify | Med‑High | **Yes — the spine of the AD claim** |
| 4 | **AD‑microglia geneset** | Add TREM2, APOE, MS4A4A/6A, PLCG2, INPP5D, ABCA7, BIN1, CD33, SPI1, CR1 to `brain_cell_genesets.csv` (currently PD‑only) | AD GWAS microglial loci (Bryois/Marioni) | Low | Yes — grounds AO + hero frame |
| 5 | **AD mechanistic geneset** | APP, MAPT, PSEN1/2, BACE1, GSK3B; neuroinflammation NLRP3/TNF — a MitoCarta analog for AD | curated | Low‑Med | Optional (strengthens MIE/KE grounding) |
| 6 | **AD epidemiology** | Add `ad_risk` rows to `epidemiology_coverage.csv` (PD‑only today) | Claude Science curation (e.g. DDE/DDT — Richardson 2014 *JAMA Neurol*; lead; solvents), explicit uncertainty | Low‑Med | Corroboration tier |
| 7 | **AlzKB (display‑only)** | External KG context, **never** a recovery gate | recon `axis-comptoxai.md` (marked circular/coverage‑killed) | Low | No — grounding/context only |

**Candidate AD positives to curate (verify each — do NOT assume):** DDT/DDE, lead, methylmercury,
manganese, certain solvents (e.g. TCE), possibly cadmium/copper/aluminum (contested). **Curate the full
CTD‑AD DirectEvidence environmental list — take as many as the evidence genuinely supports**; do not
pre‑cap. The set may honestly come out smaller than PD's 12, and that is fine — N is reported as the
calibrated truth, not padded. Discrete‑chemical only (exclude PM2.5/air‑pollution mixtures as
non‑chemicals, note them as context).
**AD decoys:** compounds active in in‑vitro tau/amyloid‑aggregation or metabolic assays but lacking
curated AD evidence — the AD analog of the mito‑active PD decoys.

**Guardrail:** therapeutic‑only AD DirectEvidence (e.g. an anti‑amyloid drug) is **not** a positive —
recovery uses marker/mechanism evidence, as with PD. Unverified curate drafts → hypothesis, never a call.

## 5. Engine / contract changes (additive, PD frozen)

- **contract → v1.2.0** (additive). Add `Disease` enum; add `ADDirect int`, `ADAOPStressorOf []string`
  to `Compound`; give `CompoundResult` a per‑disease result map (or `PD`/`AD` decisions) each with its
  own `ConfidenceTier` + `ScaffoldEndorsed bool`. New fixtures; keep existing PD fixtures byte‑stable.
- **service** — `decide(c, disease)`, `RunValidation(disease)`, `Benchmark(disease)`,
  `SourceAblation(disease)`. `Assess` returns both diseases. Load an AD scaffold subset + AD validation
  rows. **Regression test: PD outputs are byte‑identical before/after** (protect the core).
- **HTTP/MCP** — add optional `disease` param (default `pd` for back‑compat) to assess / validation /
  benchmark / pathway / sources tools. `assess_curated` gains a disease field.
- **Falsification** — per disease. If AD positive N is too small for a meaningful AUROC, **report N and
  say "underpowered"** rather than presenting a weak AUROC as a result.

## 6. UI separation (PD vs AD) — the core design ask

**Principles:** PD stays the default headline; AD is a clearly‑labeled second axis with a visible
lower‑confidence/endorsement tier; a judge can never mistake an AD call for a PD call.

1. **Global disease control** — a segmented toggle in the header: `Parkinson's · Alzheimer's`
   (PD default), persisted in the URL (`?disease=ad`). Switching re‑parameterizes the hero spine +
   terminal frame, validation board, falsification, discovery map, and the sources subset.
2. **Per‑compound dual verdict** — on a resolved compound, always show **both** verdicts as two tiles:
   `PD: positive · endorsed‑anchored` / `AD: negative · exploratory`. A chemical can drive one, both,
   or neither — showing both is the scientifically honest view and prevents cross‑disease confusion.
3. **Endorsement / confidence badges (the AD honesty centerpiece)** — an explicit badge + one‑line
   legend contrasting `OECD‑endorsed AOP` (PD) vs `non‑endorsed scaffold — exploratory` (AD). This is
   the single most important AD‑specific UI element; it converts the asymmetry into credibility.
4. **Hero — two variants, one engine.** Reuse the shader/particle/edge system; swap (a) the node graph
   to the AD spine, (b) the terminal geneset to **AD‑microglia** (new set #4), (c) an accent (PD teal →
   AD amber). Motion identical; only the data differs. Fallback if Day‑5 time slips: a static AD
   terminal frame instead of the full animated cascade — AD still ships on engine+UI+validation.
5. **Per‑disease boards** — validation, falsification, discovery, sources each reflect the selected
   disease; AD panels **show smaller N / weaker separation honestly** (or an explicit "underpowered"
   state), never faked parity with PD.

## 7. Six‑day timeline — gated, PD never regresses, runnable each day

| Day | Focus | Deliverable / gate |
|---|---|---|
| **0** | **Deep‑research step (added per Jon 2026‑07‑08)** | A serious re‑interrogation of the AD literature w.r.t. AOPs + exposome data (§11), to find support for expanding the scaffold **beyond** AOP‑429/475 before we lock it. Synthesis → `docs/research/ad-aop-literature-scan.md`. |
| **1** | Scaffold + data spec | ADR (`docs/decisions/0005-ad-axis.md`); AD spine finalized (§2, informed by Day 0); AD validation *candidate* CSV (unverified, via curate CLI); AD‑microglia geneset added. **Gate 1 review.** |
| **2** | Engine generalization | contract v1.2.0 + `decide/validation/benchmark(disease)`; **PD regression green (byte‑identical)**; AD runs on available data. |
| **3** | Claude Science verification | Verify AD positives' CTD AD DirectEvidence + AOP status; lock AD set with explicit N + tiers; honest AD confusion matrix. **Gate 2 review** (is the AD set strong enough to ship?). |
| **4** | UI separation | Disease toggle, dual‑verdict tiles, endorsement badges, per‑disease boards; PD default unchanged. |
| **5** | AD hero | Microglia terminal frame + AD cascade graph + accent; motion parity; polish (or static‑frame fallback). |
| **6** | Integration + honesty pass | Deck (AD as honest second axis + the endorsement‑asymmetry slide), README, `learnings.md`, redeploy + verify. Buffer. |

## 8. Decisions needing sign-off (the gates)

Per Jon (2026‑07‑08): AD is a **first‑class arm, equal rigor and polish to PD** — honesty lives in
*calibration*, not reduced effort. Recommendations updated accordingly.

1. **AD scope ambition** — *(rec)* **full first‑class second arm, equal engineering + polish to PD**;
   honesty carried by calibrated confidence/endorsement badges, not by building less. Alt: token
   feature (**rejected** — contradicts Jon's directive).
2. **AD spine** — *(rec)* **full converging scaffold** (endorsed KEs 48/17 + AD‑specific 429/475 +
   microglia grounding), endorsement marked per edge. Alt A: name only AOP‑429 (weaker). Alt B: only
   endorsed L&M AOPs (safer AOP status but a weaker "Alzheimer's" claim).
3. **AD hero** — *(rec)* **build the full animated AD cascade** (microglia terminal frame), equal to
   the PD hero; static frame kept only as a time‑risk fallback, not the target.
4. **Data ambition** — *(rec)* **maximal defensible curated set**: pull the full CTD AD DirectEvidence
   environmental‑chemical list and curate **as many positives as the evidence genuinely supports**
   (metals, pesticides, solvents…), build a real adversarial AD decoy set, add the microglia + AD‑
   mechanistic genesets and AD epidemiology (Claude Science); AlzKB display‑only. Report N honestly —
   whatever N the evidence yields is the calibrated truth, and the arm is fully built regardless.

**Timeline note:** if genuine PD‑equal *validation depth* for AD needs more curation than 6 days allows,
we **flag it and extend the curation**, we do not ship a thinner AD arm to hit the date (§7 is the
baseline, not a cap on rigor).

## 9. Risks & honesty guardrails

- **Overclaiming environmental→AD** → hard guardrail: curated marker/mechanism DirectEvidence required;
  therapeutic‑only ≠ positive; AD tier capped below PD; unverified → hypothesis.
- **Underpowered AD validation (small N)** → report N everywhere; no AUROC if N too small; frame as
  generalization, not a second proof.
- **Weaker AD circularity defense** → surface it in the ablation, don't hide it.
- **Time risk to PD polish** → PD frozen + regression‑tested; AD is purely additive; hero has a fallback.
- **Don't out‑render** → AD hero reuses PD tech; no atomistic/molecular rendering.

## 11. Deep‑research step (added per Jon — "I'm not convinced we've turned up everything")

Before locking the AD scaffold, re‑interrogate the AD literature/AOP landscape to find support for
**expanding beyond current knowledge** (AOP‑429/475 + CTD‑AD + the recon's assumptions). Five parallel
facets, each returning citations; synthesized into `docs/research/ad-aop-literature-scan.md` with an
explicit "what this lets us expand" verdict feeding §2/§4:

1. **AOP‑Wiki AD landscape** — all AOPs relevant to AD/dementia/tau/amyloid/neuroinflammation beyond
   429/475; endorsement status; registered chemical stressors; AOP *networks*; is anything endorsed or
   near‑endorsed for AD pathology?
2. **Environmental exposome ↔ AD causal evidence** (2015–2026) — discrete chemicals with the strongest
   human AD association (pesticides, metals, solvents), effect sizes, mechanism → candidate positives.
3. **AD mechanistic grounding datasets** — microglia/DAM genesets (Bellenguez 2022 GWAS; Mathys, Gerrits,
   Sun single‑cell), amyloid/tau pathway genes, AD resources beyond CTD/AlzKB (AD Knowledge Portal, Agora).
4. **AOP‑based environmental‑AD frameworks** — ONTOX/EU‑ToxRisk, Bal‑Price/Tschudi‑Monnet/Fritsche neuro
   AOP work; shared upstream KEs (mito dysfunction 177, neuroinflammation 188) feeding AD; emerging AOPs.
5. **Adversarial AD decoys** — amyloid/tau/BACE/AChE/metabolic‑active compounds lacking curated AD
   causation, for a real falsification set.

Rule: findings only expand the scaffold/validation if **verifiable and citable**; nothing enters a
recovery call unverified (same discipline as PD). Recon's AlzKB NO‑GO stands unless the research
materially changes it (then: flag to Jon, don't silently override).

## 10. Definition of done (honest)

Engine assesses PD & AD independently (PD byte‑identical) · AD validation set curated + Claude‑Science
verified with explicit N + tiers · UI cleanly separates PD/AD with endorsement/confidence badges +
dual verdict · AD hero or honest static fallback · deck/README/learnings updated with the asymmetry
surfaced as a feature · live on fly.io, verified.
