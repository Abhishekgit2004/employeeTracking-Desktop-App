/* =====================================================
   context/ToastContext.jsx
   =====================================================
   Usage anywhere inside the tree:
       const { showToast } = useToast();
       showToast("Saved!");
       showToast("Something broke", true);  // red dot
   ===================================================== */

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  // { visible, msg, isError, id }  – id forces re-mount of animation
  const [toast, setToast] = useState({ visible: false, msg: "", isError: false, id: 0 });
  const timerRef = useRef(null);

  const showToast = useCallback((msg, isError = false) => {
    clearTimeout(timerRef.current);
    setToast(prev => ({ visible: true, msg, isError, id: prev.id + 1 }));
    timerRef.current = setTimeout(
      () => setToast(prev => ({ ...prev, visible: false })),
      2800
    );
  }, []);

  // cleanup on unmount
  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast {...toast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast() must be inside <ToastProvider>");
  return ctx;
}

/* ── Toast renderer ── */
function Toast({ visible, msg, isError, id }) {
  return (
    <div
      key={id} // key change → fresh animation each time
      style={{
        position: "fixed",
        bottom: 32,
        left: "50%",
        transform: "translateX(-50%)",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "13px 22px",
        fontSize: ".85rem",
        color: "var(--text)",
        boxShadow: "0 8px 32px rgba(0,0,0,.42)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 10,
        pointerEvents: "none",
        animation: visible ? "toastIn .35s cubic-bezier(.22,1,.36,1) both" : "toastOut .28s ease both",
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: isError ? "var(--error)" : "var(--success)",
          flexShrink: 0,
        }}
      />
      {msg}
    </div>
  );
}
