# ADR-0003: Frontend architecture and the hero visualization

- **Status:** accepted
- **Date:** 2026-07-07
- **Rests on (recon finding):** `docs/build-kickoff.md` Visual North Star + hero-shot
  spec (validation-and-specificity reveal resolving into the SOX6/AGTR1 vulnerable
  DA neurons; evidence-weighted glowing edges; discovery-map view); the enrichment
  recon (MitoCarta Q-site subunits, Kamath vulnerable DA neurons) as the terminal
  frame; the recovery-rule spec (never gate on assay) encoded in the UI framing.

## Context

The visual is a primary win condition. The Taste Skill (`design-taste-frontend`)
was installed and its anti-slop ruleset followed. Design read: a calm, premium
editorial scientific instrument for mechanism-obsessed judges; dark by default with
light parity; drama from the data viz, not the chrome.

## Decision

- **One Vite + React + TypeScript app at `web/`** coupled to the core only through
  the contract seam (aliased `@contract` types + `@fixtures`), reading live engine
  data via a `/api` proxy with fixture fallback for demo resilience. (The brief's
  separate viz dev-server is consolidated into this app as a self-contained hero
  component that still runs on fixtures; the seam is preserved.)
- **Hand-authored dark design system** (no Tailwind) with one locked accent (signal
  cyan) plus strictly data-semantic gold (neuron) and rose (rejection). Space Grotesk
  + IBM Plex Mono, self-hosted. No em-dashes anywhere (Taste Skill hard rule).
- **Hero: Three.js + custom GLSL** driven by the engine's `CompoundResult` — an
  exposome particle field, evidence-weighted glowing cascade edges with a travelling
  energy band gated by reconstruction progress, and the terminal ignition into the
  vulnerable DA-neuron population for positives; withheld cascade + rose rejection
  rings for decoys. A single progress ramp animates both modes.
- **Analytical panels** make it a credible instrument: convergent-evidence display
  (strands + rejection, with the never-a-gate disclaimer), full reasoning trace, the
  27-compound validation panel (doubles as selector), the honest discovery map, and
  the MCP dual-interface panel.
- **Verification:** Go tests (fp=fn=0, salt-form guard, decoy rejection); web build;
  headless Chrome screenshots of recovered/rejected/light modes with zero runtime
  errors; MCP stdio smoke.

## Consequences

- `./run.sh` starts everything with one command.
- The hero canvas intentionally stays dark in light mode (an instrument's screen).
- three.js makes the bundle large (~1.1 MB); acceptable for a demo, code-splittable later.
