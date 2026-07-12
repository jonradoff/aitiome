#!/usr/bin/env bash
# Runs the offline RLM-vs-RAG evidence-assembly comparison (ADR-0007) across the
# eval set. Idempotent + resumable: every chemical uses --resume, so systems already
# in its output file are skipped and a re-run only fills gaps. A failed chemical is
# logged and the loop continues. Wrap the whole invocation in `caffeinate -is` so a
# laptop suspend can't interrupt an overnight run.
#
#   caffeinate -is env ANTHROPIC_API_KEY=... scripts/rlm-eval-all.sh
set -u
cd "$(dirname "$0")/.."

export RLM_DUMP_DIR="${RLM_DUMP_DIR:-/tmp/rlm-raw-eval}"

# Optional phase control: set RLM_SYSTEMS="RAG,RAG+" to bank the resilient single-pass
# systems across all chemicals first, then rerun with RLM_SYSTEMS unset (or the RLM
# subset) to add the web-search-heavy RLM passes when search latency is favorable.
SYS_ARG=()
[ -n "${RLM_SYSTEMS:-}" ] && SYS_ARG=(--systems "$RLM_SYSTEMS")

# name|dtxsid|disease  — blinded spread: 3 positives, 2 adversarial decoys, 1 candidate.
CHEMS=(
  "perchloroethylene|DTXSID8021397|PD"   # candidate
  "rotenone|DTXSID6021248|PD"            # positive (assay+curated)
  "paraquat|DTXSID3034799|PD"            # positive (epi-strong)
  "chlorpyrifos|DTXSID4020458|PD"        # positive (well-covered)
  "troglitazone|DTXSID8023719|PD"        # adversarial decoy
  "propiconazole|DTXSID8024280|PD"       # adversarial decoy
)

for entry in "${CHEMS[@]}"; do
  IFS='|' read -r name dtxsid disease <<< "$entry"
  echo "=== [$(date '+%Y-%m-%d %H:%M:%S')] $name ($disease) ==="
  if go run ./services/cmd/rlm-eval --chemical "$name" --disease "$disease" --dtxsid "$dtxsid" --resume ${SYS_ARG[@]+"${SYS_ARG[@]}"}; then
    echo "=== [$(date '+%H:%M:%S')] $name OK ==="
  else
    echo "!!! [$(date '+%H:%M:%S')] $name FAILED (exit $?) — continuing"
  fi
done
echo "=== [$(date '+%Y-%m-%d %H:%M:%S')] eval set complete ==="
