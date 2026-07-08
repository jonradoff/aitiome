package contract

// Disease is the neurodegeneration axis a compound is assessed against. The
// engine reasons per-disease: a chemical can be positive for PD, AD, both, or
// neither. Parkinson's is the endorsed, validated anchor; Alzheimer's is a
// second axis on a weaker (but partly endorsed) scaffold — honesty is carried by
// the confidence tier and the scaffold-endorsement signal, not by less rigor.
type Disease string

const (
	DiseasePD Disease = "pd"
	DiseaseAD Disease = "ad"
)

// Diseases is the canonical order for UI/enumeration (PD is the default anchor).
var Diseases = []Disease{DiseasePD, DiseaseAD}

// Label is the human-facing disease name.
func (d Disease) Label() string {
	switch d {
	case DiseaseAD:
		return "Alzheimer's disease"
	default:
		return "Parkinson's disease"
	}
}

// Short is the compact UI label.
func (d Disease) Short() string {
	switch d {
	case DiseaseAD:
		return "Alzheimer's"
	default:
		return "Parkinson's"
	}
}

// MeSH is the curated-DirectEvidence disease identifier (CTD).
func (d Disease) MeSH() string {
	switch d {
	case DiseaseAD:
		return "MESH:D000544" // Alzheimer Disease
	default:
		return "MESH:D010300" // Parkinson Disease
	}
}

// Valid reports whether d is a known disease axis.
func (d Disease) Valid() bool {
	return d == DiseasePD || d == DiseaseAD
}

// ParseDisease maps a query/tool value to a disease, defaulting to PD.
func ParseDisease(s string) Disease {
	switch s {
	case "ad", "alzheimers", "alzheimer":
		return DiseaseAD
	default:
		return DiseasePD
	}
}

// DiseaseInfo describes a disease axis for the UI's top-level filter: the anchor
// AOP, whether that anchor is OECD-endorsed, and a calibration note. This is what
// lets the chip bar set the honesty context the instant a user switches axes.
type DiseaseInfo struct {
	Disease        Disease `json:"disease"`
	Label          string  `json:"label"`
	Short          string  `json:"short"`
	AnchorAOP      string  `json:"anchorAop"`
	AnchorEndorsed bool    `json:"anchorEndorsed"`
	Note           string  `json:"note"`
	CompoundCount  int     `json:"compoundCount"`
}
