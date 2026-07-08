package aitio

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"strings"

	contract "aitiome/contract/goapi"
)

// MVPAnchorAOP is AOP-3: complex-I inhibition -> nigrostriatal dopaminergic
// degeneration -> parkinsonian motor deficits (docs/build-kickoff.md).
const MVPAnchorAOP = "3"

// scaffoldFile mirrors the aop_scaffold.json shape (no RDF parsing in-window).
type scaffoldFile struct {
	AOPs []scaffoldAOP `json:"aops"`
}

type scaffoldAOP struct {
	AOPID       string `json:"aop_id"`
	Title       string `json:"title"`
	OECDStatus  string `json:"oecd_status"`
	Endorsed    bool   `json:"is_oecd_endorsed"`
	URL         string `json:"url"`
	KeyEvents   []struct {
		EventID string `json:"event_id"`
		Title   string `json:"title"`
		Role    string `json:"role"`
	} `json:"key_events"`
	KERs []struct {
		KerID      string `json:"ker_id"`
		Upstream   string `json:"upstream_event_id"`
		Downstream string `json:"downstream_event_id"`
	} `json:"key_event_relationships"`
}

// loadPathways builds every AOP in the scaffold into a positioned, grounded
// Pathway, keyed by AOP id.
func loadPathways() (map[string]contract.Pathway, error) {
	b, err := dataFS.ReadFile("data/aop_scaffold.json")
	if err != nil {
		return nil, fmt.Errorf("read aop_scaffold: %w", err)
	}
	var sf scaffoldFile
	if err := json.Unmarshal(b, &sf); err != nil {
		return nil, fmt.Errorf("parse aop_scaffold: %w", err)
	}

	grounding, err := loadGrounding()
	if err != nil {
		return nil, err
	}

	out := make(map[string]contract.Pathway, len(sf.AOPs))
	for _, a := range sf.AOPs {
		out[a.AOPID] = buildPathway(a, grounding)
	}
	if _, ok := out[MVPAnchorAOP]; !ok {
		return nil, fmt.Errorf("aop_scaffold missing MVP anchor AOP-%s", MVPAnchorAOP)
	}
	return out, nil
}

func buildPathway(a scaffoldAOP, g groundingSets) contract.Pathway {
	// Index roles and build adjacency for layering.
	role := map[string]contract.EventRole{}
	title := map[string]string{}
	for _, ke := range a.KeyEvents {
		role[ke.EventID] = contract.EventRole(ke.Role)
		title[ke.EventID] = ke.Title
	}

	loop := detectBackEdges(a)
	layer := layerize(a, loop)

	nodes := make([]contract.PathwayNode, 0, len(a.KeyEvents))
	for _, ke := range a.KeyEvents {
		n := contract.PathwayNode{
			EventID: ke.EventID,
			Title:   ke.Title,
			Role:    contract.EventRole(ke.Role),
			Layer:   layer[ke.EventID],
		}
		if gr := g.forEvent(ke.EventID); gr != nil {
			n.Grounding = gr
		}
		nodes = append(nodes, n)
	}

	edges := make([]contract.PathwayEdge, 0, len(a.KERs))
	for _, k := range a.KERs {
		edges = append(edges, contract.PathwayEdge{
			KerID:      k.KerID,
			Upstream:   k.Upstream,
			Downstream: k.Downstream,
			IsLoop:     loop[k.KerID],
			Confidence: 0.9, // endorsed KER; refined by evidence in a later commit
		})
	}

	return contract.Pathway{
		AopID:        a.AOPID,
		Title:        a.Title,
		OECDEndorsed: a.Endorsed,
		URL:          a.URL,
		Nodes:        nodes,
		Edges:        edges,
	}
}

// detectBackEdges finds edges that close a cycle in a DFS from the MIE, so the
// 188<->890 neuroinflammation feedback loop is rendered as a loop rather than
// breaking the forward layering.
func detectBackEdges(a scaffoldAOP) map[string]bool {
	adj := map[string][]struct{ ker, to string }{}
	for _, k := range a.KERs {
		adj[k.Upstream] = append(adj[k.Upstream], struct{ ker, to string }{k.KerID, k.Downstream})
	}
	start := ""
	for _, ke := range a.KeyEvents {
		if contract.EventRole(ke.Role) == contract.RoleMIE {
			start = ke.EventID
			break
		}
	}
	loop := map[string]bool{}
	state := map[string]int{} // 0 unvisited, 1 in-stack, 2 done
	var dfs func(u string)
	dfs = func(u string) {
		state[u] = 1
		for _, e := range adj[u] {
			switch state[e.to] {
			case 1:
				loop[e.ker] = true // back-edge
			case 0:
				dfs(e.to)
			}
		}
		state[u] = 2
	}
	if start != "" {
		dfs(start)
	}
	// Any nodes not reached from the MIE: DFS them too (defensive).
	for _, ke := range a.KeyEvents {
		if state[ke.EventID] == 0 {
			dfs(ke.EventID)
		}
	}
	return loop
}

// layerize assigns each event a layer = longest forward path from the MIE,
// ignoring loop edges. Nodes unreachable forward fall back to layer 0.
func layerize(a scaffoldAOP, loop map[string]bool) map[string]int {
	layer := map[string]int{}
	for _, ke := range a.KeyEvents {
		layer[ke.EventID] = 0
	}
	// Relax repeatedly (small graphs) over non-loop edges.
	for i := 0; i < len(a.KeyEvents); i++ {
		changed := false
		for _, k := range a.KERs {
			if loop[k.KerID] {
				continue
			}
			if layer[k.Upstream]+1 > layer[k.Downstream] {
				layer[k.Downstream] = layer[k.Upstream] + 1
				changed = true
			}
		}
		if !changed {
			break
		}
	}
	return layer
}

// --- Grounding (MitoCarta Complex-I Q-site subunits + Kamath vulnerable DA neurons) ---

type groundingSets struct {
	qsiteGenes   []string
	vulnerableDA []string
	adMicroglia  []string
	mitoSource   string
	daSource     string
	adSource     string
}

// forEvent returns grounding for the events that carry it. AOP-3 (PD): the MIE/CI
// nodes get the Q-site subunits; the DA-degeneration and AO nodes get the
// vulnerable DA neuron population. AD AOPs (12/48/…): the neurodegeneration and
// learning/memory AO nodes (352, 341 — absent from AOP-3, so PD is unaffected)
// get the AD disease-associated microglia population, the AD hero terminal frame.
func (g groundingSets) forEvent(eventID string) *contract.Grounding {
	switch eventID {
	case "888", "887": // binding of inhibitor / inhibition of complex I (PD MIE)
		return &contract.Grounding{Kind: "mie_genes", Genes: g.qsiteGenes, Source: g.mitoSource}
	case "890", "896": // DA neuron degeneration / parkinsonian deficits (PD AO)
		return &contract.Grounding{Kind: "ao_celltype", CellTypes: g.vulnerableDA, Source: g.daSource}
	case "352", "341": // neurodegeneration / learning-memory impairment (AD AO)
		return &contract.Grounding{Kind: "ao_celltype", CellTypes: g.adMicroglia, Source: g.adSource}
	}
	return nil
}

func loadGrounding() (groundingSets, error) {
	g := groundingSets{
		mitoSource: "MitoCarta3.0 (Complex I Q-site core subunits)",
		daSource:   "Kamath 2022 Nat Neurosci (SN vulnerable DA neurons)",
		adSource:   "Bellenguez 2022 / DAM (disease-associated microglia)",
	}
	// MitoCarta Complex-I Q-site core subunits.
	mb, err := dataFS.ReadFile("data/mitocarta_complexI.csv")
	if err != nil {
		return g, fmt.Errorf("read mitocarta: %w", err)
	}
	rows, err := csv.NewReader(strings.NewReader(string(mb))).ReadAll()
	if err != nil {
		return g, fmt.Errorf("parse mitocarta: %w", err)
	}
	mcol := index(rows[0])
	for _, row := range rows[1:] {
		if parseBool(row[mcol["is_qsite_core"]]) {
			g.qsiteGenes = append(g.qsiteGenes, strings.TrimSpace(row[mcol["Symbol"]]))
		}
	}
	// Kamath vulnerable DA neuron marker genes.
	bb, err := dataFS.ReadFile("data/brain_cell_genesets.csv")
	if err != nil {
		return g, fmt.Errorf("read brain_cell_genesets: %w", err)
	}
	brows, err := csv.NewReader(strings.NewReader(string(bb))).ReadAll()
	if err != nil {
		return g, fmt.Errorf("parse brain_cell_genesets: %w", err)
	}
	bcol := index(brows[0])
	for _, row := range brows[1:] {
		switch strings.TrimSpace(row[bcol["set"]]) {
		case "DA_neuron_vulnerable":
			g.vulnerableDA = append(g.vulnerableDA, strings.TrimSpace(row[bcol["gene"]]))
		case "AD_microglia_vulnerable":
			g.adMicroglia = append(g.adMicroglia, strings.TrimSpace(row[bcol["gene"]]))
		}
	}
	return g, nil
}
