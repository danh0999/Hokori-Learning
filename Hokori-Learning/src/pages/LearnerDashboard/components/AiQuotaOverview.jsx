// src/pages/.../AiQuotaOverview.jsx
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from "./AiQuotaOverview.module.scss";
import {
  fetchAiQuota,
  openModal,
} from "../../../redux/features/aiPackageSlice";

const AiQuotaOverview = () => {
  const dispatch = useDispatch();

  const quota = useSelector((state) => state.aiPackage.quota);
  const quotaStatus = useSelector((state) => state.aiPackage.quotaStatus);

  // NGUỒN SỰ THẬT DUY NHẤT
  const hasActivePackage = quota?.hasQuota === true && quota?.totalRequests > 0;

  useEffect(() => {
    dispatch(fetchAiQuota());
  }, [dispatch]);

  /* =======================
     LOADING
  ======================= */
  if (quotaStatus === "loading") {
    return (
      <section className={`${styles.card} card`}>
        <h3 className={styles.title}>Công cụ AI</h3>
        <p className={styles.note}>Đang tải thông tin AI...</p>
      </section>
    );
  }

  /* =======================
     CHƯA MUA GÓI AI
     → EMPTY STATE (RÕ NGHĨA)
  ======================= */
  if (!hasActivePackage) {
    return (
      <section className={`${styles.card} card`}>
        <h3 className={styles.title}>Công cụ AI</h3>

        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>Bạn chưa sử dụng dịch vụ AI</p>

          <p className={styles.note}>
            Mua gói AI để phân tích câu, luyện phát âm và trò chuyện cùng AI
            trong quá trình học.
          </p>

          <button
            className={styles.ctaBtn}
            onClick={() => dispatch(openModal())}
          >
            Kích hoạt AI
          </button>
        </div>
      </section>
    );
  }

  /* =======================
     ĐÃ MUA GÓI AI
  ======================= */
  const { totalRequests = 0, remainingRequests = 0 } = quota;

  // Hết lượt
  if (remainingRequests === 0) {
    return (
      <section className={`${styles.card} card`}>
        <h3 className={styles.title}>Lượt AI còn lại</h3>

        <p className={styles.warningText}>
          Bạn đã dùng hết lượt AI trong gói hiện tại.
        </p>

        <button className={styles.ctaBtn} onClick={() => dispatch(openModal())}>
          Mua thêm lượt AI
        </button>
      </section>
    );
  }

  /* =======================
     CÒN LƯỢT → QUOTA STATE
  ======================= */
  const percent = Math.round((remainingRequests / totalRequests) * 100);

  return (
    <section className={`${styles.card} card`}>
      <h3 className={styles.title}>Lượt AI còn lại</h3>

      <div className={styles.item}>
        <div className={styles.row}>
          <span className={styles.label}>Tất cả tính năng AI</span>
          <span className={styles.value}>
            {remainingRequests}/{totalRequests} lượt
          </span>
        </div>

        <div className={styles.bar}>
          <div className={styles.fill} style={{ width: `${percent}%` }} />
        </div>

        <p className={styles.note}>
          Mỗi lần sử dụng AI sẽ trừ <b>1 lượt</b> cho Phân tích câu, Luyện nói
          và <b>2 lượt</b> Trò chuyện AI.
        </p>
      </div>
    </section>
  );
};

export default AiQuotaOverview;
