// Package aitio is the transport-agnostic service layer for the Aitiome engine.
// The HTTP and MCP adapters (services/cmd/httpd, services/cmd/mcpd) are thin
// shims over these methods — no domain logic lives in an adapter. This split is
// what lets the same engine serve a human web UI and an external agent over MCP
// (see docs/build-kickoff.md, the dual human + agentic interface pillar).
package aitio

import (
	"context"
	"fmt"
	"sync"

	contract "aitiome/contract/goapi"
)

// Service is the single implementation both adapters drive.
type Service struct {
	compounds   []contract.Compound // PD ground-truth set
	compoundsAD []contract.Compound // AD ground-truth set (ADR-0005)
	resolver    *resolver
	resolverAD  *resolver
	pathways    map[string]contract.Pathway
	evidence    *evidenceStore

	reasoner     EvidenceReasoner // nil unless a Claude key is configured
	reasonerName string
	synthCache   sync.Map
}

// New constructs the service, loading the ground-truth validation set (27
// compounds), the DTXSID-first resolver index, and the endorsed AOP scaffold.
// Returns an error if the embedded data is malformed — the engine must not
// silently start empty.
func New() (*Service, error) {
	compounds, err := loadValidationSet()
	if err != nil {
		return nil, fmt.Errorf("aitio: load validation set: %w", err)
	}
	compoundsAD, err := loadValidationSetAD()
	if err != nil {
		return nil, fmt.Errorf("aitio: load AD validation set: %w", err)
	}
	pathways, err := loadPathways()
	if err != nil {
		return nil, fmt.Errorf("aitio: load pathways: %w", err)
	}
	evidence, err := loadEvidence()
	if err != nil {
		return nil, fmt.Errorf("aitio: load evidence: %w", err)
	}
	reasoner, reasonerName := newReasoner()
	return &Service{
		compounds:    compounds,
		compoundsAD:  compoundsAD,
		resolver:     newResolver(compounds),
		resolverAD:   newResolver(compoundsAD),
		pathways:     pathways,
		evidence:     evidence,
		reasoner:     reasoner,
		reasonerName: reasonerName,
	}, nil
}

// compoundsFor returns the ground-truth set for a disease axis.
func (s *Service) compoundsFor(d contract.Disease) []contract.Compound {
	if d == contract.DiseaseAD {
		return s.compoundsAD
	}
	return s.compounds
}

// resolverFor returns the identifier resolver for a disease axis.
func (s *Service) resolverFor(d contract.Disease) *resolver {
	if d == contract.DiseaseAD {
		return s.resolverAD
	}
	return s.resolver
}

// AssessDisease resolves an identifier within a disease's set and assesses it on
// that axis (the cross-disease verdict for the other axis is attached).
func (s *Service) AssessDisease(ctx context.Context, id string, d contract.Disease) (contract.CompoundResult, bool) {
	if !d.Valid() {
		d = contract.DiseasePD
	}
	r := s.resolverFor(d)
	i := r.resolve(id)
	if i < 0 {
		// Fall back to the other axis's identity so a known compound still
		// resolves; it is then assessed on the requested disease.
		if oi := s.resolver.resolve(id); oi >= 0 {
			return s.assessCompoundDisease(s.compounds[oi], d), true
		}
		return contract.CompoundResult{}, false
	}
	return s.assessCompoundDisease(s.compoundsFor(d)[i], d), true
}

// ReasonerInfo reports whether a Claude-backed reasoner is active and its model.
func (s *Service) ReasonerInfo() (active bool, model string) {
	return s.reasoner != nil, s.reasonerName
}

// GetPathway returns a reconstructed, grounded AOP pathway by id (e.g. "3").
func (s *Service) GetPathway(ctx context.Context, aopID string) (contract.Pathway, bool) {
	p, ok := s.pathways[aopID]
	return p, ok
}

// AnchorPathway returns the MVP anchor (AOP-3) — the demo spine.
func (s *Service) AnchorPathway(ctx context.Context) contract.Pathway {
	return s.pathways[MVPAnchorAOP]
}

// Health surfaces status, contract version, and the loaded compound count.
func (s *Service) Health(ctx context.Context) contract.Health {
	return contract.Health{
		Status:          "ok",
		ContractVersion: contract.Version,
		CompoundsLoaded: len(s.compounds),
	}
}

// ListCompounds returns the full PD ground-truth set (identity + tiers only here;
// pathway/recovery/evidence are assembled by later methods).
func (s *Service) ListCompounds(ctx context.Context) []contract.Compound {
	return s.ListCompoundsDisease(ctx, contract.DiseasePD)
}

// ListCompoundsDisease returns the ground-truth set for a disease axis.
func (s *Service) ListCompoundsDisease(ctx context.Context, d contract.Disease) []contract.Compound {
	set := s.compoundsFor(d)
	out := make([]contract.Compound, len(set))
	copy(out, set)
	return out
}

// DiseaseCatalog describes the available disease axes for the top-level filter.
func (s *Service) DiseaseCatalog(ctx context.Context) []contract.DiseaseInfo {
	return []contract.DiseaseInfo{
		{
			Disease: contract.DiseasePD, Label: contract.DiseasePD.Label(), Short: contract.DiseasePD.Short(),
			AnchorAOP: MVPAnchorAOP, AnchorEndorsed: true,
			Note:          "OECD-endorsed AOP-3 spine (complex-I -> mitochondrial dysfunction -> nigrostriatal degeneration -> parkinsonian deficits). The validated anchor.",
			CompoundCount: len(s.compounds),
		},
		{
			Disease: contract.DiseaseAD, Label: contract.DiseaseAD.Label(), Short: contract.DiseaseAD.Short(),
			AnchorAOP: ADAnchorAOP, AnchorEndorsed: true,
			Note:          "Endorsed AOP-12/48 anchor (aging neurodegeneration + memory) with a non-endorsed Tau/amyloid overlay (AOP-429/475). Second axis; calibrated below PD.",
			CompoundCount: len(s.compoundsAD),
		},
	}
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

// ResolveDisease resolves an identifier within a disease's ground-truth set,
// falling back to the other axis so any benchmark compound resolves regardless
// of the selected disease. Returns ok=false only if the identifier is not in the
// curated benchmark at all.
func (s *Service) ResolveDisease(ctx context.Context, id string, d contract.Disease) (contract.Compound, bool) {
	if !d.Valid() {
		d = contract.DiseasePD
	}
	if i := s.resolverFor(d).resolve(id); i >= 0 {
		return s.compoundsFor(d)[i], true
	}
	// fall back to the other axis's identity
	other := contract.DiseasePD
	if d == contract.DiseasePD {
		other = contract.DiseaseAD
	}
	if i := s.resolverFor(other).resolve(id); i >= 0 {
		return s.compoundsFor(other)[i], true
	}
	return contract.Compound{}, false
}
