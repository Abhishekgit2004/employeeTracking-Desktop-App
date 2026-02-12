/* =====================================================
   components/StrengthMeter.jsx
   =====================================================
   <StrengthMeter password={string} />
   Renders four small bars that colour-shift as the
   password grows stronger.  Rules:
     1 bar  – length ≥ 6
     2 bars – has an uppercase letter
     3 bars – has a digit
     4 bars – has a special character
   ===================================================== */

import { useMemo } from "react";

const COLORS = ["#f05a5a", "#f5a623", "#f5d623", "#4ade80"];

export default function StrengthMeter({ password }) {
  const score = useMemo(() => {
    let s = 0;
    if (password.length >= 6)            s++;
    if (/[A-Z]/.test(password))          s++;
    if (/[0-9]/.test(password))          s++;
    if (/[^A-Za-z0-9]/.test(password))   s++;
    return s;
  }, [password]);

  return (
    <div style={{ display: "flex", gap: 5, marginBottom: 16 }}>
      {[0, 1, 2, 3].map(i => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 3,
            borderRadius: 2,
            background: i < score ? COLORS[score - 1] : "var(--border)",
            transition: "background .28s ease",
            /* subtle scale-in when bar activates */
            transformOrigin: "left",
            animation: i < score ? "barFill .3s ease both" : "none",
          }}
        />
      ))}
    </div>
  );
}