package rlm

import "testing"

// A JSON evidence array truncated mid-object by the model's token limit — the run6
// failure mode. The first two objects are complete; the third is cut off.
const truncatedArray = "```json\n" + `[
  {
    "claim": "TCE inhibits mitochondrial complex I in nigral neurons",
    "chemical_identity": {"dtxsid": "DTXSID1021383", "name": "trichloroethylene", "form": "parent"},
    "disease": "PD",
    "pathway_edge": {"source_node": "complex I inhibition", "target_node": "dopaminergic degeneration"},
    "evidence_role": "corroboration",
    "study_context": {"species": "rat", "tissue": "nigra", "dose": "high", "route": "oral"},
    "direction": "supports",
    "source": {"pmid": "18306852", "quoted_span": "TCE produced selective complex I inhibition {bracket in text}"},
    "confidence_basis": "primary source",
    "limitations": ["rodent only"],
    "verification_status": "source-resolved"
  },
  {
    "claim": "PCE shares the chlorinated-solvent scaffold with TCE",
    "chemical_identity": {"dtxsid": "DTXSID8021397", "name": "perchloroethylene", "form": "parent"},
    "disease": "PD",
    "evidence_role": "grounding",
    "study_context": {"species": "human"},
    "direction": "supports",
    "source": {"doi": "10.1002/ana.23747", "quoted_span": "PCE and TCE are structurally related solvents"},
    "verification_status": "source-resolved"
  },
  {
    "claim": "PCE occupational exposure trends with PD risk",
    "chemical_identity": {"dtxsid": "DTXSID8021397", "name": "perchloroethylene",
    "source": {"pm`

// TestSalvageTruncatedArray locks in the two-layer defense against token-limit
// truncation: the whole-array parse fails, but every COMPLETE object is salvaged
// (the incomplete trailing one is dropped), and flexStrings tolerates
// confidence_basis emitted as a bare string.
func TestSalvageTruncatedArray(t *testing.T) {
	objs := extractEvidence(truncatedArray)
	if len(objs) != 2 {
		t.Fatalf("expected 2 salvaged objects, got %d", len(objs))
	}
	if objs[0].Source.PMID != "18306852" {
		t.Errorf("obj0 pmid = %q, want 18306852", objs[0].Source.PMID)
	}
	// confidence_basis was a bare string, not an array — flexStrings must coerce it.
	if len(objs[0].ConfidenceBasis) != 1 || objs[0].ConfidenceBasis[0] != "primary source" {
		t.Errorf("flexStrings did not coerce scalar confidence_basis: %#v", objs[0].ConfidenceBasis)
	}
	if objs[1].ChemicalIdentity.Name != "perchloroethylene" {
		t.Errorf("obj1 name = %q", objs[1].ChemicalIdentity.Name)
	}
}
