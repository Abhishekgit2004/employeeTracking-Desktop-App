import { createContext, useContext, useState, useCallback } from "react";
import useElectronApi from "../hooks/useElectronApi";

/* ─────────────────────────────────────────────
   AuthContext
   ─────────────────────────────────────────────
   Provides:
     • currentUser   → null | { _id, name, email, role }
     • login(email, password)   → { success, message }
     • register(name, email, password, role) → { success, message }
     • logout()
   ───────────────────────────────────────────── */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const { invoke }                    = useElectronApi();

  /* ── LOGIN ── */
  const login = useCallback(async (email, password) => {
    const result = await invoke("auth:login", { email, password });

    if (result.success) {
      // ✅ CRITICAL (per Implementation Guide):
      //    In the Electron main process, your login handler must do:
      //      global.CURRENT_USER_ID = user._id.toString();
      //    The renderer just stores the user object for UI use.
      setCurrentUser(result.user);
    }
    return result; // { success, message, user? }
  }, [invoke]);

  /* ── REGISTER ── */
const register = useCallback(async (payload) => {
  return await invoke("auth:register", payload);
}, [invoke]);


  /* ── LOGOUT ── */
  const logout = useCallback(async () => {
    // Triggers the main-process handler that:
    //   1. Saves aggregated activityData → MongoDB
    //   2. Writes attendance logoutTime
    //   3. Clears global.CURRENT_USER_ID
    await invoke("attendance:stop");
    setCurrentUser(null);
  }, [invoke]);

  return (
    <AuthContext.Provider value={{ currentUser, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
