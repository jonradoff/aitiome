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
