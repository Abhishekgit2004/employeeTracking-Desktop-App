/* =====================================================
   pages/SignupPage.jsx
   ===================================================== */

import { useState } from "react";
import { useToast } from "../context/ToastContext";
// import { Select } from "../components/Shared";
import { Select } from "../auth/components/Shared";

export default function SignupPage({ onSwitch }) {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role: "EMPLOYEE",
  });
  const [loading, setLoading] = useState(false);

  const { showToast } = useToast();

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (
      !formData.name.trim() ||
      !formData.username.trim() ||
      !formData.email.trim() ||
      !formData.password.trim()
    ) {
      showToast("Please fill in all fields", "error");
      return;
    }

    if (formData.password.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showToast("Please enter a valid email address", "error");
      return;
    }

    setLoading(true);

    try {
      // Call Electron IPC to register
      const result = await window.electron.register(formData);

      if (result.success) {
        showToast("Account created successfully!", "success");
        // Switch to success screen
        onSwitch("success");
      } else {
        showToast(result.message || "Registration failed", "error");
      }
    } catch (err) {
      console.error("Registration error:", err);
      showToast("An error occurred during registration", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.container}>
      {/* header */}
      <div style={S.header}>
        <h1 style={S.title}>Create Account</h1>
        <p style={S.subtitle}>Join our productivity tracker</p>
      </div>

      {/* form */}
      <form onSubmit={handleSubmit} style={S.form}>
        <div style={S.inputWrapper}>
          <label style={S.label}>Full Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="John Doe"
            style={S.input}
            autoFocus
            disabled={loading}
          />
        </div>

        <div style={S.inputWrapper}>
          <label style={S.label}>Username</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => handleChange("username", e.target.value)}
            placeholder="johndoe"
            style={S.input}
            disabled={loading}
          />
        </div>

        <div style={S.inputWrapper}>
          <label style={S.label}>Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="john@example.com"
            style={S.input}
            disabled={loading}
          />
        </div>

        <div style={S.inputWrapper}>
          <label style={S.label}>Password</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            placeholder="Min. 6 characters"
            style={S.input}
            disabled={loading}
          />
        </div>

        <Select
          label="Role"
          value={formData.role}
          onChange={(e) => handleChange("role", e.target.value)}
          options={[
            { value: "EMPLOYEE", label: "Employee" },
            { value: "HR", label: "HR / Manager" },
            { value: "ADMIN", label: "Admin" },
          ]}
          disabled={loading}
        />

        <button 
          type="submit" 
          disabled={loading} 
          style={loading ? {...S.button, ...S.buttonDisabled} : S.button}
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>

      {/* footer link */}
      <div style={S.footer}>
        <span style={S.footerText}>Already have an account?</span>
        <button
          type="button"
          style={S.footerLink}
          onClick={() => onSwitch("login")}
          disabled={loading}
        >
          Sign In
        </button>
      </div>
    </div>
  );
}

/* ─── styles ─── */
const S = {
  container: {
    animation: "screenIn .4s cubic-bezier(.22,1,.36,1) both",
  },

  header: {
    marginBottom: 28,
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
    gap: 18,
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
  },

  buttonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },

  footer: {
    marginTop: 24,
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