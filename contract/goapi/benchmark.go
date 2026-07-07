package contract

// Discriminator is one candidate signal and how well it separates the classes,
// measured as AUROC (0.5 = chance). The whole point: bioactivity signals collapse
// to chance against the adversarial decoys even though they separate positives
// from inert negatives. That is why the engine never gates on them.
type Discriminator struct {
	Name                string  `json:"name"`
	AUROCvsAdversarial  float64 `json:"aurocVsAdversarial"`  // positives vs the 6 adversarial decoys
	AUROCvsAllNegatives float64 `json:"aurocVsAllNegatives"` // positives vs all 15 negatives
	Coverage            string  `json:"coverage,omitempty"`
}

// Confusion is the 2x2 outcome of a decision rule on the validation set.
type Confusion struct {
	TP       int     `json:"tp"`
	FP       int     `json:"fp"`
	FN       int     `json:"fn"`
	TN       int     `json:"tn"`
	Accuracy float64 `json:"accuracy"`
}

// Benchmark is the falsification harness result: the curated rule's perfect
// separation next to the bioactivity signals' chance-level separation against the
// decoys. Computed live from the validation set, not asserted.
type Benchmark struct {
	CuratedRule    Confusion       `json:"curatedRule"`
	Bioactivity    []Discriminator `json:"bioactivity"`
	Positives      int             `json:"positives"`
	Adversarial    int             `json:"adversarial"`
	AllNegatives   int             `json:"allNegatives"`
	Interpretation string          `json:"interpretation"`
}
