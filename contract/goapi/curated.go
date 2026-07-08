package contract

// CuratedInput is externally-assembled curated evidence for a chemical NOT in the
// embedded benchmark - the shape a Claude Science curation (or the command-line
// curation agent) produces. The engine grades it with the SAME deterministic
// predicate. Honesty guardrail: Verified marks whether the curated evidence was
// checked against the primary sources (CTD DirectEvidence / AOP-Wiki) or verified
// in Claude Science. An UNVERIFIED draft is graded as a hypothesis (analogy_only),
// never as a curated diagnostic positive - the LLM never enters the decision path.
type CuratedInput struct {
	Name          string     `json:"name"`
	DTXSID        string     `json:"dtxsid,omitempty"`
	CAS           string     `json:"cas,omitempty"`
	Verified      bool       `json:"verified"`         // true only if checked vs primary sources / Claude Science
	Source        string     `json:"source,omitempty"` // "claude-science" | "agent-draft" | "manual"
	PDDirect      int        `json:"pdDirect"`         // count of curated CTD Parkinson's DirectEvidence rows
	ADDirect      int        `json:"adDirect,omitempty"`
	AOPStressorOf []string   `json:"aopStressorOf"` // neuro-AOP ids it is a registered stressor of
	MitoActive    int        `json:"mitoActive,omitempty"`
	MechActiveTotal int      `json:"mechActiveTotal,omitempty"`
	Citations     []Citation `json:"citations,omitempty"`
	Notes         string     `json:"notes,omitempty"`
}
