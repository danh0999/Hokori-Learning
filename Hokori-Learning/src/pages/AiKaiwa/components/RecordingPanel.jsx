// src/pages/AiKaiwa/components/RecordingPanel.jsx
import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { analyzeSpeech, resetAiSpeech } from "../../../redux/features/aiSpeechSlice";
import { useAudioRecorder } from "../../../hooks/useAudioRecorder";
import styles from "./RecordingPanel.module.scss";

const RecordingPanel = () => {
  const dispatch = useDispatch();
  const audioRef = useRef(null);

  const { loading, transcript } = useSelector((state) => state.aiSpeech);
  const {
    isRecording,
    audioBlob,
    permissionError,
    startRecording,
    stopRecording,
    resetAudio,
  } = useAudioRecorder();

  // Gửi audio lên backend khi có bản ghi mới
  useEffect(() => {
    if (audioBlob) dispatch(analyzeSpeech(audioBlob));
  }, [audioBlob, dispatch]);

  const handleMicClick = () => {
    if (isRecording) stopRecording();
    else {
      dispatch(resetAiSpeech());
      resetAudio();
      startRecording();
    }
  };

  const handleResetAll = () => {
    resetAudio();
    dispatch(resetAiSpeech());
  };

  const handlePlay = () => {
    if (!audioBlob) return;
    const url = URL.createObjectURL(audioBlob);
    audioRef.current.src = url;
    audioRef.current.play();
  };

  const disabledPlay = !audioBlob;

  return (
    <div className={styles.panel}>
      {/* Microphone Button */}
      <div className={styles.micWrapper}>
        <div className={`${styles.glowRing} ${isRecording ? styles.glowActive : ""}`} />
        <button
          className={`${styles.micButton} ${isRecording ? styles.micButtonRecording : ""}`}
          onClick={handleMicClick}
        >
          <i className="fa-solid fa-microphone" />
        </button>
      </div>

      <div className="text-center mb-4">
        <p className="text-lg font-semibold text-neutral-900">
          {isRecording ? "Đang ghi âm..." : "Bắt đầu ghi âm"}
        </p>
        <p className="text-sm text-neutral-500">
          {isRecording ? "Nói tiếng Nhật rõ ràng, tự nhiên." : "Nhấn vào micro để bắt đầu"}
        </p>
      </div>

      {/* Waveform animation */}
      <div
        className={`${styles.waveform} ${isRecording ? styles.recording : ""}`}
        aria-label="waveform"
      >
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className={styles.bar}></div>
        ))}
      </div>

      {/* Transcript */}
      <div className={styles.transcriptBox}>
        <div className={styles.transcriptHeader}>
          <i className="fa-solid fa-language" />
          <span>Văn bản nhận diện:</span>
        </div>

        <div className={styles.transcriptText}>
          {loading && <p className={styles.placeholder}>AI đang phân tích...</p>}
          {!loading && !transcript && (
            <p className={styles.placeholder}>Chưa có bản ghi nào...</p>
          )}
          {!loading && transcript && <p>{transcript}</p>}
        </div>
      </div>

      {/* Buttons */}
      <div className={styles.buttons}>
        <button
          className={styles.playBtn}
          onClick={handlePlay}
          disabled={disabledPlay}
        >
          <i className="fa-solid fa-play" /> Phát lại
        </button>
        <button className={styles.resetBtn} onClick={handleResetAll}>
          Xóa bản ghi
        </button>
      </div>

      {permissionError && (
        <p className="text-red-500 text-sm mt-2">{permissionError}</p>
      )}

      <audio ref={audioRef} hidden />
    </div>
  );
};

export default RecordingPanel;
