/* =====================================================
   pages/SuccessPage.jsx
   =====================================================
   Shown after a successful register().
   Animated check-circle + single CTA back to login.
   ===================================================== */

// import SubmitButton from "../components/SubmitButton";
import SubmitButton from "../auth/components/SubmitButton";

export default function SuccessPage({ onSwitch }) {
  return (
    <div style={{ animation: "screenIn .38s cubic-bezier(.22,1,.36,1) both", textAlign: "center" }}>

      {/* pop-in check circle */}
      <div
        style={{
          width: 76,
          height: 76,
          borderRadius: "50%",
          background: "linear-gradient(135deg, var(--accent), var(--accent2))",
          boxShadow: "0 6px 28px var(--accent-glow)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
          animation: "popIn .42s cubic-bezier(.175,.885,.32,1.275) both",
        }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline
            points="20 6 9 17 4 12"
            style={{
              strokeDasharray: 30,
              strokeDashoffset: 0,
              animation: "checkDraw .45s .3s cubic-bezier(.22,1,.36,1) both",
            }}
          />
        </svg>
      </div>

      <h2
        style={{
          fontFamily:    "var(--font-display)",
          fontSize:      "1.45rem",
          fontWeight:    700,
          color:         "var(--text)",
          marginBottom:  6,
        }}
      >
        Account Created!
      </h2>

      <p
        style={{
          color:      "var(--text-dim)",
          fontSize:   ".875rem",
          marginBottom: 28,
        }}
      >
        Your account is ready. Sign in to start tracking.
      </p>

      <SubmitButton onClick={() => onSwitch("login")}>
        Go to Sign In
      </SubmitButton>
    </div>
  );
}
