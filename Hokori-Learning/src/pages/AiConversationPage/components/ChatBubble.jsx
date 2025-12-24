// src/pages/AiConversationPage/components/ChatBubble.jsx
import React from "react";
import styles from "./ChatBubble.module.scss";

/* ===============================
   Helpers
================================ */

/**
 * Tách romaji trong ngoặc ()
 * VD: "JP (romaji)" → "romaji"
 */
const extractRomaji = (text = "") => {
  const match = String(text).match(/\(([^)]+)\)/);
  return match ? match[1].trim() : "";
};

/**
 * Lấy tiếng Nhật thuần:
 * - bỏ nội dung trong ()
 * - chỉ giữ kana + kanji
 */
const extractJapanese = (text = "") => {
  if (!text) return "";

  let jp = text.replace(/\([^)]*\)/g, "").trim();
  jp = jp.replace(/[^\u3040-\u30FF\u4E00-\u9FAF\s！？。、]/g, "").trim();

  return jp;
};

/**
 * Lấy tiếng Việt thuần:
 * - bỏ ()
 * - bỏ ký tự Nhật
 */
const extractVietnamese = (text = "") => {
  if (!text) return "";

  let vi = text.replace(/\([^)]*\)/g, "").trim();
  vi = vi.replace(/[\u3040-\u30FF\u4E00-\u9FAF]/g, "").trim();

  return vi;
};

export default function ChatBubble({
  role = "AI",
  jp,
  vi,
  ts,
  isTyping = false,
}) {
  const isUser = String(role).toUpperCase() === "USER";

  const jpClean = extractJapanese(jp);
  const viClean = extractVietnamese(vi);
  const romaji = extractRomaji(jp); // 🔥 CHỐT Ở ĐÂY

  return (
    <div className={`${styles.row} ${isUser ? styles.userRow : styles.aiRow}`}>
      <div
        className={`${styles.bubble} ${isUser ? styles.user : styles.ai} ${
          isTyping ? styles.typing : ""
        }`}
      >
        {/* META */}
        <div className={styles.meta}>
          <span className={styles.role}>
            {isUser ? "Bạn" : "AI"}
            {isTyping ? " đang nhập" : ""}
          </span>

          {!isTyping && ts && (
            <span className={styles.time}>
              {new Date(ts).toLocaleTimeString("vi-VN")}
            </span>
          )}
        </div>

        {/* CONTENT */}
        {isTyping ? (
          <div className={styles.typingDots}>
            <span />
            <span />
            <span />
          </div>
        ) : (
          <>
            {/* JP */}
            <div className={styles.jp}>
              {jpClean || "—"}
            </div>

            {/* VI + ROMAJI */}
            {(viClean || romaji) && (
              <div className={styles.vi}>
                {viClean}
                {romaji && (
                  <span className={styles.romaji}>
                    {" "}({romaji})
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
