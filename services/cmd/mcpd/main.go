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
			mcp.WithDescription("List the ground-truth validation set (12 known neurotoxicants + 15 negatives, incl. 6 adversarial decoys) with identity and confidence tier. Read-only."),
		),
		func(ctx context.Context, _ mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			return jsonResult(svc.ListCompounds(ctx))
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
			mcp.WithDescription("Run the validation-mode assessment for a chemical: resolve identity, apply the curated recovery predicate (never gated on assay/bioactivity), reconstruct the grounded AOP cascade for positives, and emit the trace-event stream. Returns the full CompoundResult with confidence tier. Read-only."),
			mcp.WithString("id", mcp.Required(), mcp.Description("Chemical identifier: name, CAS, DTXSID, InChIKey, or CID.")),
		),
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			id, err := req.RequireString("id")
			if err != nil {
				return mcp.NewToolResultError("id is required"), nil
			}
			res, ok := svc.Assess(ctx, id)
			if !ok {
				return mcp.NewToolResultError("unresolved identifier: " + id), nil
			}
			return jsonResult(res)
		},
	)

	s.AddTool(
		mcp.NewTool("run_validation",
			mcp.WithDescription("Run the full validation harness over the 27-compound ground truth: recover the 12 known neurotoxicants, reject the 15 negatives (incl. 6 adversarial mito-active decoys), and report the scoreboard (expect fp=0, fn=0). Read-only."),
		),
		func(ctx context.Context, _ mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			return jsonResult(svc.RunValidation(ctx))
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

func jsonResult(v any) (*mcp.CallToolResult, error) {
	b, err := json.Marshal(v)
	if err != nil {
		return mcp.NewToolResultError("marshal: " + err.Error()), nil
	}
	return mcp.NewToolResultText(string(b)), nil
}
