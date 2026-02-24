/* =====================================================
   pages/LoginPage.jsx
   ===================================================== */

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function LoginPage({ onSwitch }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      showToast("Please fill in all fields", "error");
      return;
    }

    setLoading(true);

    try {
      // Call Electron IPC to login
      const result = await window.electron.login({ username, password });
      console.log(result)
      if (result.success) {
        showToast("Login successful!", "success");
        // Call the login function from AuthContext
        login(result.user);
      } else {
        showToast(result.message || "Login failed", "error");
      }
    } catch (err) {
      console.log("Login error:", err);
      showToast("An error occurred during login", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.container}>
      {/* header */}
      <div style={S.header}>
        <h1 style={S.title}>Welcome Back</h1>
        <p style={S.subtitle}>Sign in to continue</p>
      </div>

      {/* form */}
      <form onSubmit={handleSubmit} style={S.form}>
        <div style={S.inputWrapper}>
          <label style={S.label}>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            style={S.input}
            autoFocus
            disabled={loading}
          />
        </div>

        <div style={S.inputWrapper}>
          <label style={S.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            style={S.input}
            disabled={loading}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          style={loading ? {...S.button, ...S.buttonDisabled} : S.button}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {/* footer link */}
      <div style={S.footer}>
        <span style={S.footerText}>Don't have an account?</span>
        <button
          type="button"
          style={S.footerLink}
          onClick={() => onSwitch("signup")}
          disabled={loading}
        >
          Sign Up
        </button>
      </div>
    </div>
  );
}

/* ─── styles ─── */
const S = {
  container: {
    animation: "screenIn .4s cubic-bezier(.22,1,.36,1) both",
    bgColor: "var(--surface)",
  },

  header: {
    marginBottom: 32,
    textAlign: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: 700,
    color: "var(--text-primary)",
    marginBottom: 6,
    letterSpacing: "-.02em",
  },

  subtitle: {
    fontSize: 15,
    color: "var(--text-secondary)",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },

  inputWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  label: {
    fontSize: 14,
    fontWeight: 600,
    color: "var(--text-primary)",
    letterSpacing: "-.01em",
  },

  input: {
    height: 48,
    background: "var(--input-bg)",
    border: "1px solid var(--input-border)",
    borderRadius: "var(--radius-input)",
    padding: "0 14px",
    fontSize: 15,
    color: "var(--text-primary)",
    outline: "none",
    transition: "border-color .2s, box-shadow .2s",
  },

  button: {
    height: 48,
    marginTop: 8,
    background: "linear-gradient(135deg, var(--accent), var(--accent2))",
    border: "none",
    borderRadius: "var(--radius-button)",
    fontSize: 15,
    fontWeight: 600,
    color: "#fff",
    cursor: "pointer",
    transition: "transform .15s, box-shadow .15s",
    backgroundColor: "blue",
  },

  buttonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },

  footer: {
    marginTop: 28,
    textAlign: "center",
    fontSize: 14,
  },

  footerText: {
    color: "var(--text-secondary)",
    marginRight: 6,
  },

  footerLink: {
    background: "none",
    border: "none",
    color: "var(--accent)",
    fontWeight: 600,
    cursor: "pointer",
    padding: 0,
    fontSize: 14,
    transition: "color .2s",
  },
};