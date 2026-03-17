type ButtonProps = {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: "primary" | "secondary" | "danger" | "ghost";
    size?: "sm" | "md" | "lg";
    disabled?: boolean;
    fullWidth?: boolean;
    href?: string;
    type?: "button" | "submit";
  };
  
  export default function Button({
    children, onClick, variant = "primary",
    size = "md", disabled = false, fullWidth = false, href, type = "button"
  }: ButtonProps) {
  
    const styles: Record<string, React.CSSProperties> = {
      primary:   { background: "#4F46E5", color: "#fff", border: "none" },
      secondary: { background: "#F9FAFB", color: "#374151", border: "1px solid #E5E7EB" },
      danger:    { background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" },
      ghost:     { background: "none", color: "#6B7280", border: "none" },
    };
  
    const sizes: Record<string, React.CSSProperties> = {
      sm: { fontSize: "0.8rem",  padding: "0.4rem 0.9rem",  borderRadius: "8px" },
      md: { fontSize: "0.9rem",  padding: "0.7rem 1.4rem",  borderRadius: "10px" },
      lg: { fontSize: "1rem",    padding: "0.85rem 1.75rem", borderRadius: "10px" },
    };
  
    const base: React.CSSProperties = {
      fontFamily: "inherit", fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.6 : 1, width: fullWidth ? "100%" : "auto",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      gap: "0.4rem", textDecoration: "none", transition: "opacity 0.15s",
      ...styles[variant], ...sizes[size],
    };
  
    if (href) {
      return <a href={href} style={base}>{children}</a>;
    }
  
    return (
      <button type={type} onClick={onClick} disabled={disabled} style={base}>
        {children}
      </button>
    );
  }