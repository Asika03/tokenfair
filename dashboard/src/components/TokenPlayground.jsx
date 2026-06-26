import { useState, useEffect, useRef, useCallback } from "react";
import { THEME, LANG_COLORS, cardStyle, cardGlowStyle,
         sLabelStyle, pageEyebrowStyle, pageTitleStyle, pageDescStyle } from "../theme";

const LLM_OPTIONS = [
  "GPT-4 / GPT-3.5",
  "GPT-4o",
  "GPT-4o-mini",
  "GPT-4-Turbo",
  "GPT-3.5-Turbo-Instruct",
  "GPT-2",
  "text-davinci-003",
  "text-davinci-002",
  "code-davinci-002",
  "davinci-002",
];

// Pricing: input + output combined per 1K tokens
const LLM_PRICING = {
  "GPT-5":               { input: 0.015,   output: 0.060  },
  "GPT-4.1":             { input: 0.002,   output: 0.008  },
  "GPT-4o":              { input: 0.005,   output: 0.015  },
  "GPT-4o-mini":         { input: 0.00015, output: 0.0006 },
  "GPT-4 / GPT-3.5":    { input: 0.0005,  output: 0.0015 },
  "Claude 3.5 Sonnet":   { input: 0.003,   output: 0.015  },
  "Claude 3 Haiku":      { input: 0.00025, output: 0.00125},
  "Gemini 1.5 Pro":      { input: 0.00125, output: 0.005  },
  "Gemini 1.5 Flash":    { input: 0.000075,output: 0.0003 },
  "Llama 3 70B":         { input: 0.0009,  output: 0.0009 },
};

function chipHue(id) { return (id * 47 + 180) % 360; }


function TokenChip({ token, index, explode }) {
  const hue = chipHue(token.id ?? index);
  const display = token.text === " " ? "␣" : token.text === "\n" ? "↵" : token.text;
  const angle = explode ? (index * 37) % 360 : 0;
  const dist  = explode ? 40 + (index % 5) * 18 : 0;
  return (
    <span
      title={`#${token.id} · token ${index + 1}`}
      style={{
        display: "inline-block", margin: "3px", padding: "4px 8px",
        borderRadius: 6, fontSize: 12,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        background: `hsla(${hue}, 75%, 55%, 0.18)`,
        border: `1px solid hsla(${hue}, 80%, 60%, 0.55)`,
        color: `hsl(${hue}, 90%, 78%)`,
        boxShadow: `0 0 10px hsla(${hue}, 80%, 50%, 0.25)`,
        transition: "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s",
        transform: explode
          ? `translate(${Math.cos(angle * Math.PI / 180) * dist}px, ${Math.sin(angle * Math.PI / 180) * dist}px) rotate(${angle * 0.3}deg)`
          : "none",
        whiteSpace: "pre-wrap", wordBreak: "break-all",
      }}
    >{display}</span>
  );
}

const SLabel = ({ children }) => (
  <p style={sLabelStyle}>
    <span style={{ width: 20, height: 1, background: THEME.accentDim, display: "inline-block" }} />
    {children}
  </p>
);

const Divider = () => (
  <div style={{
    height: 1, background: `linear-gradient(90deg, transparent, ${THEME.border}, transparent)`,
    margin: "8px 0",
  }} />
);


export default function TokenPlayground() {
  // ── Token Explorer state ──
  const [text, setText]       = useState("Language is not neutral in the eyes of a tokenizer.");
  const [llm, setLlm]         = useState("GPT-4 / GPT-3.5");
  const [visual, setVisual]   = useState(null);
  const [explode, setExplode] = useState(false);
  const debounce = useRef(null);

  // ── Prompt Optimizer state ──
  const [prompt, setPrompt]         = useState("");
  const [optResult, setOptResult]   = useState(null);
  const [optLoading, setOptLoading] = useState(false);

  // ── Fetch token visualization ──
  const fetchVisual = useCallback(async (t, model) => {
    if (!t.trim()) { setVisual(null); return; }
    try {
      const res = await fetch("/api/tokenize-visual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: t, llm: model }),
      });
      setVisual(await res.json());
    } catch { setVisual({ error: "API offline" }); }
  }, []);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => fetchVisual(text, llm), 350);
    return () => clearTimeout(debounce.current);
  }, [text, llm, fetchVisual]);

  const tokenCount = visual?.count ?? 0;
  const tokens     = visual?.tokens ?? [];


  // ── API cost derived from tokenCount ──
  const costRows = Object.entries(LLM_PRICING).map(([model, { input, output }]) => {
    const inputCost  = (tokenCount / 1000) * input;
    const outputCost = (tokenCount / 1000) * output;
    return { model, inputCost, outputCost, totalCost: inputCost + outputCost };
  });

  // ── Prompt Optimizer ──
  const runOptimizer = async () => {
    if (!prompt.trim()) return;
    setOptLoading(true);
    setOptResult(null);
    try {
      // Get original token count
      const visRes = await fetch("/api/tokenize-visual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: prompt, llm: "GPT-4 / GPT-3.5" }),
      });
      const visData = await visRes.json();
      const originalTokens = visData.count ?? 0;

      // Use prompt-estimate to get tips and per-language data
      const estRes = await fetch("/api/prompt-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, users: 1 }),
      });
      const estData = await estRes.json();

      // Build a simulated optimised prompt (strip filler words server-side not available,
      // so we demonstrate by trimming and collapsing whitespace as a client-side proxy,
      // and show the API tip as the optimization advice)
      const optimised = prompt
        .replace(/\bplease\b/gi, "")
        .replace(/\bkindly\b/gi, "")
        .replace(/\bcould you\b/gi, "")
        .replace(/\bI would like you to\b/gi, "")
        .replace(/\bcan you please\b/gi, "")
        .replace(/\bwould you\b/gi, "")
        .replace(/\s{2,}/g, " ")
        .trim();

      // Get optimised token count
      const optVisRes = await fetch("/api/tokenize-visual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: optimised, llm: "GPT-4 / GPT-3.5" }),
      });
      const optVisData = await optVisRes.json();
      const optimisedTokens = optVisData.count ?? 0;

      const saved = originalTokens - optimisedTokens;
      const pctReduction = originalTokens > 0 ? ((saved / originalTokens) * 100).toFixed(1) : 0;

      setOptResult({
        original: prompt,
        optimised,
        originalTokens,
        optimisedTokens,
        saved,
        pctReduction,
        tips: estData.tip ?? [],
      });
    } catch { setOptResult({ error: "API offline — start uvicorn first." }); }
    setOptLoading(false);
  };


  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

      {/* ── Page Header ── */}
      <div>
        <h1 style={pageTitleStyle}>Token Playground</h1>
      </div>

      {/* ══════════════════════════════════════════
          SECTION 1 — TOKEN EXPLORER
      ══════════════════════════════════════════ */}
      <div style={{
        ...cardStyle,
        borderLeft: `3px solid ${THEME.accent}`,
      }}>
        <SLabel>Token Explorer</SLabel>
        <p style={{ fontSize: 12, color: THEME.sub, margin: "0 0 16px", lineHeight: 1.6 }}>
          Type anything below and watch it split into subword tokens in real time. Each chip = 1 token.
        </p>

        <textarea
          value={text}
          onChange={e => { setExplode(false); setText(e.target.value); }}
          rows={3}
          placeholder="Type any sentence here..."
          style={{
            width: "100%", padding: "12px 14px", borderRadius: 9,
            border: `1px solid ${THEME.border}`,
            background: THEME.inputBg, color: THEME.text,
            fontSize: 15, fontFamily: "inherit", resize: "vertical",
            outline: "none", lineHeight: 1.6, boxSizing: "border-box",
          }}
        />

        <div style={{ display: "flex", gap: 12, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
          <select value={llm} onChange={e => setLlm(e.target.value)}
            style={{
              padding: "8px 12px", borderRadius: 8, fontSize: 12,
              background: THEME.inputBg, color: THEME.textSoft,
              border: `1px solid ${THEME.border}`, cursor: "pointer",
            }}>
            {LLM_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>

          <button
            onClick={() => { setExplode(true); setTimeout(() => setExplode(false), 800); }}
            style={{
              padding: "9px 18px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: `1px solid ${THEME.magenta}66`, cursor: "pointer",
              background: `${THEME.magenta}18`, color: THEME.magenta,
            }}>
            Explode Tokens
          </button>

          {tokenCount > 0 && (
            <span style={{ fontSize: 13, color: THEME.muted }}>
              <b style={{ color: THEME.accent, fontSize: 18 }}>{tokenCount}</b>
              {" "}tokens
              {visual?.chars_per_token ? ` · ${visual.chars_per_token} chars/token` : ""}
            </span>
          )}
        </div>

        {/* Token chips */}
        <div style={{
          marginTop: 18, minHeight: 60, padding: "12px",
          background: THEME.inputBg, borderRadius: 10,
          border: `1px solid ${THEME.border}`,
          display: "flex", flexWrap: "wrap", alignItems: "flex-start", lineHeight: 1.8,
        }}>
          {visual?.error ? (
            <p style={{ color: THEME.dangerSoft, fontSize: 13, margin: 0 }}>
              API offline — start uvicorn to explore tokens.
            </p>
          ) : tokens.length === 0 ? (
            <p style={{ color: THEME.sub, fontSize: 13, fontStyle: "italic", margin: 0 }}>
              Type something above to see tokens appear...
            </p>
          ) : (
            tokens.map((t, i) => (
              <TokenChip key={`${t.id}-${i}`} token={t} index={i} explode={explode} />
            ))
          )}
        </div>
      </div>


      {/* ══════════════════════════════════════════
          SECTION 2 — API COST ESTIMATOR
      ══════════════════════════════════════════ */}
      <div style={{
        ...cardGlowStyle,
        borderLeft: `3px solid ${THEME.violet}`,
      }}>
        <SLabel>API Cost Estimator</SLabel>
        <p style={{ fontSize: 12, color: THEME.sub, margin: "0 0 20px", lineHeight: 1.6 }}>
          Estimated cost for <b style={{ color: THEME.accentSoft }}>{tokenCount}</b> tokens
          {" "}(from your input above) across popular LLM APIs. Assumes equal input + output token count.
        </p>

        {tokenCount === 0 ? (
          <p style={{ fontSize: 13, color: THEME.sub, fontStyle: "italic" }}>
            Enter text in Token Explorer above to see cost estimates.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%", borderCollapse: "collapse",
              fontSize: 12, minWidth: 480,
            }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${THEME.border}` }}>
                  {["Model", "Input Cost", "Output Cost", "Total Cost"].map(h => (
                    <th key={h} style={{
                      padding: "8px 14px", textAlign: h === "Model" ? "left" : "right",
                      fontSize: 10, color: THEME.accentDim, letterSpacing: 2,
                      textTransform: "uppercase", fontWeight: 700,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {costRows.map((row, i) => (
                  <tr key={row.model} style={{
                    background: i % 2 === 0 ? "transparent" : `${THEME.inputBg}88`,
                    borderBottom: `1px solid ${THEME.border}44`,
                    transition: "background 0.15s",
                  }}>
                    <td style={{
                      padding: "10px 14px", fontWeight: 600,
                      color: THEME.textSoft,
                    }}>{row.model}</td>
                    <td style={{ padding: "10px 14px", textAlign: "right",
                                 color: THEME.muted, fontFamily: "monospace" }}>
                      ${row.inputCost.toFixed(6)}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right",
                                 color: THEME.muted, fontFamily: "monospace" }}>
                      ${row.outputCost.toFixed(6)}
                    </td>
                    <td style={{
                      padding: "10px 14px", textAlign: "right",
                      fontWeight: 700, fontFamily: "monospace",
                      color: row.totalCost > 0.001 ? THEME.dangerSoft
                           : row.totalCost > 0.0001 ? THEME.warning
                           : THEME.successDim,
                    }}>
                      ${row.totalCost.toFixed(6)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: 10, color: THEME.sub, margin: "12px 0 0", lineHeight: 1.5 }}>
              * Prices per 1K tokens (approximate, based on public list pricing). Actual cost may vary.
            </p>
          </div>
        )}
      </div>


      {/* ══════════════════════════════════════════
          SECTION 3 — PROMPT OPTIMIZER
      ══════════════════════════════════════════ */}
      <div style={{
        ...cardStyle,
        borderLeft: `3px solid ${THEME.magenta}`,
      }}>
        <SLabel>Prompt Optimizer</SLabel>
        <p style={{ fontSize: 12, color: THEME.sub, margin: "0 0 16px", lineHeight: 1.6 }}>
          Paste a long prompt below. We'll estimate its token count and return an optimized version
          that preserves meaning while reducing tokens.
        </p>

        <textarea
          value={prompt}
          onChange={e => { setPrompt(e.target.value); setOptResult(null); }}
          rows={5}
          placeholder="e.g. Could you please kindly help me write a professional email to my manager requesting time off next week..."
          style={{
            width: "100%", padding: "12px 14px", borderRadius: 9,
            border: `1px solid ${THEME.border}`,
            background: THEME.inputBg, color: THEME.text,
            fontSize: 14, fontFamily: "inherit", resize: "vertical",
            outline: "none", lineHeight: 1.6, boxSizing: "border-box",
            transition: "box-shadow 0.2s",
          }}
          onFocus={e => e.target.style.boxShadow = `0 0 0 2px ${THEME.magenta}40`}
          onBlur={e  => e.target.style.boxShadow = "none"}
        />

        <div style={{ marginTop: 14, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={runOptimizer}
            disabled={!prompt.trim() || optLoading}
            style={{
              padding: "11px 32px", borderRadius: 9, fontSize: 13, fontWeight: 700,
              border: `1px solid ${THEME.magenta}`,
              cursor: prompt.trim() && !optLoading ? "pointer" : "not-allowed",
              background: optLoading
                ? THEME.grid
                : `linear-gradient(135deg, ${THEME.magenta}33, ${THEME.violet}33)`,
              color: optLoading ? THEME.sub : THEME.text,
              boxShadow: optLoading ? "none" : `0 0 20px ${THEME.magenta}33`,
              transition: "all 0.2s",
            }}>
            {optLoading ? "Optimizing..." : "Optimize Prompt"}
          </button>
          {prompt.trim() && !optResult && !optLoading && (
            <span style={{ fontSize: 12, color: THEME.sub }}>
              ~{Math.ceil(prompt.length / 4)} tokens (rough estimate)
            </span>
          )}
        </div>

        {/* Error */}
        {optResult?.error && (
          <div style={{
            marginTop: 16, padding: "12px 16px",
            background: "#1a0818", border: `1px solid ${THEME.danger}44`,
            borderRadius: 9, color: THEME.dangerSoft, fontSize: 12,
          }}>
            {optResult.error}
          </div>
        )}


        {/* Results */}
        {optResult && !optResult.error && (
          <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 20 }}>
            <Divider />

            {/* Stats row */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: 12,
            }}>
              {[
                { label: "Original Tokens",   value: optResult.originalTokens,  color: THEME.dangerSoft },
                { label: "Optimized Tokens",  value: optResult.optimisedTokens, color: THEME.successDim },
                { label: "Tokens Saved",      value: optResult.saved,           color: THEME.accentSoft },
                { label: "Token Reduction",   value: `${optResult.pctReduction}%`, color: THEME.violet  },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: THEME.inputBg, borderRadius: 10,
                  border: `1px solid ${THEME.border}`,
                  padding: "14px 16px",
                  boxShadow: `0 0 12px ${stat.color}18`,
                  borderLeft: `3px solid ${stat.color}`,
                }}>
                  <p style={{ fontSize: 9, color: THEME.sub, textTransform: "uppercase",
                              letterSpacing: 1.5, margin: "0 0 6px", fontWeight: 600 }}>
                    {stat.label}
                  </p>
                  <p style={{ fontSize: 24, fontWeight: 900, color: stat.color, margin: 0, lineHeight: 1 }}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Comparison table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${THEME.border}` }}>
                    <th style={{ padding: "8px 14px", textAlign: "left", fontSize: 10,
                                 color: THEME.accentDim, letterSpacing: 2,
                                 textTransform: "uppercase", fontWeight: 700 }}>Version</th>
                    <th style={{ padding: "8px 14px", textAlign: "left", fontSize: 10,
                                 color: THEME.accentDim, letterSpacing: 2,
                                 textTransform: "uppercase", fontWeight: 700 }}>Prompt</th>
                    <th style={{ padding: "8px 14px", textAlign: "right", fontSize: 10,
                                 color: THEME.accentDim, letterSpacing: 2,
                                 textTransform: "uppercase", fontWeight: 700 }}>Tokens</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: `1px solid ${THEME.border}44` }}>
                    <td style={{ padding: "12px 14px", fontWeight: 700,
                                 color: THEME.dangerSoft, whiteSpace: "nowrap" }}>Original</td>
                    <td style={{ padding: "12px 14px", color: THEME.textSoft,
                                 lineHeight: 1.6, wordBreak: "break-word" }}>
                      {optResult.original}
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 700,
                                 fontFamily: "monospace", color: THEME.dangerSoft }}>
                      {optResult.originalTokens}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "12px 14px", fontWeight: 700,
                                 color: THEME.successDim, whiteSpace: "nowrap" }}>Optimized</td>
                    <td style={{ padding: "12px 14px", color: THEME.text,
                                 lineHeight: 1.6, wordBreak: "break-word" }}>
                      {optResult.optimised}
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 700,
                                 fontFamily: "monospace", color: THEME.successDim }}>
                      {optResult.optimisedTokens}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Tips */}
            {optResult.tips?.length > 0 && (
              <div style={{
                background: "linear-gradient(135deg, #141c38, #0c1022)",
                border: `1px solid ${THEME.border}`, borderRadius: 10,
                padding: "14px 18px",
              }}>
                <p style={{ fontSize: 10, color: THEME.accentDim, fontWeight: 700,
                            letterSpacing: 2, textTransform: "uppercase", margin: "0 0 8px" }}>
                  Optimization Tips
                </p>
                {optResult.tips.map((tip, i) => (
                  <p key={i} style={{ fontSize: 12, color: THEME.textSoft,
                                      margin: "0 0 6px", lineHeight: 1.6 }}>
                    • {tip}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
