package aitio

import (
	"os"
	"strings"
	"testing"
)

// TestSynthesisDirect exercises the deterministic reasoner (no network). It must
// produce cited prose that never contradicts the fixed call, for both a recovered
// positive and a rejected decoy.
func TestSynthesisDirect(t *testing.T) {
	// Force the direct path so tests never make a billed API call.
	os.Setenv("AITIO_LLM_SYNTHESIS", "0")

	svc, err := New()
	if err != nil {
		t.Fatalf("New: %v", err)
	}
	if active, _ := svc.ReasonerInfo(); active {
		t.Fatal("expected direct reasoner in tests, got Claude-backed")
	}

	rot, ok := svc.Synthesize(nil, "rotenone")
	if !ok {
		t.Fatal("rotenone did not synthesize")
	}
	if rot.Source != "direct" || rot.Call != "positive" {
		t.Errorf("rotenone: source=%s call=%s, want direct/positive", rot.Source, rot.Call)
	}
	if len(rot.Citations) == 0 || !strings.Contains(rot.Prose, "[E1]") {
		t.Error("rotenone synthesis missing citations")
	}
	if !strings.Contains(rot.Prose, "not a claim of causation") {
		t.Error("positive synthesis must carry the no-causation guardrail")
	}

	war, ok := svc.Synthesize(nil, "warfarin")
	if !ok {
		t.Fatal("warfarin did not synthesize")
	}
	if war.Call != "negative" {
		t.Errorf("warfarin call = %s, want negative", war.Call)
	}
	if !strings.Contains(war.Prose, "not activity") {
		t.Error("decoy synthesis must state it reasons on curated mechanism, not activity")
	}
}
