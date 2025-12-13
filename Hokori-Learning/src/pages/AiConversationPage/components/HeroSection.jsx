// src/pages/AiConversationPage/components/HeroSection.jsx
import React from "react";
import { HiOutlineChatBubbleLeftRight } from "react-icons/hi2";
import styles from "./HeroSection.module.scss";

export default function HeroSection() {
  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <div className={styles.icon}>
          <HiOutlineChatBubbleLeftRight />
        </div>

        <div className={styles.text}>
          <h1 className={styles.title}>Trò chuyện cùng AI</h1>
          <p className={styles.subtitle}>
            Luyện hội thoại tiếng Nhật theo trình độ và tình huống. AI sẽ hỏi –
            bạn trả lời bằng giọng nói, kèm bản dịch và audio.
          </p>
        </div>
      </div>
    </section>
  );
}
