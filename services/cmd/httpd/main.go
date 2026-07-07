// Command httpd is the thin HTTP adapter over the aitio service. It marshals
// HTTP <-> service methods and contains no domain logic.
package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"

	"aitiome/services/aitio"
)

func main() {
	svc := aitio.New()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, svc.Health(r.Context()))
	})

	addr := envOr("AITIO_HTTP_ADDR", ":8787")
	srv := &http.Server{Addr: addr, Handler: mux}
	log.Printf("aitiome httpd listening on %s", addr)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("httpd: %v", err)
	}
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func envOr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
