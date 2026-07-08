// Command httpd is the thin HTTP adapter over the aitio service. It marshals
// HTTP <-> service methods (no domain logic) and, in production, also serves the
// built web UI so the whole app ships as one binary. The web app calls the API
// under /api/* (same-origin in prod, vite-proxied in dev); the same routes are
// also served at the root for curl/parity and the fixtures dump.
package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"

	contract "aitiome/contract/goapi"
	"aitiome/services/aitio"
)

// apiPaths are the exact API routes; used to distinguish API from static at root.
var apiPaths = map[string]bool{
	"/health": true, "/compounds": true, "/resolve": true, "/assess": true,
	"/validation": true, "/pathway": true, "/discovery-map": true, "/synthesis": true,
	"/benchmark": true, "/sources": true, "/assess-curated": true, "/diseases": true,
}

// disease reads the ?disease= query param (default PD), so the whole API is
// disease-scoped for the top-level UI filter without breaking PD-only callers.
func disease(r *http.Request) contract.Disease {
	return contract.ParseDisease(r.URL.Query().Get("disease"))
}

func main() {
	svc, err := aitio.New()
	if err != nil {
		log.Fatalf("httpd: %v", err)
	}
	if active, model := svc.ReasonerInfo(); active {
		log.Printf("evidence-reasoner: Claude (%s)", model)
	} else {
		log.Printf("evidence-reasoner: deterministic (no ANTHROPIC_API_KEY)")
	}

	api := apiMux(svc)

	top := http.NewServeMux()
	// Same-origin API for the production single-binary deploy.
	top.Handle("/api/", http.StripPrefix("/api", api))

	webDir := os.Getenv("AITIO_WEB_DIR")
	if webDir != "" {
		top.Handle("/", staticWithAPI(api, webDir))
		log.Printf("serving web UI from %s", webDir)
	} else {
		top.Handle("/", api) // dev/curl: API at root
	}

	addr := envOr("AITIO_HTTP_ADDR", ":8787")
	srv := &http.Server{Addr: addr, Handler: withCORS(top)}
	log.Printf("aitiome httpd listening on %s", addr)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("httpd: %v", err)
	}
}

func apiMux(svc *aitio.Service) *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, svc.Health(r.Context()))
	})
	mux.HandleFunc("GET /compounds", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, svc.ListCompoundsDisease(r.Context(), disease(r)))
	})
	mux.HandleFunc("GET /diseases", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, svc.DiseaseCatalog(r.Context()))
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
	mux.HandleFunc("GET /assess", func(w http.ResponseWriter, r *http.Request) {
		id := r.URL.Query().Get("id")
		res, ok := svc.AssessDisease(r.Context(), id, disease(r))
		if !ok {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "unresolved identifier: " + id})
			return
		}
		writeJSON(w, http.StatusOK, res)
	})
	mux.HandleFunc("GET /validation", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, svc.RunValidationDisease(r.Context(), disease(r)))
	})
	mux.HandleFunc("GET /discovery-map", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, svc.DiscoveryMap(r.Context()))
	})
	mux.HandleFunc("GET /benchmark", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, svc.Benchmark(r.Context()))
	})
	mux.HandleFunc("GET /sources", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, svc.Sources(r.Context()))
	})
	mux.HandleFunc("POST /assess-curated", func(w http.ResponseWriter, r *http.Request) {
		var in contract.CuratedInput
		if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid curated input: " + err.Error()})
			return
		}
		if in.Name == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "name is required"})
			return
		}
		writeJSON(w, http.StatusOK, svc.AssessCurated(r.Context(), in))
	})
	mux.HandleFunc("GET /synthesis", func(w http.ResponseWriter, r *http.Request) {
		id := r.URL.Query().Get("id")
		res, ok := svc.Synthesize(r.Context(), id)
		if !ok {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "unresolved identifier: " + id})
			return
		}
		writeJSON(w, http.StatusOK, res)
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
	return mux
}

// staticWithAPI serves API routes at root, real files when they exist, and
// index.html for everything else (SPA fallback).
func staticWithAPI(api http.Handler, webDir string) http.Handler {
	fileServer := http.FileServer(http.Dir(webDir))
	index := filepath.Join(webDir, "index.html")
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if apiPaths[r.URL.Path] {
			api.ServeHTTP(w, r)
			return
		}
		if r.URL.Path == "/" {
			http.ServeFile(w, r, index)
			return
		}
		clean := filepath.Join(webDir, filepath.Clean(r.URL.Path))
		if info, err := os.Stat(clean); err == nil && !info.IsDir() {
			fileServer.ServeHTTP(w, r)
			return
		}
		http.ServeFile(w, r, index) // SPA fallback
	})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

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
