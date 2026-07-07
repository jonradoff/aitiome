package aitio

import (
	"strconv"
	"strings"

	contract "aitiome/contract/goapi"
)

// resolver does DTXSID-first identifier resolution over the curated validation
// set. For the validation engine, "resolution" means mapping any identifier a
// user throws at us (name, CAS, DTXSID, InChIKey, CID) to the ONE salt-form-correct
// record we reason over — the correctness spine (docs/recon/data-source-map.md
// RISK 1: PubChem-synonym guessing silently picks the wrong salt, e.g. paraquat
// parent vs. paraquat dichloride).
type resolver struct {
	byKey map[string]int // normalized identifier -> index into compounds
}

func newResolver(compounds []contract.Compound) *resolver {
	r := &resolver{byKey: make(map[string]int)}
	for i, c := range compounds {
		r.put(c.Name, i)
		r.put(c.DTXSID, i)
		r.put(c.CAS, i)
		r.put(c.ToxcastCAS, i) // the tested salt form resolves back to the parent record
		r.put(c.InChIKey, i)
		if c.CID != 0 {
			r.put(strconv.Itoa(c.CID), i)
			r.put("cid:"+strconv.Itoa(c.CID), i)
		}
	}
	return r
}

func (r *resolver) put(key string, idx int) {
	key = normalizeID(key)
	if key == "" {
		return
	}
	// First writer wins: the parent record registers its own name/DTXSID before
	// any shared synonym, so we never shadow a canonical record.
	if _, exists := r.byKey[key]; !exists {
		r.byKey[key] = idx
	}
}

// resolve returns the index of the matching compound, or -1.
func (r *resolver) resolve(id string) int {
	if i, ok := r.byKey[normalizeID(id)]; ok {
		return i
	}
	return -1
}

func normalizeID(s string) string {
	return strings.ToLower(strings.TrimSpace(s))
}
