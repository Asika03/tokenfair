import { THEME } from "../theme";

/** Animated circular fairness score (0–100, higher = fairer) */
export default function FairnessGauge({ score, label = "TokenFair Index" }) {
  const clamped = Math.max(0, Math.min(100, score));
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (clamped / 100) * circ;
  const color = clamped >= 70 ? THEME.successDim : clamped >= 40 ? THEME.warning : THEME.dangerSoft;

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "8px 0",
    }}>
      <div style={{ position: "relative", width: 130, height: 130 }}>
        <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="65" cy="65" r={r} fill="none"
            stroke={THEME.border} strokeWidth="8" opacity="0.5" />
          <circle cx="65" cy="65" r={r} fill="none"
            stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)",
              filter: `drop-shadow(0 0 8px ${color}88)`,
            }} />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{
            fontSize: 32, fontWeight: 900, color,
            textShadow: `0 0 20px ${color}66`,
            lineHeight: 1,
          }}>
            {Math.round(clamped)}
          </span>
          <span style={{ fontSize: 9, color: THEME.sub, letterSpacing: 2, marginTop: 4 }}>
            / 100
          </span>
        </div>
      </div>
      <p style={{
        fontSize: 10, color: THEME.accentDim, fontWeight: 700,
        letterSpacing: 2, textTransform: "uppercase", margin: "10px 0 4px",
      }}>
        {label}
      </p>
      <p style={{ fontSize: 11, color: THEME.muted, margin: 0, textAlign: "center", maxWidth: 160, lineHeight: 1.4 }}>
        {clamped >= 70 ? "Relatively balanced" : clamped >= 40 ? "Moderate bias detected" : "Significant token inequality"}
      </p>
    </div>
  );
}

/** Compute fairness index from dataset TIS stats (100 = perfect parity) */
export function computeFairnessIndex(tisStats) {
  if (!tisStats) return 72;
  const vals = ["tamil", "hindi", "french"]
    .map(l => tisStats[l]?.mean)
    .filter(v => v != null);
  if (!vals.length) return 72;
  const avgOverhead = vals.reduce((a, b) => a + b, 0) / vals.length;
  return Math.max(5, Math.min(98, 100 - avgOverhead * 120));
}
