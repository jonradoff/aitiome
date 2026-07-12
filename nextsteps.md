# Next steps — RLM-vs-RAG evidence-assembly experiment

_Handoff written 2026-07-12. Trust the repo (`git log`, `git status`) over this doc if they disagree._

## Just wrapped (this session)
- **RLM-vs-RAG offline experiment (ADR-0007).** Four evidence-assembly systems — RAG, RAG+,
  RLM-1, RLM-ADV — assemble typed, source-resolved evidence for 6 chemicals (positives
  rotenone/paraquat/chlorpyrifos · decoys troglitazone/propiconazole · candidate
  perchloroethylene), scored on ONE deterministic validator+merge. **Never touches the live
  recovery gate.** Full matrix **23/24 cells** (only chlorpyrifos RAG+ missing, backend-limited).
  Commit **c47fba2**. Per-chemical data: `docs/research/rlm/rlm-<chem>-pd.json`.
- **Findings: `docs/research/rlm/FINDINGS.md`.** Headline: **RLM-ADV surfaces ~10× more
  counter-evidence than RAG, ~2.4× more than the strong RAG+ baseline**, and matches RAG+ on
  yield/breadth *while running degraded* by a slow web-search window. Trade-off: RLM-ADV's critic
  refutes → 0/6 diagnostic-anchor recovery (pair with RLM-1). RLM degrades gracefully where RAG
  is all-or-nothing (memory: `rlm-decomposition-resilience`).
- **Deck source updated** (`web/scripts/build-deck.mjs`), commit **998885d**: 3 new slides after
  the "Deterministic core" architecture slide (RLM-vs-RAG + MIT citation arXiv:2512.24601 · the
  4-method comparison grid · overall finding + transferability) plus a takeaways headline line.
  **Syntax-verified, NOT yet rendered to PDF.**
- **Harness** (commits 306e4ac, c47fba2): the full offline runner lives in `services/aitio/rlm/`
  + `services/cmd/rlm-eval/`; driver `scripts/rlm-eval-all.sh`. Plus general HTTP access logging on
  httpd (306e4ac).

## Exactly where we are
- **Nothing is running** (all background eval processes ended). Working tree clean except
  auto-generated `VIBECTL.md` (do not commit).
- **Deck PDF NOT regenerated.** `web/scripts/build-deck.mjs` fails at module load because it reads
  `/tmp/deck-*.png` screenshots produced by the capture pipeline (ephemeral, gone). The slide
  SOURCE is correct and committed — only the render is pending. VERIFIED: source parses
  (`node --check`). ASSUMED: the new slides look right (not visually confirmed — needs the render).
- **chlorpyrifos RAG+** is the one empty cell: 5 web-search timeouts at 15–20 min. Backend-limited,
  not a code bug. Everything else is filled.

## How we continue
1. **Regenerate the deck PDF and eyeball the new slides.** From `web/`:
   - `npm run dev &` (serves localhost:5273), wait for ready
   - `node scripts/capture-deck-shots.mjs http://localhost:5273` (writes `/tmp/deck-*.png`)
   - `node scripts/build-deck.mjs` (writes `docs/aitiome-presentation.pdf`, logs "wrote … (N slides)")
   - Check: the 3 new slides render (esp. the 5-column `.cmp.g5` grid on the comparison slide) and
     the takeaways headline line. Commit the PDF if the repo tracks it.
2. **(Optional) Backfill chlorpyrifos RAG+** in a faster web-search window:
   `RLM_DUMP_DIR=/tmp/rlm-raw-eval go run ./services/cmd/rlm-eval --chemical chlorpyrifos --disease PD --dtxsid DTXSID4020458 --resume --systems RAG,RAG+`
   (its file currently holds RAG/RLM-1/RLM-ADV, so `--resume` will attempt just RAG+.) If it lands,
   update the RAG+ mean in FINDINGS.md (currently n=5).
3. **(Optional, not started) BYOK RLM app/MCP capability** + precomputed demo fixtures, per the
   original sprint brief. Live RLM must be BYOK + gated + rate-limited + fixtured — casual app use
   must NOT invoke RLM on our key.

## Do NOT redo
- **Don't re-run the whole matrix** — it's committed. Only backfill chlorpyrifos RAG+.
- **Don't set `ANTHROPIC_API_KEY` via `env VAR=\"…\"` with backslash-escaping** — it passed a
  garbage key → 401 and wasted a cell. `loadKey()` reads ambient env then `.env`; just inherit the
  ambient env.
- **Don't use the SDK's `Message.Accumulate`** on streamed server-tool responses — it crashes
  re-marshaling empty `web_search_tool_result` blocks (anthropic-sdk-go v1.56.0). We hand-accumulate
  text/usage/stop-reason off the event stream (`services/aitio/rlm/leaf.go`).
- **Don't raise `leafConcurrency` back to 4** — server-side `web_search` is org-rate-limited;
  4 concurrent leaves starve each other (single-pass RAG succeeds while concurrent leaves time out).
  2 was chosen deliberately.
- **Don't chunk RAG/RAG+ searches** to fight timeouts — rejected: it turns RAG into RLM and breaks
  the baseline contrast. RLM already embodies the resilient chunked pattern (that's a finding).
- **Deck PDF build always needs the capture pipeline first** — `build-deck.mjs` alone fails.

Blocked-on-Jon: none. The BYOK RLM capability is a product decision, not a blocker.
