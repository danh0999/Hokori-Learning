// src/pages/LearnerDashboard/components/AISidebar.jsx
import React, { useEffect } from "react";
import styles from "./AISidebar.module.scss";
import { FaRobot, FaChartLine, FaLightbulb } from "react-icons/fa6";
import { Button } from "../../../components/Button/Button";

import { useDispatch, useSelector } from "react-redux";
import {
  checkAIPermission,
  fetchMyAiPackage,
  fetchAiQuota,
} from "../../../redux/features/aiPackageSlice.js";

import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const AISidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { myPackage } = useSelector((state) => state.aiPackage);

  const hasActivePackage =
    myPackage && myPackage.hasPackage && !myPackage.isExpired;

  // Load gói AI + quota khi sidebar mount
  useEffect(() => {
    const load = async () => {
      try {
        await dispatch(fetchMyAiPackage()).unwrap();
        await dispatch(fetchAiQuota()).unwrap();
      } catch (err) {
        console.error("Lỗi load AI package/quota:", err);
      }
    };
    load();
  }, [dispatch]);

  const goToServicePage = (serviceCode) => {
    if (serviceCode === "GRAMMAR") navigate("/ai-analyse");
    if (serviceCode === "KAIWA") navigate("/ai-kaiwa");
    if (serviceCode === "PRONUN") navigate("/ai/pronunciation");
  };

  const handleClick = async (serviceCode) => {
    try {
      // CASE 1: ĐÃ MUA GÓI → VÀO THẲNG TOOL
      if (hasActivePackage) {
        goToServicePage(serviceCode);
        return;
      }

      // CASE 2: CHƯA MUA → CHECK QUOTA (free / trial)
      const result = await dispatch(checkAIPermission(serviceCode)).unwrap();

      if (result?.hasQuota) {
        goToServicePage(serviceCode);
        return;
      }

      // CASE 3: Hết quota → slice sẽ bật showModal, AiPackageModal xuất hiện
    } catch (error) {
      console.error("Lỗi kiểm tra quyền AI:", error);
      toast.error("Không kiểm tra được quyền sử dụng AI. Vui lòng thử lại.");
    }
  };

  return (
    <aside className={styles.sidebar}>
      {/* =============== Công cụ AI =============== */}
      <section>
        <h3>
          <FaRobot /> Công cụ AI
        </h3>

        <div className={styles.buttons}>
          {/* PHÂN TÍCH CÂU (GRAMMAR) */}
          <Button
            content="Phân tích câu cùng AI"
            onClick={() => handleClick("GRAMMAR")}
            className={styles.aiButton}
            containerClassName={styles.aiButtonContainer}
          />

          {/* KAIWA */}
          <Button
            content="Luyện nói cùng AI"
            onClick={() => handleClick("KAIWA")}
            className={styles.aiButton}
            containerClassName={styles.aiButtonContainer}
          />

          {/* PRONUN */}
          <Button
            content="Kiểm tra phát âm"
            onClick={() => handleClick("PRONUN")}
            className={styles.aiButton}
            containerClassName={styles.aiButtonContainer}
          />
        </div>
      </section>

      {/* =============== Thống kê / Gợi ý (decorative, giữ UI) =============== */}
      <section className={styles.section}>
        <h3>
          <FaChartLine /> Tổng quan học tập
        </h3>
        <div className={styles.stats}>
          <div>
            <strong>Chuỗi ngày học</strong>
            <p>Đang maintain streak của bạn</p>
          </div>
          <div>
            <strong>JLPT Progress</strong>
            <p>Tiến độ ôn thi JLPT N?</p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h3>
          <FaLightbulb /> Gợi ý luyện tập
        </h3>
        <div className={styles.suggestions}>
          <div>
            <strong>Ngữ pháp て-form</strong>
            <p>AI phát hiện bạn cần luyện thêm</p>
          </div>
          <div>
            <strong>Từ vựng N3</strong>
            <p>Gợi ý từ khóa học đã hoàn thành</p>
          </div>
        </div>
      </section>
    </aside>
  );
};

export default AISidebar;
