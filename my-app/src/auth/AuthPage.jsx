import { useState } from "react";
import { AuthProvider }  from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import LoginScreen       from "./screens/LoginScreen";
import SignupScreen      from "./screens/SignupScreen";
import SuccessScreen     from "./screens/SuccessScreen";

/**
 *  <AuthPage />
 *  ──────────────
 *  Drop this into your Electron renderer's root (or a route).
 *  It self-contains the card, ambient bg, font imports, and all three screens.
 *
 *  Usage in your app's entry:
 *    import AuthPage from "./auth/AuthPage";
 *    // ... inside your router / root component:
 *    <AuthPage />
 */
export default function AuthPage() {
  const [screen, setScreen] = useState("login"); // "login" | "signup" | "success"

  return (
    <AuthProvider>
      <ToastProvider>
        {/* ── Google Fonts (Syne + DM Sans) ── */}
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap"
          rel="stylesheet"
        />

        {/* ── full-viewport dark shell ── */}
        <div style={S.root}>

          {/* ambient gradient blobs */}
          <div style={S.ambient} />

          {/* noise grain overlay */}
          <div style={S.grain} />

          {/* ── centred card ── */}
          <div style={S.cardWrap}>
            <div style={S.card}>
              {/* top-edge accent line */}
              <div style={S.cardAccent} />

              {/* active screen */}
              {screen === "login"   && <LoginScreen   onSwitch={setScreen} />}
              {screen === "signup"  && <SignupScreen  onSwitch={setScreen} />}
              {screen === "success" && <SuccessScreen onSwitch={setScreen} />}
            </div>
          </div>
        </div>
      </ToastProvider>
    </AuthProvider>
  );
}

/* ─────────────────── styles ─────────────────── */
const S = {
  root: {
    position:  "fixed",
    inset:     0,
    background:"#0a0b0e",
    overflow:  "hidden",
    display:   "flex",
    alignItems:"center",
    justifyContent:"center",
    fontFamily:"'DM Sans', sans-serif",
    WebkitFontSmoothing:"antialiased",
  },

  /* ── two soft radial blobs ── */
  ambient: {
    position:   "absolute",
    inset:      0,
    zIndex:     0,
    background: [
      "radial-gradient(ellipse 600px 500px at 15% 50%, rgba(91,127,255,.08) 0%, transparent 70%)",
      "radial-gradient(ellipse 500px 600px at 85% 40%, rgba(124,92,252,.07) 0%, transparent 70%)",
      "radial-gradient(ellipse 300px 300px at 50% 90%, rgba(91,127,255,.05) 0%, transparent 60%)",
    ].join(", "),
    pointerEvents:"none",
  },

  /* ── SVG-turbulence grain ── */
  grain: {
    position:      "absolute",
    inset:         0,
    zIndex:        1,
    opacity:       0.035,
    backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
    backgroundSize:"256px 256px",
    pointerEvents: "none",
  },

  cardWrap: {
    position: "relative",
    zIndex:   2,
  },

  card: {
    width:          420,
    background:     "#131417",
    border:         "1px solid #2a2d35",
    borderRadius:   24,
    padding:        "44px 38px 38px",
    boxShadow:      "0 24px 80px rgba(0,0,0,.45)",
    position:       "relative",
    overflow:       "hidden",
  },

  /* thin gradient line across the very top edge */
  cardAccent: {
    position:   "absolute",
    top:        -1,
    left:       "10%",
    right:      "10%",
    height:     1,
    background: "linear-gradient(90deg, transparent, #5b7fff, #7c5cfc, transparent)",
  },
};
