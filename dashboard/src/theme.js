/** Dark base + high-chroma neon / pastel accents */
export const THEME = {
  bg:              "#000000",
  surface:         "#0a0a0a",
  card:            "#111833",
  cardHover:       "#161f3d",
  cardGradient:    "#0d0d0d",
  inputBg:         "#080c18",
  rowAlt:          "#0f1528",
  rowAlt2:         "#0c1020",

  border:          "#1e2d5a",
  borderSub:       "#151d35",
  borderGlow:      "#00e5ff33",

  accent:          "#00e5ff",
  accentSoft:      "#67f0ff",
  accentDim:       "#818cf8",
  magenta:         "#ff5ecc",
  violet:          "#a78bfa",

  text:            "#e8eeff",
  textSoft:        "#b4c0e0",
  muted:           "#7b8ab8",
  sub:             "#556080",

  success:         "#39ff14",
  successDim:      "#4ade80",
  warning:         "#ffee58",
  danger:          "#ff4757",
  dangerSoft:      "#ff6b81",

  grid:            "#141e3a",
  tooltipBg:       "#141c38",
  tooltipBorder:   "#2a3f7a",

  glow:            "0 0 20px #00e5ff33",
  glowStrong:      "0 0 40px #00e5ff55",
  titleGradient:   "linear-gradient(135deg, #e8eeff 20%, #00e5ff 55%, #ff5ecc 100%)",
  logoGradient:    "linear-gradient(135deg, #67f0ff, #a78bfa)",
  buttonGradient:  "linear-gradient(135deg, #1e3a5f, #6366f1)",
  tabActiveGradient: "linear-gradient(135deg, #6366f1, #818cf8)",
  sidebarGradient: "linear-gradient(180deg, #111833 0%, #0c1022 100%)",
};

export const LANG_COLORS = {
  english: "#67e8f9",
  tamil:   "#fde047",
  hindi:   "#fb7185",
  french:  "#c084fc",
  arabic:  "#34d399",
};

export const FAMILY_COLORS = {
  "GPT-4o":  "#fde047",
  "GPT-4":   "#67e8f9",
  "GPT-3.5": "#818cf8",
  "GPT-3":   "#a78bfa",
  "Codex":   "#c084fc",
  "Legacy":  "#34d399",
  "GPT-2":   "#8892b0",
};

export const cardStyle = {
  background: "#0d0d0d",
  borderRadius: 14,
  border: `1px solid ${THEME.border}`,
  padding: "24px 26px",
  boxShadow: "0 4px 24px #00000066",
};

export const cardGlowStyle = {
  ...cardStyle,
  boxShadow: `0 0 30px ${THEME.accent}18, 0 4px 24px #00000066`,
};

export const sLabelStyle = {
  fontSize: 10,
  color: THEME.accentDim,
  letterSpacing: 3,
  textTransform: "uppercase",
  fontWeight: 700,
  margin: "0 0 16px",
  display: "flex",
  alignItems: "center",
  gap: 8,
};

export const pageEyebrowStyle = {
  fontSize: 11,
  color: THEME.accentDim,
  letterSpacing: 3,
  textTransform: "uppercase",
  margin: "0 0 10px",
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  gap: 8,
};

export const pageTitleStyle = {
  fontSize: 30,
  fontWeight: 900,
  margin: "0 0 10px",
  background: THEME.titleGradient,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

export const pageDescStyle = {
  fontSize: 14,
  color: THEME.muted,
  margin: 0,
  lineHeight: 1.6,
};
