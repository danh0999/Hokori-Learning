// src/pages/AiKaiwaPage/AiKaiwaPage.jsx
import React, { useState, useCallback } from "react";
import styles from "./AiKaiwaPage.module.scss";

import HeroSection from "./components/HeroSection";
import AudioRecorder from "./components/AudioRecorder";
import FeedbackPanel from "./components/FeedbackPanel";

import { convertBlobToBase64, getAudioFormat } from "../../utils/audioUtils";
import { kaiwaService } from "../../services/kaiwaService";
import {
  KAIWA_DEFAULTS,
  KAIWA_ERROR_MESSAGES,
} from "../../configs/aiKaiwaConfig";

const AiKaiwaPage = () => {
  const [audioBlob, setAudioBlob] = useState(null);

  const [targetText, setTargetText] =
    useState("私は日本語を勉強しています");
  const [level, setLevel] = useState(KAIWA_DEFAULTS.LEVEL);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Khi recorder trả blob mới
  const handleAudioReady = useCallback((blob) => {
    setAudioBlob(blob);
  }, []);

  const handlePractice = async () => {
    if (!audioBlob) {
      setError(KAIWA_ERROR_MESSAGES.AUDIO_REQUIRED);
      return;
    }
    if (!targetText.trim()) {
      setError(KAIWA_ERROR_MESSAGES.TARGET_TEXT_REQUIRED);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const base64 = await convertBlobToBase64(audioBlob);
      const audioFormat = getAudioFormat(audioBlob);

      const response = await kaiwaService.practiceKaiwa({
        targetText,
        audioData: base64,
        level,
        language: KAIWA_DEFAULTS.LANGUAGE,
        audioFormat,
        voice: KAIWA_DEFAULTS.VOICE,
        speed: KAIWA_DEFAULTS.SPEED,
        validAudioFormat: true,
        validSpeed: true,
        validLevel: true,
      });

      setResult(response);
    } catch (err) {
      console.error("Kaiwa practice error:", err);
      setError(err.message || KAIWA_ERROR_MESSAGES.PRACTICE_FAILED);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <HeroSection />

      <main className={styles.main}>
        {/* LEFT CARD */}
        <section className={`${styles.card} ${styles.leftCard}`}>
          <div>
            <h3 className={styles.sectionTitle}>Câu luyện nói</h3>
            <textarea
              className={styles.textarea}
              value={targetText}
              onChange={(e) => setTargetText(e.target.value)}
              rows={3}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.fieldGroup}>
              <div className={styles.label}>Cấp độ JLPT</div>
              <select
                className={styles.select}
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                <option value="N5">N5</option>
                <option value="N4">N4</option>
                <option value="N3">N3</option>
                <option value="N2">N2</option>
                <option value="N1">N1</option>
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.label}>Ghi âm</div>
              <AudioRecorder onAudioReady={handleAudioReady} />
            </div>
          </div>

          <button
            type="button"
            className={styles.submit}
            onClick={handlePractice}
            disabled={loading}
          >
            {loading ? "AI đang phân tích..." : "Phân tích giọng nói với AI"}
          </button>

          {error && <p className={styles.error}>{error}</p>}
        </section>

        {/* RIGHT CARD */}
        <section className={`${styles.card} ${styles.rightCard}`}>
          <FeedbackPanel loading={loading} error={error} result={result} />
        </section>
      </main>
    </div>
  );
};

export default AiKaiwaPage;
