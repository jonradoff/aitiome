package contract

// RecoveryPredicate records the two curated diagnostic terms. A positive call is
// their OR. These are the ONLY basis for a recovery decision. The terms are
// disease-scoped: CTDDirectEvidence is curated DirectEvidence for the assessed
// disease's MeSH (PD D010300 / AD D000544); AOPStressor is a registered stressor
// of an AOP in that disease's family (PD keeps the historical broad neuro-AOP
// leg; AD is scoped to AD-relevant AOPs {12,48,429,475} — see ADR-0005).
type RecoveryPredicate struct {
	CTDPdDirectEvidence bool `json:"ctdPdDirectEvidence"` // curated CTD DirectEvidence for the disease
	NeuroAOPStressor    bool `json:"neuroAopStressor"`    // registered stressor of a disease-relevant AOP
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

// RecoveryDecision is the curated-diagnostic verdict for one compound, for one
// disease axis.
type RecoveryDecision struct {
	Call          string            `json:"call"` // "positive" | "negative"
	Disease       Disease           `json:"disease"`
	Predicate     RecoveryPredicate `json:"predicate"`
	Diagnostic    bool              `json:"diagnostic"`    // always true: curated signals are diagnostic
	GatedOnAssay  bool              `json:"gatedOnAssay"`  // always false: never gate on bioactivity
	Corroboration Corroboration     `json:"corroboration"`
	Rationale     string            `json:"rationale"`
}
