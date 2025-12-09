import React, { useEffect } from "react";
import styles from "./AISidebar.module.scss";
import { FaRobot, FaChartLine, FaLightbulb } from "react-icons/fa6";
import { Button } from "../../../components/Button/Button";

import { useDispatch, useSelector } from "react-redux";
import {
  fetchMyAiPackage,
  fetchAiQuota,
  openModal,
} from "../../../redux/features/aiPackageSlice";

import { useNavigate } from "react-router-dom";

const AISidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { myPackage } = useSelector((state) => state.aiPackage);

  const hasActivePackage =
    myPackage && myPackage.hasPackage && !myPackage.isExpired;

  useEffect(() => {
    dispatch(fetchMyAiPackage());
    dispatch(fetchAiQuota());
  }, [dispatch]);

  const goToServicePage = (serviceCode) => {
    if (serviceCode === "GRAMMAR") navigate("/ai-analyse");
    if (serviceCode === "KAIWA") navigate("/ai-kaiwa");
  };

  const handleClick = (serviceCode) => {
    if (hasActivePackage) {
      goToServicePage(serviceCode);
      return;
    }

    // CHƯA MUA GÓI → MỞ MODAL LUÔN
    dispatch(openModal(serviceCode));
  };

  return (
    <aside className={styles.sidebar}>
      <section>
        <h3><FaRobot /> Công cụ AI</h3>

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
        </div>
      </section>
    </aside>
    
  );
};

export default AISidebar;
