import s from "../styles/cards.module.scss";

export default function StatsCard({ label, value, delta }) {
  return (
    <div className={s.card}>
      <div className={s.top}>
        <span className={s.label}>{label}</span>
        {delta && <span className={delta >= 0 ? s.up : s.down}>{delta}%</span>}
      </div>
      <div className={s.value}>{value ?? "—"}</div>
    </div>
  );
}
