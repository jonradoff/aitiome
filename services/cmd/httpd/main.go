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
	svc, err := aitio.New()
	if err != nil {
		log.Fatalf("httpd: %v", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, svc.Health(r.Context()))
	})
	mux.HandleFunc("GET /compounds", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, svc.ListCompounds(r.Context()))
	})
	mux.HandleFunc("GET /resolve", func(w http.ResponseWriter, r *http.Request) {
		id := r.URL.Query().Get("id")
		c, ok := svc.Resolve(r.Context(), id)
		if !ok {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "unresolved identifier: " + id})
			return
		}
		writeJSON(w, http.StatusOK, c)
	})
	mux.HandleFunc("GET /pathway", func(w http.ResponseWriter, r *http.Request) {
		id := r.URL.Query().Get("aop")
		if id == "" {
			writeJSON(w, http.StatusOK, svc.AnchorPathway(r.Context()))
			return
		}
		p, ok := svc.GetPathway(r.Context(), id)
		if !ok {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "unknown AOP: " + id})
			return
		}
		writeJSON(w, http.StatusOK, p)
	})

	addr := envOr("AITIO_HTTP_ADDR", ":8787")
	srv := &http.Server{Addr: addr, Handler: withCORS(mux)}
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

// withCORS allows the viz/web dev servers (different port) to call the engine.
func withCORS(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		h.ServeHTTP(w, r)
	})
}

func envOr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
