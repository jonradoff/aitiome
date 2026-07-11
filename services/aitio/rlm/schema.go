// Package rlm is the OFFLINE RLM-vs-RAG evidence-assembly experiment (ADR-0007,
// sprint brief). It is NOT on the live app request path and never touches the
// deterministic recovery gate — it assembles a typed, source-resolved evidence
// bundle that the SAME deterministic predicate could later grade. RLM here follows
// Zhang, Kraska & Khattab, "Recursive Language Models," arXiv:2512.24601 (2025):
// decompose a long problem into bounded sub-investigations. Depth is fixed at 1
// (the reproduction study, Wang 2026 arXiv:2603.02615, warns deeper recursion
// inflates cost and can hurt accuracy).
package rlm

import (
	"bytes"
	"encoding/json"
	"sort"
	"strings"
)

// flexStrings tolerates an LLM emitting a list field as either a JSON array or a
// bare scalar string (a very common inconsistency). Without this, a single object
// that writes `"limitations": "none"` instead of `["none"]` fails json.Unmarshal
// for the WHOLE array and silently zeroes every object.
type flexStrings []string

func (f *flexStrings) UnmarshalJSON(b []byte) error {
	b = bytes.TrimSpace(b)
	if len(b) == 0 || string(b) == "null" {
		return nil
	}
	if b[0] == '[' {
		// Array — decode elementwise so a non-string element (number, object) is
		// coerced to its raw text rather than failing the whole parse.
		var raw []json.RawMessage
		if err := json.Unmarshal(b, &raw); err != nil {
			return err
		}
		out := make([]string, 0, len(raw))
		for _, r := range raw {
			var s string
			if json.Unmarshal(r, &s) == nil {
				out = append(out, s)
			} else {
				out = append(out, strings.TrimSpace(string(r)))
			}
		}
		*f = out
		return nil
	}
	// Scalar string.
	var s string
	if err := json.Unmarshal(b, &s); err != nil {
		return err
	}
	*f = flexStrings{s}
	return nil
}

// Source is a resolvable primary-source pointer with the exact supporting span.
type Source struct {
	DOI        string `json:"doi,omitempty"`
	PMID       string `json:"pmid,omitempty"`
	URL        string `json:"url,omitempty"`
	QuotedSpan string `json:"quoted_span,omitempty"`
}

// StudyContext captures the experimental frame so co-mention can't masquerade as
// mechanism (species/tissue/dose/route).
type StudyContext struct {
	Species string `json:"species,omitempty"`
	Tissue  string `json:"tissue,omitempty"`
	Dose    string `json:"dose,omitempty"`
	Route   string `json:"route,omitempty"`
}

// ChemIdentity is the resolved identity the object is about.
type ChemIdentity struct {
	DTXSID string `json:"dtxsid,omitempty"`
	Name   string `json:"name,omitempty"`
	Form   string `json:"form,omitempty"`
}

// PathwayEdge names an MIE→KE / KE→AO edge when the claim is mechanistic.
type PathwayEdge struct {
	SourceNode string `json:"source_node,omitempty"`
	TargetNode string `json:"target_node,omitempty"`
}

// EvidenceObject is the typed leaf output — the unit every system emits, so RAG
// and RLM are scored on the same schema (sprint brief §5.2).
type EvidenceObject struct {
	Claim              string        `json:"claim"`
	ChemicalIdentity   ChemIdentity  `json:"chemical_identity"`
	Disease            string        `json:"disease"`
	PathwayEdge        *PathwayEdge  `json:"pathway_edge,omitempty"`
	EvidenceRole       string        `json:"evidence_role"` // diagnostic | corroboration | grounding | counterevidence
	StudyContext       StudyContext  `json:"study_context"`
	Direction          string        `json:"direction"` // supports | contradicts | limits | unresolved
	Source             Source        `json:"source"`
	ConfidenceBasis    flexStrings   `json:"confidence_basis,omitempty"`
	Limitations        flexStrings   `json:"limitations,omitempty"`
	VerificationStatus string        `json:"verification_status"` // unverified | source-resolved | schema-validated
	// filled by the harness, not the model:
	Task    string `json:"task,omitempty"`   // which subproblem produced it (RLM)
	Dropped string `json:"dropped,omitempty"` // reason if rejected by the validator
}

var evidenceRoles = map[string]bool{"diagnostic": true, "corroboration": true, "grounding": true, "counterevidence": true}
var directions = map[string]bool{"supports": true, "contradicts": true, "limits": true, "unresolved": true}

// Validate applies the deterministic acceptance rule (brief §5.3): reject any
// object lacking a resolvable primary source, an exact supporting span, or a
// resolved chemical identity; normalize the controlled vocabularies. Accepted
// objects come back with verification_status="schema-validated"; rejects are
// returned separately with a reason. No LLM in this step.
func Validate(objs []EvidenceObject, target ChemIdentity) (accepted, rejected []EvidenceObject) {
	tName := strings.ToLower(strings.TrimSpace(target.Name))
	tDTX := strings.ToUpper(strings.TrimSpace(target.DTXSID))
	for _, o := range objs {
		if reason := reject(o, tName, tDTX); reason != "" {
			o.Dropped = reason
			rejected = append(rejected, o)
			continue
		}
		o.EvidenceRole = strings.ToLower(strings.TrimSpace(o.EvidenceRole))
		o.Direction = strings.ToLower(strings.TrimSpace(o.Direction))
		o.VerificationStatus = "schema-validated"
		accepted = append(accepted, o)
	}
	return accepted, rejected
}

func reject(o EvidenceObject, tName, tDTX string) string {
	src := o.Source
	if strings.TrimSpace(src.DOI) == "" && strings.TrimSpace(src.PMID) == "" && strings.TrimSpace(src.URL) == "" {
		return "no resolvable primary source (doi/pmid/url)"
	}
	if len(strings.TrimSpace(src.QuotedSpan)) < 12 {
		return "no exact supporting span"
	}
	if strings.TrimSpace(o.Claim) == "" {
		return "empty claim"
	}
	if !evidenceRoles[strings.ToLower(strings.TrimSpace(o.EvidenceRole))] {
		return "invalid evidence_role: " + o.EvidenceRole
	}
	if !directions[strings.ToLower(strings.TrimSpace(o.Direction))] {
		return "invalid direction: " + o.Direction
	}
	// identity must resolve to the target (by DTXSID or by name substring match)
	oName := strings.ToLower(strings.TrimSpace(o.ChemicalIdentity.Name))
	oDTX := strings.ToUpper(strings.TrimSpace(o.ChemicalIdentity.DTXSID))
	idOK := (tDTX != "" && oDTX == tDTX) ||
		(oName != "" && tName != "" && (strings.Contains(oName, tName) || strings.Contains(tName, oName)))
	if !idOK {
		return "unresolved / mismatched chemical identity"
	}
	return ""
}

// Merge deduplicates accepted objects by normalized identity + pathway edge +
// study context + source, keeping supporting and contradicting evidence SEPARATE
// (never averaged). Deterministic; order-stable.
func Merge(objs []EvidenceObject) []EvidenceObject {
	seen := map[string]bool{}
	out := make([]EvidenceObject, 0, len(objs))
	for _, o := range objs {
		k := MergeKey(o)
		if seen[k] {
			continue
		}
		seen[k] = true
		out = append(out, o)
	}
	sort.SliceStable(out, func(i, j int) bool { return out[i].EvidenceRole < out[j].EvidenceRole })
	return out
}

// MergeKey is the identity of an evidence object for dedup and cross-system
// comparison: chemical | pathway edge | species | dose | direction | source.
func MergeKey(o EvidenceObject) string {
	return strings.ToLower(strings.Join([]string{
		firstNonEmpty(o.ChemicalIdentity.DTXSID, o.ChemicalIdentity.Name),
		edgeKey(o.PathwayEdge), o.StudyContext.Species, o.StudyContext.Dose,
		o.Direction, firstNonEmpty(o.Source.DOI, o.Source.PMID, o.Source.URL),
	}, "|"))
}

func edgeKey(e *PathwayEdge) string {
	if e == nil {
		return ""
	}
	return e.SourceNode + "→" + e.TargetNode
}
func firstNonEmpty(ss ...string) string {
	for _, s := range ss {
		if strings.TrimSpace(s) != "" {
			return s
		}
	}
	return ""
}

// RoleCoverage counts distinct evidence roles present (a coverage proxy).
func RoleCoverage(objs []EvidenceObject) map[string]int {
	m := map[string]int{}
	for _, o := range objs {
		m[o.EvidenceRole]++
	}
	return m
}
