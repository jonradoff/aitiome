package aitio

import (
	"testing"

	contract "aitiome/contract/goapi"
)

// TestAnchorPathway pins the AOP-3 spine: 7 key events, MIE 888, AO 896, the
// 888->887->177->890->896 layering, a detected 188<->890 feedback loop, and
// grounding on the MIE (Q-site genes) and AO (vulnerable DA neurons).
func TestAnchorPathway(t *testing.T) {
	svc, err := New()
	if err != nil {
		t.Fatalf("New: %v", err)
	}
	p := svc.AnchorPathway(nil)

	if p.AopID != "3" || !p.OECDEndorsed {
		t.Fatalf("anchor: got AOP-%s endorsed=%v, want AOP-3 endorsed", p.AopID, p.OECDEndorsed)
	}
	if len(p.Nodes) != 7 {
		t.Errorf("want 7 key events, got %d", len(p.Nodes))
	}

	node := map[string]contract.PathwayNode{}
	for _, n := range p.Nodes {
		node[n.EventID] = n
	}
	if node["888"].Role != contract.RoleMIE {
		t.Errorf("888 role = %q, want MIE", node["888"].Role)
	}
	if node["896"].Role != contract.RoleAO {
		t.Errorf("896 role = %q, want AO", node["896"].Role)
	}
	// Forward layering along the spine.
	if !(node["888"].Layer < node["887"].Layer &&
		node["887"].Layer < node["177"].Layer &&
		node["177"].Layer < node["890"].Layer &&
		node["890"].Layer < node["896"].Layer) {
		t.Errorf("spine not monotonically layered: 888=%d 887=%d 177=%d 890=%d 896=%d",
			node["888"].Layer, node["887"].Layer, node["177"].Layer, node["890"].Layer, node["896"].Layer)
	}
	// Grounding present where the hero visual needs it.
	if g := node["888"].Grounding; g == nil || len(g.Genes) == 0 {
		t.Error("MIE 888 missing Q-site gene grounding")
	}
	if g := node["890"].Grounding; g == nil || len(g.CellTypes) == 0 {
		t.Error("AO-adjacent 890 missing vulnerable-DA-neuron grounding")
	}

	// The 188<->890 neuroinflammation loop must be flagged (exactly one back-edge).
	var loops int
	for _, e := range p.Edges {
		if e.IsLoop {
			loops++
		}
	}
	if loops != 1 {
		t.Errorf("want exactly 1 loop edge (188<->890 feedback), got %d", loops)
	}
}
