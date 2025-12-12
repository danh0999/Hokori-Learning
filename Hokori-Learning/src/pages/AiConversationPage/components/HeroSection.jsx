// src/pages/AiConversationPage/components/HeroSection.jsx
import React from "react";
import styles from "./HeroSection.module.scss";

export default function HeroSection() {
  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <div className={styles.icon}>💬</div>
        <div>
          <h1 className={styles.title}>Trò chuyện cùng AI (Conversation Practice)</h1>
          <p className={styles.subtitle}>
            Chọn trình độ + tình huống, AI sẽ hỏi và trò chuyện cùng mày khoảng 6–7 lượt. Mỗi câu AI đều có
            tiếng Nhật và bản dịch tiếng Việt kèm audio.
          </p>
        </div>
      </div>
    </section>
  );
}
