package aitio

import (
	"testing"

	contract "aitiome/contract/goapi"
)

// TestCandidateQueueInvariants locks ADR-0006's honesty guarantees: the queue
// loads for both axes, every adversarial decoy (control) scores 0 and ranks
// after every real candidate, and the held-out prioritization backtest passes
// (a known positive, scored on non-curated strands alone, outranks every decoy).
// If the VOI ranker ever lets a decoy float up, this fails.
func TestCandidateQueueInvariants(t *testing.T) {
	svc, err := New()
	if err != nil {
		t.Fatalf("New: %v", err)
	}
	for _, d := range []contract.Disease{contract.DiseasePD, contract.DiseaseAD} {
		q := svc.Candidates(nil, d)
		if len(q.Candidates) == 0 {
			t.Fatalf("%s: empty candidate queue", d)
		}

		seenControl := false
		lastReal := -1.0
		for i, c := range q.Candidates {
			if c.IsControl {
				seenControl = true
				if c.Score != 0 {
					t.Errorf("%s: control %q scored %.1f, want 0", d, c.Name, c.Score)
				}
			} else {
				if seenControl {
					t.Errorf("%s: real candidate %q ranked after a control (index %d)", d, c.Name, i)
				}
				// real candidates must be in non-increasing score order
				if lastReal >= 0 && c.Score > lastReal {
					t.Errorf("%s: candidate %q score %.1f out of order (> previous %.1f)", d, c.Name, c.Score, lastReal)
				}
				lastReal = c.Score
			}
		}

		if q.Backtest == nil {
			t.Fatalf("%s: missing held-out backtest", d)
		}
		if !q.Backtest.Passed {
			t.Errorf("%s: backtest failed — held-out %q scored %.1f vs decoy max %.1f",
				d, q.Backtest.HeldOut, q.Backtest.HeldOutScore, q.Backtest.DecoyMaxScore)
		}
	}
}
