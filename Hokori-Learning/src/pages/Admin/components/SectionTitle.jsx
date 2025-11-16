export default function SectionTitle({ children, right }) {
  return (
    <div
      style={{ display: "flex", alignItems: "center", margin: "8px 0 12px" }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{children}</h2>
      <div style={{ marginLeft: "auto" }}>{right}</div>
    </div>
  );
}
