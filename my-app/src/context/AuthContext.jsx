/* =====================================================
   context/AuthContext.jsx
   ===================================================== */

import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}

export function AuthProvider({ children, onLoginSuccess }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = () => {
    try {
      const savedUser = localStorage.getItem("currentUser");

      if (savedUser) {
        const userData = JSON.parse(savedUser);
        console.log("✅ Session restored:", userData.username);
        setUser(userData);

        // Trigger onLoginSuccess if provided
        if (onLoginSuccess) {
          onLoginSuccess(userData);
        }
      } else {
        console.log("ℹ️ No saved session found");
      }
    } catch (err) {
      console.error("❌ Error restoring session:", err);
      localStorage.removeItem("currentUser");
    } finally {
      setLoading(false);
    }
  };

  const login = (userData) => {
    try {
      // Save to localStorage
      localStorage.setItem("currentUser", JSON.stringify(userData));
      setUser(userData);

      // Trigger onLoginSuccess callback
      if (onLoginSuccess) {
        onLoginSuccess(userData);
      }

      console.log("✅ User logged in:", userData.username);
    } catch (err) {
      console.error("❌ Error saving user:", err);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem("currentUser");
      setUser(null);
      console.log("👋 User logged out");
    } catch (err) {
      console.error("❌ Error during logout:", err);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isHR: user?.role === "HR" || user?.role === "ADMIN",
    isEmployee: user?.role === "EMPLOYEE",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}