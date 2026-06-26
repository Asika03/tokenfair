import { useState } from "react";
import { THEME, cardStyle, pageEyebrowStyle, pageTitleStyle, pageDescStyle } from "../theme";

const NON_ENG = ["tamil", "hindi", "french"];

const cell = (v) => {
  if (v == null) return { bg: THEME.inputBg, border: THEME.border, text: THEME.sub };
  const p = v * 100;
  if (p >= 80) return { bg: "#2a0818", border: "#ff4757", text: "#ff6b81" };
  if (p >= 50) return { bg: "#2a1208", border: "#fb923c", text: "#fdba74" };
  if (p >= 30) return { bg: "#2a1a08", border: "#fde047", text: "#fef08a" };
  if (p >= 10) return { bg: "#081a12", border: "#34d399", text: "#6ee7b7" };
  return              { bg: "#081018", border: "#67e8f9", text: "#67e8f9" };
};

export default function DomainHeatmap({ stats, LANG_COLORS }) {
  const [sortBy, setSortBy] = useState("tamil");
  const domainTis = stats?.domain_tis ?? {};
  const rows = Object.entries(domainTis).map(([domain, vals]) => ({
    domain, tamil: vals.tamil ?? null, hindi: vals.hindi ?? null, french: vals.french ?? null,
  }));
  const sorted = [...rows].sort((a, b) => (b[sortBy] ?? -99) - (a[sortBy] ?? -99));

  if (!rows.length) return (
    <div style={{ padding: 40, color: THEME.muted }}>No domain data. Make sure the API is running.</div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <p style={pageEyebrowStyle}>
          <span style={{ width: 30, height: 1, background: THEME.accentDim, display: "inline-block" }} />
          Domains
        </p>
        <h1 style={pageTitleStyle}>Domain Heatmap</h1>
        <p style={pageDescStyle}>
          Mean TIS token overhead per domain. Brighter red = higher bias.
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "center", flexWrap: "wrap", gap: 14 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 10, color: THEME.sub, fontWeight: 600,
                         textTransform: "uppercase", letterSpacing: 1 }}>Scale:</span>
          {[["< 10%","#67e8f9"],["10 – 30%","#6ee7b7"],["30 – 50%","#fef08a"],
            ["50 – 80%","#fdba74"],["80%+","#ff6b81"]].map(([l, c]) => (
            <span key={l} style={{ fontSize: 10, color: c, background: `${c}14`,
                                    padding: "3px 10px", borderRadius: 5,
                                    border: `1px solid ${c}30`, fontWeight: 600 }}>
              {l}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: THEME.sub, fontWeight: 600 }}>Sort:</span>
          {NON_ENG.map(lang => (
            <button key={lang} onClick={() => setSortBy(lang)}
              style={{
                padding: "5px 14px", borderRadius: 7, cursor: "pointer",
                fontSize: 11, fontWeight: 600, border: "1px solid",
                borderColor: sortBy === lang ? LANG_COLORS[lang] : THEME.border,
                background: sortBy === lang ? `${LANG_COLORS[lang]}18` : THEME.surface,
                color: sortBy === lang ? LANG_COLORS[lang] : THEME.muted,
                boxShadow: sortBy === lang ? `0 0 10px ${LANG_COLORS[lang]}33` : "none",
                transition: "all 0.2s",
              }}>
              {lang[0].toUpperCase() + lang.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        ...cardStyle,
        padding: 0,
        overflow: "hidden",
      }}>
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr 1fr 1fr",
                        background: THEME.inputBg, borderBottom: `1px solid ${THEME.border}`,
                        padding: "12px 22px", minWidth: 480 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: THEME.sub,
                        textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>Domain</p>
            {NON_ENG.map(lang => (
              <p key={lang} style={{ fontSize: 10, fontWeight: 700, color: LANG_COLORS[lang],
                                     textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>
                {lang}
              </p>
            ))}
          </div>
          {sorted.map((row, i) => (
            <div key={row.domain}
              style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr 1fr 1fr",
                       padding: "4px 22px", minWidth: 480,
                       borderBottom: i < sorted.length - 1 ? `1px solid ${THEME.borderSub}` : "none",
                       background: i % 2 === 0 ? THEME.card : THEME.rowAlt }}>
              <p style={{ padding: "10px 0", fontSize: 13, fontWeight: 500,
                          color: THEME.textSoft, margin: 0 }}>{row.domain}</p>
              {NON_ENG.map(lang => {
                const val = row[lang];
                const pct = val != null ? (val * 100).toFixed(1) : null;
                const s   = cell(val);
                return (
                  <div key={lang} style={{ display: "flex", alignItems: "center", padding: "6px 0" }}>
                    <span style={{
                      background: s.bg, border: `1px solid ${s.border}`,
                      color: s.text, borderRadius: 6, padding: "4px 12px",
                      fontSize: 12, fontWeight: 700, minWidth: 72, textAlign: "center",
                    }}>
                      {pct != null ? `+${pct}%` : "N/A"}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
