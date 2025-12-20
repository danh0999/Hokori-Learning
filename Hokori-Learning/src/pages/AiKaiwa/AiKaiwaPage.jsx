// src/pages/AiKaiwaPage/AiKaiwaPage.jsx
import React, { useState, useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import styles from "./AiKaiwaPage.module.scss";
import useAiService from "../../hooks/useAiService";

import HeroSection from "./components/HeroSection";
import AudioRecorder from "./components/AudioRecorder";
import FeedbackPanel from "./components/FeedbackPanel";

import { convertBlobToBase64, getAudioFormat } from "../../utils/audioUtils";
import { kaiwaService } from "../../services/kaiwaService";
import {
  KAIWA_DEFAULTS,
  KAIWA_ERROR_MESSAGES,
} from "../../configs/aiKaiwaConfig";

const STORAGE_PREFIX = "ai_kaiwa_result_";

const AiKaiwaPage = () => {
  /* =========================
     AUTH / STORAGE KEY
  ========================= */
  const userId = useSelector((state) => state.user?.id);
  const STORAGE_KEY = userId ? `${STORAGE_PREFIX}${userId}` : null;

  /* =========================
     STATE
  ========================= */
  const [audioBlob, setAudioBlob] = useState(null);
  const [targetText, setTargetText] = useState("");
  const [level, setLevel] = useState(KAIWA_DEFAULTS.LEVEL);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const { runService } = useAiService("KAIWA");

  /* =========================
     LOAD SAVED DATA (F5 / BACK)
  ========================= */
  useEffect(() => {
    if (!STORAGE_KEY) return;

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const saved = JSON.parse(raw);
      setTargetText(saved.targetText || "");
      setLevel(saved.level || KAIWA_DEFAULTS.LEVEL);
      setResult(saved.result || null);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [STORAGE_KEY]);

  /* =========================
     SAVE RESULT TO LOCAL
  ========================= */
  useEffect(() => {
    if (!STORAGE_KEY || !result) return;

    const dataToSave = {
      targetText,
      level,
      result,
      savedAt: Date.now(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [result, targetText, level, STORAGE_KEY]);

  /* =========================
     HANDLERS
  ========================= */
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

      const response = await runService("KAIWA", () =>
        kaiwaService.practiceKaiwa({
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
        })
      );

      setResult(response);
    } catch (err) {
      console.error("Kaiwa practice error:", err);

      let message = err?.message || "";

      if (message.includes("Could not transcribe audio")) {
        message =
          "Không thể nhận diện giọng nói. Vui lòng nói rõ hơn hoặc ghi âm lại.";
      }

      if (message.includes("Failed to process audio")) {
        message = "AI gặp lỗi khi xử lý âm thanh. Hãy thử ghi âm lại.";
      }

      setError(message || "Lỗi luyện nói. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     RENDER
  ========================= */
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
              placeholder="Hãy nhập câu tiếng Nhật và bắt đầu luyện nói!"
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
