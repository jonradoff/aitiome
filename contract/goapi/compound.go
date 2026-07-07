package contract

// Role is the ground-truth class of a validation-set compound.
type Role string

const (
	RolePositive Role = "positive"
	RoleNegative Role = "negative"
)

// ConfidenceTier is surfaced on EVERY result (a hard requirement). Positives are
// assay_mechanism_recovered | curated_anchored_only; negatives are
// adversarial_negative | clean_negative | weak_negative; novel candidates are
// analogy_only (lowest, not used in the validation set).
type ConfidenceTier string

// Compound is a resolved chemical with its curated + corroborating signals.
// Identity is DTXSID-first with a salt-form-correct ToxCast record (ToxcastCAS);
// see docs/recon/data-source-map.md RISK 1 (the paraquat-dichloride trap).
type Compound struct {
	Name           string   `json:"name"`
	Role           Role     `json:"role"`
	ConfidenceTier ConfidenceTier `json:"confidenceTier"`
	Mech           string   `json:"mech"`
	Note           string   `json:"note,omitempty"`

	// Identity (DSSTox-first).
	CID        int    `json:"cid,omitempty"`
	CAS        string `json:"cas,omitempty"`
	InChIKey   string `json:"inchikey,omitempty"`
	SMILES     string `json:"smiles,omitempty"`
	DTXSID     string `json:"dtxsid"`
	ToxcastCAS string `json:"toxcastCas,omitempty"` // salt-form-correct tested record

	// Curated diagnostic signals (the ONLY basis for a recovery call).
	PDDirect     int      `json:"pdDirect"`     // curated CTD Parkinson's DirectEvidence rows
	ADDirect     int      `json:"adDirect"`     // curated CTD Alzheimer's DirectEvidence rows
	AOPStressorOf []string `json:"aopStressorOf"` // registered neuro-AOP ids this is a stressor of
	AOP3Stressor  bool     `json:"aop3Stressor"`
	InNeurotoxKb  bool     `json:"inNeurotoxkb"` // redundant confirming vote only

	// Corroborating (anti-diagnostic — NEVER gates a positive call).
	ToxcastTested   int `json:"toxcastTested"`
	ToxcastActive   int `json:"toxcastActive"`
	MitoActive      int `json:"mitoActive"`
	MMPActive       int `json:"mmpActive"`
	OxStressActive  int `json:"oxStressActive"`
	NeuroActive     int `json:"neuroActive"`
	MechActiveTotal int `json:"mechActiveTotal"`

	GeneIxnsHuman   int    `json:"geneIxnsHuman,omitempty"`
	AOP3GeneHits    int    `json:"aop3GeneHits,omitempty"`
	CoverageGrade   string `json:"coverageGrade,omitempty"`
}
