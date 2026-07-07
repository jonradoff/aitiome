// Command mcpd is the thin MCP adapter over the aitio service. It registers
// service methods as MCP tools (stdio transport) and contains no domain logic.
// The same Health method is exposed here and over HTTP — proving one engine
// serves both a human UI and an external agent.
package main

import (
	"context"
	"encoding/json"
	"log"

	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"

	"aitiome/services/aitio"
	contract "aitiome/contract/goapi"
)

func main() {
	svc := aitio.New()

	s := server.NewMCPServer("aitiome", contract.Version,
		server.WithToolCapabilities(false),
	)

	s.AddTool(
		mcp.NewTool("health",
			mcp.WithDescription("Engine health: status, loaded contract version, and count of validation compounds loaded. Read-only."),
		),
		func(ctx context.Context, _ mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			b, err := json.Marshal(svc.Health(ctx))
			if err != nil {
				return mcp.NewToolResultError("marshal: " + err.Error()), nil
			}
			return mcp.NewToolResultText(string(b)), nil
		},
	)

	log.Println("aitiome mcpd serving on stdio")
	if err := server.ServeStdio(s); err != nil {
		log.Fatalf("mcpd: %v", err)
	}
}
