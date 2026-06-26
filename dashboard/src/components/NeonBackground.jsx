import { useEffect, useRef } from "react";
import { THEME } from "../theme";

/** Ambient floating neon orbs — pure CSS, no canvas */
export default function NeonBackground() {
  return (
    <div aria-hidden style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden",
    }}>
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="orb orb-4" />
      <style>{`
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.35;
          animation: drift 18s ease-in-out infinite;
        }
        .orb-1 {
          width: 420px; height: 420px;
          background: ${THEME.accent};
          top: -8%; left: -5%;
          animation-duration: 22s;
        }
        .orb-2 {
          width: 340px; height: 340px;
          background: ${THEME.magenta};
          top: 40%; right: -10%;
          animation-delay: -6s;
          animation-duration: 26s;
        }
        .orb-3 {
          width: 280px; height: 280px;
          background: ${THEME.violet};
          bottom: -5%; left: 30%;
          animation-delay: -12s;
          animation-duration: 20s;
        }
        .orb-4 {
          width: 200px; height: 200px;
          background: ${THEME.successDim};
          top: 15%; left: 55%;
          animation-delay: -3s;
          opacity: 0.2;
        }
        @keyframes drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(30px, -40px) scale(1.08); }
          66%       { transform: translate(-25px, 25px) scale(0.95); }
        }
      `}</style>
    </div>
  );
}

/** Brief confetti burst for easter eggs */
export function ConfettiBurst({ active }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!active || !ref.current) return;
    const colors = [THEME.accent, THEME.magenta, THEME.violet, THEME.successDim, "#fde047"];
    ref.current.innerHTML = "";
    for (let i = 0; i < 48; i++) {
      const p = document.createElement("span");
      const angle = (i / 48) * Math.PI * 2;
      const dist = 80 + Math.random() * 120;
      p.style.cssText = `
        position: fixed; left: 50%; top: 40%; width: 6px; height: 6px;
        border-radius: ${Math.random() > 0.5 ? "50%" : "2px"};
        background: ${colors[i % colors.length]};
        pointer-events: none; z-index: 9999;
        animation: burst 1.2s ease-out forwards;
        --tx: ${Math.cos(angle) * dist}px;
        --ty: ${Math.sin(angle) * dist}px;
      `;
      ref.current.appendChild(p);
    }
    const t = setTimeout(() => { if (ref.current) ref.current.innerHTML = ""; }, 1300);
    return () => clearTimeout(t);
  }, [active]);

  return (
    <>
      <div ref={ref} />
      <style>{`
        @keyframes burst {
          0%   { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0); opacity: 0; }
        }
      `}</style>
    </>
  );
}

export const BIAS_FACTS = [
  "Tamil & Hindi often need 2–5× more tokens than English for the same sentence.",
  "Token bias silently shrinks context windows for non-Latin scripts.",
  "GPT-4o uses o200k_base — a different vocabulary than GPT-4's cl100k_base.",
  "One Tamil syllable can become 3–6 BPE fragments. English words often stay whole.",
  "Higher TIS = you pay more API dollars for the same user experience abroad.",
  "Arabic diacritics and ligatures confuse byte-pair encoders the most.",
  "Fairness isn't fluency — a model can speak Tamil yet still over-charge tokens.",
  "Domain matters: legal Tamil text tokenizes differently than casual chat.",
];
