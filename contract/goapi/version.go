// Package contract holds the versioned, transport-neutral data shapes that
// couple the core service to the visualization stream. Adapters (HTTP, MCP)
// and the viz module all speak these types. Keep in sync with contract/VERSION.
package contract

// Version is the contract schema version. Must match contract/VERSION.
// v1.2.0: per-disease axis (Disease dimension; PD + AD). Additive — PD-only
// consumers are unaffected; AD is exposed via the disease-parameterized methods.
const Version = "1.2.0"
