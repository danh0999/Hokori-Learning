import React from "react";
import styles from "./AITools.module.scss";

const AITools = () => {
  return (
    <div className={styles.ai}>
      <div className={styles.card}>
        <h3>Trợ lý AI</h3>
        <div className={styles.chat}>
          <p className={styles.bot}>Xin chào 👋! Tôi có thể giúp bạn về ngữ pháp hoặc từ vựng.</p>
          <p className={styles.user}>Làm sao để dùng thể て?</p>
          <p className={styles.bot}>Thể て dùng để nối các hành động, ví dụ: 「食べて 行く」.</p>
        </div>
      </div>

      <div className={styles.card}>
        <h3>Luyện nói Kaiwa</h3>
        <button className={styles.secondary}>🎙 Bắt đầu luyện nói</button>
      </div>

      <div className={styles.card}>
        <h3>Thống kê học tập</h3>
        <p>Thời gian học hôm nay: 45 phút</p>
        <p>Bài đã hoàn thành: 12 / 18</p>
        <p>Điểm Quiz gần nhất: 85%</p>
      </div>
    </div>
  );
};

export default AITools;
