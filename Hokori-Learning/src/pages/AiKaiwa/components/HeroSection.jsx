import React from "react";
import { HiMicrophone } from "react-icons/hi2";
import styles from "./HeroSection.module.scss";

const HeroSection = () => {
  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <div className={styles.icon}>
          <HiMicrophone />
        </div>

        <div className={styles.text}>
          <h1 className={styles.title}>Nhận diện giọng nói (AI Kaiwa)</h1>
          <p className={styles.subtitle}>
            Luyện nói tiếng Nhật và nhận phản hồi phát âm tức thì từ AI.
            Ghi âm câu nói và xem đánh giá chi tiết.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
