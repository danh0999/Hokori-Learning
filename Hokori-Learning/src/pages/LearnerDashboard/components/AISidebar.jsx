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
    dispatch(fetchMyAiPackage());
    dispatch(fetchAiQuota());
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
        </div>
      </section>

      {/* =============== Thống kê học tập =============== */}
      <section>
        <h3>
          <FaChartLine /> Thống kê học tập
        </h3>
        <ul>
          <li>
            <span>Ngày học liên tiếp</span>
            <span>7 ngày</span>
          </li>
          <li>
            <span>Tổng thời gian học</span>
            <span>24h 30m</span>
          </li>
          <li>
            <span>Điểm trung bình</span>
            <span>8.5/10</span>
          </li>
          <li>
            <span>Tiến độ tổng thể</span>
            <span>58%</span>
          </li>
        </ul>
      </section>

      {/* =============== Gợi ý ôn tập =============== */}
      <section>
        <h3>
          <FaLightbulb /> Gợi ý ôn tập
        </h3>
        <div className={styles.hints}>
          <div>
            <strong>Kanji N4 - Bài 5</strong>
            <p>Bạn chưa ôn tập từ 3 ngày trước</p>
          </div>
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
