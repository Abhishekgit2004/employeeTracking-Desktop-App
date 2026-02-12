/**
 * <SubmitButton loading={bool} disabled={bool} onClick={fn}>
 *   Sign In
 * </SubmitButton>
 */
export default function SubmitButton({ children, loading = false, disabled = false, onClick }) {
  return (
    <button
      type="button"
      disabled={loading || disabled}
      onClick={onClick}
      style={{
        ...S.btn,
        filter: (loading || disabled) ? "saturate(.5) brightness(.7)" : "none",
        cursor: (loading || disabled) ? "not-allowed" : "pointer",
      }}
      onMouseEnter={e => { if (!loading && !disabled) e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
      onMouseDown  ={e => { e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {/* gradient overlay shine */}
      <span style={S.shine} />

      {/* label or spinner */}
      {loading ? (
        <span style={S.spinner} />
      ) : (
        <span style={S.label}>{children}</span>
      )}
    </button>
  );
}

const S = {
  btn: {
    width:          "100%",
    padding:        13,
    border:         "none",
    borderRadius:   14,
    background:     "linear-gradient(135deg, #5b7fff, #7c5cfc)",
    color:          "#fff",
    fontFamily:     "'DM Sans', sans-serif",
    fontSize:       ".9rem",
    fontWeight:     600,
    marginTop:      8,
    position:       "relative",
    overflow:       "hidden",
    boxShadow:      "0 4px 20px rgba(91,127,255,.35)",
    transition:     "transform .15s, box-shadow .2s, filter .2s",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    minHeight:      46,
  },
  shine: {
    position:   "absolute",
    inset:      0,
    background: "linear-gradient(135deg, rgba(255,255,255,.15), transparent 60%)",
    pointerEvents:"none",
  },
  label: {
    position: "relative",
    zIndex:   1,
  },
  spinner: {
    position:    "relative",
    zIndex:      1,
    width:       18,
    height:      18,
    borderRadius:"50%",
    border:      "2px solid rgba(255,255,255,.35)",
    borderTop:   "2px solid #fff",
    animation:   "spinBtn .55s linear infinite",
  },
};

/* ── inject keyframes once ── */
if (typeof document !== "undefined" && !document.getElementById("spin-btn-kf")) {
  const style = document.createElement("style");
  style.id   = "spin-btn-kf";
  style.textContent = "@keyframes spinBtn { to { transform: rotate(360deg); } }";
  document.head.appendChild(style);
}
