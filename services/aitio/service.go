// Package aitio is the transport-agnostic service layer for the Aitiome engine.
// The HTTP and MCP adapters (services/cmd/httpd, services/cmd/mcpd) are thin
// shims over these methods — no domain logic lives in an adapter. This split is
// what lets the same engine serve a human web UI and an external agent over MCP
// (see docs/build-kickoff.md, the dual human + agentic interface pillar).
package aitio

import (
	"context"
	"fmt"

	contract "aitiome/contract/goapi"
)

// Service is the single implementation both adapters drive.
type Service struct {
	compounds []contract.Compound
	resolver  *resolver
}

// New constructs the service, loading the ground-truth validation set (27
// compounds) and building the DTXSID-first resolver index. Returns an error if
// the embedded data is malformed — the engine must not silently start empty.
func New() (*Service, error) {
	compounds, err := loadValidationSet()
	if err != nil {
		return nil, fmt.Errorf("aitio: load validation set: %w", err)
	}
	return &Service{
		compounds: compounds,
		resolver:  newResolver(compounds),
	}, nil
}

// Health surfaces status, contract version, and the loaded compound count.
func (s *Service) Health(ctx context.Context) contract.Health {
	return contract.Health{
		Status:          "ok",
		ContractVersion: contract.Version,
		CompoundsLoaded: len(s.compounds),
	}
}

// ListCompounds returns the full ground-truth set (identity + tiers only here;
// pathway/recovery/evidence are assembled by later methods).
func (s *Service) ListCompounds(ctx context.Context) []contract.Compound {
	out := make([]contract.Compound, len(s.compounds))
	copy(out, s.compounds)
	return out
}

// Resolve maps any identifier (name, CAS, DTXSID, InChIKey, CID) to the one
// salt-form-correct record. Returns ok=false if unknown.
func (s *Service) Resolve(ctx context.Context, id string) (contract.Compound, bool) {
	i := s.resolver.resolve(id)
	if i < 0 {
		return contract.Compound{}, false
	}
	return s.compounds[i], true
}
