# Design proposal — a distinct AD hero terminal frame (for Jon's feedback)

> Status: PROPOSAL. Not built. The hero is a primary win condition; today the AD hero *reuses* the PD one.

## The problem
The PD hero resolves the endorsed cascade into a designed **terminal frame**: a point‑cluster of the
**vulnerable SOX6/AGTR1 dopaminergic‑neuron population** that ignites at the adverse outcome — the "one
screenshot that travels." The **AD hero currently reuses that exact cluster**, just relabeled with microglia
genes and given a warm tint. It reads as "the PD hero in gold," not as a distinct Alzheimer's endpoint.

## The concept — "the disease‑associated microglia response"
Give AD its own scientifically‑grounded terminal motif, sibling to (not a recolor of) the PD neuron frame:
the cascade resolves into a field of **microglia that transition from *ramified* (homeostatic, surveilling) to
*amoeboid* (activated, DAM) and converge on a neuroinflammation focus.** That ramified→amoeboid→clustering
transition is the textbook visual signature of AD microglia — morphologically distinct from a neuron population,
and we already carry both genesets to drive it:
- **homeostatic** (`AD_microglia_homeostatic`: P2RY12, CX3CR1, TMEM119) — the "before"
- **activated / DAM** (`AD_microglia_vulnerable`: TREM2, APOE, SPP1, ITGAX…) — the "after"

Register stays **schematic**, per CLAUDE.md ("don't out‑render Mol*/Drew Berry") — glyphs and motion, not
photoreal cells.

## Motion story (what a judge sees when DDE resolves on the AD axis)
1. Cascade edges fire down the AOP‑12 spine (NMDAR → cell death → neuroinflammation ↔ neurodegeneration → memory loss).
2. At the AO, a field of **ramified microglia glyphs** (dim, cool, spread out, long thin processes) **ignites**.
3. Processes **retract** (ramified→amoeboid), glyphs **brighten and warm** (teal→amber), and **converge** toward the
   KE‑188 neuroinflammation focus — with the **188↔352 feedback loop** rendered as a subtle pulsing ring.
4. Gene labels cross‑fade homeostatic → DAM. Caption: *"resolves into the disease‑associated microglia population."*

## Three ways to build it (pick one)
- **Option A — particle‑morph microglia glyphs (RECOMMENDED).** Reuse the existing point/particle system; a custom
  point shader draws a small cell body + a few radiating processes whose length is driven by an `activation`
  uniform (long=ramified → short=amoeboid), with a cool→warm color ramp and a convergence transform toward the
  focus. Distinct silhouette, scientifically legible, reuses infra. **Effort: medium (~½ day). Risk: medium**
  (GLSL tuning + perf with many glyphs) — mitigated because it's gated on `disease==='ad'` so **PD is untouched**.
- **Option B — instanced microglia sprites (ramified→amoeboid atlas).** Higher fidelity (sprite frames or instanced
  meshes morphing shape). Prettier, but more effort, more perf risk, and drifts toward the "out‑render" line.
  **Effort: high. Risk: medium‑high.**
- **Option C — abstract neuroinflammation bloom.** No literal microglia: concentric activated rings converging on a
  focus + the pulsing KE‑188 loop. Lowest risk, but less "microglia‑specific" and less memorable. **Effort: low‑med. Risk: low.**

## Palette & consistency
PD = teal/cyan (cool, dopaminergic); AD = amber/gold (warm, inflammatory) — extends the warm accent already
shipped. Dark default + light parity. Motion serves comprehension (the transition *is* the science), stays performant.

## Risk mitigation
- **PD hero path byte‑identical** — the microglia motif only activates for `disease==='ad'`; the PD neuron cluster
  code is untouched.
- **Static fallback** — if perf/time slips, fall back to a still amoeboid‑cluster frame (AD still ships a distinct endpoint).
- Ship behind the existing fixture/live flip so the demo is resilient.

## Recommendation
**Option A.** It's the sweet spot: genuinely distinct from the PD frame, grounded in our own genesets, schematic
(in‑scope), reuses the particle infra, and isolates all risk to the AD path. It gives the AD arm its own
"screenshot that travels" (microglia converging on a neuroinflammation focus) without endangering the polished PD hero.

## Questions for you
1. Option **A** (recommended), B (higher‑fidelity, riskier), or C (safe/abstract)?
2. Literal microglia glyphs (ramified→amoeboid) vs. a more abstract inflammatory bloom — how literal do you want it?
3. Palette: keep the amber/warm AD accent, or a different cue?
