import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
         ResponsiveContainer, Cell } from "recharts";
import { THEME, LANG_COLORS, cardStyle, cardGlowStyle, sLabelStyle,
         pageEyebrowStyle, pageTitleStyle, pageDescStyle } from "../theme";

const LANG_ORDER = ["english", "tamil", "hindi", "french", "arabic"];

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
            {typeof p.value === "number" ? p.value : p.value}
          </b>
        </div>
      ))}
    </div>
  );
};

const SLabel = ({ children }) => (
  <p style={sLabelStyle}>
    <span style={{ width: 20, height: 1, background: THEME.accentDim, display: "inline-block" }} />
    {children}
  </p>
);

export default function PromptEstimator() {
  const [prompt, setPrompt]   = useState("");
  const [users, setUsers]     = useState(1000);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);

  const estimate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res  = await fetch("/api/prompt-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, users }),
      });
      setResult(await res.json());
    } catch {
      setResult({ error: "API offline — start uvicorn first." });
    }
    setLoading(false);
  };

  const chartData = result && !result.error
    ? LANG_ORDER.map(lang => ({
        lang:   lang[0].toUpperCase() + lang.slice(1),
        tokens: result.languages?.[lang]?.gpt4_tokens ?? 0,
        cost:   result.languages?.[lang]?.cost_usd ?? 0,
        color:  LANG_COLORS[lang],
      }))
    : [];

  const maxTokens = chartData.length
    ? Math.max(...chartData.map(d => d.tokens)) : 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <p style={pageEyebrowStyle}>
          <span style={{ width: 30, height: 1, background: THEME.accentDim, display: "inline-block" }} />
          Prompt Engineering Tool
        </p>
        <h1 style={pageTitleStyle}>Prompt Token Estimator</h1>
        <p style={pageDescStyle}>
          Type any prompt in English. See exactly how many tokens it costs across
          5 languages and 10 LLMs — before you send it.
        </p>
      </div>

      <div style={cardStyle}>
        <SLabel>Your Prompt</SLabel>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
          placeholder="e.g. You are a helpful medical assistant. Answer the patient's question clearly and concisely..."
          rows={4}
          style={{
            width: "100%", padding: "12px 14px", borderRadius: 9,
            border: `1px solid ${THEME.tooltipBorder}`,
            background: THEME.inputBg, color: THEME.text,
            fontSize: 14, fontFamily: "inherit", resize: "vertical",
            outline: "none", boxSizing: "border-box", lineHeight: 1.6,
            boxShadow: `0 0 0 0 ${THEME.accent}00`, transition: "box-shadow 0.2s",
          }}
          onFocus={e => e.target.style.boxShadow = `0 0 0 2px ${THEME.accent}40`}
          onBlur={e  => e.target.style.boxShadow = "none"}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 20,
                      marginTop: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 11, color: THEME.accentDim, fontWeight: 600 }}>Users:</span>
            <input type="range" min={100} max={100000} step={100} value={users}
              onChange={e => setUsers(Number(e.target.value))}
              style={{ width: 140, accentColor: THEME.accent }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: LANG_COLORS.english, minWidth: 60 }}>
              {users.toLocaleString()}
            </span>
          </div>
          <button onClick={estimate} disabled={!prompt.trim() || loading}
            style={{
              padding: "11px 32px", borderRadius: 9, fontSize: 13, fontWeight: 700,
              border: `1px solid ${THEME.accent}`, cursor: "pointer",
              background: loading ? THEME.grid : THEME.buttonGradient,
              color: loading ? THEME.sub : THEME.text,
              boxShadow: loading ? "none" : THEME.glow,
              transition: "all 0.2s",
            }}>
            {loading ? "Estimating..." : "Estimate Tokens"}
          </button>
          {result?.eng_tokens && (
            <span style={{ fontSize: 12, color: THEME.muted }}>
              English baseline: <b style={{ color: LANG_COLORS.english }}>{result.eng_tokens} tokens</b>
            </span>
          )}
        </div>
      </div>

      {result?.error && (
        <div style={{ padding: "12px 16px", background: "#1a0818", border: `1px solid ${THEME.danger}44`,
                      borderRadius: 9, color: THEME.dangerSoft, fontSize: 12 }}>
          {result.error}
        </div>
      )}

      {result && !result.error && (
        <>
          {result.tip?.length > 0 && (
            <div style={{
              background: "linear-gradient(135deg, #141c38, #0c1022)",
              border: `1px solid ${THEME.border}`, borderRadius: 12, padding: "16px 20px",
              boxShadow: `0 0 20px ${THEME.accent}18`,
            }}>
              <SLabel>Prompt Engineer Tip</SLabel>
              {result.tip.map((t, i) => (
                <p key={i} style={{ fontSize: 13, color: THEME.textSoft, margin: "0 0 6px",
                                    lineHeight: 1.6 }}>
                  {t}
                </p>
              ))}
            </div>
          )}

          <div style={cardGlowStyle}>
            <SLabel>GPT-4 Token Count per Language</SLabel>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={chartData} margin={{ left: -18, right: 16, top: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} vertical={false} />
                <XAxis dataKey="lang" tick={{ fontSize: 11, fill: THEME.muted }}
                       axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: THEME.sub }} axisLine={false} tickLine={false} />
                <Tooltip content={<TT />} cursor={{ fill: `${THEME.accent}06` }} />
                <Bar dataKey="tokens" name="Tokens" radius={[5, 5, 0, 0]} barSize={44}>
                  {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14 }}>
            {LANG_ORDER.map(lang => {
              const d   = result.languages?.[lang];
              if (!d) return null;
              const pct = maxTokens > 0 ? (d.gpt4_tokens / maxTokens) * 100 : 0;
              const tis = d.tis;
              const isEng = lang === "english";
              return (
                <div key={lang} style={{
                  background: THEME.cardGradient,
                  borderRadius: 12, border: `1px solid ${LANG_COLORS[lang]}33`,
                  padding: "16px 18px",
                  boxShadow: `0 0 16px ${LANG_COLORS[lang]}18`,
                }}>
                  <p style={{ fontSize: 10, color: LANG_COLORS[lang], fontWeight: 700,
                              textTransform: "uppercase", letterSpacing: 1.5, margin: "0 0 10px" }}>
                    {lang}
                  </p>
                  <p style={{ fontSize: 26, fontWeight: 900, color: LANG_COLORS[lang],
                              margin: "0 0 4px", lineHeight: 1 }}>
                    {d.gpt4_tokens}
                  </p>
                  <p style={{ fontSize: 10, color: THEME.sub, margin: "0 0 8px" }}>GPT-4 tokens</p>

                  <div style={{ background: THEME.inputBg, borderRadius: 3, height: 4,
                                border: `1px solid ${THEME.border}`, overflow: "hidden", marginBottom: 8 }}>
                    <div style={{ width: `${pct}%`, height: "100%",
                                  background: LANG_COLORS[lang],
                                  boxShadow: `0 0 6px ${LANG_COLORS[lang]}88`,
                                  transition: "width 0.5s ease" }} />
                  </div>

                  <p style={{ fontSize: 11, color: THEME.muted, margin: "0 0 3px" }}>
                    {d.word_count} words · ${d.cost_usd?.toFixed(6)}
                  </p>
                  {!isEng && tis != null && (
                    <p style={{ fontSize: 11, fontWeight: 700, margin: 0,
                                color: tis > 0.3 ? THEME.danger : THEME.successDim }}>
                      TIS: {tis > 0 ? "+" : ""}{(tis * 100).toFixed(1)}%
                    </p>
                  )}
                  <p style={{ fontSize: 10, color: THEME.sub, margin: "4px 0 0",
                              fontStyle: "italic" }}>
                    Best LLM: {d.best_llm?.replace(" / ", "/")}
                  </p>
                </div>
              );
            })}
          </div>

          <div style={cardStyle}>
            <SLabel>Auto-Translated Prompt</SLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {LANG_ORDER.map(lang => {
                const d = result.languages?.[lang];
                if (!d?.text) return null;
                return (
                  <div key={lang} style={{ borderLeft: `2px solid ${LANG_COLORS[lang]}`,
                                            paddingLeft: 14 }}>
                    <p style={{ fontSize: 10, color: LANG_COLORS[lang], fontWeight: 700,
                                textTransform: "uppercase", letterSpacing: 1, margin: "0 0 4px" }}>
                      {lang}
                    </p>
                    <p style={{ fontSize: 12, color: THEME.textSoft, margin: 0, lineHeight: 1.7 }}>
                      {d.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
