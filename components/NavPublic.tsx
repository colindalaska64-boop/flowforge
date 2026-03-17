import Logo from "./Logo";
import Button from "./Button";

export default function NavPublic() {
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      padding: "1rem 3rem", display: "flex", alignItems: "center",
      justifyContent: "space-between", background: "rgba(250,250,250,0.88)",
      backdropFilter: "blur(20px)", borderBottom: "1px solid #EBEBEB"
    }}>
      <Logo />
      <ul style={{ display: "flex", gap: "2.5rem", listStyle: "none" }}>
        {["Fonctionnalités", "Intégrations", "Pricing", "Docs"].map((item) => (
          <li key={item}>
            <a href="#" style={{ fontSize: "0.875rem", color: "#6B7280", textDecoration: "none" }}>{item}</a>
          </li>
        ))}
      </ul>
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <Button variant="ghost" href="/login">Se connecter</Button>
        <Button href="/register">Commencer gratuitement</Button>
      </div>
    </nav>
  );
}