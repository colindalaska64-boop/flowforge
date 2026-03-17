type InputProps = {
    label: string;
    type?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    error?: string;
  };
  
  export default function Input({ label, type = "text", value, onChange, placeholder, error }: InputProps) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>
          {label}
        </label>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{
            width: "100%", padding: "0.75rem 1rem",
            border: `1px solid ${error ? "#FECACA" : "#E5E7EB"}`,
            borderRadius: "8px", fontSize: "0.9rem",
            fontFamily: "inherit", outline: "none",
            background: error ? "#FEF2F2" : "#FAFAFA",
            color: "#0A0A0A",
          }}
        />
        {error && (
          <span style={{ fontSize: "0.78rem", color: "#DC2626" }}>{error}</span>
        )}
      </div>
    );
  }