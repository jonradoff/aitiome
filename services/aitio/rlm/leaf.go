package rlm

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync/atomic"
	"time"

	sdk "github.com/anthropics/anthropic-sdk-go"
)

// dumpDir, if set via RLM_DUMP_DIR, receives the raw model response text for every
// investigation — the ground truth for diagnosing extraction/schema failures.
var dumpDir = os.Getenv("RLM_DUMP_DIR")
var dumpSeq int64

func dumpRaw(label, text string) {
	if dumpDir == "" {
		return
	}
	if err := os.MkdirAll(dumpDir, 0o755); err != nil {
		return
	}
	safe := strings.NewReplacer("/", "_", ":", "_", " ", "_").Replace(label)
	n := atomic.AddInt64(&dumpSeq, 1)
	_ = os.WriteFile(filepath.Join(dumpDir, fmt.Sprintf("%03d-%s.txt", n, safe)), []byte(text), 0o644)
}

// webTools returns the server-side web-search tool, capped at maxSearches uses (a
// hard budget control — brief §4). We deliberately use search only (no web_fetch):
// search returns citable excerpts sufficient for evidence + quoted spans, while
// fetch pulls whole pages — the main cost/latency driver — and keeping the call to
// a few searches lets it finish within one server loop (no pause_turn round-trip).
func webTools(maxSearches int64) []sdk.ToolUnionParam {
	return []sdk.ToolUnionParam{
		{OfWebSearchTool20260209: &sdk.WebSearchTool20260209Param{MaxUses: sdk.Int(maxSearches)}},
	}
}

// heartbeat is how often a long-running stream logs liveness, so a hang is visible
// in the log instead of looking identical to steady progress.
const heartbeat = 30 * time.Second

// streamMessage runs one streamed request and returns the assistant's text.
// Server-side web-tool requests run long, so we MUST stream — a non-streaming call
// hits the SDK's ~10-minute HTTP timeout. We deliberately do NOT use the SDK's
// Message.Accumulate: at each stop event it re-marshals the accumulated message,
// which panics-to-error on a server-side web_search_tool_result block whose Content
// RawMessage is empty ("unexpected end of JSON input") — an SDK v1.56.0 bug. Instead
// we pull only what we need (text, usage, model) directly off the event stream.
// Each attempt runs under its own watchdog timeout; transient errors and per-call
// timeouts are retried with exponential backoff, while parent-context cancellation
// and non-retryable client errors abort immediately. Folds usage into cost.
func streamMessage(ctx context.Context, client sdk.Client, params sdk.MessageNewParams, cost *Cost, label string, timeout time.Duration) (string, error) {
	const maxAttempts = 3
	var lastErr error
	netRetried := false // a network error retries at most once (bounds flaky-wifi waste)
	for attempt := 0; attempt < maxAttempts; attempt++ {
		if ctx.Err() != nil {
			return "", ctx.Err()
		}
		if attempt > 0 {
			backoff := time.Duration(1<<uint(attempt-1)) * 4 * time.Second // 4s, 8s
			log.Printf("[rlm] %s: transient (attempt %d/%d), retrying in %s: %v", label, attempt, maxAttempts, backoff, lastErr)
			select {
			case <-ctx.Done():
				return "", ctx.Err()
			case <-time.After(backoff):
			}
		}

		attemptCtx, cancel := context.WithTimeout(ctx, timeout)
		t0 := time.Now()
		stream := client.Messages.NewStreaming(attemptCtx, params)
		var text strings.Builder
		var usage sdk.Usage
		var model string
		var stopReason sdk.StopReason
		events, lastBeat := 0, time.Now()
		for stream.Next() {
			events++
			switch ev := stream.Current().AsAny().(type) {
			case sdk.MessageStartEvent:
				model = string(ev.Message.Model)
				usage = ev.Message.Usage // input + cache tokens
			case sdk.ContentBlockDeltaEvent:
				if d, ok := ev.Delta.AsAny().(sdk.TextDelta); ok {
					text.WriteString(d.Text)
				}
			case sdk.MessageDeltaEvent:
				stopReason = ev.Delta.StopReason
				usage.OutputTokens = ev.Usage.OutputTokens
				if ev.Usage.JSON.InputTokens.Valid() {
					usage.InputTokens = ev.Usage.InputTokens
				}
				if ev.Usage.JSON.CacheReadInputTokens.Valid() {
					usage.CacheReadInputTokens = ev.Usage.CacheReadInputTokens
				}
				if ev.Usage.JSON.CacheCreationInputTokens.Valid() {
					usage.CacheCreationInputTokens = ev.Usage.CacheCreationInputTokens
				}
				if ev.Usage.JSON.ServerToolUse.Valid() {
					usage.ServerToolUse = ev.Usage.ServerToolUse
				}
			}
			if time.Since(lastBeat) >= heartbeat {
				log.Printf("[rlm] %s: streaming… %d events, %d chars, %d searches", label, events, text.Len(), usage.ServerToolUse.WebSearchRequests)
				lastBeat = time.Now()
			}
		}
		err := stream.Err()
		cancel()
		if err != nil {
			lastErr = err
			// Parent cancelled → abort the whole run.
			if ctx.Err() != nil {
				return "", ctx.Err()
			}
			// Per-call watchdog timeout: DON'T retry. A call that blew the 15m timeout
			// is throttled by slow server-side web search and will blow it again;
			// degrading this leaf/system to 0 objects keeps the overall run moving
			// instead of burning another 15m. (Transient overloads, below, do retry.)
			if isDeadline(err) {
				return "", err
			}
			// Transient server error (overload / 5xx) → retry with backoff. Network
			// errors are also retryable but capped at one retry: on flaky wifi they
			// repeat, and 3× a long attempt wastes 25m+ for nothing.
			if retryable(err) {
				// Connect-phase failures ("dial tcp …") fail in seconds — retry them
				// freely up to maxAttempts. Mid-stream read timeouts ("read tcp …")
				// fail near the 15m watchdog, so cap those at one retry.
				if isNetwork(err) && !strings.Contains(strings.ToLower(err.Error()), "dial") {
					if netRetried {
						return "", err
					}
					netRetried = true
				}
				continue
			}
			return "", err
		}
		cost.Add(model, usage)
		// Per-call outcome line — makes stop reason (end_turn vs pause_turn vs
		// max_tokens), search count, and duration visible for every call, so an
		// empty/short response is explainable rather than mysterious.
		log.Printf("[rlm] %s: complete — stop=%s, %d chars, %d searches, %d out-tok, %s",
			label, stopReason, text.Len(), usage.ServerToolUse.WebSearchRequests, usage.OutputTokens, time.Since(t0).Round(time.Second))
		return text.String(), nil
	}
	return "", fmt.Errorf("%s: exhausted %d attempts: %w", label, maxAttempts, lastErr)
}

// isDeadline reports whether an error is a context/timeout deadline (the per-call
// watchdog firing), which we retry rather than surface.
func isDeadline(err error) bool {
	if errors.Is(err, context.DeadlineExceeded) {
		return true
	}
	return strings.Contains(strings.ToLower(err.Error()), "deadline")
}

// retryable reports whether a streamed error is a transient server-side condition
// worth retrying (overload / rate limit / 5xx), as opposed to a client error.
// isNetwork reports whether err is a transient network/socket error (as opposed to
// a server-side HTTP condition) — these are retried at most once.
func isNetwork(err error) bool {
	s := strings.ToLower(err.Error())
	return strings.Contains(s, "operation timed out") || strings.Contains(s, "i/o timeout") ||
		strings.Contains(s, "connection reset") || strings.Contains(s, "broken pipe") ||
		strings.Contains(s, "connection refused") || strings.Contains(s, "no such host") ||
		strings.Contains(s, "eof")
}

func retryable(err error) bool {
	s := strings.ToLower(err.Error())
	// Server-side transient conditions.
	if strings.Contains(s, "overloaded") ||
		strings.Contains(s, "rate_limit") || strings.Contains(s, "429") ||
		strings.Contains(s, "500") || strings.Contains(s, "502") ||
		strings.Contains(s, "503") || strings.Contains(s, "529") {
		return true
	}
	// Transient network errors (flaky/travelling connection): retry these too. Note
	// our own per-call watchdog surfaces as "context deadline exceeded" and is caught
	// by isDeadline() BEFORE this, so it is not swept up here.
	return strings.Contains(s, "operation timed out") || strings.Contains(s, "i/o timeout") ||
		strings.Contains(s, "connection reset") || strings.Contains(s, "broken pipe") ||
		strings.Contains(s, "connection refused") || strings.Contains(s, "no such host") ||
		strings.Contains(s, "unexpected eof") || strings.Contains(s, "eof")
}

// investigate runs one bounded, web-grounded investigation as a SINGLE streamed
// request and returns the model's final text. The search cap is kept low enough
// that the server finishes its tool loop within one turn (reaching end_turn and
// emitting the JSON) — so we never round-trip a server-tool result, which the SDK
// mis-serializes on resume. System prompt is prompt-cached.
func investigate(ctx context.Context, client sdk.Client, model, system, user string, maxTokens int, maxSearches int64, cost *Cost, label string, timeout time.Duration) (string, error) {
	text, err := streamMessage(ctx, client, sdk.MessageNewParams{
		Model:     sdk.Model(model),
		MaxTokens: int64(maxTokens),
		System:    []sdk.TextBlockParam{{Text: system, CacheControl: sdk.NewCacheControlEphemeralParam()}},
		Messages:  []sdk.MessageParam{sdk.NewUserMessage(sdk.NewTextBlock(user))},
		Tools:     webTools(maxSearches),
	}, cost, label, timeout)
	if err != nil {
		return "", fmt.Errorf("investigate(%s): %w", model, err)
	}
	dumpRaw(label, text)
	return text, nil
}

// callJSON runs a single streamed (no-tools) model call whose output is expected to
// be JSON; used for planner/critic-task generation. System prompt is prompt-cached.
func callJSON(ctx context.Context, client sdk.Client, model, system, user string, maxTokens int, cost *Cost, label string) (string, error) {
	// Thinking is DISABLED here: this call must emit a clean JSON array (a plan/
	// critique), and our stream accumulator captures only text deltas — thinking
	// tokens would silently consume the output budget and leave no JSON (the RLM-1
	// "0 objects, planner-only" failure).
	disabled := sdk.NewThinkingConfigDisabledParam()
	text, err := streamMessage(ctx, client, sdk.MessageNewParams{
		Model:     sdk.Model(model),
		MaxTokens: int64(maxTokens),
		Thinking:  sdk.ThinkingConfigParamUnion{OfDisabled: &disabled},
		System:    []sdk.TextBlockParam{{Text: system, CacheControl: sdk.NewCacheControlEphemeralParam()}},
		Messages:  []sdk.MessageParam{sdk.NewUserMessage(sdk.NewTextBlock(user))},
	}, cost, label, orchTimeout)
	if err != nil {
		return "", fmt.Errorf("callJSON(%s): %w", model, err)
	}
	dumpRaw(label, text)
	return text, nil
}

// extractEvidence pulls a JSON array of evidence objects out of a model response,
// tolerating ```json fences and surrounding prose. It decodes ELEMENT-BY-ELEMENT so
// a single malformed object doesn't discard the whole array, and logs a diagnostic
// when a non-empty response yields nothing (the run6 "0 objects from 9700 chars"
// failure mode).
func extractEvidence(text string) []EvidenceObject {
	body := arrayBody(text)
	if body == "" {
		if strings.TrimSpace(text) != "" {
			log.Printf("[rlm] extract: no JSON array found in %d-char response; head: %.200q", len(text), head(text, 200))
		}
		return nil
	}
	var elems []json.RawMessage
	if err := json.Unmarshal([]byte(body), &elems); err != nil {
		// Most common cause: the array was truncated mid-object by the token limit.
		// Salvage every COMPLETE top-level object rather than losing the whole set.
		elems = salvageObjects(body)
		if len(elems) == 0 {
			log.Printf("[rlm] extract: array parse failed (%v) and nothing salvageable; body head: %.200q", err, head(body, 200))
			return nil
		}
		log.Printf("[rlm] extract: array truncated/trailing (%v); salvaged %d complete objects", err, len(elems))
	}
	objs := make([]EvidenceObject, 0, len(elems))
	skipped := 0
	for _, el := range elems {
		var o EvidenceObject
		if err := json.Unmarshal(el, &o); err != nil {
			skipped++
			if skipped <= 2 {
				log.Printf("[rlm] extract: object parse skipped (%v); obj head: %.200q", err, head(string(el), 200))
			}
			continue
		}
		objs = append(objs, o)
	}
	if skipped > 0 {
		log.Printf("[rlm] extract: %d/%d objects parsed, %d skipped", len(objs), len(elems), skipped)
	}
	return objs
}

func head(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n]
}

// salvageObjects extracts every COMPLETE top-level {…} object from a JSON array
// body that may be truncated (the token-limit failure mode). It is string- and
// escape-aware so braces inside quoted values don't confuse the depth counter; an
// incomplete trailing object is simply dropped.
func salvageObjects(arrayText string) []json.RawMessage {
	var out []json.RawMessage
	depth, start := 0, -1
	inStr, esc := false, false
	for i := 0; i < len(arrayText); i++ {
		c := arrayText[i]
		if inStr {
			switch {
			case esc:
				esc = false
			case c == '\\':
				esc = true
			case c == '"':
				inStr = false
			}
			continue
		}
		switch c {
		case '"':
			inStr = true
		case '{':
			if depth == 0 {
				start = i
			}
			depth++
		case '}':
			depth--
			if depth == 0 && start >= 0 {
				out = append(out, json.RawMessage(arrayText[start:i+1]))
				start = -1
			}
		}
	}
	return out
}

// arrayBody returns the JSON array text to parse, preferring a ```json fenced block.
// It bracket-walks (string/escape-aware) to the matching close of the FIRST array:
// if balanced, it returns the tight [...] slice (clean happy path); if the array is
// truncated (no matching close), it returns everything from the first '[' to the end
// so salvageObjects can still recover complete objects. This avoids the LastIndex('[')
// trap where an inner array's ']' mis-terminates a truncated outer array.
func arrayBody(text string) string {
	s := text
	if i := strings.Index(s, "```json"); i >= 0 {
		s = s[i+len("```json"):]
		if j := strings.Index(s, "```"); j >= 0 {
			s = s[:j]
		}
	}
	start := strings.Index(s, "[")
	if start < 0 {
		return ""
	}
	depth, inStr, esc := 0, false, false
	for i := start; i < len(s); i++ {
		c := s[i]
		if inStr {
			switch {
			case esc:
				esc = false
			case c == '\\':
				esc = true
			case c == '"':
				inStr = false
			}
			continue
		}
		switch c {
		case '"':
			inStr = true
		case '[':
			depth++
		case ']':
			depth--
			if depth == 0 {
				return s[start : i+1] // balanced, complete array
			}
		}
	}
	return s[start:] // truncated — hand the full remainder to salvage
}

// extractJSONArray finds the outermost [...] array, preferring a ```json fenced block.
func extractJSONArray(text string) string {
	if i := strings.Index(text, "```json"); i >= 0 {
		rest := text[i+len("```json"):]
		if j := strings.Index(rest, "```"); j >= 0 {
			rest = rest[:j]
		}
		if a := bracketSlice(rest); a != "" {
			return a
		}
	}
	return bracketSlice(text)
}

func bracketSlice(s string) string {
	start := strings.Index(s, "[")
	end := strings.LastIndex(s, "]")
	if start < 0 || end <= start {
		return ""
	}
	return s[start : end+1]
}
