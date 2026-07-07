package contract

// EventRole is an AOP key-event role. The AO is the terminal key event.
type EventRole string

const (
	RoleMIE EventRole = "MIE" // molecular initiating event
	RoleKE  EventRole = "KE"  // key event
	RoleAO  EventRole = "AO"  // adverse outcome (terminal)
)

// Grounding anchors an abstract key event in real molecular/cellular data. The
// MIE is grounded in MitoCarta Complex-I Q-site subunits; the adverse outcome in
// the Kamath SOX6/AGTR1 vulnerable dopaminergic neuron population — which is also
// the hero visual's terminal frame (docs/recon/enrich-brain-cell-mito.md).
type Grounding struct {
	Genes      []string `json:"genes,omitempty"`      // e.g. MitoCarta Complex-I Q-site subunits
	CellTypes  []string `json:"cellTypes,omitempty"`  // e.g. SOX6+ / AGTR1+ vulnerable DA neurons
	Source     string   `json:"source,omitempty"`
	Kind       string   `json:"kind,omitempty"` // "mie_genes" | "ao_celltype"
}

// PathwayNode is one key event, positioned by Layer along the cascade (0 = MIE).
type PathwayNode struct {
	EventID   string     `json:"eventId"`
	Title     string     `json:"title"`
	Role      EventRole  `json:"role"`
	Layer     int        `json:"layer"`
	Grounding *Grounding `json:"grounding,omitempty"`
}

// PathwayEdge is a key-event relationship (upstream -> downstream). IsLoop marks
// a feedback edge (the 188<->890 neuroinflammation loop) so the viz can render it
// distinctly. Confidence drives edge weight/glow in the hero visualization.
type PathwayEdge struct {
	KerID      string  `json:"kerId"`
	Upstream   string  `json:"upstream"`
	Downstream string  `json:"downstream"`
	IsLoop     bool    `json:"isLoop"`
	Confidence float64 `json:"confidence"`
}

// Pathway is an endorsed AOP reconstructed as a positioned, grounded graph.
type Pathway struct {
	AopID        string        `json:"aopId"`
	Title        string        `json:"title"`
	OECDEndorsed bool          `json:"oecdEndorsed"`
	URL          string        `json:"url,omitempty"`
	Nodes        []PathwayNode `json:"nodes"`
	Edges        []PathwayEdge `json:"edges"`
}
