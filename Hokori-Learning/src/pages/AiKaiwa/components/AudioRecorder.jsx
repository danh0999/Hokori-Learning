import React, { useState, useRef } from "react";
import styles from "./AudioRecorder.module.scss";
import { FaMicrophone, FaStop } from "react-icons/fa";

const AudioRecorder = ({ onAudioReady }) => {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        onAudioReady?.(blob);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch {
      alert("Không thể truy cập microphone. Vui lòng kiểm tra lại quyền trình duyệt.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <div className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title}>Ghi âm giọng nói của bạn</h2>
        <p className={styles.subtitle}>
          Nhấn vào micro để bắt đầu luyện nói. Hệ thống sẽ phân tích phát âm và phản hồi ngay.
        </p>
      </header>

      <div className={styles.center}>
        {!recording ? (
          <button className={styles.micBtn} onClick={startRecording}>
            <FaMicrophone className={styles.micIcon} />
          </button>
        ) : (
          <button className={styles.micBtnStop} onClick={stopRecording}>
            <FaStop className={styles.micIcon} />
          </button>
        )}

        <p className={styles.status}>
          {recording ? "Đang ghi âm... Nhấn để dừng." : "Sẵn sàng ghi âm"}
        </p>

        <div className={styles.waveBox}>
          {[...Array(7)].map((_, idx) => (
            <span
              key={idx}
              className={`${styles.wave} ${recording ? styles.waveActive : ""}`}
            />
          ))}
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.textBox}>
          <div className={styles.textLabel}>Văn bản nhận diện</div>
          <div className={styles.textContent}>Chưa có bản ghi nào...</div>
        </div>

        <div className={styles.actions}>
          <button className={styles.actionBtn} disabled>
            ⏵ Phát lại
          </button>
          <button className={styles.actionBtn} disabled>
            🗑 Xóa bản ghi
          </button>
        </div>
      </footer>
    </div>
  );
};

export default AudioRecorder;
