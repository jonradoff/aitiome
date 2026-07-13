# Changelog

Notable changes to Aitiome — a *Built with Claude: Life Sciences* hackathon submission
by Jon Radoff. Live at https://aitiome.fly.dev.

## 2026-07-13 — Public launch

### Added
- Public repository + **MIT LICENSE** (© 2026 Jon Radoff).
- Comprehensive **README** (identity, "what we presented," technical architecture, three
  MCP working examples, install/build/run) and canonical **MCP documentation** (`mcp.md` —
  13 read-only tools + three worked examples).
- In-app pages via `react-router`: **`/rlm`** (the RAG vs RAG+ vs RLM vs RLM-ADV methods
  study) and **`/mcp`** (the MCP interface). Deep links work via the Go SPA index-fallback.
- **First-visit Welcome modal** and **end-of-tour modal** (view the deck / explore the app);
  a **global site footer** (MIT License + hackathon credit + nav links) on every page.
- Guided tour expanded to **8 steps** — now including the candidate queue and the RLM
  methods study — with an on-page RLM methods section a presenter can narrate.
- Presentation deck served at **`/presentation.pdf`**, plus new deck slides (Hackathon
  Highlights, Results) and layout/line-break fixes.

### Changed
- RLM evidence-assembly study completed to **24/24 cells** (chlorpyrifos RAG+ backfilled).
  RAG+ means recomputed to n=6 (distinct sources 12.7, counter-evidence 5.7, cost $3.58,
  diagnostic 4/6); headline finding moved **~2.4× → ~2.2×** more counter-evidence than the
  strong RAG+ baseline (still ~10× vs plain RAG). All n=5 / 23-of-24 caveats removed.
- Corrected rotenone identity to `DTXSID6021248`.

### Notes
- The recovery gate is **deterministic and never uses bioactivity**; the RLM study is
  **offline** and never touches the live request path.
