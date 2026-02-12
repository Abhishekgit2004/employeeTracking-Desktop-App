/* =====================================================
   components/Shared.jsx - Additional Components
   ===================================================== */

/**
 * Select Component
 */
export function Select({ label, value, onChange, options, ...rest }) {
  return (
    <div style={selectStyles.wrapper}>
      {label && <label style={selectStyles.label}>{label}</label>}
      <select
        value={value}
        onChange={onChange}
        style={selectStyles.select}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const selectStyles = {
  wrapper: {
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

  select: {
    height: 48,
    background: "var(--input-bg)",
    border: "1px solid var(--input-border)",
    borderRadius: "var(--radius-input)",
    padding: "0 14px",
    fontSize: 15,
    color: "var(--text-primary)",
    outline: "none",
    transition: "border-color .2s, box-shadow .2s",
    cursor: "pointer",
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 14px center",
    paddingRight: "40px",
  },
};

// Re-export existing components if they exist in your Shared file
// export { Input, Button } from "./SharedOriginal";