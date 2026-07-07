package contract

// Citation binds an [E#] marker in a synthesis to a concrete evidence strand and
// its source (the [E#] evidence-registry pattern). Citations are built from the
// engine's strands, never invented by the model.
type Citation struct {
	Marker string `json:"marker"` // e.g. "E1"
	Kind   string `json:"kind"`   // strand kind
	Detail string `json:"detail"`
	Source string `json:"source"`
}

// Synthesis is a calibrated prose account of an assessment. It EXPLAINS the
// mechanistic reasoning; it never makes or changes the recovery call (the call
// and tier are fixed inputs). It cites evidence as [E#] markers.
type Synthesis struct {
	Compound  string     `json:"compound"`
	Call      string     `json:"call"`
	Tier      string     `json:"tier"`
	Prose     string     `json:"prose"`
	Citations []Citation `json:"citations"`
	Model     string     `json:"model"`  // model that produced it (or "template")
	Source    string     `json:"source"` // "claude" | "direct"
}
