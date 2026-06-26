import { useState, useRef, useCallback } from "react";
import { THEME, LANG_COLORS, FAMILY_COLORS, cardStyle,
         sLabelStyle, pageEyebrowStyle, pageTitleStyle, pageDescStyle } from "../theme";

const LANG_ORDER = ["english", "tamil", "hindi", "french", "arabic"];

const LLM_FAMILIES = {
  "GPT-4 / GPT-3.5":       "GPT-4",
  "GPT-4o":                 "GPT-4o",
  "GPT-4o-mini":            "GPT-4o",
  "GPT-4-Turbo":            "GPT-4",
  "GPT-3.5-Turbo-Instruct": "GPT-3.5",
  "text-davinci-003":       "GPT-3",
  "text-davinci-002":       "GPT-3",
  "code-davinci-002":       "Codex",
  "davinci-002":            "Legacy",
  "GPT-2":                  "GPT-2",
};

const SLabel = ({ children }) => (
  <p style={sLabelStyle}>
    <span style={{ width: 20, height: 1, background: THEME.accentDim, display: "inline-block" }} />
    {children}
  </p>
);

export default function LLMCompare() {
  const [texts, setTexts]     = useState({ english: "", tamil: "", hindi: "", french: "", arabic: "" });
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [transing, setTrans]  = useState(false);
  const debounce = useRef(null);

  const handleEnglish = useCallback((val) => {
    setTexts(p => ({ ...p, english: val }));
    setResult(null);
    if (debounce.current) clearTimeout(debounce.current);
    if (!val.trim()) {
      setTexts({ english: val, tamil: "", hindi: "", french: "", arabic: "" });
      return;
    }
    debounce.current = setTimeout(async () => {
      setTrans(true);
      try {
        const res  = await fetch("/api/translate", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: val }),
        });
        const data = await res.json();
        setTexts({ english: val,
          tamil: data.tamil || "", hindi: data.hindi || "",
          french: data.french || "", arabic: data.arabic || "" });
      } catch {}
      setTrans(false);
    }, 700);
  }, []);

  const compare = async () => {
    if (!texts.english.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/llm-compare", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts }),
      });
      setResult(await res.json());
    } catch {
      setResult({ error: "API offline." });
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <p style={pageEyebrowStyle}>
          <span style={{ width: 30, height: 1, background: THEME.accentDim, display: "inline-block" }} />
          Research
        </p>
        <h1 style={pageTitleStyle}>10 LLM Tokenizer Comparison</h1>
        <p style={pageDescStyle}>
          Compare how 10 different LLM tokenizers handle the same text
          across 5 languages. Helps you choose the right model for multilingual workloads.
        </p>
      </div>

      <div style={cardStyle}>
        <SLabel>Enter Text (type English — all 5 languages auto-fill)</SLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: 12, marginBottom: 16 }}>
          {LANG_ORDER.map(lang => (
            <div key={lang}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: LANG_COLORS[lang],
                            textTransform: "uppercase", letterSpacing: 1.5, margin: 0 }}>{lang}</p>
                {lang !== "english" && transing && (
                  <p style={{ fontSize: 9, color: THEME.sub, fontStyle: "italic", margin: 0 }}>
                    translating...
                  </p>
                )}
              </div>
              <textarea
                value={texts[lang]}
                onChange={e => lang === "english"
                  ? handleEnglish(e.target.value)
                  : setTexts(p => ({ ...p, [lang]: e.target.value }))}
                placeholder={lang === "english" ? "Type here..." : "Auto-filled..."}
                rows={2}
                style={{
                  width: "100%", padding: "9px 11px", borderRadius: 8,
                  border: `1px solid ${texts[lang] ? LANG_COLORS[lang] + "50" : THEME.border}`,
                  background: THEME.inputBg,
                  color: texts[lang] ? THEME.text : THEME.sub,
                  fontSize: 12, fontFamily: "inherit", resize: "vertical",
                  outline: "none", boxSizing: "border-box", transition: "border-color 0.3s",
                }}
              />
            </div>
          ))}
        </div>
        <button onClick={compare} disabled={!texts.english.trim() || loading || transing}
          style={{
            padding: "11px 32px", borderRadius: 9, fontSize: 13, fontWeight: 700,
            border: `1px solid ${THEME.accent}`, cursor: "pointer",
            background: loading ? THEME.grid : THEME.buttonGradient,
            color: loading ? THEME.sub : THEME.text,
            opacity: transing ? 0.5 : 1,
            boxShadow: loading ? "none" : THEME.glow,
            transition: "all 0.2s",
          }}>
          {loading ? "Comparing..." : "Compare All 10 LLMs"}
        </button>
      </div>

      {result?.error && (
        <div style={{ padding: "12px 16px", background: "#1a0818", border: `1px solid ${THEME.danger}44`,
                      borderRadius: 9, color: THEME.dangerSoft, fontSize: 12 }}>
          {result.error}
        </div>
      )}

      {result && !result.error && (
        <>
          <div style={cardStyle}>
            <SLabel>Full Token Matrix — All 10 LLMs × 5 Languages</SLabel>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse",
                              fontSize: 11, minWidth: 600 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${THEME.border}` }}>
                    <th style={{ textAlign: "left", padding: "10px 16px 10px 0",
                                 color: THEME.sub, fontWeight: 600, fontSize: 10,
                                 textTransform: "uppercase", letterSpacing: 1, minWidth: 180 }}>
                      LLM Tokenizer
                    </th>
                    {LANG_ORDER.map(lang => (
                      <th key={lang} style={{ textAlign: "right", padding: "10px 12px",
                                               color: LANG_COLORS[lang], fontWeight: 700,
                                               fontSize: 10, textTransform: "uppercase" }}>
                        {lang}
                      </th>
                    ))}
                    <th style={{ textAlign: "right", padding: "10px 0 10px 12px",
                                 color: THEME.sub, fontWeight: 600, fontSize: 10,
                                 textTransform: "uppercase" }}>
                      Encoding
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(result.matrix).map(([llm, langs], i) => {
                    const meta   = result.llm_meta?.[llm] ?? {};
                    const family = LLM_FAMILIES[llm] ?? "";
                    const fc     = FAMILY_COLORS[family] ?? THEME.accent;
                    const engT   = langs.english ?? 1;
                    return (
                      <tr key={llm} style={{
                        borderBottom: `1px solid ${THEME.borderSub}`,
                        background: i % 2 === 0 ? THEME.card : THEME.rowAlt,
                      }}>
                        <td style={{ padding: "10px 16px 10px 0" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 9, fontWeight: 700, color: fc,
                                           background: `${fc}18`, padding: "2px 7px",
                                           borderRadius: 4, letterSpacing: 1,
                                           border: `1px solid ${fc}33` }}>
                              {family}
                            </span>
                            <span style={{ fontSize: 11, color: THEME.textSoft, fontWeight: 500 }}>
                              {llm}
                            </span>
                          </div>
                        </td>
                        {LANG_ORDER.map(lang => {
                          const t   = langs[lang] ?? 0;
                          const tis = lang !== "english" && engT > 0
                            ? ((t / engT) - 1) * 100 : 0;
                          return (
                            <td key={lang} style={{ padding: "10px 12px", textAlign: "right" }}>
                              <span style={{ fontWeight: 700, color: LANG_COLORS[lang] }}>{t}</span>
                              {lang !== "english" && (
                                <span style={{ fontSize: 9, color: tis > 50 ? THEME.danger : THEME.successDim,
                                               marginLeft: 4 }}>
                                  +{tis.toFixed(0)}%
                                </span>
                              )}
                            </td>
                          );
                        })}
                        <td style={{ padding: "10px 0 10px 12px", textAlign: "right",
                                     fontSize: 10, color: THEME.sub, fontStyle: "italic" }}>
                          {meta.encoding ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
            {LANG_ORDER.map(lang => {
              const best = result.best_per_lang?.[lang];
              if (!best) return null;
              return (
                <div key={lang} style={{
                  background: THEME.cardGradient,
                  borderRadius: 12, border: `1px solid ${LANG_COLORS[lang]}33`,
                  padding: "14px 16px", boxShadow: `0 0 14px ${LANG_COLORS[lang]}18`,
                }}>
                  <p style={{ fontSize: 10, color: LANG_COLORS[lang], fontWeight: 700,
                              textTransform: "uppercase", letterSpacing: 1.5, margin: "0 0 8px" }}>
                    {lang}
                  </p>
                  <p style={{ fontSize: 10, color: THEME.sub, margin: "0 0 4px" }}>
                    Best tokenizer:
                  </p>
                  <p style={{ fontSize: 12, fontWeight: 700, color: THEME.text, margin: "0 0 4px" }}>
                    {best.llm}
                  </p>
                  <p style={{ fontSize: 20, fontWeight: 900, color: LANG_COLORS[lang], margin: 0 }}>
                    {best.tokens} <span style={{ fontSize: 11, fontWeight: 400, color: THEME.sub }}>tokens</span>
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
