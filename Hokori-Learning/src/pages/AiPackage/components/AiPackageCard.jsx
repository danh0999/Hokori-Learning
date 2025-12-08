// src/pages/AiPackage/components/AiPackageCard.jsx
import React from "react";
import styles from "./AiPackageModal.module.scss";
import { Button } from "../../../components/Button/Button";

const formatPrice = (priceCents, currency = "VND") => {
  const value = (priceCents || 0) / 100;
  return `${value.toLocaleString("vi-VN")}đ`;
};

export default function AiPackageCard({
  pkg,
  onPurchase,
  highlight,
  myPackage,
}) {
  const hasActivePackage =
    myPackage && myPackage.hasPackage && !myPackage.isExpired;

  const activePackageId =
    hasActivePackage && (myPackage.packageId || myPackage.id || null);

  const isActive = activePackageId === pkg.id;

  return (
    <div className={`${styles.card} ${highlight ? styles.pro : ""}`}>
      {highlight && <span className={styles.best}>BEST VALUE</span>}

      <h3>{pkg.name}</h3>
      <p>{pkg.durationDays} ngày sử dụng</p>

      <ul>
        <li>{pkg.grammarQuota} lượt kiểm tra chính tả</li>
        <li>{pkg.kaiwaQuota} lượt Kaiwa</li>
        <li>{pkg.pronunQuota} lượt kiểm tra phát âm</li>
      </ul>

      <div className={styles.price}>{formatPrice(pkg.priceCents)}</div>

      {isActive ? (
        <Button content="Đang sử dụng" disabled />
      ) : hasActivePackage ? (
        // Đã có gói khác đang active → không cho mua gói này
        <Button content="Không khả dụng" disabled />
      ) : (
        <Button
          content={`Mua ${pkg.name}`}
          onClick={() => onPurchase(pkg.id)}
        />
      )}
    </div>
  );
}
