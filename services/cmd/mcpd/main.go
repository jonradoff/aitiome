// Command mcpd is the thin MCP adapter over the aitio service. It registers
// service methods as MCP tools (stdio transport) and contains no domain logic.
// The same methods are exposed here and over HTTP — proving one engine serves
// both a human UI and an external agent.
package main

import (
	"context"
	"encoding/json"
	"log"

	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"

	contract "aitiome/contract/goapi"
	"aitiome/services/aitio"
)

func main() {
	svc, err := aitio.New()
	if err != nil {
		log.Fatalf("mcpd: %v", err)
	}

	s := server.NewMCPServer("aitiome", contract.Version,
		server.WithToolCapabilities(false),
	)

	s.AddTool(
		mcp.NewTool("health",
			mcp.WithDescription("Engine health: status, loaded contract version, and count of validation compounds loaded. Read-only."),
		),
		func(ctx context.Context, _ mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			return jsonResult(svc.Health(ctx))
		},
	)

	s.AddTool(
		mcp.NewTool("list_compounds",
			mcp.WithDescription("List a disease axis's ground-truth validation set with identity and confidence tier. Read-only."),
			mcp.WithString("disease", mcp.Description("Disease axis: \"pd\" (Parkinson's, default) or \"ad\" (Alzheimer's).")),
		),
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			return jsonResult(svc.ListCompoundsDisease(ctx, diseaseArg(req)))
		},
	)

	s.AddTool(
		mcp.NewTool("diseases",
			mcp.WithDescription("The available disease axes for assessment: Parkinson's (endorsed AOP-3 anchor) and Alzheimer's (endorsed AOP-12/48 anchor + non-endorsed Tau/amyloid overlay), each with its anchor AOP, endorsement status, calibration note, and compound count. Read-only."),
		),
		func(ctx context.Context, _ mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			return jsonResult(svc.DiseaseCatalog(ctx))
		},
	)

	s.AddTool(
		mcp.NewTool("resolve_compound",
			mcp.WithDescription("Resolve any identifier (name, CAS, DTXSID, InChIKey, CID) to the one salt-form-correct record. DTXSID-first; avoids the PubChem-synonym salt-form trap. Read-only."),
			mcp.WithString("id", mcp.Required(), mcp.Description("Chemical identifier: name, CAS, DTXSID, InChIKey, or CID.")),
		),
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			id, err := req.RequireString("id")
			if err != nil {
				return mcp.NewToolResultError("id is required"), nil
			}
			c, ok := svc.Resolve(ctx, id)
			if !ok {
				return mcp.NewToolResultError("unresolved identifier: " + id), nil
			}
			return jsonResult(c)
		},
	)

	s.AddTool(
		mcp.NewTool("assess_compound",
			mcp.WithDescription("Run the validation-mode assessment for a chemical on a disease axis: resolve identity, apply the curated recovery predicate (never gated on assay/bioactivity), reconstruct the grounded AOP cascade for positives, and emit the trace-event stream. Returns the full CompoundResult with confidence tier and the cross-disease verdict for the other axis. Read-only."),
			mcp.WithString("id", mcp.Required(), mcp.Description("Chemical identifier: name, CAS, DTXSID, InChIKey, or CID.")),
			mcp.WithString("disease", mcp.Description("Disease axis: \"pd\" (Parkinson's, default) or \"ad\" (Alzheimer's).")),
		),
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			id, err := req.RequireString("id")
			if err != nil {
				return mcp.NewToolResultError("id is required"), nil
			}
			res, ok := svc.AssessDisease(ctx, id, diseaseArg(req))
			if !ok {
				return mcp.NewToolResultError("unresolved identifier: " + id), nil
			}
			return jsonResult(res)
		},
	)

	s.AddTool(
		mcp.NewTool("run_validation",
			mcp.WithDescription("Run the full validation harness over a disease axis's ground truth (PD: 12 neurotoxicants + 15 negatives incl. 6 adversarial decoys; AD: curated AD-linked chemicals + AD-assay-active decoys) and report the scoreboard (expect fp=0, fn=0). Read-only."),
			mcp.WithString("disease", mcp.Description("Disease axis: \"pd\" (Parkinson's, default) or \"ad\" (Alzheimer's).")),
		),
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			return jsonResult(svc.RunValidationDisease(ctx, diseaseArg(req)))
		},
	)

	s.AddTool(
		mcp.NewTool("synthesize_assessment",
			mcp.WithDescription("Return a calibrated prose synthesis of a compound's assessment, citing the evidence strands as [E#]. It explains the mechanistic reasoning; it never makes or changes the recovery call (which is curated and fixed). Uses the Claude evidence-reasoner when configured, with a deterministic fallback. Read-only."),
			mcp.WithString("id", mcp.Required(), mcp.Description("Chemical identifier: name, CAS, DTXSID, InChIKey, or CID.")),
		),
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			id, err := req.RequireString("id")
			if err != nil {
				return mcp.NewToolResultError("id is required"), nil
			}
			res, ok := svc.Synthesize(ctx, id)
			if !ok {
				return mcp.NewToolResultError("unresolved identifier: " + id), nil
			}
			return jsonResult(res)
		},
	)

	s.AddTool(
		mcp.NewTool("assess_curated",
			mcp.WithDescription("Grade externally-assembled curated evidence for a chemical NOT in the embedded benchmark - the shape Claude Science (or the command-line curation agent) produces. Uses the same deterministic predicate; an UNVERIFIED draft is graded as a hypothesis (analogy_only), never a curated diagnostic positive. Input is a JSON CuratedInput object as a string. Read-only."),
			mcp.WithString("input", mcp.Required(), mcp.Description("JSON CuratedInput: {\"name\":..,\"dtxsid\":..,\"pdDirect\":0,\"aopStressorOf\":[],\"verified\":false,\"source\":\"claude-science\"}")),
		),
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			raw, err := req.RequireString("input")
			if err != nil {
				return mcp.NewToolResultError("input (JSON CuratedInput) is required"), nil
			}
			var in contract.CuratedInput
			if err := json.Unmarshal([]byte(raw), &in); err != nil {
				return mcp.NewToolResultError("invalid CuratedInput JSON: " + err.Error()), nil
			}
			if in.Name == "" {
				return mcp.NewToolResultError("name is required"), nil
			}
			return jsonResult(svc.AssessCurated(ctx, in))
		},
	)

	s.AddTool(
		mcp.NewTool("sources",
			mcp.WithDescription("The primary data sources and methods as research-style citations with links to the original material (CTD, AOP-Wiki, MitoCarta3.0, Kamath 2022, EPA ToxCast/ICE, openFDA FAERS, B3DB, DSSTox). Read-only."),
		),
		func(ctx context.Context, _ mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			return jsonResult(svc.Sources(ctx))
		},
	)

	s.AddTool(
		mcp.NewTool("benchmark",
			mcp.WithDescription("The falsification harness, computed live from the validation set: the curated rule's perfect separation (fp=fn=0) next to the AUROC of every bioactivity signal against the adversarial decoys, which is at or below chance. The empirical answer to 'you are just detecting bioactivity'. Read-only."),
		),
		func(ctx context.Context, _ mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			return jsonResult(svc.Benchmark(ctx))
		},
	)

	s.AddTool(
		mcp.NewTool("discovery_map",
			mcp.WithDescription("The honest negative-results discovery map: seven axes tested for an annotation-independent discovery signal on this chemical class, each coverage- or confounder-killed, plus the two live leads (neural-specific subset, Boltz-2 Q-site). Discovery is a map, not a predictor. Read-only."),
		),
		func(ctx context.Context, _ mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			return jsonResult(svc.DiscoveryMap(ctx))
		},
	)

	s.AddTool(
		mcp.NewTool("get_pathway",
			mcp.WithDescription("Reconstruct an endorsed OECD AOP as a positioned, grounded graph (nodes = key events MIE->KE->AO, edges = key-event relationships). Defaults to the MVP anchor AOP-3 (complex-I inhibition -> nigrostriatal dopaminergic degeneration -> parkinsonian deficits). MIE grounded in MitoCarta Complex-I Q-site subunits; AO grounded in SOX6/AGTR1 vulnerable DA neurons. Read-only."),
			mcp.WithString("aop", mcp.Description("AOP id (e.g. \"3\"). Omit for the AOP-3 anchor.")),
		),
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			id := req.GetString("aop", "")
			if id == "" {
				return jsonResult(svc.AnchorPathway(ctx))
			}
			p, ok := svc.GetPathway(ctx, id)
			if !ok {
				return mcp.NewToolResultError("unknown AOP: " + id), nil
			}
			return jsonResult(p)
		},
	)

	log.Println("aitiome mcpd serving on stdio")
	if err := server.ServeStdio(s); err != nil {
		log.Fatalf("mcpd: %v", err)
	}
}

func diseaseArg(req mcp.CallToolRequest) contract.Disease {
	return contract.ParseDisease(req.GetString("disease", ""))
}

func jsonResult(v any) (*mcp.CallToolResult, error) {
	b, err := json.Marshal(v)
	if err != nil {
		return mcp.NewToolResultError("marshal: " + err.Error()), nil
	}
	return mcp.NewToolResultText(string(b)), nil
}
