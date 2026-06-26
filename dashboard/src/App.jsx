import { useState, useEffect } from "react";
import Overview from "./components/Overview";
import TokenPlayground from "./components/TokenPlayground";

import { THEME, LANG_COLORS } from "./theme";

export { THEME, LANG_COLORS };

const NAV = [
  { id: "playground", label: "Token Playground" },
  { id: "overview",   label: "Overview"          },
];

export default function App() {
  const [page, setPage]       = useState("playground");
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiOnline, setOnline] = useState(false);
  const [menuOpen, setMenu]   = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/health").then(r => r.json()).catch(() => null),
      fetch("/api/dataset-stats").then(r => r.json()).catch(() => null),
    ]).then(([health, data]) => {
      setOnline(!!health?.status);
      setStats(data);
      setLoading(false);
    });
  }, []);

  const go = (id) => { setPage(id); setMenu(false); };

  return (
    <div style={{
      display: "flex", minHeight: "100vh", width: "100%",
      fontFamily: "'Inter', system-ui, sans-serif",
      background: "#000000", color: THEME.text,
      position: "relative",
    }}>
      {/* Sidebar */}
      <aside className="sidebar-desktop" style={{
        width: 228, background: "#0a0a0a",
        borderRight: `1px solid ${THEME.border}`,
        display: "flex", flexDirection: "column",
        padding: "28px 14px 24px", gap: 3,
        position: "sticky", top: 0, height: "100vh",
        flexShrink: 0, zIndex: 10,
      }}>
        <div style={{ padding: "0 6px 32px" }}>
          <div style={{
            fontSize: 22, fontWeight: 900, lineHeight: 1.1,
            background: `linear-gradient(135deg, ${THEME.accentSoft}, ${THEME.violet})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            TokenFair
          </div>
        </div>

        {NAV.map(n => (
          <button key={n.id} onClick={() => go(n.id)}
            style={{
              padding: "10px 14px", border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: page === n.id ? 600 : 400,
              width: "100%", textAlign: "left", borderRadius: 8,
              transition: "all 0.2s",
              background:   page === n.id
                ? `linear-gradient(90deg, ${THEME.accentDim}55, ${THEME.accentDim}22)`
                : "transparent",
              color:        page === n.id ? THEME.accentSoft : THEME.muted,
              borderLeft:   page === n.id
                ? `2px solid ${THEME.accent}`
                : "2px solid transparent",
              boxShadow:    page === n.id ? `inset 0 0 20px ${THEME.accent}11` : "none",
            }}>
            {n.label}
          </button>
        ))}

        <div style={{ marginTop: "auto", padding: "18px 6px 0",
                      borderTop: `1px solid ${THEME.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11,
                        color: apiOnline ? THEME.successDim : THEME.dangerSoft }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: apiOnline ? THEME.successDim : THEME.danger,
              display: "inline-block", flexShrink: 0,
              boxShadow: apiOnline ? `0 0 6px ${THEME.successDim}` : `0 0 6px ${THEME.danger}`,
            }} />
            API {apiOnline ? "Online" : "Offline"}
          </div>
          <div style={{ fontSize: 10, color: THEME.sub, marginTop: 5, lineHeight: 1.5 }}>
            {stats
              ? `${stats.total_rows?.toLocaleString()} rows · ${stats.domains?.length} domains`
              : "Connecting..."}
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="topbar-mobile" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "#0a0a0a", borderBottom: `1px solid ${THEME.border}`,
        display: "none", alignItems: "center", justifyContent: "space-between",
        padding: "14px 20px",
      }}>
        <span style={{
          fontSize: 17, fontWeight: 900,
          background: `linear-gradient(135deg, ${THEME.accentSoft}, ${THEME.violet})`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          TokenFair
        </span>
        <button onClick={() => setMenu(o => !o)}
          style={{ background: "none", border: `1px solid ${THEME.border}`,
                   color: THEME.textSoft, borderRadius: 7,
                   padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>
          {menuOpen ? "Close" : "Menu"}
        </button>
      </div>

      {menuOpen && (
        <div className="mobile-menu" style={{
          position: "fixed", top: 53, left: 0, right: 0, zIndex: 99,
          background: "#0a0a0a", borderBottom: `1px solid ${THEME.border}`,
          padding: "8px 16px 16px",
        }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => go(n.id)}
              style={{
                display: "block", width: "100%", padding: "11px 14px",
                margin: "3px 0", border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 500, textAlign: "left", borderRadius: 8,
                background: page === n.id ? `${THEME.accentDim}33` : "transparent",
                color: page === n.id ? THEME.accentSoft : THEME.muted,
              }}>
              {n.label}
            </button>
          ))}
        </div>
      )}

      {/* Main content */}
      <main className="main-content" style={{
        flex: 1, overflow: "auto", padding: "36px 40px", minWidth: 0,
        position: "relative", zIndex: 1,
      }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
                        justifyContent: "center", height: "60vh", gap: 16 }}>
            <div className="loader-ring" />
            <span style={{ color: THEME.muted, fontSize: 14 }}>Loading...</span>
          </div>
        ) : (
          <div key={page} className="page-enter">
            {page === "playground" && <TokenPlayground />}
            {page === "overview"   && <Overview stats={stats} LANG_COLORS={LANG_COLORS} />}
          </div>
        )}
      </main>

      <style>{`
        * { box-sizing: border-box; }
        button { font-family: inherit; }
        textarea, input, select { font-family: inherit; }
        .topbar-mobile { display: none !important; }

        @keyframes pageEnter {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .page-enter { animation: pageEnter 0.35s ease-out; }

        .loader-ring {
          width: 36px; height: 36px; border-radius: 50%;
          border: 3px solid ${THEME.border};
          border-top-color: ${THEME.accent};
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .topbar-mobile   { display: flex !important; }
          .main-content    { padding: 76px 16px 28px !important; }
        }
        @media (max-width: 1024px) and (min-width: 769px) {
          .sidebar-desktop { width: 190px !important; }
          .main-content    { padding: 28px 22px !important; }
        }
      `}</style>
    </div>
  );
}
