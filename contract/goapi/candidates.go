package contract

// The candidate queue turns Aitiome from a pure validator into a triage pipeline:
// a ranked list of chemicals that are NOT yet confirmed positives but carry
// partial or pending evidence worth curation or wet-lab attention. It is an
// evidence-weighted priority layer, NOT a predictor — a candidate only enters with at
// least one real (non-bioactivity) evidence strand, and only the curated gate
// (CTD DirectEvidence OR a registered in-scope AOP stressor) can ever promote it
// to a positive. General bioactivity is barred (it is anti-diagnostic here), and
// the adversarial decoys are carried as a permanent negative control that must
// rank last. See docs/decisions/0006-candidate-pipeline.md.

// CandidateEvidence is one non-bioactivity line supporting a candidate.
type CandidateEvidence struct {
	Line     string `json:"line"`     // AOP | MECH | IPSC | EPI | XDIS | ZF | INFERRED
	Strength string `json:"strength"` // strong | moderate | weak
	Detail   string `json:"detail"`
	Source   string `json:"source"` // provenance citation
}

// Candidate is one chemical in the triage queue, with its derived priority score.
type Candidate struct {
	Name       string              `json:"name"`
	Disease    Disease             `json:"disease"`
	CAS        string              `json:"cas,omitempty"`
	DTXSID     string              `json:"dtxsid,omitempty"`
	State      string              `json:"state"`      // aop_stressor_ready | mechanistic | association | pending_verification
	Score      float64             `json:"score"`      // evidence-weighted priority (DERIVED from evidence, not stored)
	Promotion  string              `json:"promotion"`  // human phrase: distance to the curated gate
	Experiment string              `json:"experiment"` // recommended next experiment (the wet-lab guidance)
	Rationale  string              `json:"rationale"`
	Evidence   []CandidateEvidence `json:"evidence"`
	IsControl  bool                `json:"isControl"` // adversarial decoy, carried as a negative control
}

// CandidateBacktest is the honest prioritization check: a KNOWN positive whose
// curated evidence is withheld, scored on its convergent non-curated strands
// alone, and shown to outrank every adversarial decoy. This demonstrates
// prioritization skill (the ranker recovers a positive it was not told about) —
// NOT causal discovery.
type CandidateBacktest struct {
	HeldOut       string              `json:"heldOut"`       // a confirmed positive whose curated evidence was hidden
	HeldOutScore  float64             `json:"heldOutScore"`  // its score from non-curated strands only
	DecoyMaxScore float64             `json:"decoyMaxScore"` // best decoy score — the bar it must clear
	Passed        bool                `json:"passed"`
	Method        string              `json:"method"`
	Verdict       string              `json:"verdict"`
	Evidence      []CandidateEvidence `json:"evidence"` // the non-curated strands used
}

// CandidateQueue is the disease-scoped, VOI-ranked candidate list plus the
// held-out prioritization backtest.
type CandidateQueue struct {
	Disease    Disease            `json:"disease"`
	Headline   string             `json:"headline"`
	Weights    []CandidateWeight  `json:"weights"` // the transparent, published ranker weights
	Candidates []Candidate        `json:"candidates"`
	Backtest   *CandidateBacktest `json:"backtest,omitempty"`
	Note       string             `json:"note"`
}

// CandidateWeight publishes one term of the additive ranker so the score is
// fully auditable (no learned/black-box weighting).
type CandidateWeight struct {
	Line   string  `json:"line"`
	Weight float64 `json:"weight"`
	Label  string  `json:"label"`
}
