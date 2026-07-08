# Aitiome - Judge Q&A Preparation

Prep for a mechanism-obsessed audience (judged with the Gladstone Institutes). Every
answer below is backed by something on screen at https://aitiome.fly.dev or by a test in
the repo. Lead with honesty; the calibrated framing is the credibility.

---

## 0. The pitch (memorize these)

**One sentence:** "Aitiome is an honest mechanistic-reasoning engine for the environmental
exposome of neurodegeneration: it reconstructs the endorsed causal pathway for a chemical,
recovers the known neurotoxicants, and - the hard part - refuses to be fooled by bioactive
compounds that are not neurotoxic."

**30 seconds:** "The field asked for AI that finds environmental drivers of Parkinson's and
Alzheimer's. We did the reconnaissance first, and the data told us two things: there is no
honest unsupervised-discovery signal for this chemical class on public data, and the signal
that does work is curated mechanism, not bioactivity. So we built the thing the data
supports - an engine that reconstructs OECD-endorsed pathways, proves it recovers 12 known
neurotoxicants and rejects 15 negatives including 6 bioactive decoys with zero errors, backs
every claim with a linked citation, and ships an honest map of where discovery is and isn't
possible. It's live, and the same engine answers an external agent over MCP."

**The tagline:** "It recovers the real ones, resolves to the real neurons, and isn't fooled
by the imposters."

---

## 1. Scientific rigor (the questions that decide it)

**Q: Isn't this circular? Your recovery predicate uses curated sources, and your positive
labels come from curated sources.**
A: We address it on screen, empirically. Three points. (1) The two predicate terms come from
*independent* curation efforts - CTD (toxicogenomics literature curation) and AOP-Wiki (OECD
regulatory stressor registration). Neither alone recovers all positives: CTD-only gets 8/12,
AOP-only gets 8/12, together 12/12. That convergence is not one source read twice. (2) There
are no fitted parameters - it's a fixed logical rule, so there is nothing to overfit. (3) The
negatives are selected *orthogonally*: the 6 decoys were chosen for bioactivity, not for their
curation status, so rejecting them is not built into the predicate. Recovery is a sanity check;
the contribution is the specificity and the honest discovery map.

**Q: You're just detecting bioactivity.**
A: Computed live from our own data, every bioactivity signal is at or *below* chance against
the decoys: mitochondrial assays AUROC 0.16, membrane potential 0.12, oxidative stress 0.20,
total mechanistic hits 0.39, all ToxCast actives 0.15 (0.5 is chance). The decoys are, if
anything, *more* bioactive than the real neurotoxicants, because the true positives are
environmental toxicants under-represented in ToxCast. Bioactivity is anti-diagnostic here, so
the engine never gates on it. That is the falsification panel.

**Q: 27 compounds is a small validation set. Does it generalize?**
A: Correct, and we don't overclaim. This is a *curated benchmark with an adversarial control*,
not a held-out generalization study. Its job is to make the specificity claim falsifiable, not
to estimate population accuracy. The honest next step is a materially larger, blinded reference
set - which is exactly what the discovery-map's "qualified lead" (the neural-specific axis,
AUROC 0.72 but perm-p 0.155, underpowered) is waiting on. We would rather show a small,
scrupulously honest result than a large, unearned one.

**Q: Why a hand-written curated rule instead of a trained model?**
A: Because there was no signal to learn from on this class - that is the central reconnaissance
finding. Seven discovery axes were coverage-killed or confounder-killed. A learned model on
this data would either memorize the curation or fit the bioactivity confound. The curated rule
has zero free parameters, is fully auditable, and every term is 0/15 on the negatives.

**Q: What is your false-positive control?**
A: The 6 adversarial decoys (troglitazone, prochloraz, propiconazole, simvastatin, fenofibrate,
warfarin) - bioactive, often mitochondria-active, non-neurotoxic drugs chosen specifically to
fool an activity model. They are a permanent false-positive control. The engine rejects all 6.

**Q: Could you be overfitting the decoys?**
A: There is nothing to fit - the rule is fixed. And the decoys' selection criterion (bioactivity)
is independent of the rule (curated mechanism), so they are a genuine out-of-construction test of
specificity.

---

## 2. Mechanism and neuroscience

**Q: Why AOP-3 as the anchor?**
A: It is an OECD WPHA/WNT-endorsed adverse outcome pathway with a complete chain:
MIE 888 (binding of inhibitor, complex I) -> KE 887 (complex-I inhibition) -> KE 177
(mitochondrial dysfunction) -> KE 890 (nigrostriatal dopaminergic degeneration) -> AO 896
(parkinsonian motor deficits), with the 188<->890 neuroinflammation loop. It is the canonical
mitochondrial route to Parkinson's, and it terminates in the cell population that actually
degenerates. Nine endorsed neuro-AOPs are loaded; AOP-3 is the demo anchor.

**Q: How is the pathway grounded in real biology, not just a diagram?**
A: The molecular initiating event is grounded gene-level in the MitoCarta3.0 Complex-I Q-site
subunits (NDUFS2/7/8, NDUFV1, MT-ND1, etc.). The adverse outcome is grounded in the Kamath 2022
(Nature Neuroscience) SOX6/AGTR1 vulnerable dopaminergic-neuron population - the specific SN
neurons that selectively degenerate in Parkinson's. That is also the hero visual's terminal
frame: the cascade resolves into those neurons.

**Q: Does this speak to Alzheimer's too, or only Parkinson's?**
A: The shipped anchor is the Parkinson's / dopaminergic-mitochondrial route because that is where
the endorsed pathway and the ground truth are strongest. The scaffold holds 9 endorsed neuro-AOPs;
the recon distinguishes the PD -> DA-neuron-mitochondrial axis from the AD -> microglia axis
(Bryois). Extending to an AD hallmark is a scaffold-swap, not a re-architecture.

**Q: The neuroinflammation loop - why does it matter?**
A: 188<->890 is a feedback edge (neuroinflammation both drives and is driven by dopaminergic
degeneration). We render it as a loop rather than breaking the forward layering, because it is a
real bidirectional relationship in the endorsed pathway.

---

## 3. Discovery, represented honestly

**Q: You said you'd discover novel drivers. You didn't. Isn't that a failure?**
A: It's the most important finding, and we ship it as a feature. We tested seven independent
discovery axes (LINCS L1000, EPA HTTr, EPA HTPP, structure/QSAR, full ToxCast fingerprint,
ComptoxAI/AlzKB, Boltz-2). Every one is coverage-killed (environmental toxicants aren't in the
drug-centric profiling databases) or confounder-killed (general bioactivity is not neurotoxicity,
and excluding cytotoxicity barely helped). Mapping *why* discovery doesn't drop in for free on
this chemical class is a genuine, reproducible contribution - and it is exactly the kind of
negative result the field needs published.

**Q: So there's no path to discovery at all?**
A: Two honest, unproven leads remain, shown as leads not claims. (1) The neural-specific ToxCast
subset: excluding viability endpoints improves separation to AUROC 0.72, but it is underpowered
(perm-p 0.155, CI includes chance) and developmental != adult neurodegeneration. (2) A bounded
Boltz-2 physics-based Q-site engagement benchmark (the only basis that is neither annotation nor
bioactivity), prepped to one step, not run. Both need more power or compute; we report them with
explicit N.

**Q: If discovery doesn't work, what is the product for?**
A: Two things a lab can act on today. First, a validated, auditable mechanistic-reasoning engine
that reconstructs and grounds the pathway for any in-scope chemical and rates confidence. Second,
the honest boundary map that tells you which discovery approaches are worth funding for this class
and which are dead ends - saving real time and compute.

---

## 4. Data and methods

**Q: How do you handle chemical identity? Salt forms are a classic trap.**
A: DTXSID-first resolution with the salt-form-correct registered substance, not PubChem-synonym
guessing. Live demo: type the paraquat *dichloride* CAS 1910-42-5 and it resolves to the paraquat
record tested as that salt. The parent cation returns "no data" in ToxCast; the dichloride has the
real bioactivity. Getting this wrong silently corrupts everything downstream, so it is a day-one,
tested component (TestParaquatSaltForm).

**Q: CTD has tons of inferred associations. How do you avoid noise?**
A: Curated DirectEvidence only. Inferred associations scale with how heavily a chemical is studied,
not with real disease linkage - acetaminophen shows 80 inferred Parkinson's links and 0 curated,
and it is a clean negative. Inferred counts never touch a grade.

**Q: FAERS pharmacovigilance - is that meaningful?**
A: As an independent human-outcome strand, yes, and we validated the method (haloperidol positive
control ROR 39.6). The result: 0 of 4 assessable adversarial drugs show any parkinsonism signal
across ~20 million reports. It is corroboration, never a gate, and only ~9/27 compounds are
drug-like enough to assess - we say so.

**Q: Blood-brain-barrier - a real discriminator?**
A: A plausibility gate, not a discriminator. 3 of 6 adversarials are low-brain-exposure
(warfarin protein-bound, fenofibrate BBB-, troglitazone non-penetrant), which is an orthogonal
pharmacokinetic reason they can't be CNS drivers. 6-OHDA is correctly non-penetrant (it is
delivered directly in lesioning models) - a clean sanity check.

**Q: The "three independent lines" - do all decoys show three?**
A: No, and the app says so per compound. Warfarin and fenofibrate fail all three (no curated
signal + BBB non-penetrance + zero FAERS signal). Simvastatin and troglitazone fail two each -
simvastatin is BBB+ by passive permeability (it is P-gp-effluxed, which the structural call
doesn't capture), and troglitazone has zero assessable FAERS reports. We show the true count, not
a uniform claim.

---

## 5. Built on Claude / AI usage

**Q: Where is Claude actually used? Is it making the medical calls?**
A: No - and that is deliberate. The recovery decision is curated and fully deterministic; there is
no LLM in the decision path. Claude is used two ways. (1) An in-app Claude evidence-reasoner (Opus
4.8) writes the calibrated prose synthesis - it is hard-bounded to *explain*, never to decide: the
call and tier are fixed inputs it may not change, it cites the engine's evidence by [E#] marker
(nothing invented), and it never claims causation. (2) Claude Science is the human-in-the-loop
substrate for evidence curation (e.g., the epidemiology literature extraction), snapshotted into
the engine.

**Q: Why Opus and not your newest model?**
A: We tested per-role model config. On the life-sciences synthesis prompt, Fable 5 returned an
empty response and we fell back to the deterministic reasoner; Opus 4.8 produced rich,
rule-abiding prose. So Opus is the default reasoner; the server logs any model back-off. It is
configurable per role.

**Q: What stops the LLM from hallucinating a citation or a finding?**
A: Two guardrails. The citations are built by the engine from real strands and passed to the model
as fixed [E#] markers - the model cites, it does not invent. And the synthesis never touches the
decision. Every [E#] links to the original source (CTD, AOP-Wiki, MitoCarta, Kamath, ToxCast/ICE,
FAERS, B3DB), listed on the Sources page.

---

## 6. Product and engineering

**Q: Is this reproducible?**
A: Yes. The engine is a single Go binary that embeds the curated data; the recovery decision is
deterministic; `make validate` prints the falsification report; the whole validation harness is
tests (fp=fn=0 is enforced). Same input, same output.

**Q: The dual human + agent interface - why?**
A: The same transport-agnostic service is exposed over HTTP (the web UI) and MCP (for an external
agent). A scientist and an AI agent query the identical engine - `assess_compound`, `run_validation`,
`benchmark`, `get_pathway`, `discovery_map`, `synthesize_assessment`, `sources`. It's a genuine
dual interface, not a bolt-on.

**Q: How is it deployed?**
A: One ~13 MB container on fly.io serving web + API + the Claude reasoner; MCP is a sibling binary.
Live at aitiome.fly.dev. Private repo, contract-versioned (v1.1.0).

---

## 7. Limitations (say these before they ask)

- Small curated benchmark (27), not a population-level generalization study.
- Recovery shares curated provenance with the labels; we defend it with the independent-source
  ablation and the orthogonally-selected negatives, but it is a sanity check, not the headline.
- Discovery is a map, not a predictor. The two leads are underpowered / unrun.
- FAERS and epidemiology cover only part of the set; BBB is a plausibility gate.
- Anchored on the Parkinson's / mitochondrial route; AD is a scaffold extension, not yet shipped.

## 8. Curveballs

**Q: If I gave you a new chemical right now, could it assess it?**
A: For the 27 in the curated benchmark, yes, live. For an arbitrary new chemical, the honest
answer is it needs the curated lookups (CTD DirectEvidence, AOP stressor status, salt-form
resolution) assembled first - which is the Claude Science curation step, not a live public API
pull. We chose correctness over a live demo that could silently return wrong data.

**Q: What would change your mind that discovery is possible here?**
A: A materially larger, blinded neural-specific reference set that holds AUROC well above chance
with a significant permutation test, or a Boltz-2 Q-site benchmark that separates the 12 positives
from the 6 decoys with meaningful effect size. Both are specified; neither is proven.

**Q: What's the single most important thing you learned?**
A: That letting the evidence redirect the project - from an overclaimed discovery watchlist to a
validated, honest engine plus a map of the limits - produced something far more credible for this
audience. The honesty is not a hedge; it is the contribution.
