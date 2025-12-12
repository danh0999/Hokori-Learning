// src/pages/AiConversationPage/components/ChatBubble.jsx
import React from "react";
import styles from "./ChatBubble.module.scss";

export default function ChatBubble({ role = "AI", jp, vi, ts }) {
  const isUser = String(role).toUpperCase() === "USER";

  return (
    <div className={`${styles.row} ${isUser ? styles.userRow : styles.aiRow}`}>
      <div className={`${styles.bubble} ${isUser ? styles.user : styles.ai}`}>
        <div className={styles.meta}>
          <span className={styles.role}>{isUser ? "Bạn" : "AI"}</span>
          {ts ? <span className={styles.time}>{new Date(ts).toLocaleTimeString("vi-VN")}</span> : null}
        </div>

        <div className={styles.jp}>{jp || "—"}</div>
        <div className={styles.vi}>{vi || ""}</div>
      </div>
    </div>
  );
}
