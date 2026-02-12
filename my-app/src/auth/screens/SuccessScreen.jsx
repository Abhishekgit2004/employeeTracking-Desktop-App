import SubmitButton from "../components/SubmitButton";
import { ScreenWrapper } from "../components/Shared";

export default function SuccessScreen({ onSwitch }) {
  return (
    <ScreenWrapper>
      {/* animated checkmark circle */}
      <div style={S.checkCircle}>
        <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h2 style={S.heading}>Account Created!</h2>
      <p  style={S.sub}>Your account is ready. Sign in to start tracking.</p>

      <SubmitButton onClick={() => onSwitch("login")}>
        Go to Sign In
      </SubmitButton>
    </ScreenWrapper>
  );
}

/* ── inject pop-in keyframes once ── */
if (typeof document !== "undefined" && !document.getElementById("pop-in-kf")) {
  const style = document.createElement("style");
  style.id    = "pop-in-kf";
  style.textContent = `
    @keyframes popIn {
      from { transform: scale(.4); opacity: 0; }
      to   { transform: scale(1);  opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

const S = {
  checkCircle: {
    width:          72,
    height:         72,
    borderRadius:   "50%",
    background:     "linear-gradient(135deg, #5b7fff, #7c5cfc)",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    margin:         "0 auto 18px",
    boxShadow:      "0 6px 24px rgba(91,127,255,.35)",
    animation:      "popIn .4s cubic-bezier(.175,.885,.32,1.275) both",
  },
  heading: {
    fontFamily:    "'Syne', sans-serif",
    fontSize:      "1.4rem",
    fontWeight:    700,
    color:         "#e8eaef",
    textAlign:     "center",
    marginBottom:  6,
  },
  sub: {
    textAlign:  "center",
    color:      "#6b7280",
    fontSize:   ".875rem",
    marginBottom: 26,
    fontFamily: "'DM Sans', sans-serif",
  },
};
