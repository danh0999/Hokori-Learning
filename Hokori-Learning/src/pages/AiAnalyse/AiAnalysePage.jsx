// src/pages/AiAnalysePage/AiAnalysePage.jsx
import React, { useState, useEffect } from "react";
import HeroSection from "./components/HeroSection";
import SentenceInput from "./components/SentenceInput";
import AnalysisResult from "./components/AnalysisResult";
import {
  analyseSentence,
  fetchRandomSentence,
} from "../../services/aiAnalyseService";
import styles from "./AiAnalysePage.module.scss";

const AiAnalysePage = () => {
  const [sentence, setSentence] = useState("");
  const [level, setLevel] = useState("N5");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  /* ============================================================
     1) LOAD STATE TỪ LOCAL STORAGE KHI MỞ LẠI TRANG
  ============================================================ */
  useEffect(() => {
    const savedSentence = localStorage.getItem("ai_sentence");
    const savedLevel = localStorage.getItem("ai_level");
    const savedResult = localStorage.getItem("ai_result");

    if (savedSentence) setSentence(savedSentence);
    if (savedLevel) setLevel(savedLevel);
    if (savedResult) setResult(JSON.parse(savedResult));
  }, []);

  /* ============================================================
     2) LƯU STATE VÀO LOCAL STORAGE MỖI KHI THAY ĐỔI
  ============================================================ */
  useEffect(() => {
    localStorage.setItem("ai_sentence", sentence);
  }, [sentence]);

  useEffect(() => {
    localStorage.setItem("ai_level", level);
  }, [level]);

  useEffect(() => {
    if (result) localStorage.setItem("ai_result", JSON.stringify(result));
  }, [result]);

  /* ============================================================
     3) PHÂN TÍCH CÂU
  ============================================================ */
  const handleAnalyse = async () => {
    const trimmed = sentence.trim();

    if (!trimmed) {
      setError("Vui lòng nhập câu tiếng Nhật.");
      setResult(null);
      return;
    }

    if (trimmed.length > 50) {
      setError("Câu không được quá 50 ký tự.");
      setResult(null);
      return;
    }

    setError("");
    setLoading(true);

    try {
      const apiRes = await analyseSentence(trimmed, level);
      if (!apiRes?.success) {
        setError(apiRes?.message || "Phân tích câu thất bại.");
        setResult(null);
      } else setResult(apiRes.data);
    } catch {
      setError("Lỗi phân tích câu.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     4) CÂU NGẪU NHIÊN
  ============================================================ */
  const handleRandomSentence = async () => {
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const apiRes = await fetchRandomSentence(level);
      const rnd = apiRes?.data?.sentence;
      if (rnd) {
        setSentence(rnd);
        const analysisRes = await analyseSentence(rnd, level);
        if (analysisRes?.success) setResult(analysisRes.data);
      }
    } catch {
      setError("Không lấy được câu ngẫu nhiên.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <HeroSection />

        <div className={styles.main}>
          <div className={styles.section}>
            <SentenceInput
              sentence={sentence}
              onChangeSentence={setSentence}
              level={level}
              onChangeLevel={setLevel}
              onAnalyse={handleAnalyse}
              onRandom={handleRandomSentence}
            />
          </div>

          <div className={styles.section}>
            <AnalysisResult loading={loading} error={error} data={result} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiAnalysePage;
