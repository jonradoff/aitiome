// Package aitio is the transport-agnostic service layer for the Aitiome engine.
// The HTTP and MCP adapters (services/cmd/httpd, services/cmd/mcpd) are thin
// shims over these methods — no domain logic lives in an adapter. This split is
// what lets the same engine serve a human web UI and an external agent over MCP
// (see docs/build-kickoff.md, the dual human + agentic interface pillar).
package aitio

import (
	"context"

	contract "aitiome/contract/goapi"
)

// Service is the single implementation both adapters drive.
type Service struct {
	compoundsLoaded int
}

// New constructs the service. compoundsLoaded stays 0 until the validation set
// loads in a later commit; Health surfaces it so the dual-adapter wiring is
// observably identical across transports.
func New() *Service {
	return &Service{compoundsLoaded: 0}
}

// Health is the trivial operation proving the dual-adapter pattern (Commit 1).
func (s *Service) Health(ctx context.Context) contract.Health {
	return contract.Health{
		Status:          "ok",
		ContractVersion: contract.Version,
		CompoundsLoaded: s.compoundsLoaded,
	}
}
