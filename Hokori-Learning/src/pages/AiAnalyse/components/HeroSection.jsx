// src/pages/AiAnalysePage/components/HeroSection.jsx
import React from "react";
import { FaWandMagicSparkles } from "react-icons/fa6";
import styles from "./HeroSection.module.scss";

const HeroSection = () => {
  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <div className={styles.icon}>
          <FaWandMagicSparkles />
        </div>

        <div className={styles.text}>
          <h1 className={styles.title}>Phân tích câu tiếng Nhật bằng AI</h1>
          <p className={styles.subtitle}>
            AI giúp phân tích từ vựng, ngữ pháp, cấu trúc câu và cung cấp ví dụ
            liên quan theo chuẩn JLPT.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
