// Package contract holds the versioned, transport-neutral data shapes that
// couple the core service to the visualization stream. Adapters (HTTP, MCP)
// and the viz module all speak these types. Keep in sync with contract/VERSION.
package contract

// Version is the contract schema version. Must match contract/VERSION.
const Version = "1.0.0"
