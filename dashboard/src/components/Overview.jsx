import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
  LineChart, Line, Legend,
} from "recharts";
import { THEME, cardStyle, cardGlowStyle, sLabelStyle,
         pageEyebrowStyle, pageTitleStyle, pageDescStyle } from "../theme";

const LANGUAGES   = ["english", "tamil", "hindi", "french"];
const ALL_LANGS   = ["english", "tamil", "hindi", "french"];

/* ── Shared tooltip ── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: THEME.tooltipBg, border: `1px solid ${THEME.tooltipBorder}`,
      borderRadius: 8, padding: "10px 14px", fontSize: 11,
      boxShadow: "0 8px 32px #00000088",
    }}>
      <div style={{
        fontWeight: 600, marginBottom: 6, color: THEME.accent,
        fontSize: 10, textTransform: "uppercase", letterSpacing: 1,
      }}>
        {label}
      </div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || THEME.textSoft, marginBottom: 2 }}>
          {p.name}:{" "}
          <b style={{ color: THEME.text }}>
            {typeof p.value === "number" ? p.value.toFixed(2) : p.value}
          </b>
        </div>
      ))}
    </div>
  );
};

const SLabel = ({ children }) => (
  <p style={sLabelStyle}>
    <span style={{
      width: 20, height: 1, background: THEME.accentDim, display: "inline-block",
    }} />
    {children}
  </p>
);


export default function Overview({ stats, LANG_COLORS }) {
  if (!stats?.token_stats) return (
    <div style={{ color: THEME.muted, fontSize: 14, padding: 40 }}>
      Loading dataset stats...
    </div>
  );

  /* ── KPI values ── */
  const engMean = stats.token_stats?.english?.mean_gpt_tokens ?? 0;

  const kpis = [
    {
      label: "Sentences",
      value: stats.total_rows?.toLocaleString() ?? "—",
      accent: THEME.accent,
    },
    {
      label: "Domains",
      value: stats.domains?.length ?? "—",
      accent: THEME.violet,
    },
    {
      label: "Languages",
      value: "4",
      accent: THEME.magenta,
    },
    {
      label: "Eng. Tokens",
      value: engMean.toFixed(1),
      accent: LANG_COLORS.english,
    },
  ];

  /* ── Bar chart data: avg GPT tokens per language ── */
  const barData = LANGUAGES.map(lang => ({
    lang: lang[0].toUpperCase() + lang.slice(1),
    tokens: parseFloat((stats.token_stats[lang]?.mean_gpt_tokens ?? 0).toFixed(1)),
    color: LANG_COLORS[lang],
  }));

  /* ── Line chart data: TIS score per language (all 4) ── */
  // English is always 0 — shown as the baseline anchor point.
  const tisData = ALL_LANGS.map(lang => ({
    lang: lang[0].toUpperCase() + lang.slice(1),
    mean:   lang === "english" ? 0 : parseFloat(((stats.tis_stats?.[lang]?.mean   ?? 0) * 100).toFixed(2)),
    median: lang === "english" ? 0 : parseFloat(((stats.tis_stats?.[lang]?.median ?? 0) * 100).toFixed(2)),
    std:    lang === "english" ? 0 : parseFloat(((stats.tis_stats?.[lang]?.std    ?? 0) * 100).toFixed(2)),
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

      {/* ── Page header ── */}
      <div>
        <h1 style={{ ...pageTitleStyle, fontSize: 32, lineHeight: 1.15 }}>
          Language Tokenization Fairness
        </h1>
      </div>


      {/* ── 4 KPI Cards ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 16,
      }}>
        {kpis.map((k) => (
          <div key={k.label} style={{
            background: THEME.cardGradient,
            borderRadius: 14,
            border: `1px solid ${THEME.border}`,
            borderTop: `3px solid ${k.accent}`,
            padding: "20px 22px",
            boxShadow: `0 0 20px ${k.accent}14, 0 4px 16px #00000044`,
            position: "relative", overflow: "hidden",
          }}>
            {/* decorative corner glow */}
            <div style={{
              position: "absolute", top: 0, right: 0,
              width: 56, height: 56, borderRadius: "0 14px 0 56px",
              background: `linear-gradient(225deg, ${k.accent}22, transparent)`,
              pointerEvents: "none",
            }} />
            <p style={{
              fontSize: 10, color: k.accent, textTransform: "uppercase",
              letterSpacing: 1.5, margin: "0 0 10px", fontWeight: 700,
            }}>
              {k.label}
            </p>
            <p style={{
              fontSize: 32, fontWeight: 900, color: THEME.text,
              margin: 0, lineHeight: 1,
            }}>
              {k.value}
            </p>
          </div>
        ))}
      </div>


      {/* ── 2 Charts ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: 20,
      }}>

        {/* Chart 1: Bar — Avg GPT Tokens per Language */}
        <div style={{ ...cardGlowStyle }}>
          <SLabel>Avg GPT Tokens per Language</SLabel>
          <p style={{ fontSize: 11, color: THEME.sub, margin: "0 0 18px", lineHeight: 1.5 }}>
            Average token count across all sentences in the dataset, broken down by language.
          </p>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart
              data={barData}
              margin={{ left: -18, right: 8, top: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} vertical={false} />
              <XAxis
                dataKey="lang"
                tick={{ fontSize: 11, fill: THEME.muted }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: THEME.sub }}
                axisLine={false} tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: `${THEME.accent}08` }} />
              <Bar dataKey="tokens" name="Avg Tokens" radius={[6, 6, 0, 0]} barSize={46}>
                {barData.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.color}
                    style={{ filter: `drop-shadow(0 0 6px ${d.color}66)` }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Mini legend */}
          <div style={{
            display: "flex", gap: 16, flexWrap: "wrap",
            marginTop: 10, paddingTop: 10,
            borderTop: `1px solid ${THEME.border}`,
          }}>
            {barData.map(d => (
              <div key={d.lang} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{
                  width: 10, height: 10, borderRadius: 3,
                  background: d.color, display: "inline-block",
                  boxShadow: `0 0 6px ${d.color}88`,
                }} />
                <span style={{ fontSize: 11, color: THEME.muted }}>{d.lang}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: d.color }}>
                  {d.tokens}
                </span>
              </div>
            ))}
          </div>
        </div>


        {/* Chart 2: Line — TIS Score per Language */}
        <div style={{ ...cardStyle }}>
          <SLabel>TIS Score per Language</SLabel>
          <p style={{ fontSize: 11, color: THEME.sub, margin: "0 0 18px", lineHeight: 1.5 }}>
            Token Inequality Score — mean, median and std deviation of token overhead
            vs English (%). Higher = more biased against that language.
          </p>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart
              data={tisData}
              margin={{ left: -12, right: 16, top: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} vertical={false} />
              <XAxis
                dataKey="lang"
                tick={{ fontSize: 11, fill: THEME.muted }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: THEME.sub }}
                axisLine={false} tickLine={false}
                tickFormatter={v => `${v}%`}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: THEME.border, strokeWidth: 1 }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, color: THEME.muted, paddingTop: 8 }}
              />
              <Line
                type="monotone"
                dataKey="mean"
                name="Mean TIS %"
                stroke={THEME.accent}
                strokeWidth={2.5}
                dot={{ fill: THEME.accent, r: 5, strokeWidth: 0 }}
                activeDot={{ r: 7, fill: THEME.accent,
                             boxShadow: `0 0 10px ${THEME.accent}` }}
              />
              <Line
                type="monotone"
                dataKey="median"
                name="Median TIS %"
                stroke={THEME.violet}
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={{ fill: THEME.violet, r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: THEME.violet }}
              />
              <Line
                type="monotone"
                dataKey="std"
                name="Std Dev %"
                stroke={THEME.magenta}
                strokeWidth={1.5}
                strokeDasharray="3 4"
                dot={{ fill: THEME.magenta, r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: THEME.magenta }}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Per-language TIS summary — all 4 languages */}
          <div style={{
            display: "flex", flexDirection: "column", gap: 8,
            marginTop: 12, paddingTop: 12,
            borderTop: `1px solid ${THEME.border}`,
          }}>
            {ALL_LANGS.map(lang => {
              const mean = lang === "english" ? 0 : (stats.tis_stats?.[lang]?.mean ?? 0) * 100;
              const flag = lang === "english" ? "BASE" : mean >= 40 ? "HIGH" : mean > 10 ? "MOD" : "LOW";
              const fc   = lang === "english" ? THEME.accentDim
                         : mean >= 40 ? THEME.danger : mean > 10 ? THEME.warning : THEME.successDim;
              // scale bar against max TIS across all non-English
              const maxMean = Math.max(...["tamil","hindi","french"].map(l =>
                (stats.tis_stats?.[l]?.mean ?? 0) * 100));
              const pct = lang === "english" ? 2 : maxMean > 0 ? Math.min((mean / maxMean) * 100, 100) : 0;
              return (
                <div key={lang}>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: 4,
                  }}>
                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      color: LANG_COLORS[lang], textTransform: "capitalize",
                    }}>
                      {lang}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, color: THEME.textSoft }}>
                        {lang === "english" ? "baseline (0%)" : `+${mean.toFixed(1)}% overhead`}
                      </span>
                      <span style={{
                        fontSize: 9, fontWeight: 700, color: fc, letterSpacing: 1.5,
                        background: `${fc}18`, border: `1px solid ${fc}44`,
                        padding: "2px 7px", borderRadius: 4,
                      }}>
                        {flag}
                      </span>
                    </div>
                  </div>
                  <div style={{
                    height: 5, borderRadius: 3,
                    background: THEME.inputBg, overflow: "hidden",
                    border: `1px solid ${THEME.border}`,
                  }}>
                    <div style={{
                      width: `${pct}%`, height: "100%", borderRadius: 3,
                      background: `linear-gradient(90deg, ${LANG_COLORS[lang]}99, ${LANG_COLORS[lang]})`,
                      boxShadow: `0 0 8px ${LANG_COLORS[lang]}66`,
                      transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
