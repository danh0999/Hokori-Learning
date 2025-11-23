// src/pages/AiKaiwaPage/components/AudioRecorder.jsx
import React, { useEffect, useState } from "react";
import { useAudioRecorder } from "../../../hooks/useAudioRecorder";
import styles from "./AudioRecorder.module.scss";
import { FaMicrophoneAlt } from "react-icons/fa";

const AudioRecorder = ({ onAudioReady }) => {
  const { isRecording, audioBlob, startRecording, stopRecording } =
    useAudioRecorder();

  const [audioUrl, setAudioUrl] = useState(null);

  // Khi audioBlob mới được tạo → gửi lên parent + tạo URL local để phát
  useEffect(() => {
    if (!audioBlob) return;

    onAudioReady?.(audioBlob);

    // clear URL cũ nếu có
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    const url = URL.createObjectURL(audioBlob);
    setAudioUrl(url);
  }, [audioBlob]); // cố tình KHÔNG để audioUrl vào dependency

  const handleClick = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  return (
    <div className={styles.container}>
      {/* Nút ghi âm */}
      <button
        type="button"
        className={`${styles.recordButton} ${
          isRecording ? styles.recording : ""
        }`}
        onClick={handleClick}
      >
        {isRecording ? (
          <>
            ⏹ Dừng
            <div className={styles.innerWave}>
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </>
        ) : (
          <>
            <FaMicrophoneAlt />
            <span>Bắt đầu nói</span>
          </>
        )}
      </button>

      {/* Playback audio */}
      {audioUrl && !isRecording && (
        <audio className={styles.player} src={audioUrl} controls />
      )}
    </div>
  );
};

export default AudioRecorder;
