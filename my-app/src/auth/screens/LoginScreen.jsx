import { useState } from "react";
import { useAuth }        from "../context/AuthContext";
import { useToast }       from "../context/ToastContext";
import InputField, { EmailIcon, LockIcon } from "../components/InputField";
import SubmitButton       from "../components/SubmitButton";
import { Brand, ScreenWrapper, TabBar, SwitchLink } from "../components/Shared";

export default function LoginScreen({ onSwitch }) {
  const { login }    = useAuth();
  const { showToast } = useToast();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [errors,   setErrors]   = useState({});          // { email?: string, password?: string }
  const [loading,  setLoading]  = useState(false);

  /* ── validation ── */
  function validate() {
    const errs = {};
    if (!email.trim())                              errs.email    = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email    = "Enter a valid email";
    if (!password)                                  errs.password = "Password is required";
    else if (password.length < 6)                   errs.password = "At least 6 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  /* ── submit ── */
  async function handleLogin() {
    if (!validate()) return;
    setLoading(true);

    const result = await login(email, password);   // ← calls IPC auth:login

    setLoading(false);

    if (result.success) {
      showToast(`Welcome back, ${result.user.name}!`);
      // ➜  In your real app, navigate to Dashboard here:
      //       navigate("/dashboard");   (react-router)
      //    or set a global route state.
    } else {
      showToast(result.message || "Invalid email or password", true);
    }
  }

  /* ── clear single error on keystroke ── */
  function clearErr(field) {
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
  }

  return (
    <ScreenWrapper>
      <Brand />

      <h2 style={S.title}>Welcome back</h2>
      <p  style={S.sub}>Sign in to continue tracking your work</p>

      <TabBar active="login" onSwitch={onSwitch} />

      <InputField
        label="Email"
        icon={<EmailIcon />}
        type="email"
        value={email}
        onChange={e => { setEmail(e.target.value); clearErr("email"); }}
        placeholder="you@company.com"
        error={errors.email || ""}
      />

      <InputField
        label="Password"
        icon={<LockIcon />}
        type="password"
        showToggle
        value={password}
        onChange={e => { setPassword(e.target.value); clearErr("password"); }}
        placeholder="••••••••"
        error={errors.password || ""}
      />

      <SubmitButton loading={loading} onClick={handleLogin}>
        Sign In
      </SubmitButton>

      <SwitchLink
        label="Don't have an account?"
        linkText="Sign up"
        onClick={() => onSwitch("signup")}
      />
    </ScreenWrapper>
  );
}

const S = {
  title: {
    fontFamily:    "'Syne', sans-serif",
    fontSize:      "1.55rem",
    fontWeight:    700,
    color:         "#e8eaef",
    marginTop:     28,
    marginBottom:  4,
    letterSpacing: "-.025em",
  },
  sub: {
    color:      "#6b7280",
    fontSize:   ".875rem",
    fontWeight: 300,
    marginBottom: 0,   // TabBar handles its own top margin
    fontFamily: "'DM Sans', sans-serif",
  },
};
