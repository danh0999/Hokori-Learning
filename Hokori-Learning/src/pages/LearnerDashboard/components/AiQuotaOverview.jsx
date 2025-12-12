import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from "./AiQuotaOverview.module.scss";
import { fetchAiQuota } from "../../../redux/features/aiPackageSlice";

const SERVICE_LABEL = {
  GRAMMAR: "Phân tích câu",
  KAIWA: "Luyện nói (Kaiwa)",
  CONVERSATION: "Trò chuyện cùng AI",
};

const SERVICE_ORDER = ["GRAMMAR", "KAIWA", "CONVERSATION"];

const AiQuotaOverview = () => {
  const dispatch = useDispatch();
  const quotas = useSelector((state) => state.aiPackage.quotas);

  useEffect(() => {
    dispatch(fetchAiQuota());
  }, [dispatch]);

  if (!quotas) return null;

  return (
    <section className={`${styles.card} card`}>
      <h3 className={styles.title}>Lượt AI còn lại</h3>

      <div className={styles.list}>
        {SERVICE_ORDER.map((code) => {
          const q = quotas[code];
          if (!q || q.totalQuota === 0) return null;

          const percent = Math.round(
            (q.remainingQuota / q.totalQuota) * 100
          );

          return (
            <div key={code} className={styles.item}>
              <div className={styles.row}>
                <span className={styles.label}>
                  {SERVICE_LABEL[code]}
                </span>
                <span className={styles.value}>
                  {q.remainingQuota}/{q.totalQuota}
                </span>
              </div>

              <div className={styles.bar}>
                <div
                  className={styles.fill}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default AiQuotaOverview;
