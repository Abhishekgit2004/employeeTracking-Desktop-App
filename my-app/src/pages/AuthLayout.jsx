/* =====================================================
   pages/AuthLayout.jsx
   ===================================================== */

import { useState } from "react";
import { AuthProvider } from "../context/AuthContext";
import { ToastProvider } from "../context/ToastContext";
import LoginPage from "./LoginPage";
// import SignupPage from "./SignupPage";
// import SignupPage from "./SignupPage";
import SignupPage from "./SignupPage";
import SuccessPage from "./SuccessPage";

export default function AuthLayout({ onLoginSuccess }) {
  const [screen, setScreen] = useState("login"); // "login" | "signup" | "success"

  return (
    <AuthProvider onLoginSuccess={onLoginSuccess}>
      <ToastProvider>
        {/* ── full-viewport shell ── */}
        <div style={S.root}>
          {/* ── centred card ── */}
          <div style={S.cardWrap}>
            <div
              style={S.card}
              key={screen} // key forces unmount → remount → screenIn animation
            >
              {/* top accent line */}
              <div style={S.cardAccent} />

              {/* active screen */}
              {screen === "login" && <LoginPage onSwitch={setScreen} />}
              {screen === "signup" && <SignupPage onSwitch={setScreen} />}
              {screen === "success" && <SuccessPage onSwitch={setScreen} />}
            </div>
          </div>
        </div>
      </ToastProvider>
    </AuthProvider>
  );
}

/* ─── layout styles ─── */
const S = {
  root: {
    position: "fixed",
    inset: 0,
    background: "var(--bg)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  cardWrap: {
    position: "relative",
    zIndex: 2,
    animation: "cardIn .5s cubic-bezier(.22,1,.36,1) both",
  },

  card: {
    width: 430,
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-card)",
    padding: "44px 38px 40px",
    boxShadow: "0 28px 80px rgba(0,0,0,.5)",
    position: "relative",
    overflow: "hidden",
  },

  /* thin gradient rule across top edge */
  cardAccent: {
    position: "absolute",
    top: -1,
    left: "8%",
    right: "8%",
    height: 1,
    background:
      "linear-gradient(90deg, transparent, var(--accent), var(--accent2), transparent)",
    pointerEvents: "none",
  },
};