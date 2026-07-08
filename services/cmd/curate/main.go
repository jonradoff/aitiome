// Command curate is the command-line evidence-assembly agent: given a chemical,
// it uses Claude (Opus 4.8) with the web-search tool - the same class of agent
// Claude Science is built on - to assemble a CURATED-EVIDENCE DRAFT (identity,
// CTD Parkinson's DirectEvidence status, neuro-AOP stressor status, epidemiology)
// with citations, and emits a contract.CuratedInput JSON.
//
// Honesty: the output is an UNVERIFIED draft (verified=false, source=agent-draft).
// The engine grades it as a hypothesis, never a curated diagnostic positive. The
// intended pipeline is: curate (draft) -> verify in Claude Science / against CTD &
// AOP-Wiki -> feed the verified record to the engine.
//
// Usage:
//   go run ./services/cmd/curate "ziram"                 # print the draft JSON
//   go run ./services/cmd/curate --assess "ziram"        # draft, then grade via the engine
package main

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	sdk "github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/option"

	contract "aitiome/contract/goapi"
)

const system = `You are an evidence-assembly agent for Aitiome, an honest mechanistic-reasoning engine for the environmental exposome of neurodegeneration. You assemble CURATED-EVIDENCE DRAFTS for a chemical using web search. This is the same kind of literature/database assembly Claude Science performs.

Assemble, for the given chemical:
- identity: DTXSID and CAS if findable (prefer the EPA CompTox/DSSTox record; note the salt form).
- pdDirect: 1 ONLY if you find explicit evidence of a CURATED Comparative Toxicogenomics Database (CTD) Parkinson's Disease DirectEvidence association (marker/mechanism or therapeutic) for this chemical; otherwise 0. Inferred/gene-network associations do NOT count. Be conservative.
- aopStressorOf: list of OECD AOP-Wiki adverse-outcome-pathway ids for which this chemical is a REGISTERED stressor of a NEURO AOP (e.g. AOP 3 complex-I/parkinsonian). Empty if none found.
- mechActiveTotal / mitoActive: approximate counts of active ToxCast mechanistic / mitochondrial assays if readily findable; else 0.
- epidemiology: one short sentence on any published PD/AD human epidemiological association, with a citation.
- citations: array of {marker, detail, url} for every claim above. Use real, resolvable URLs.
- notes: your uncertainty and what a human should verify.

HARD RULES:
- Do not guess. If you cannot substantiate CTD DirectEvidence or AOP-stressor status, set 0 / [] and say so in notes.
- Never overstate. This draft will be graded as a hypothesis, not a diagnostic call.
- Output ONLY a single JSON object (no prose before or after) matching this shape, with "verified": false and "source": "agent-draft":
{"name":"","dtxsid":"","cas":"","verified":false,"source":"agent-draft","pdDirect":0,"aopStressorOf":[],"mitoActive":0,"mechActiveTotal":0,"epidemiology":"","citations":[{"marker":"C1","detail":"","url":""}],"notes":""}`

func main() {
	args := os.Args[1:]
	assess := false
	var name string
	for _, a := range args {
		if a == "--assess" {
			assess = true
		} else {
			name = a
		}
	}
	if strings.TrimSpace(name) == "" {
		fmt.Fprintln(os.Stderr, "usage: curate [--assess] \"<chemical name>\"")
		os.Exit(2)
	}
	loadDotEnv()
	key := strings.TrimSpace(os.Getenv("ANTHROPIC_API_KEY"))
	if key == "" {
		fmt.Fprintln(os.Stderr, "ANTHROPIC_API_KEY not set (add it to .env)")
		os.Exit(1)
	}
	model := envOr("AITIO_MODEL_REASONER", "claude-opus-4-8")

	client := sdk.NewClient(option.WithAPIKey(key))
	ctx, cancel := context.WithTimeout(context.Background(), 180*time.Second)
	defer cancel()

	raw, err := assemble(ctx, client, model, name)
	if err != nil {
		fmt.Fprintf(os.Stderr, "curate: %v\n", err)
		os.Exit(1)
	}

	in, jsonText, err := parseCurated(raw, name)
	if err != nil {
		fmt.Fprintf(os.Stderr, "curate: could not parse a CuratedInput from the model output:\n%s\n", raw)
		os.Exit(1)
	}
	fmt.Println(jsonText)

	if assess {
		fmt.Fprintln(os.Stderr, "\n--- grading the draft via the engine (unverified => hypothesis) ---")
		if err := gradeViaEngine(in); err != nil {
			fmt.Fprintf(os.Stderr, "assess: %v (is the engine running? make run-http)\n", err)
		}
	}
}

func assemble(ctx context.Context, client sdk.Client, model, name string) (string, error) {
	messages := []sdk.MessageParam{
		sdk.NewUserMessage(sdk.NewTextBlock("Assemble the curated-evidence draft for: " + name)),
	}
	tools := []sdk.ToolUnionParam{
		{OfWebSearchTool20260209: &sdk.WebSearchTool20260209Param{}},
	}
	var out strings.Builder
	for i := 0; i < 6; i++ {
		resp, err := client.Messages.New(ctx, sdk.MessageNewParams{
			Model:     sdk.Model(model),
			MaxTokens: 4000,
			System:    []sdk.TextBlockParam{{Text: system}},
			Messages:  messages,
			Tools:     tools,
		})
		if err != nil {
			return "", err
		}
		out.Reset()
		for _, block := range resp.Content {
			if tb, ok := block.AsAny().(sdk.TextBlock); ok {
				out.WriteString(tb.Text)
			}
		}
		messages = append(messages, resp.ToParam())
		if string(resp.StopReason) != "pause_turn" {
			break
		}
	}
	return out.String(), nil
}

// parseCurated extracts the JSON object from the model output and normalizes it
// to an unverified agent draft.
func parseCurated(raw, name string) (contract.CuratedInput, string, error) {
	s := raw
	if i := strings.Index(s, "```json"); i >= 0 {
		s = s[i+7:]
	}
	start := strings.Index(s, "{")
	end := strings.LastIndex(s, "}")
	if start < 0 || end <= start {
		return contract.CuratedInput{}, "", fmt.Errorf("no JSON object found")
	}
	var in contract.CuratedInput
	if err := json.Unmarshal([]byte(s[start:end+1]), &in); err != nil {
		return contract.CuratedInput{}, "", err
	}
	if in.Name == "" {
		in.Name = name
	}
	// Enforce the honesty guardrail regardless of what the model returned.
	in.Verified = false
	in.Source = "agent-draft"
	b, _ := json.MarshalIndent(in, "", "  ")
	return in, string(b), nil
}

func gradeViaEngine(in contract.CuratedInput) error {
	body, _ := json.Marshal(in)
	base := envOr("AITIO_ENGINE", "http://localhost:8787")
	resp, err := http.Post(base+"/assess-curated", "application/json", bytes.NewReader(body))
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	var res contract.CompoundResult
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return err
	}
	fmt.Fprintf(os.Stderr, "call:  %s\ntier:  %s\nwhy:   %s\n", res.Recovery.Call, res.ConfidenceTier, res.Recovery.Rationale)
	return nil
}

// --- small helpers (self-contained; the engine has its own dotenv loader) ---

func envOr(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}

func loadDotEnv() {
	for _, path := range []string{".env", "../.env", "../../.env"} {
		f, err := os.Open(path)
		if err != nil {
			continue
		}
		sc := bufio.NewScanner(f)
		for sc.Scan() {
			line := strings.TrimSpace(sc.Text())
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}
			if k, v, ok := strings.Cut(line, "="); ok {
				if os.Getenv(strings.TrimSpace(k)) == "" {
					_ = os.Setenv(strings.TrimSpace(k), strings.TrimSpace(v))
				}
			}
		}
		f.Close()
		return
	}
}
