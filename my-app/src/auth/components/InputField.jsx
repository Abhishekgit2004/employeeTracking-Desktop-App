import { useState } from "react";

/**
 * <InputField
 *    label="Email"
 *    icon={<SvgIcon />}
 *    value={val}
 *    onChange={fn}
 *    placeholder="you@company.com"
 *    type="email"          // "text" | "email" | "password"
 *    error="required"      // shown beneath the input
 *    showToggle={true}     // password eye toggle (only for type="password")
 * />
 */
export default function InputField({
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
  error = "",
  showToggle = false,
}) {
  const [reveal, setReveal] = useState(false);
  const inputType = type === "password" && reveal ? "text" : type;

  return (
    <div style={S.field}>
      {label && <label style={S.label}>{label}</label>}

      <div style={S.inputWrap}>
        {/* leading icon */}
        {icon && <span style={S.iconWrap}>{icon}</span>}

        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          style={{
            ...S.input,
            paddingLeft:  icon   ? 42 : 14,
            paddingRight: showToggle ? 40 : 14,
            borderColor:  error ? "#f05a5a" : undefined,
            boxShadow:    error ? "0 0 0 3px rgba(240,90,90,.2)" : undefined,
          }}
          onFocus={e => {
            if (!error) {
              e.target.style.borderColor = "#5b7fff";
              e.target.style.boxShadow   = "0 0 0 3px rgba(91,127,255,.35)";
            }
          }}
          onBlur={e => {
            e.target.style.borderColor = error ? "#f05a5a" : "#2a2d35";
            e.target.style.boxShadow   = error ? "0 0 0 3px rgba(240,90,90,.2)" : "none";
          }}
        />

        {/* password toggle */}
        {showToggle && (
          <button type="button" style={S.toggleBtn} onClick={() => setReveal(r => !r)}>
            {reveal ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>

      {/* error text */}
      <div style={{ ...S.errorText, opacity: error ? 1 : 0 }}>{error || " "}</div>
    </div>
  );
}

/* ────────── tiny SVG icons ────────── */
const iconProps = {
  viewBox:"0 0 24 24", width:18, height:18,
  fill:"none", stroke:"currentColor", strokeWidth:2,
  strokeLinecap:"round", strokeLinejoin:"round",
};

export function EyeIcon()    { return <svg {...iconProps}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>; }
export function EyeOffIcon() { return <svg {...iconProps}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>; }
export function EmailIcon()  { return <svg {...iconProps}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>; }
export function LockIcon()   { return <svg {...iconProps}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>; }
export function UserIcon()   { return <svg {...iconProps}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="8" r="4"/></svg>; }

/* ─── styles ─── */
const S = {
  field: {
    marginBottom: 18,
  },
  label: {
    display:       "block",
    fontSize:      ".775rem",
    fontWeight:    500,
    color:         "#9ca3af",
    marginBottom:  7,
    letterSpacing: ".02em",
    textTransform: "uppercase",
    fontFamily:    "'DM Sans', sans-serif",
  },
  inputWrap: {
    position: "relative",
  },
  iconWrap: {
    position:  "absolute",
    left:      14,
    top:       "50%",
    transform: "translateY(-50%)",
    color:     "#6b7280",
    display:   "flex",
    alignItems:"center",
    pointerEvents:"none",
    transition:"color .25s",
  },
  input: {
    width:          "100%",
    background:     "#1a1c22",
    border:         "1.5px solid #2a2d35",
    borderRadius:   14,
    paddingTop:     13,
    paddingBottom:  13,
    color:          "#e8eaef",
    fontFamily:     "'DM Sans', sans-serif",
    fontSize:       ".9rem",
    outline:        "none",
    transition:     "border-color .25s, box-shadow .25s",
    boxSizing:      "border-box",
  },
  toggleBtn: {
    position:  "absolute",
    right:     13,
    top:       "50%",
    transform: "translateY(-50%)",
    background:"none",
    border:    "none",
    cursor:    "pointer",
    color:     "#6b7280",
    display:   "flex",
    alignItems:"center",
    justifyContent:"center",
    padding:   0,
  },
  errorText: {
    fontSize:   ".78rem",
    color:      "#f05a5a",
    marginTop:  6,
    minHeight:  16,
    transition: "opacity .2s",
    fontFamily: "'DM Sans', sans-serif",
  },
};
