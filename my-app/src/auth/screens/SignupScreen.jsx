import { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import InputField, {
  UserIcon,
  EmailIcon,
  LockIcon,
} from "../components/InputField";
import SubmitButton from "../components/SubmitButton";
import { Brand, ScreenWrapper, TabBar, SwitchLink } from "../components/Shared";

export default function SignupScreen({ onSwitch }) {
  const { register } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Employee"); // "Employee" | "HR"
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  /* ── password strength (0-4) ── */
  const strength = useMemo(() => {
    let s = 0;
    if (password.length >= 6) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  }, [password]);

  const strengthColors = ["#f05a5a", "#f5a623", "#f5d623", "#4ade80"];

  /* ── validation ── */
  function validate() {
    const errs = {};
    if (!name.trim()) errs.name = "Full name is required";
    else if (name.trim().split(/\s+/).length < 2)
      errs.name = "Enter first and last name";
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "Enter a valid email";
    if (!password) errs.password = "Password is required";
    else if (password.length < 6) errs.password = "At least 6 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  /* ── submit ── */
  async function handleSignup() {
    if (!validate()) return;
    setLoading(true);

    // ⚠️ Backend MUST bcrypt.hash(password) before saving to MongoDB
    const result = await register(name.trim(), email.trim(), password, role);

    setLoading(false);

    if (result.success) {
      showToast("Account created successfully!");
      onSwitch("success"); // ← navigate to success screen
    } else {
      showToast(result.message || "Signup failed", true);
    }
  }

  function clearErr(field) {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  return (
    <ScreenWrapper>
      <Brand />

      <h2 style={S.title}>Create account</h2>
      <p style={S.sub}>Join the team and start tracking productivity</p>

      <TabBar active="signup" onSwitch={onSwitch} />

      {/* ── Name ── */}
      <InputField
        label="Full Name"
        icon={<UserIcon />}
        type="text"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          clearErr("name");
        }}
        placeholder="John Doe"
        error={errors.name || ""}
      />

      {/* ── Email ── */}
      <InputField
        label="Email"
        icon={<EmailIcon />}
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          clearErr("email");
        }}
        placeholder="you@company.com"
        error={errors.email || ""}
      />

      {/* ── Password + strength ── */}
      <InputField
        label="Password"
        icon={<LockIcon />}
        type="password"
        showToggle
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          clearErr("password");
        }}
        placeholder="Min 6 characters"
        error={errors.password || ""}
      />

      {/* strength bar */}
      <div style={S.strengthRow}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              ...S.strengthBar,
              background:
                i < strength ? strengthColors[strength - 1] : "#2a2d35",
            }}
          />
        ))}
      </div>

      {/* ── Role Selector ── */}
      <label style={S.label}>Role</label>
      <div style={S.roleRow}>
        {["Employee", "HR"].map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            style={{
              ...S.roleBtn,
              ...(role === r ? S.roleBtnActive : {}),
            }}
          >
            <span style={S.roleIcon}>{r === "Employee" ? "👤" : "📋"}</span>
            {r}
          </button>
        ))}
      </div>

      <SubmitButton
        loading={loading}
        onClick={handleSignup}
        style={{ marginTop: 10 }}
      >
        Create Account
      </SubmitButton>

      <SwitchLink
        label="Already have an account?"
        linkText="Sign in"
        onClick={() => onSwitch("login")}
      />
    </ScreenWrapper>
  );
}

/* ─── styles ─── */
const S = {
  title: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "1.55rem",
    fontWeight: 700,
    color: "#e8eaef",
    marginTop: 28,
    marginBottom: 4,
    letterSpacing: "-.025em",
  },
  sub: {
    color: "#6b7280",
    fontSize: ".875rem",
    fontWeight: 300,
    fontFamily: "'DM Sans', sans-serif",
  },
  label: {
    display: "block",
    fontSize: ".775rem",
    fontWeight: 500,
    color: "#9ca3af",
    marginBottom: 7,
    letterSpacing: ".02em",
    textTransform: "uppercase",
    fontFamily: "'DM Sans', sans-serif",
  },
  strengthRow: {
    display: "flex",
    gap: 5,
    marginTop: -10, // tuck up under the password field
    marginBottom: 18,
  },
  strengthBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    transition: "background .3s",
  },
  roleRow: {
    display: "flex",
    gap: 8,
    marginBottom: 18,
  },
  roleBtn: {
    flex: 1,
    padding: "11px 8px",
    border: "1.5px solid #2a2d35",
    borderRadius: 10,
    background: "#1a1c22",
    color: "#6b7280",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: ".82rem",
    fontWeight: 500,
    cursor: "pointer",
    textAlign: "center",
    transition: "all .22s",
  },
  roleBtnActive: {
    borderColor: "#5b7fff",
    background: "rgba(91,127,255,.1)",
    color: "#5b7fff",
  },
  roleIcon: {
    fontSize: "1.2rem",
    display: "block",
    marginBottom: 3,
  },
};
