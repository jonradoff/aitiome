# Learnings

A running log of what we learn as we build and stress-test Aitiome. Red-teaming
findings go here, but so does anything else worth remembering that is not already
captured in the code, the ADRs (`docs/decisions/`), or the recon (`docs/recon/`).

Newest first. Each entry: date, a one-line claim, and what backs it.

---

## 2026-07-07 - Bioactivity is anti-diagnostic here, quantified live (red-team)

**Claim:** "You're just detecting bioactivity" is false, and we can prove it from our
own data. **What backs it:** the falsification harness (`make validate`, `/benchmark`)
computes the AUROC of every bioactivity signal separating the 12 positives from the 6
adversarial decoys:

| signal | AUROC vs decoys | AUROC vs all negatives |
|---|---|---|
| Mitochondrial assays | 0.16 | 0.41 |
| Membrane potential (MMP) | 0.12 | 0.39 |
| Oxidative stress | 0.20 | 0.40 |
| Mechanistic assays (total) | 0.39 | 0.57 |
| ToxCast active (all) | 0.15 | 0.45 |

Every signal is **at or below chance (0.5)**. The decoys are, if anything, *more*
bioactive than the real neurotoxicants, because the true positives are environmental
toxicants (metals, MPTP/MPP+, rotenoids) under-represented in ToxCast. Bioactivity is
not merely a weak discriminator, it is anti-diagnostic. The curated rule is perfect on
the same set (tp12/tn15/fp0/fn0). This is the empirical heart of "never gate on assay".

## 2026-07-07 - Red-teaming from the harness catches our own overclaims

**Claim:** grounding red-team in executable tests (not talking points) is worth it
because it catches *our* mistakes. **What backs it:** the first version of the benchmark
test asserted "at least one bioactivity signal separates positives from inert negatives"
(paraphrasing the recon's 0.76 fingerprint number). It **failed**: single-count signals
do not separate positives from inert negatives either on this set (that 0.76 was the
multi-assay *fingerprint* similarity, a different measure). The test forced the honest,
stronger statement. Lesson: assert what the data shows, and let the harness correct the
narrative, not the other way around.

## 2026-07-07 - Both curated predicate terms are load-bearing (ablation)

**Claim:** the recovery rule needs both terms; neither is redundant. **What backs it:**
`TestBothPredicateTermsLoadBearing` - CTD-DirectEvidence alone misses 4 positives (the
metals and deguelin, which have no curated PD evidence but are registered neuro-AOP
stressors); AOP-stressor alone misses 4 positives (e.g. 6-OHDA, dieldrin). Both terms
are 0/15 on the negatives. So the OR is necessary and neither term introduces a false
positive.

## 2026-07-07 - Fable backs off on life-sciences synthesis; keep Opus (see ADR-0004)

**Claim:** default the evidence-reasoner to Opus 4.8, not Fable. **What backs it:** with
the identical prompt/code path, `claude-fable-5` returned an **empty response** on the
neurotoxicity synthesis (no API error, no text), so the engine fell back to the
deterministic reasoner; `claude-opus-4-8` produced rich, rule-abiding prose. Fable adds
no value here and wastes a round-trip. Model is configurable per role via
`AITIO_MODEL_REASONER`; we monitor for back-off (the server logs requested-vs-served).

## Open critique to address (circularity)

**The sharpest anticipated question:** the recovery predicate (curated CTD + AOP) and the
positive labels draw on overlapping curated sources, so recovering the positives is close
to true-by-construction. **Our honest position:** recovery is a **sanity check**, not the
contribution. The contribution is (1) the **specificity** against adversarial *bioactive*
decoys that every activity/similarity method fails (quantified above), and (2) the honest
**discovery-is-a-map** result. We should state this plainly in the app and the pitch, and
we are surfacing the falsification benchmark so the "just bioactivity" critique is answered
on screen, not in a footnote. (Tracked for the red-team UI section.)
