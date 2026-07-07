package contract

// Health is the trivial dual-adapter proof payload (Commit 1). It exists to
// demonstrate that one service method is reachable identically over the HTTP
// and MCP adapters before any feature code lands.
type Health struct {
	Status          string `json:"status"`
	ContractVersion string `json:"contractVersion"`
	CompoundsLoaded int    `json:"compoundsLoaded"`
}
