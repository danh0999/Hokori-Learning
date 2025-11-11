import React from "react";
import styles from "./HeroSection.module.scss";

const HeroSection = () => {
  return (
    <section className={styles.heroSection}>
      <div className={styles.heroSection__content}>
        <h1 className={styles.heroSection__title}>
          Nhận diện giọng nói (AI Kaiwa)
        </h1>
        <p className={styles.heroSection__subtitle}>
          Luyện nói tiếng Nhật và nhận phản hồi phát âm tức thì
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
