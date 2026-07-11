package rlm

import (
	"fmt"
	"sort"
	"strings"
	"sync"

	sdk "github.com/anthropics/anthropic-sdk-go"
)

// Model IDs. Orchestration (planner + critic + final synthesis) runs on Opus 4.8;
// leaf investigations run on Sonnet 4.6 (the user's mixed-model choice — Sonnet is
// capable at "read this snippet, emit a typed evidence object" and ~40% cheaper).
const (
	ModelOpus   = "claude-opus-4-8"
	ModelSonnet = "claude-sonnet-4-6"
)

// per-MTok pricing (confirmed via the claude-api skill, 2026-05): input / output.
type price struct{ in, out float64 }

var prices = map[string]price{
	ModelOpus:          {5, 25},
	ModelSonnet:        {3, 15},
	"claude-haiku-4-5": {1, 5},
}

const (
	cacheReadMult  = 0.10 // cache reads ~0.1x input
	cacheWriteMult = 1.25 // 5-minute cache writes 1.25x input
	webSearchEach  = 10.0 / 1000.0
	webFetchEach   = 10.0 / 1000.0 // treat fetch like search for a rough bound
)

type modelUsage struct {
	Calls                          int
	In, Out, CacheRead, CacheWrite int64
}

// Cost accumulates token usage across every model call in a run and prices it.
// Thread-safe (leaves run in parallel).
type Cost struct {
	mu          sync.Mutex
	byModel     map[string]*modelUsage
	WebSearches int64
	WebFetches  int64
}

func NewCost() *Cost { return &Cost{byModel: map[string]*modelUsage{}} }

// Add folds one response's usage into the accumulator under its served model.
func (c *Cost) Add(model string, u sdk.Usage) {
	c.mu.Lock()
	defer c.mu.Unlock()
	m := c.byModel[model]
	if m == nil {
		m = &modelUsage{}
		c.byModel[model] = m
	}
	m.Calls++
	m.In += u.InputTokens
	m.Out += u.OutputTokens
	m.CacheRead += u.CacheReadInputTokens
	m.CacheWrite += u.CacheCreationInputTokens
	c.WebSearches += u.ServerToolUse.WebSearchRequests
	c.WebFetches += u.ServerToolUse.WebFetchRequests
}

// Dollars totals the priced cost of the run.
func (c *Cost) Dollars() float64 {
	c.mu.Lock()
	defer c.mu.Unlock()
	total := 0.0
	for model, m := range c.byModel {
		p := prices[model]
		if p.in == 0 { // unknown model served — price at Opus as a conservative bound
			p = prices[ModelOpus]
		}
		total += float64(m.In)/1e6*p.in +
			float64(m.CacheRead)/1e6*p.in*cacheReadMult +
			float64(m.CacheWrite)/1e6*p.in*cacheWriteMult +
			float64(m.Out)/1e6*p.out
	}
	total += float64(c.WebSearches)*webSearchEach + float64(c.WebFetches)*webFetchEach
	return total
}

// Report renders a human-readable cost + token breakdown.
func (c *Cost) Report() string {
	c.mu.Lock()
	models := make([]string, 0, len(c.byModel))
	for k := range c.byModel {
		models = append(models, k)
	}
	c.mu.Unlock()
	sort.Strings(models)
	var b strings.Builder
	fmt.Fprintf(&b, "  cost: $%.4f\n", c.Dollars())
	for _, model := range models {
		m := c.byModel[model]
		fmt.Fprintf(&b, "  %-20s calls=%d  in=%d  cacheRead=%d  cacheWrite=%d  out=%d\n",
			model, m.Calls, m.In, m.CacheRead, m.CacheWrite, m.Out)
	}
	fmt.Fprintf(&b, "  web: %d searches, %d fetches\n", c.WebSearches, c.WebFetches)
	return b.String()
}

// TotalCalls is the number of model calls across all models (a fragility/latency proxy).
func (c *Cost) TotalCalls() int {
	c.mu.Lock()
	defer c.mu.Unlock()
	n := 0
	for _, m := range c.byModel {
		n += m.Calls
	}
	return n
}
