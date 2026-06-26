import { useState, useRef, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
         ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { THEME, cardStyle, cardGlowStyle, sLabelStyle, pageEyebrowStyle,
         pageTitleStyle, pageDescStyle } from "../theme";

const LANGUAGES = ["english", "tamil", "hindi", "french"];
const COMBINED  = 0.002;

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
            ${typeof p.value === "number" ? p.value.toFixed(4) : p.value}
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

const TokenRow = ({ lang, tokens, maxTokens, color, tis }) => {
  const pct = maxTokens > 0 ? (tokens / maxTokens) * 100 : 0;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color, textTransform: "capitalize" }}>{lang}</span>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: THEME.muted }}>{tokens} tokens</span>
          {lang !== "english" && tis != null && (
            <span style={{ fontSize: 11, fontWeight: 700,
                           color: tis > 0.3 ? THEME.danger : THEME.successDim }}>
              TIS {tis > 0 ? "+" : ""}{(tis * 100).toFixed(1)}%
            </span>
          )}
        </div>
      </div>
      <div style={{ background: THEME.inputBg, borderRadius: 4, height: 6,
                    border: `1px solid ${THEME.border}`, overflow: "hidden" }}>
        <div style={{
          width: `${pct}%`, height: "100%", borderRadius: 4,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          boxShadow: `0 0 8px ${color}55`,
          transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)",
        }} />
      </div>
    </div>
  );
};

export default function CostCalculator({ stats, LANG_COLORS }) {
  const [users, setUsers]       = useState(1000);
  const [texts, setTexts]       = useState({ english: "", tamil: "", hindi: "", french: "" });
  const [result, setResult]     = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [translating, setTrans]   = useState(false);
  const debounce = useRef(null);
  const tok = stats?.token_stats ?? {};

  const costs = LANGUAGES.map(lang => ({
    lang:  lang[0].toUpperCase() + lang.slice(1),
    cost:  parseFloat(((tok[lang]?.total_gpt_tokens ?? 0) * users / 1000 * COMBINED).toFixed(4)),
    color: LANG_COLORS[lang], raw: lang,
  }));
  const engCost = costs.find(d => d.raw === "english")?.cost ?? 1;
  const maxLive = result && !result.error
    ? Math.max(...LANGUAGES.map(l => result.languages?.[l]?.gpt_tokens ?? 0)) : 1;

  const handleEnglish = useCallback((val) => {
    setTexts(p => ({ ...p, english: val }));
    setResult(null);
    if (debounce.current) clearTimeout(debounce.current);
    if (!val.trim()) { setTexts({ english: val, tamil: "", hindi: "", french: "" }); return; }
    debounce.current = setTimeout(async () => {
      setTrans(true);
      try {
        const res  = await fetch("/api/translate", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: val }),
        });
        const data = await res.json();
        setTexts({ english: val, tamil: data.tamil || "", hindi: data.hindi || "", french: data.french || "" });
      } catch { /* offline */ }
      setTrans(false);
    }, 700);
  }, []);

  const analyze = async () => {
    if (!texts.english.trim()) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts, users }),
      });
      setResult(await res.json());
    } catch { setResult({ error: "API offline — start uvicorn first." }); }
    setAnalyzing(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <p style={pageEyebrowStyle}>
          <span style={{ width: 30, height: 1, background: THEME.accentDim, display: "inline-block" }} />
          Economics
        </p>
        <h1 style={pageTitleStyle}>Cost Calculator</h1>
        <p style={pageDescStyle}>
          Simulate GPT-3.5-Turbo API costs at scale. Type English to auto-translate.
        </p>
      </div>

      <div style={cardStyle}>
        <SLabel>Scale</SLabel>
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div style={{ minWidth: 110 }}>
            <p style={{ fontSize: 11, color: THEME.accentDim, margin: "0 0 4px", fontWeight: 600 }}>Users</p>
            <p style={{ fontSize: 32, fontWeight: 900, margin: 0, lineHeight: 1,
                        background: THEME.logoGradient,
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {users.toLocaleString()}
            </p>
          </div>
          <input type="range" min={100} max={100000} step={100} value={users}
            onChange={e => setUsers(Number(e.target.value))}
            style={{ flex: 1, minWidth: 140, accentColor: THEME.accent, cursor: "pointer" }} />
          <p style={{ fontSize: 11, color: THEME.sub, margin: 0, whiteSpace: "nowrap" }}>
            100 – 100,000
          </p>
        </div>
        <p style={{ fontSize: 11, color: THEME.sub, margin: "12px 0 0", lineHeight: 1.5 }}>
          GPT-3.5-Turbo: $0.0005 / 1K input + $0.0015 / 1K output = $0.002 combined
        </p>
      </div>

      <div style={cardGlowStyle}>
        <SLabel>
          Dataset Cost — {stats?.total_rows?.toLocaleString()} sentences × {users.toLocaleString()} users
        </SLabel>
        <ResponsiveContainer width="100%" height={190}>
          <BarChart data={costs} margin={{ left: -4, right: 16, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} vertical={false} />
            <XAxis dataKey="lang" tick={{ fontSize: 11, fill: THEME.muted }}
                   axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: THEME.sub }} axisLine={false} tickLine={false}
                   tickFormatter={v => `$${v}`} />
            <Tooltip content={<TT />} cursor={{ fill: `${THEME.accent}06` }} />
            <ReferenceLine y={engCost} stroke={LANG_COLORS.english} strokeDasharray="5 3"
              label={{ value: "English", fontSize: 9, fill: LANG_COLORS.english, position: "insideTopRight" }} />
            <Bar dataKey="cost" name="Total Cost" radius={[5, 5, 0, 0]} barSize={44}>
              {costs.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                      gap: 12, marginTop: 18 }}>
          {costs.map(d => {
            const ov = ((d.cost - engCost) / engCost * 100);
            return (
              <div key={d.raw} style={{ background: THEME.inputBg, borderRadius: 10, padding: "12px 16px",
                                         borderLeft: `3px solid ${d.color}`,
                                         boxShadow: `0 0 10px ${d.color}18` }}>
                <p style={{ fontSize: 10, color: THEME.sub, textTransform: "uppercase",
                            letterSpacing: 1, margin: "0 0 4px" }}>{d.lang}</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: d.color, margin: "0 0 3px" }}>
                  ${d.cost.toFixed(4)}
                </p>
                {d.raw !== "english" && (
                  <p style={{ fontSize: 10, fontWeight: 700, margin: 0,
                               color: ov > 30 ? THEME.danger : THEME.successDim }}>
                    +{ov.toFixed(1)}% vs English
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={cardStyle}>
        <SLabel>Live Text Analyzer</SLabel>
        <p style={{ fontSize: 12, color: THEME.sub, margin: "0 0 20px", lineHeight: 1.6 }}>
          Type English — Tamil, Hindi and French auto-fill via MyMemory (free, no key needed).
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: 14, marginBottom: 18 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: LANG_COLORS.english,
                          textTransform: "uppercase", letterSpacing: 1.5, margin: 0 }}>English</p>
            </div>
            <textarea value={texts.english} onChange={e => handleEnglish(e.target.value)}
              placeholder="Type here to auto-translate..." rows={3}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8,
                border: `1px solid ${LANG_COLORS.english}50`,
                background: THEME.inputBg, color: THEME.text, fontSize: 13,
                fontFamily: "inherit", resize: "vertical", outline: "none",
                boxSizing: "border-box", lineHeight: 1.5,
                boxShadow: `0 0 0 0 ${LANG_COLORS.english}00`,
                transition: "box-shadow 0.2s, border-color 0.2s",
              }}
              onFocus={e => e.target.style.boxShadow = `0 0 0 2px ${LANG_COLORS.english}30`}
              onBlur={e  => e.target.style.boxShadow = "none"} />
          </div>
          {["tamil", "hindi", "french"].map(lang => (
            <div key={lang}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: LANG_COLORS[lang],
                            textTransform: "uppercase", letterSpacing: 1.5, margin: 0 }}>{lang}</p>
                {translating && <p style={{ fontSize: 10, color: THEME.sub, fontStyle: "italic", margin: 0 }}>
                  translating...
                </p>}
              </div>
              <textarea value={texts[lang]} onChange={e => setTexts(p => ({ ...p, [lang]: e.target.value }))}
                placeholder="Auto-filled..." rows={3}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8,
                  border: `1px solid ${texts[lang] ? LANG_COLORS[lang] + "50" : THEME.border}`,
                  background: THEME.inputBg,
                  color: texts[lang] ? THEME.text : THEME.sub,
                  fontSize: 13, fontFamily: "inherit", resize: "vertical",
                  outline: "none", boxSizing: "border-box", lineHeight: 1.5,
                  transition: "border-color 0.3s",
                }} />
            </div>
          ))}
        </div>

        <button onClick={analyze}
          disabled={!texts.english.trim() || analyzing || translating}
          style={{
            padding: "11px 32px", borderRadius: 9, fontSize: 13, fontWeight: 700,
            border: `1px solid ${THEME.accent}`, cursor: "pointer",
            background: analyzing ? THEME.grid : THEME.buttonGradient,
            color: analyzing ? THEME.sub : THEME.text,
            opacity: translating ? 0.5 : 1,
            boxShadow: analyzing ? "none" : THEME.glow,
            transition: "all 0.2s",
          }}>
          {analyzing ? "Analyzing..." : "Analyze"}
        </button>

        {result?.error && (
          <div style={{ marginTop: 14, padding: "12px 16px", background: "#1a0818",
                        border: `1px solid ${THEME.danger}44`, borderRadius: 9,
                        color: THEME.dangerSoft, fontSize: 12 }}>
            {result.error}
          </div>
        )}

        {result && !result.error && (
          <div style={{ marginTop: 24, paddingTop: 22, borderTop: `1px solid ${THEME.border}` }}>
            <SLabel>Token Usage — relative comparison</SLabel>
            {LANGUAGES.map(lang => {
              const d = result.languages?.[lang];
              if (!d) return null;
              return <TokenRow key={lang} lang={lang} tokens={d.gpt_tokens}
                maxTokens={maxLive} color={LANG_COLORS[lang]} tis={d.tis_gpt} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
