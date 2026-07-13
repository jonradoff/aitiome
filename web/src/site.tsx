import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";

// Shared site chrome used across every route: a lightweight header, the global
// footer (license + hackathon credit + the standing links), and the two modals
// (first-visit Welcome, end-of-tour). Kept deliberately close in spirit to the
// AboutModal pattern in Panels.tsx — a styled overlay, never a browser dialog.

export const GITHUB_URL = "https://github.com/jonradoff/aitiome";
export const DECK_URL = "/presentation.pdf";

function flipTheme() {
  const cur = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  const next = cur === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  try { localStorage.setItem("aitiome_theme", next); } catch { /* ignore */ }
}

// A compact header for the standalone pages (RLM, MCP): brand → home, the same
// site nav, and a theme toggle. The main experience keeps its richer Masthead.
export function SiteHeader() {
  return (
    <header
      className="wrap"
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 68, position: "sticky", top: 0, zIndex: 20,
        backdropFilter: "blur(10px)", background: "color-mix(in srgb, var(--bg) 72%, transparent)",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <Link to="/" style={{ display: "flex", alignItems: "baseline", gap: 14, textDecoration: "none", color: "inherit" }}>
        <span style={{ fontWeight: 600, letterSpacing: "-0.02em", fontSize: 18 }}>Aitiome</span>
        <span className="mono faint" style={{ fontSize: 12 }}>exposome / neurodegeneration</span>
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <SiteNav />
        <button className="btn" style={{ marginLeft: 6 }} onClick={flipTheme}>Theme</button>
      </div>
    </header>
  );
}

// The standing navigation used in headers/footers. Internal routes use <Link>;
// the deck + repo are plain anchors (the PDF is served at /presentation.pdf).
export function SiteNav({ compact = false }: { compact?: boolean }) {
  const linkStyle = { fontSize: compact ? 12 : 13.5, color: "var(--ink-dim)", textDecoration: "none" } as const;
  return (
    <nav style={{ display: "flex", alignItems: "center", gap: compact ? 14 : 16, flexWrap: "wrap" }}>
      <Link to="/" style={linkStyle}>Home</Link>
      <Link to="/rlm" style={linkStyle}>Recursive Language Models</Link>
      <Link to="/mcp" style={linkStyle}>MCP</Link>
      <a href={DECK_URL} target="_blank" rel="noreferrer" style={linkStyle}>Presentation</a>
      <a href={GITHUB_URL} target="_blank" rel="noreferrer" style={linkStyle}>GitHub</a>
    </nav>
  );
}

// The global footer — present on every page. Carries the required credit line
// plus the standing links (MCP docs, presentation PDF, GitHub, RLM page).
export function SiteFooter({ note }: { note?: string }) {
  return (
    <footer className="wrap section" style={{ paddingBottom: 44 }}>
      <div className="hair" style={{ marginBottom: 20 }} />
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 14, alignItems: "center" }}>
        <span className="faint mono" style={{ fontSize: 12 }}>
          © 2026 Jon Radoff — MIT License &nbsp;|&nbsp; Built with Claude: Life Sciences Hackathon
        </span>
        <SiteNav compact />
      </div>
      {note && (
        <div className="faint mono" style={{ fontSize: 11.5, marginTop: 12 }}>{note}</div>
      )}
    </footer>
  );
}

// A minimal styled modal shell (overlay + centered panel + Escape-to-close),
// matching the AboutModal treatment. Content and actions are passed in.
export function ModalShell({ onClose, title, children, actions, maxWidth = 560 }: {
  onClose: () => void; title: string; children: ReactNode; actions?: ReactNode; maxWidth?: number;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center",
        background: "color-mix(in srgb, var(--bg) 55%, transparent)", backdropFilter: "blur(6px)", padding: 20,
      }}
    >
      <div
        className="panel"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth, width: "100%", padding: "28px 30px", maxHeight: "88vh", overflowY: "auto" }}
      >
        <h2 style={{ fontSize: 24, letterSpacing: "-0.01em", marginBottom: 14 }}>{title}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
        {actions && <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 22 }}>{actions}</div>}
      </div>
    </div>
  );
}

const WELCOME_KEY = "aitiome_welcomed";

export function hasSeenWelcome(): boolean {
  try { return localStorage.getItem(WELCOME_KEY) === "1"; } catch { return false; }
}
export function markWelcomeSeen() {
  try { localStorage.setItem(WELCOME_KEY, "1"); } catch { /* ignore */ }
}

// First-visit Welcome: invites the guided tour, or lets them skip straight in.
export function WelcomeModal({ onTour, onSkip }: { onTour: () => void; onSkip: () => void }) {
  return (
    <ModalShell onClose={onSkip} title="Welcome to Aitiome" maxWidth={580}>
      <p className="dim" style={{ fontSize: 15, lineHeight: 1.55, margin: 0 }}>
        Aitiome is an <b style={{ color: "var(--ink)" }}>honest mechanistic-reasoning engine</b> for the
        environmental exposome of neurodegeneration. Give it a chemical and it reconstructs the
        OECD-endorsed causal pathway to Parkinson's or Alzheimer's, grades it on
        {" "}<b style={{ color: "var(--ink)" }}>curated evidence — never bioactivity</b>, and rates its confidence.
      </p>
      <p className="dim" style={{ fontSize: 14, lineHeight: 1.5, margin: 0 }}>
        New here? The 60-second guided tour walks the thesis: recover a known neurotoxicant, reject a
        bioactive imposter, and see why activity alone can't tell them apart.
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
        <button className="btn primary" onClick={onTour}>&#9654; Take the guided tour</button>
        <button className="btn" onClick={onSkip}>Skip and explore</button>
      </div>
    </ModalShell>
  );
}

// End-of-tour: offer the full presentation, or drop them into the app.
export function EndOfTourModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell onClose={onClose} title="That's the thesis in 60 seconds" maxWidth={560}>
      <p className="dim" style={{ fontSize: 15, lineHeight: 1.55, margin: 0 }}>
        You've seen it recover the real neurotoxicants, reject the bioactive decoys, and calibrate across
        two diseases. Want the full story — the falsification, the candidate pipeline, the RLM methods
        study — or would you rather explore the live engine yourself?
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
        <a className="btn primary" href={DECK_URL} target="_blank" rel="noreferrer" onClick={onClose}>
          View the presentation (PDF)
        </a>
        <button className="btn" onClick={onClose}>Explore the app</button>
      </div>
    </ModalShell>
  );
}
