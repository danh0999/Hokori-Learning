// src/pages/.../AiQuotaOverview.jsx
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from "./AiQuotaOverview.module.scss";
import { fetchAiQuota } from "../../../redux/features/aiPackageSlice";

const AiQuotaOverview = () => {
  const dispatch = useDispatch();
  const quota = useSelector((state) => state.aiPackage.quota);
  const myPackage = useSelector((state) => state.aiPackage.myPackage);

  useEffect(() => {
    dispatch(fetchAiQuota());
  }, [dispatch]);

  const hasPackage =
    myPackage && myPackage.hasPackage && !myPackage.isExpired;

  /* =======================
     CASE: CHƯA MUA GÓI
  ======================= */
  if (!hasPackage) {
    return (
      <section className={`${styles.card} card`}>
        <h3 className={styles.title}>Lượt AI còn lại</h3>

        <p className={styles.emptyText}>
          Bạn chưa mua gói AI
        </p>

        <p className={styles.note}>
          Mua gói AI để sử dụng Phân tích câu, Luyện nói và Trò chuyện AI
        </p>
      </section>
    );
  }

  /* =======================
     CASE: ĐÃ MUA GÓI
  ======================= */
  if (!quota || quota.totalQuota === 0) return null;

  const percent = Math.round(
    (quota.remainingQuota / quota.totalQuota) * 100
  );

  return (
    <section className={`${styles.card} card`}>
      <h3 className={styles.title}>Lượt AI còn lại</h3>

      <div className={styles.item}>
        <div className={styles.row}>
          <span className={styles.label}>Tất cả tính năng AI</span>
          <span className={styles.value}>
            {quota.remainingQuota}/{quota.totalQuota} lượt
          </span>
        </div>

        <div className={styles.bar}>
          <div
            className={styles.fill}
            style={{ width: `${percent}%` }}
          />
        </div>

        <p className={styles.note}>
          Áp dụng cho Phân tích câu, Luyện nói và Trò chuyện AI
        </p>
      </div>
    </section>
  );
};

export default AiQuotaOverview;
