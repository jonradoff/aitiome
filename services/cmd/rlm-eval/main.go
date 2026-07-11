// Command rlm-eval runs the OFFLINE RLM-vs-RAG evidence-assembly comparison for one
// chemical across all four systems (RAG, RAG+, RLM-1, RLM-ADV), logging tokens and
// cost. It runs on the operator's Anthropic key and NEVER on the live app path.
//
// Usage: ANTHROPIC_API_KEY=... go run ./services/cmd/rlm-eval --chemical "perchloroethylene" --disease PD --dtxsid DTXSID8021397
package main

import (
	"bufio"
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	sdk "github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/option"

	"aitiome/services/aitio/rlm"
)

func main() {
	chemical := flag.String("chemical", "", "chemical name (required)")
	disease := flag.String("disease", "PD", "disease axis: PD or AD")
	dtxsid := flag.String("dtxsid", "", "DTXSID for identity resolution (optional)")
	outDir := flag.String("out", "docs/research/rlm", "output directory for the result JSON")
	systemsFlag := flag.String("systems", "", "comma-separated subset to run (RAG,RAG+,RLM-1,RLM-ADV); empty = all")
	resume := flag.Bool("resume", false, "resume: keep systems already in the output file, run only the missing ones")
	flag.Parse()

	only := map[string]bool{}
	for _, s := range strings.Split(*systemsFlag, ",") {
		if s = strings.TrimSpace(s); s != "" {
			only[s] = true
		}
	}

	if strings.TrimSpace(*chemical) == "" {
		log.Fatal("--chemical is required")
	}
	key := loadKey()
	if key == "" {
		log.Fatal("ANTHROPIC_API_KEY not set (env or .env)")
	}
	client := sdk.NewClient(option.WithAPIKey(key))

	// Generous whole-run cap; the per-call watchdog (15m) is the real hang guard.
	// RLM-ADV (planner + leaves + critic + leaves) can legitimately run ~40m under
	// slow web search, so give the full 4-system sequence room.
	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Minute)
	defer cancel()

	// Resolve the output path up front so we can persist incrementally.
	if err := os.MkdirAll(*outDir, 0o755); err != nil {
		log.Fatalf("mkdir: %v", err)
	}
	slug := strings.ToLower(strings.NewReplacer(" ", "-", "/", "-", ",", "").Replace(*chemical))
	path := filepath.Join(*outDir, fmt.Sprintf("rlm-%s-%s.json", slug, strings.ToLower(*disease)))
	writeArtifact := func(c rlm.Comparison) {
		b, _ := json.MarshalIndent(c, "", "  ")
		if err := os.WriteFile(path, b, 0o644); err != nil {
			log.Printf("[rlm-eval] warn: could not write %s: %v", path, err)
		}
	}

	// Resume: load systems already completed in a prior run and run only the rest.
	var seed []rlm.SystemSummary
	if *resume {
		if b, err := os.ReadFile(path); err == nil {
			var prev rlm.Comparison
			if json.Unmarshal(b, &prev) == nil && len(prev.Systems) > 0 {
				seed = prev.Systems
				present := map[string]bool{}
				for _, s := range prev.Systems {
					present[s.System] = true
				}
				wanted := only // may be empty (= all); if set, resume is restricted to it
				only = map[string]bool{}
				for _, name := range []string{"RAG", "RAG+", "RLM-1", "RLM-ADV"} {
					if !present[name] && (len(wanted) == 0 || wanted[name]) {
						only[name] = true
					}
				}
				if len(only) == 0 {
					log.Printf("[rlm-eval] resume: all 4 systems already present in %s — nothing to do", path)
					return
				}
				log.Printf("[rlm-eval] resume: %d systems already done; running %d remaining", len(seed), len(only))
			}
		} else {
			log.Printf("[rlm-eval] resume requested but no prior file at %s — running fresh", path)
		}
	}

	start := time.Now()
	log.Printf("[rlm-eval] chemical=%q disease=%s — running RAG, RAG+, RLM-1, RLM-ADV", *chemical, *disease)
	cmp := rlm.RunComparison(ctx, client, *chemical, strings.ToUpper(*disease), *dtxsid, only, seed, writeArtifact)
	elapsed := time.Since(start)

	// console summary
	fmt.Printf("\n=== RLM vs RAG — %s (%s) ===\n", cmp.Chemical, cmp.Disease)
	fmt.Printf("%-9s %4s %4s %4s %5s %5s %5s %5s %4s %5s %8s %7s\n",
		"system", "acc", "rej", "src", "diag", "uniq", "cntr", "call", "web", "sec", "cost($)", "$/obj")
	for _, s := range cmp.Systems {
		diag := "-"
		if s.DiagnosticRecovered {
			diag = "yes"
		}
		perObj := 0.0
		if s.Accepted > 0 {
			perObj = s.CostUSD / float64(s.Accepted)
		}
		fmt.Printf("%-9s %4d %4d %4d %5s %5d %5d %5d %4d %5.0f %8.4f %7.4f\n",
			s.System, s.Accepted, s.Rejected, s.DistinctSources, diag, s.UniqueVsRAG,
			s.Counterevidence, s.Calls, s.WebSearches, s.DurationSec, s.CostUSD, perObj)
	}
	fmt.Printf("\nTOTAL cost: $%.4f   wall: %s\n", cmp.TotalCost, elapsed.Round(time.Second))
	fmt.Printf("legend: acc=verified  rej=failed-validation  src=distinct-sources  diag=diagnostic-recovered  uniq=unique-vs-RAG  cntr=counterevidence\n\n")
	for _, s := range cmp.Systems {
		fmt.Printf("[%s]\n%s\n", s.System, s.CostReport)
	}

	// Final write — captures UniqueVsRAG (computed after all systems complete).
	writeArtifact(cmp)
	fmt.Printf("wrote %s\n", path)
}

// loadKey reads ANTHROPIC_API_KEY from the environment, falling back to a .env file
// at the repo root (KEY=VALUE lines).
func loadKey() string {
	if k := strings.TrimSpace(os.Getenv("ANTHROPIC_API_KEY")); k != "" {
		return k
	}
	for _, p := range []string{".env", "../.env", "../../.env"} {
		f, err := os.Open(p)
		if err != nil {
			continue
		}
		sc := bufio.NewScanner(f)
		for sc.Scan() {
			line := strings.TrimSpace(sc.Text())
			if strings.HasPrefix(line, "ANTHROPIC_API_KEY=") {
				f.Close()
				return strings.Trim(strings.TrimPrefix(line, "ANTHROPIC_API_KEY="), `"'`)
			}
		}
		f.Close()
	}
	return ""
}
