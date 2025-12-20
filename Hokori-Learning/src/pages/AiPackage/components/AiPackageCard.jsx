import React from "react";
import styles from "./AiPackageCard.module.scss";
import { Button } from "../../../components/Button/Button";

/* ================= HELPERS ================= */
const formatPrice = (value) => {
  if (!value) return "0 đ";
  return `${value.toLocaleString("vi-VN")} đ`;
};

/* ================= COMPONENT ================= */
export default function AiPackageCard({
  pkg,
  onPurchase,
  highlight = false,
  disabled = false,
}) {
  return (
    <div className={`${styles.card} ${highlight ? styles.pro : ""}`}>
      {highlight && <span className={styles.best}>BEST VALUE</span>}

      <h3 className={styles.name}>{pkg.name}</h3>
      <p className={styles.duration}>{pkg.durationDays} ngày sử dụng</p>

      {pkg.description && (
        <p className={styles.description}>{pkg.description}</p>
      )}

      <ul className={styles.features}>
        <li>
          <strong>{pkg.totalRequests}</strong> lượt AI (dùng chung)
        </li>
        <li>Sử dụng cho tất cả tính năng AI</li>
      </ul>

      <div className={styles.price}>{formatPrice(pkg.priceCents)}</div>

      <Button
        content={`Mua ${pkg.name}`}
        onClick={() => onPurchase(pkg.id)}
        disabled={disabled}
      />
    </div>
  );
}
