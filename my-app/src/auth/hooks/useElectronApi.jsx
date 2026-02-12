import { useCallback } from "react";

/* ─────────────────────────────────────────────────────
   Channel map
   ─────────────────────────────────────────────────────
   main.js registers these ipcMain.handle() names:
       "login"              ← NOT "auth:login"
       "register"           ← NOT "auth:register"
       "attendance:start"
       "attendance:stop"
       "attendance:status"
       "attendance:get"
       "activity:get"
       "employees:getAll"
       "hr:dashboard"

   preload wraps login/register inside window.electron.auth.*
   so the colon-prefixed names "auth:login" / "auth:register"
   don't exist on the main-process side.

   This map translates any friendly name to the real channel.
   ───────────────────────────────────────────────────── */
const CHANNEL_MAP = {
  "auth:login":    "login",
  "auth:register": "register",
};

/**
 * useElectronApi
 * ─────────────
 * Generic IPC bridge.  Resolves the channel through the map
 * above, then calls window.electron.invoke().
 *
 *   const { invoke } = useElectronApi();
 *   const res = await invoke("auth:login", { username, password });
 *   const res = await invoke("attendance:start");
 */
export default function useElectronApi() {
  const invoke = useCallback(async (channel, payload = {}) => {
    try {
      if (!window.electron?.invoke) {
        throw new Error("Electron IPC not available (preload not loaded)");
      }

      // resolve friendly name → real main.js channel
      const realChannel = CHANNEL_MAP[channel] || channel;

      const result = await window.electron.invoke(realChannel, payload);
      return result;
    } catch (err) {
      console.error(`[IPC] ${channel} failed:`, err);
      return { success: false, message: err.message || "Something went wrong" };
    }
  }, []);

  return { invoke };
}