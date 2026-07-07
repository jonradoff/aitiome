package contract

// RecoveryPredicate records the two curated diagnostic terms. A positive call is
// their OR. These are the ONLY basis for a recovery decision.
type RecoveryPredicate struct {
	CTDPdDirectEvidence bool `json:"ctdPdDirectEvidence"` // curated CTD Parkinson's DirectEvidence
	NeuroAOPStressor    bool `json:"neuroAopStressor"`    // registered stressor of a neuro AOP
}

// Corroboration is assay/bioactivity context shown ALONGSIDE a decision but which
// NEVER gates it. Mitochondrial/general bioactivity is anti-diagnostic (the
// adversarial decoys hit the same assays), so it is displayed, never decisive.
type Corroboration struct {
	AssayActive     bool   `json:"assayActive"`
	MitoActive      int    `json:"mitoActive"`
	MechActiveTotal int    `json:"mechActiveTotal"`
	Note            string `json:"note"`
	AntiDiagnostic  bool   `json:"antiDiagnostic"` // always true: corroboration is not a discriminator
}

// RecoveryDecision is the curated-diagnostic verdict for one compound.
type RecoveryDecision struct {
	Call          string            `json:"call"` // "positive" | "negative"
	Predicate     RecoveryPredicate `json:"predicate"`
	Diagnostic    bool              `json:"diagnostic"`    // always true: curated signals are diagnostic
	GatedOnAssay  bool              `json:"gatedOnAssay"`  // always false: never gate on bioactivity
	Corroboration Corroboration     `json:"corroboration"`
	Rationale     string            `json:"rationale"`
}
