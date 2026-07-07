package contract

// DiscoveryAxis is one investigated route to an annotation-independent discovery
// signal, with the recon's verdict and why. Shipping this map — why unsupervised
// discovery does not drop in for free on this chemical class — is a first-class,
// honest deliverable.
type DiscoveryAxis struct {
	Name     string `json:"name"`
	Verdict  string `json:"verdict"` // coverage_killed | confounder_killed | qualified_lead | conditional_lead | skip
	Metric   string `json:"metric,omitempty"`
	Coverage string `json:"coverage,omitempty"`
	Reason   string `json:"reason"`
	IsLead   bool   `json:"isLead"`
}

// DiscoveryMap is the negative-results map plus the two live leads.
type DiscoveryMap struct {
	Headline  string          `json:"headline"`
	Axes      []DiscoveryAxis `json:"axes"`
	LiveLeads []string        `json:"liveLeads"`
	Note      string          `json:"note"`
}
