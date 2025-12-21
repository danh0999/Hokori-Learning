import React from "react";
import styles from "./AiPackageCard.module.scss";
import { Button } from "../../../components/Button/Button";

/* ================= HELPERS ================= */
const formatPrice = (value) => {
  if (value === null || value === undefined) return "0 đ";
  const num = Number(value);
  if (Number.isNaN(num)) return "0 đ";
  return `${num.toLocaleString("vi-VN")} đ`;
};

/* ================= COMPONENT ================= */
export default function AiPackageCard({
  pkg,
  onPurchase,
  highlight = false,
  disabled = false,
}) {
  const isInactive = pkg?.isActive === false; // nếu BE có trả isActive
  const isDisabled = disabled || isInactive;

  return (
    <div
      className={`${styles.card} ${highlight ? styles.pro : ""} ${
        isInactive ? styles.disabledCard : ""
      }`}
    >
      {highlight && !isInactive && (
        <span className={styles.best}>BEST VALUE</span>
      )}
      {isInactive && <span className={styles.best}>TẠM DỪNG</span>}

      <h3 className={styles.name}>{pkg?.name}</h3>
      <p className={styles.duration}>{pkg?.durationDays} ngày sử dụng</p>

      {pkg?.description && (
        <p className={styles.description}>{pkg.description}</p>
      )}

      <ul className={styles.features}>
        <li className={styles.quota}>
          <strong>{pkg.totalRequests}</strong> lượt AI
        </li>
        <li className={styles.subText}>Sử dụng cho tất cả tính năng AI</li>
      </ul>

      <div className={styles.price}>{formatPrice(pkg?.priceCents)}</div>

      <Button
        content={isInactive ? "Gói đang tạm dừng" : `Mua ${pkg?.name}`}
        onClick={() => onPurchase(pkg?.id)}
        disabled={isDisabled}
      />
    </div>
  );
}
