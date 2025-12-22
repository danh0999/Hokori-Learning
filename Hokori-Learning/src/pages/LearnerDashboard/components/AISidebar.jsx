import React from "react";
import styles from "./AISidebar.module.scss";
import { FaRobot } from "react-icons/fa6";
import { Button } from "../../../components/Button/Button";

import { useDispatch, useSelector } from "react-redux";
import {
  openModal,
  fetchMyAiPackage,
  fetchAiQuota,
} from "../../../redux/features/aiPackageSlice";

import { useNavigate } from "react-router-dom";

const AISidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const goToServicePage = (serviceCode) => {
    if (serviceCode === "GRAMMAR") navigate("/ai-analyse");
    if (serviceCode === "KAIWA") navigate("/ai-kaiwa");
    if (serviceCode === "CONVERSATION") navigate("/ai-conversation");
  };

  const handleClick = async (serviceCode) => {
    // ✅ Fetch realtime cả gói + quota để chặn đúng nghiệp vụ
    const [pkg, q] = await Promise.all([
      dispatch(fetchMyAiPackage()).unwrap().catch(() => null),
      dispatch(fetchAiQuota()).unwrap().catch(() => ({})),
    ]);

    const hasAI = pkg?.hasPackage && !pkg?.isExpired;
    const remaining = Number(q?.remainingRequests ?? 0);

    // ❗ Rule chuẩn: còn lượt mới cho vào
    if (!hasAI || remaining <= 0) {
      dispatch(openModal(serviceCode));
      return;
    }

    goToServicePage(serviceCode);
  };

  return (
    <aside className={styles.sidebar}>
      <section>
        <h3>
          <FaRobot /> Công cụ AI
        </h3>

        <div className={styles.buttons}>
          <Button
            content="Phân tích câu cùng AI"
            onClick={() => handleClick("GRAMMAR")}
            className={styles.aiButton}
            containerClassName={styles.aiButtonContainer}
          />

          <Button
            content="Luyện nói cùng AI"
            onClick={() => handleClick("KAIWA")}
            className={styles.aiButton}
            containerClassName={styles.aiButtonContainer}
          />

          <Button
            content="Trò chuyện cùng AI"
            onClick={() => handleClick("CONVERSATION")}
            className={styles.aiButton}
            containerClassName={styles.aiButtonContainer}
          />
        </div>
      </section>
    </aside>
  );
};

export default AISidebar;
