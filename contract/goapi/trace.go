package contract

// TraceEvent is one step in the assessment animation stream that drives the hero
// visualization. Kinds:
//   resolve         - identity resolved to the salt-form-correct record
//   predicate_eval  - one curated diagnostic term evaluated (term + hit)
//   node_enter      - a key event lights up as the cascade is reconstructed
//   edge_fire       - a key-event relationship fires (confidence -> glow)
//   ao_resolve      - the cascade resolves into the vulnerable DA-neuron population
//   strand          - a convergent-evidence strand reports (kind + status)
//   reject_line     - one independent line of a decoy rejection
//   verdict         - final call + confidence tier
type TraceEvent struct {
	Kind string `json:"kind"`

	Compound     string   `json:"compound,omitempty"`
	ResolvedForm string   `json:"resolvedForm,omitempty"`

	Term string `json:"term,omitempty"` // predicate_eval: "ctd_pd_direct" | "neuro_aop_stressor"
	Hit  *bool  `json:"hit,omitempty"`

	EventID    string   `json:"eventId,omitempty"`
	Title      string   `json:"title,omitempty"`
	KerID      string   `json:"kerId,omitempty"`
	Confidence float64  `json:"confidence,omitempty"`
	CellTypes  []string `json:"cellTypes,omitempty"`

	StrandKind   string `json:"strandKind,omitempty"`
	StrandStatus string `json:"strandStatus,omitempty"`
	Line         string `json:"line,omitempty"`

	Call string `json:"call,omitempty"`
	Tier string `json:"tier,omitempty"`

	Label string `json:"label,omitempty"` // short human caption for the step
}
