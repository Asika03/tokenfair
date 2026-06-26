import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
         ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { THEME, cardGlowStyle, sLabelStyle, pageEyebrowStyle,
         pageTitleStyle, pageDescStyle } from "../theme";

const LANGUAGES = ["english", "tamil", "hindi", "french"];
const NON_ENG   = ["tamil", "hindi", "french"];

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: THEME.tooltipBg, border: `1px solid ${THEME.tooltipBorder}`,
                  borderRadius: 8, padding: "10px 14px", fontSize: 11,
                  boxShadow: "0 8px 32px #00000088" }}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: THEME.accent, fontSize: 10,
                    textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || THEME.textSoft, marginBottom: 2 }}>
          {p.name}: <b style={{ color: THEME.text }}>
            {typeof p.value === "number" ? p.value.toFixed(2) : p.value}
          </b>
        </div>
      ))}
    </div>
  );
};

const SLabel = ({ children }) => (
  <p style={{ ...sLabelStyle, margin: "0 0 18px" }}>
    <span style={{ width: 20, height: 1, background: THEME.accentDim, display: "inline-block" }} />
    {children}
  </p>
);

const TABS = [
  { id: "tokens", label: "Token Counts" },
  { id: "tis",    label: "TIS Scores"   },
];

export default function LanguageComparison({ stats, LANG_COLORS }) {
  const [tab, setTab] = useState("tokens");
  const tok = stats?.token_stats ?? {};
  const tis = stats?.tis_stats   ?? {};
  const engMean = tok.english?.mean_gpt_tokens ?? 1;

  const tokenData = LANGUAGES.map(lang => ({
    lang:   lang[0].toUpperCase() + lang.slice(1),
    mean:   parseFloat((tok[lang]?.mean_gpt_tokens ?? 0).toFixed(1)),
    color:  LANG_COLORS[lang],
  }));

  const tisData = NON_ENG.map(lang => ({
    lang:  lang[0].toUpperCase() + lang.slice(1),
    tis:   parseFloat(((tis[lang]?.mean ?? 0) * 100).toFixed(2)),
    color: LANG_COLORS[lang],
  }));

  const panelStyle = { ...cardGlowStyle, padding: "26px" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div>
        <p style={pageEyebrowStyle}>
          <span style={{ width: 30, height: 1, background: THEME.accentDim, display: "inline-block" }} />
          Analysis
        </p>
        <h1 style={pageTitleStyle}>Language Comparison</h1>
        <p style={pageDescStyle}>
          Token counts and inequality scores across all 4 languages.
        </p>
      </div>

      <div style={{
        display: "inline-flex", gap: 3, background: THEME.surface,
        borderRadius: 10, padding: "4px",
        border: `1px solid ${THEME.border}`,
        width: "fit-content",
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: "8px 22px", borderRadius: 8, border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 600, transition: "all 0.2s",
              background: tab === t.id ? THEME.tabActiveGradient : "transparent",
              color:  tab === t.id ? THEME.text : THEME.muted,
              boxShadow: tab === t.id ? THEME.glow : "none",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "tokens" && (
        <div style={panelStyle}>
          <SLabel>Mean GPT Token Count per Language</SLabel>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={tokenData} margin={{ left: -18, right: 16, top: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} vertical={false} />
              <XAxis dataKey="lang" tick={{ fontSize: 11, fill: THEME.muted }}
                     axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: THEME.sub }} axisLine={false} tickLine={false} />
              <Tooltip content={<TT />} cursor={{ fill: `${THEME.accent}06` }} />
              <ReferenceLine y={engMean} stroke={LANG_COLORS.english} strokeDasharray="5 3"
                label={{ value: "English", fontSize: 9, fill: LANG_COLORS.english, position: "insideTopRight" }} />
              <Bar dataKey="mean" name="Avg Tokens" radius={[5, 5, 0, 0]} barSize={44}>
                {tokenData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                        gap: 12, marginTop: 22 }}>
            {LANGUAGES.map(lang => (
              <div key={lang} style={{
                background: THEME.inputBg, borderRadius: 10, padding: "12px 16px",
                borderLeft: `3px solid ${LANG_COLORS[lang]}`,
                boxShadow: `0 0 12px ${LANG_COLORS[lang]}18`,
              }}>
                <p style={{ fontSize: 10, color: THEME.sub, textTransform: "uppercase",
                            letterSpacing: 1, margin: "0 0 5px" }}>{lang}</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: LANG_COLORS[lang], margin: "0 0 3px" }}>
                  {tok[lang]?.mean_gpt_tokens?.toFixed(1) ?? "—"}
                </p>
                <p style={{ fontSize: 10, color: THEME.muted, margin: 0 }}>
                  median {tok[lang]?.median_gpt_tokens?.toFixed(1) ?? "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "tis" && (
        <div style={panelStyle}>
          <SLabel>Tokenization Inequality Score (TIS %)</SLabel>
          <p style={{ fontSize: 12, color: THEME.sub, margin: "0 0 22px", lineHeight: 1.6 }}>
            TIS = (lang_tokens / english_tokens) - 1. Positive = more tokens than English.
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={tisData} margin={{ left: -18, right: 16, top: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} vertical={false} />
              <XAxis dataKey="lang" tick={{ fontSize: 11, fill: THEME.muted }}
                     axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: THEME.sub }} axisLine={false} tickLine={false}
                     tickFormatter={v => `${v}%`} />
              <Tooltip content={<TT />} formatter={v => [`${v}%`, "TIS"]}
                       cursor={{ fill: `${THEME.accent}06` }} />
              <ReferenceLine y={0} stroke={THEME.accent} strokeDasharray="5 3"
                label={{ value: "English parity", fontSize: 9, fill: THEME.accent, position: "insideTopRight" }} />
              <Bar dataKey="tis" name="TIS %" radius={[5, 5, 0, 0]} barSize={44}>
                {tisData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                        gap: 12, marginTop: 22 }}>
            {NON_ENG.map(lang => {
              const val  = (tis[lang]?.mean ?? 0) * 100;
              const flag = val >= 40 ? "HIGH BIAS" : val > 10 ? "MODERATE" : "LOW";
              const fc   = val >= 40 ? THEME.danger : val > 10 ? THEME.warning : THEME.successDim;
              return (
                <div key={lang} style={{
                  background: THEME.inputBg, borderRadius: 10, padding: "12px 16px",
                  borderLeft: `3px solid ${LANG_COLORS[lang]}`,
                  boxShadow: `0 0 12px ${LANG_COLORS[lang]}18`,
                }}>
                  <p style={{ fontSize: 10, color: THEME.sub, textTransform: "uppercase",
                              letterSpacing: 1, margin: "0 0 5px" }}>{lang}</p>
                  <p style={{ fontSize: 22, fontWeight: 800, color: LANG_COLORS[lang], margin: "0 0 3px" }}>
                    +{val.toFixed(1)}%
                  </p>
                  <p style={{ fontSize: 10, fontWeight: 700, color: fc, margin: 0 }}>{flag}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
