// src/pages/AiConversationPage/components/ChatBubble.jsx
import React from "react";
import styles from "./ChatBubble.module.scss";

export default function ChatBubble({
  role = "AI",
  jp,
  vi,
  ts,
  isTyping = false,
}) {
  const isUser = String(role).toUpperCase() === "USER";

  return (
    <div className={`${styles.row} ${isUser ? styles.userRow : styles.aiRow}`}>
      <div
        className={`${styles.bubble} ${isUser ? styles.user : styles.ai} ${
          isTyping ? styles.typing : ""
        }`}
      >
        <div className={styles.meta}>
          <span className={styles.role}>
            {isUser ? "Bạn" : "AI"}
            {isTyping ? " đang nhập" : ""}
          </span>

          {!isTyping && ts ? (
            <span className={styles.time}>
              {new Date(ts).toLocaleTimeString("vi-VN")}
            </span>
          ) : null}
        </div>

        {/* ===== CONTENT ===== */}
        {isTyping ? (
          <div className={styles.typingDots}>
            <span />
            <span />
            <span />
          </div>
        ) : (
          <>
            <div className={styles.jp}>{isTyping ? "•••" : jp || "—"}</div>
            {!isTyping && <div className={styles.vi}>{vi || ""}</div>}
          </>
        )}
      </div>
    </div>
  );
}
