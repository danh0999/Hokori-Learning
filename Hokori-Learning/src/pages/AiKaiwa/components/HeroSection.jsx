import React from "react";
import styles from "./HeroSection.module.scss";
import { RiRobot2Line } from "react-icons/ri";

const HeroSection = () => {
  return (
    <section className={styles.heroSection}>
      <div className={styles.inner}>
        <div className={styles.iconWrap}>
          <RiRobot2Line className={styles.icon} />
        </div>
        <h1 className={styles.title}>Nhận diện giọng nói (AI Kaiwa)</h1>
        <p className={styles.subtitle}>
          Luyện nói tiếng Nhật và nhận phản hồi phát âm tức thì
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
