#!/usr/bin/env bash
# Dump contract-shaped fixtures from the live engine so the viz/web streams can
# reach polish on fixtures alone (integration is a fixture->live flip).
set -euo pipefail
cd "$(dirname "$0")/.."

OUT="contract/fixtures"
PORT="${AITIO_FIXTURE_PORT:-8799}"
mkdir -p "$OUT/assess" "$OUT/synthesis"

go build -o bin/httpd ./services/cmd/httpd
AITIO_HTTP_ADDR=":$PORT" ./bin/httpd &
PID=$!
trap 'kill $PID 2>/dev/null || true' EXIT

base="http://localhost:$PORT"
for _ in $(seq 1 40); do
  curl -sf "$base/health" >/dev/null 2>&1 && break
  sleep 0.25
done
fetch() { curl -s "$base/$1" | python3 -m json.tool > "$OUT/$2"; echo "  $2"; }

echo "dumping fixtures from $base:"
fetch "health"                       "health.json"
fetch "compounds"                    "compounds.json"
fetch "validation"                   "validation.json"
fetch "pathway"                      "pathway-aop3.json"
fetch "discovery-map"                "discovery-map.json"
fetch "candidates"                   "candidates.json"
fetch "candidates?disease=ad"        "candidates-ad.json"
  fetch "benchmark"                    "benchmark.json"
fetch "sources"                      "sources.json"

# Demo compound set (the 5-beat demo + a couple extras).
for c in rotenone paraquat mptp 6-hydroxydopamine chlorpyrifos \
         simvastatin troglitazone warfarin fenofibrate prochloraz propiconazole acetaminophen; do
  curl -s "$base/assess?id=$c" | python3 -m json.tool > "$OUT/assess/$c.json"
  echo "  assess/$c.json"
  curl -s "$base/synthesis?id=$c" | python3 -m json.tool > "$OUT/synthesis/$c.json"
  echo "  synthesis/$c.json"
done

# Alzheimer's axis fixtures (demo resilience for the second axis).
fetch "diseases"              "diseases.json"
fetch "validation?disease=ad" "validation-ad.json"
mkdir -p "$OUT/assess-ad"
for c in "DDE" "lead acetate" "cadmium chloride" "aluminum chloride" "streptozocin" \
         "curcumin" "donepezil" "epigallocatechin gallate" "methylene blue"; do
  slug=$(echo "$c" | tr ' A-Z' '-a-z')
  enc=$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))" "$c")
  curl -s "$base/assess?id=$enc&disease=ad" | python3 -m json.tool > "$OUT/assess-ad/$slug.json"
  echo "  assess-ad/$slug.json"
done

echo "done -> $OUT"
