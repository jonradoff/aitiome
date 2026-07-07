package contract

// EngineMode is never conflated: validation (curated convergence + pathway +
// adversarial specificity) vs. discovery (analogy-based, benchmarked, uncertain).
type EngineMode string

const (
	ModeValidation EngineMode = "validation"
	ModeDiscovery  EngineMode = "discovery"
)

// EvidenceStrand is one independent line in the convergent-evidence model. These
// GROUND and enrich confidence — they are never new recovery gates (IsGate=false).
type EvidenceStrand struct {
	Kind   string `json:"kind"`   // curated_mechanism | assay_corroboration | mito_celltype_grounding | faers | epidemiology | bbb
	Status string `json:"status"` // supports | absent | refutes | not_assessable
	Detail string `json:"detail"`
	Source string `json:"source"`
	IsGate bool   `json:"isGate"` // always false
}

// Rejection is the decoy-specificity centerpiece: independent lines that each,
// on their own, withhold a positive call (curated absence + BBB non-penetrance +
// zero FAERS parkinsonism signal).
type Rejection struct {
	Lines []EvidenceStrand `json:"lines"`
	Count int              `json:"count"`
}

// CompoundResult is the full assessment for one compound.
type CompoundResult struct {
	Mode           EngineMode       `json:"mode"`
	Compound       Compound         `json:"compound"`
	Role           Role             `json:"role"`
	ConfidenceTier ConfidenceTier   `json:"confidenceTier"`
	Recovery       RecoveryDecision `json:"recovery"`
	Pathway        *Pathway         `json:"pathway,omitempty"`
	Strands        []EvidenceStrand `json:"strands,omitempty"`
	Rejection      *Rejection       `json:"rejection,omitempty"`
	Trace          []TraceEvent     `json:"trace,omitempty"`
}

// Ranking is one row of a scored panel.
type Ranking struct {
	Compound       string         `json:"compound"`
	Rank           int            `json:"rank"`
	Call           string         `json:"call"`
	ConfidenceTier ConfidenceTier `json:"confidenceTier"`
	StrandsSupporting int         `json:"strandsSupporting"`
}

// ValidationSummary is the headline scoreboard.
type ValidationSummary struct {
	PositivesRecovered  int `json:"positivesRecovered"`
	PositivesTotal      int `json:"positivesTotal"`
	NegativesRejected   int `json:"negativesRejected"`
	NegativesTotal      int `json:"negativesTotal"`
	AdversarialTotal    int `json:"adversarialTotal"`
	AdversarialRejected int `json:"adversarialRejected"`
	FalsePositives      int `json:"falsePositives"`
	FalseNegatives      int `json:"falseNegatives"`
}

// ValidationResult is the full harness output: the scoreboard plus per-compound
// assessments (expect fp=0, fn=0 on the recon set).
type ValidationResult struct {
	Summary     ValidationSummary `json:"summary"`
	PerCompound []CompoundResult  `json:"perCompound"`
}
