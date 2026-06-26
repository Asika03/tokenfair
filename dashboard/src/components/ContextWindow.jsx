import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
         ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { THEME, cardStyle, cardGlowStyle, sLabelStyle, pageEyebrowStyle,
         pageTitleStyle, pageDescStyle } from "../theme";

const LANGUAGES = ["english", "tamil", "hindi", "french"];
const MODELS = [
  { name: "GPT-3.5 (4K)",    tokens: 4096   },
  { name: "GPT-4 (8K)",      tokens: 8192   },
  { name: "GPT-4 (128K)",    tokens: 128000 },
  { name: "Claude 3 (200K)", tokens: 200000 },
];

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
          {p.name}: <b style={{ color: THEME.text }}>{p.value?.toLocaleString()} sentences</b>
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

export default function ContextWindow({ stats, LANG_COLORS }) {
  const [selected, setSelected] = useState("GPT-4 (128K)");
  const tok = stats?.token_stats ?? {};
  const avg = {};
  LANGUAGES.forEach(l => { avg[l] = tok[l]?.mean_gpt_tokens ?? 1; });

  const table = MODELS.map(m => {
    const row = { name: m.name, tokens: m.tokens };
    LANGUAGES.forEach(l => { row[l] = Math.floor(m.tokens / avg[l]); });
    return row;
  });

  const sel = table.find(r => r.name === selected) ?? table[2];
  const eng = sel.english;
  const chartData = LANGUAGES.map(lang => ({
    lang: lang[0].toUpperCase() + lang.slice(1),
    sentences: sel[lang],
    pct: Math.round((sel[lang] / eng) * 100),
    color: LANG_COLORS[lang],
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <p style={pageEyebrowStyle}>
          <span style={{ width: 30, height: 1, background: THEME.accentDim, display: "inline-block" }} />
          Capacity
        </p>
        <h1 style={pageTitleStyle}>Context Window Shrinkage</h1>
        <p style={pageDescStyle}>
          How many sentences fit per language in each model context window.
          Non-English languages lose capacity due to token inflation.
        </p>
      </div>

      <div style={{ display: "inline-flex", gap: 3, background: THEME.surface,
                    borderRadius: 10, padding: "4px", border: `1px solid ${THEME.border}`,
                    width: "fit-content", flexWrap: "wrap" }}>
        {MODELS.map(m => (
          <button key={m.name} onClick={() => setSelected(m.name)}
            style={{
              padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 600, transition: "all 0.2s",
              background: selected === m.name ? THEME.tabActiveGradient : "transparent",
              color:  selected === m.name ? THEME.text : THEME.muted,
              boxShadow: selected === m.name ? THEME.glow : "none",
            }}>
            {m.name}
          </button>
        ))}
      </div>

      <div style={cardGlowStyle}>
        <SLabel>
          Sentences That Fit — {selected} ({sel.tokens.toLocaleString()} tokens)
        </SLabel>
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={chartData} margin={{ left: -4, right: 16, top: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} vertical={false} />
            <XAxis dataKey="lang" tick={{ fontSize: 11, fill: THEME.muted }}
                   axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: THEME.sub }} axisLine={false} tickLine={false}
                   tickFormatter={v => v.toLocaleString()} />
            <Tooltip content={<TT />} cursor={{ fill: `${THEME.accent}06` }} />
            <ReferenceLine y={eng} stroke={LANG_COLORS.english} strokeDasharray="5 3"
              label={{ value: "English", fontSize: 9, fill: LANG_COLORS.english, position: "insideTopRight" }} />
            <Bar dataKey="sentences" name="Sentences" radius={[5, 5, 0, 0]} barSize={44}>
              {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                      gap: 12, marginTop: 18 }}>
          {chartData.map(d => {
            const isEng = d.lang.toLowerCase() === "english";
            const loss  = 100 - d.pct;
            return (
              <div key={d.lang} style={{ background: THEME.inputBg, borderRadius: 10, padding: "12px 16px",
                                          borderLeft: `3px solid ${LANG_COLORS[d.lang.toLowerCase()]}`,
                                          boxShadow: `0 0 10px ${LANG_COLORS[d.lang.toLowerCase()]}18` }}>
                <p style={{ fontSize: 10, color: THEME.sub, textTransform: "uppercase",
                            letterSpacing: 1, margin: "0 0 4px" }}>{d.lang}</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: LANG_COLORS[d.lang.toLowerCase()], margin: "0 0 3px" }}>
                  {d.sentences.toLocaleString()}
                </p>
                {!isEng ? (
                  <p style={{ fontSize: 10, fontWeight: 700, margin: 0,
                               color: loss > 30 ? THEME.danger : THEME.successDim }}>
                    {d.pct}% capacity · {loss}% lost
                  </p>
                ) : (
                  <p style={{ fontSize: 10, color: THEME.muted, margin: 0 }}>baseline</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={cardStyle}>
        <SLabel>All Models Comparison</SLabel>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 500 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${THEME.border}` }}>
                <th style={{ textAlign: "left", padding: "10px 16px 10px 0", color: THEME.sub,
                             fontWeight: 600, fontSize: 10, textTransform: "uppercase",
                             letterSpacing: 1 }}>Model</th>
                {LANGUAGES.map(lang => (
                  <th key={lang} style={{ textAlign: "right", padding: "10px 12px",
                                           color: LANG_COLORS[lang], fontWeight: 600,
                                           fontSize: 10, textTransform: "uppercase" }}>
                    {lang}
                  </th>
                ))}
                <th style={{ textAlign: "right", padding: "10px 0 10px 12px", color: THEME.sub,
                             fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>
                  Tamil Loss
                </th>
              </tr>
            </thead>
            <tbody>
              {table.map((row) => {
                const loss = Math.round((1 - row.tamil / row.english) * 100);
                const isSel = row.name === selected;
                return (
                  <tr key={row.name} style={{
                    borderBottom: `1px solid ${THEME.borderSub}`,
                    background: isSel ? `${THEME.accentDim}22` : "transparent",
                  }}>
                    <td style={{ padding: "11px 16px 11px 0",
                                 color: isSel ? THEME.accentSoft : THEME.textSoft,
                                 fontWeight: isSel ? 700 : 400 }}>
                      {isSel && <span style={{ marginRight: 8, fontSize: 9, color: THEME.accent }}>&#9654;</span>}
                      {row.name}
                    </td>
                    {LANGUAGES.map(lang => (
                      <td key={lang} style={{ padding: "11px 12px", textAlign: "right",
                                              color: LANG_COLORS[lang], fontWeight: 600 }}>
                        {row[lang].toLocaleString()}
                      </td>
                    ))}
                    <td style={{ padding: "11px 0 11px 12px", textAlign: "right",
                                 fontWeight: 700,
                                 color: loss > 30 ? THEME.danger : THEME.successDim }}>
                      -{loss}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
