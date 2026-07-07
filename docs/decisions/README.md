# Architecture Decision Records (ADRs)

Lightweight ADRs for Aitiome. One file per decision: `NNNN-short-slug.md`.

**Rule:** every ADR must name the **recon finding** it rests on (cite the specific `docs/` file), per the
working agreement in `/CLAUDE.md`. If a decision would contradict a recon finding, do not log it — stop and
flag it to Jon.

## Template

```markdown
# ADR-NNNN: <title>

- **Status:** proposed | accepted | superseded by ADR-XXXX
- **Date:** YYYY-MM-DD
- **Rests on (recon finding):** <doc path + one-line finding>

## Context
<the forces at play — what makes this a decision>

## Decision
<what we're doing>

## Consequences
<tradeoffs, what this makes easy/hard, what it commits us to>
```

## Index

- [ADR-0001](0001-constraint-memory-and-recon-lock.md) — Lock recon findings into `/CLAUDE.md` constraint memory
- [ADR-0002](0002-monorepo-contract-and-stack.md) — Monorepo layout, contract v1 seam, and stack choices
- [ADR-0003](0003-frontend-and-hero.md) — Frontend architecture and the hero visualization
