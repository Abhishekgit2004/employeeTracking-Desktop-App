import { createContext, useContext, useState, useCallback, useRef } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast]     = useState({ visible: false, msg: "", isError: false });
  const timerRef              = useRef(null);

  const showToast = useCallback((msg, isError = false) => {
    clearTimeout(timerRef.current);
    setToast({ visible: true, msg, isError });
    timerRef.current = setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2800);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* ── Toast Popup ── */}
      <div style={styles.toastWrap(toast.visible)}>
        <div style={styles.toastDot(toast.isError)} />
        <span>{toast.msg}</span>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside <ToastProvider>");
  return ctx;
}

/* ─── inline toast styles ─── */
const styles = {
  toastWrap: (visible) => ({
    position:  "fixed",
    bottom:    32,
    left:      "50%",
    transform: `translateX(-50%) translateY(${visible ? 0 : 90}px)`,
    opacity:   visible ? 1 : 0,
    transition:"transform .35s cubic-bezier(.22,1,.36,1), opacity .3s",
    background:"#131417",
    border:    "1px solid #2a2d35",
    borderRadius: 12,
    padding:   "14px 22px",
    fontSize:  ".85rem",
    color:     "#e8eaef",
    boxShadow: "0 8px 32px rgba(0,0,0,.4)",
    zIndex:    999,
    display:   "flex",
    alignItems:"center",
    gap:       10,
    fontFamily:"'DM Sans', sans-serif",
    pointerEvents: visible ? "auto" : "none",
  }),
  toastDot: (isError) => ({
    width:      10,
    height:     10,
    borderRadius: "50%",
    background: isError ? "#f05a5a" : "#4ade80",
    flexShrink: 0,
  }),
};
