import React from "react";
import styles from "./AISidebar.module.scss";
import { FaRobot } from "react-icons/fa6";
import { Button } from "../../../components/Button/Button";

import { useDispatch, useSelector } from "react-redux";
import {
  openModal,
  fetchMyAiPackage,
} from "../../../redux/features/aiPackageSlice";

import { useNavigate } from "react-router-dom";

const AISidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Lấy package nhưng KHÔNG dùng trực tiếp để check
  const { myPackage } = useSelector((state) => state.aiPackage);

  const goToServicePage = (serviceCode) => {
    if (serviceCode === "GRAMMAR") navigate("/ai-analyse");
    if (serviceCode === "KAIWA") navigate("/ai-kaiwa");
    if (serviceCode === "CONVERSATION") navigate("/ai-conversation");
  };

  const handleClick = async (serviceCode) => {
    // Fetch real-time gói AI khi user click
    const data = await dispatch(fetchMyAiPackage())
      .unwrap()
      .catch(() => null);

    const hasAI = data?.hasPackage && !data?.isExpired;

    if (!hasAI) {
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
