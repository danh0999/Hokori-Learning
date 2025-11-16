// src/pages/AiKaiwaPage/components/HeroSection.jsx
import React from "react";
import styles from "./HeroSection.module.scss";

const HeroSection = () => {
  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <div className={styles.icon}>🎙</div>
        <div>
          <h1 className={styles.title}>Nhận diện giọng nói (AI Kaiwa)</h1>
          <p className={styles.subtitle}>
            Luyện nói tiếng Nhật và nhận phản hồi phát âm tức thì.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
