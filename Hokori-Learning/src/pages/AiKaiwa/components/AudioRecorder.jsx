// src/pages/AiKaiwa/components/AudioRecorder.jsx
import React, { useState, useRef } from "react";
import styles from "./AudioRecorder.module.scss";
import { BsMicFill, BsStopFill } from "react-icons/bs";

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
        onAudioReady && onAudioReady(blob);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch {
      alert("Không thể truy cập micro. Vui lòng kiểm tra lại quyền của trình duyệt.");
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
      <h2 className={styles.title}>Ghi âm giọng nói của bạn</h2>
      <p className={styles.subtitle}>
        Nhấn vào micro để bắt đầu luyện nói. Hệ thống sẽ phân tích phát âm và phản hồi ngay.
      </p>

      <button
        type="button"
        className={recording ? styles.micBtnStop : styles.micBtn}
        onClick={recording ? stopRecording : startRecording}
      >
        {recording ? (
          <BsStopFill className={styles.micIcon} />
        ) : (
          <BsMicFill className={styles.micIcon} />
        )}
      </button>

      <p className={styles.status}>
        {recording ? "Đang ghi âm... Nhấn để dừng." : "Sẵn sàng ghi âm"}
      </p>

      <div className={styles.waveBox}>
        {[...Array(6)].map((_, i) => (
          <span
            key={i}
            className={`${styles.wave} ${recording ? styles.waveActive : ""}`}
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    </div>
  );
};

export default AudioRecorder;
