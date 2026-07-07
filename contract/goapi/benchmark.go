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

// SourceAblation directly addresses the circularity critique: it shows the two
// curated predicate terms come from INDEPENDENT curation efforts and each alone
// recovers only part of the positive set, so their convergence is not one source
// read twice. Both are 0 false-positives on the negatives.
type SourceAblation struct {
	CTDName        string `json:"ctdName"`
	AOPName        string `json:"aopName"`
	CTDRecovered   int    `json:"ctdRecovered"`   // positives recovered by the CTD term alone
	AOPRecovered   int    `json:"aopRecovered"`   // positives recovered by the AOP term alone
	UnionRecovered int    `json:"unionRecovered"` // positives recovered by the rule (CTD OR AOP)
	Positives      int    `json:"positives"`
	CTDFalsePos    int    `json:"ctdFalsePos"`
	AOPFalsePos    int    `json:"aopFalsePos"`
	Negatives      int    `json:"negatives"`
	Note           string `json:"note"`
}

// Benchmark is the falsification harness result: the curated rule's perfect
// separation next to the bioactivity signals' chance-level separation against the
// decoys, plus the source-independence ablation. Computed live, not asserted.
type Benchmark struct {
	CuratedRule    Confusion       `json:"curatedRule"`
	Bioactivity    []Discriminator `json:"bioactivity"`
	Ablation       SourceAblation  `json:"ablation"`
	Positives      int             `json:"positives"`
	Adversarial    int             `json:"adversarial"`
	AllNegatives   int             `json:"allNegatives"`
	Interpretation string          `json:"interpretation"`
}
