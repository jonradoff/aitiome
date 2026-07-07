.PHONY: build run-http run-mcp test tidy smoke

build:
	go build ./...

tidy:
	go mod tidy

# Human web UI adapter (HTTP). GET /health
run-http:
	go run ./services/cmd/httpd

# Agentic adapter (MCP over stdio). Drive with an MCP client.
run-mcp:
	go run ./services/cmd/mcpd

test:
	go test ./...

# Regenerate contract fixtures from the live engine (viz/web build on these).
fixtures:
	bash scripts/dump-fixtures.sh

# Smoke-test both adapters expose the same Health payload.
smoke:
	@echo "== HTTP ==" && (go run ./services/cmd/httpd & echo $$! > /tmp/aitio_http.pid; sleep 1; \
		curl -s localhost:8787/health; echo; kill `cat /tmp/aitio_http.pid`)
	@echo "== MCP (initialize + tools/call health) ==" && printf '%s\n%s\n%s\n' \
		'{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"smoke","version":"0"}}}' \
		'{"jsonrpc":"2.0","method":"notifications/initialized"}' \
		'{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"health","arguments":{}}}' \
		| go run ./services/cmd/mcpd 2>/dev/null | tail -n 1
