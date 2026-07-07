package aitio

import (
	"embed"
	"encoding/csv"
	"fmt"
	"strconv"
	"strings"

	contract "aitiome/contract/goapi"
)

// dataFS holds the recon-derived inputs the engine reasons over. These are data
// inputs to the app (loaded read-only), not a re-derivation of the recon.
//
//go:embed data/*.csv data/*.json
var dataFS embed.FS

// loadValidationSet parses data/validation_set.csv into the ground-truth set:
// 12 positives (6 assay_mechanism_recovered + 6 curated_anchored_only) and
// 15 negatives (incl. 6 adversarial decoys). confidence_tier is preserved verbatim.
func loadValidationSet() ([]contract.Compound, error) {
	b, err := dataFS.ReadFile("data/validation_set.csv")
	if err != nil {
		return nil, fmt.Errorf("read validation_set: %w", err)
	}
	r := csv.NewReader(strings.NewReader(string(b)))
	rows, err := r.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("parse validation_set: %w", err)
	}
	if len(rows) < 2 {
		return nil, fmt.Errorf("validation_set: no data rows")
	}
	col := index(rows[0])

	out := make([]contract.Compound, 0, len(rows)-1)
	for _, row := range rows[1:] {
		get := func(name string) string {
			if i, ok := col[name]; ok && i < len(row) {
				return strings.TrimSpace(row[i])
			}
			return ""
		}
		c := contract.Compound{
			Name:           get("name"),
			Role:           contract.Role(get("role")),
			ConfidenceTier: contract.ConfidenceTier(get("confidence_tier")),
			Mech:           get("mech"),
			Note:           get("note"),
			CID:            atoi(get("cid")),
			CAS:            get("cas"),
			InChIKey:       get("inchikey"),
			SMILES:         get("smiles"),
			DTXSID:         get("dtxsid"),
			ToxcastCAS:     get("toxcast_cas"),
			PDDirect:       atoi(get("pd_direct")),
			ADDirect:       atoi(get("ad_direct")),
			AOPStressorOf:  splitIDs(get("aop_stressor_of")),
			AOP3Stressor:   parseBool(get("aop3_stressor")),
			InNeurotoxKb:   parseBool(get("in_neurotoxkb")),
			ToxcastTested:  atoi(get("toxcast_tested")),
			ToxcastActive:  atoi(get("toxcast_active")),
			MitoActive:     atoi(get("mito_active")),
			MMPActive:      atoi(get("mmp_active")),
			OxStressActive: atoi(get("oxstress_active")),
			NeuroActive:    atoi(get("neuro_active")),
			MechActiveTotal: atoi(get("mech_active_total")),
			GeneIxnsHuman:  atoi(get("gene_ixns_human")),
			AOP3GeneHits:   atoi(get("aop3_gene_hit_count")),
			CoverageGrade:  get("coverage_grade"),
		}
		out = append(out, c)
	}
	return out, nil
}

func index(header []string) map[string]int {
	m := make(map[string]int, len(header))
	for i, h := range header {
		m[strings.TrimSpace(h)] = i
	}
	return m
}

func atoi(s string) int {
	if s == "" {
		return 0
	}
	n, err := strconv.Atoi(s)
	if err != nil {
		return 0
	}
	return n
}

func parseBool(s string) bool {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "true", "1", "yes":
		return true
	}
	return false
}

// splitIDs parses a "12|499|500" style list of AOP ids.
func splitIDs(s string) []string {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil
	}
	parts := strings.Split(s, "|")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	return out
}
