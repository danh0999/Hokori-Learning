// src/pages/AiKaiwaPage/components/HeroSection.jsx
import React from "react";
import styles from "./HeroSection.module.scss";
import { FaWandMagicSparkles } from "react-icons/fa6";
const HeroSection = () => {
  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <div className={styles.icon}><FaWandMagicSparkles /></div>
        <div>
          <h1 className={styles.title}> Phân tích câu tiếng Nhật bằng AI</h1>
          <p className={styles.subtitle}>
           AI sẽ phân tích từ vựng, ngữ pháp và độ khó JLPT của câu bạn nhập.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
