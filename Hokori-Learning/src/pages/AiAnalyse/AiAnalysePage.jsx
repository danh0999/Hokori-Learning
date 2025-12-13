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
import useAiService from "../../hooks/useAiService";

const AiAnalysePage = () => {
  const [sentence, setSentence] = useState("");
  const [level, setLevel] = useState("N5");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const { runService } = useAiService("GRAMMAR");
  // ================================================
  // 1) LOAD STATE TỪ LOCAL STORAGE
  // ================================================
  useEffect(() => {
    const savedSentence = localStorage.getItem("ai_sentence");
    const savedLevel = localStorage.getItem("ai_level");
    const savedResult = localStorage.getItem("ai_result");

    if (savedSentence) setSentence(savedSentence);
    if (savedLevel) setLevel(savedLevel);
    if (savedResult) setResult(JSON.parse(savedResult));
  }, []);

  // ================================================
  // 2) LƯU STATE VÀO LOCAL STORAGE
  // ================================================
  useEffect(() => {
    localStorage.setItem("ai_sentence", sentence);
  }, [sentence]);

  useEffect(() => {
    localStorage.setItem("ai_level", level);
  }, [level]);

  useEffect(() => {
    if (result) localStorage.setItem("ai_result", JSON.stringify(result));
  }, [result]);

  // ================================================
  // 3) PHÂN TÍCH CÂU
  //    - BE tự detect: Nhật / Việt
  //    - Nếu input Việt: trả sentence (JP), originalSentence, isTranslated = true
  //    - Nếu input Nhật: trả sentence (JP), vietnameseTranslation, isTranslated = false
  // ================================================
  const handleAnalyse = async () => {
    const trimmed = sentence.trim();

    if (!trimmed) {
      setError("Vui lòng nhập câu (tiếng Nhật hoặc tiếng Việt).");
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
      const apiRes = await runService("GRAMMAR", () =>
        analyseSentence(trimmed, level)
      );

      if (!apiRes?.success) {
        setError(apiRes?.message || "Phân tích câu thất bại.");
        setResult(null);
      } else {
        setResult(apiRes.data);
      }
    } catch (err) {
      console.error(err);
      setError("Lỗi phân tích câu.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  // ================================================
  // 4) CÂU NGẪU NHIÊN (OPTIONAL)
  // ================================================
  const handleRandomSentence = async () => {
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const apiRes = await fetchRandomSentence(level);
      const rnd = apiRes?.data?.sentence;

      if (rnd) {
        setSentence(rnd);

        const analysisRes = await runService("GRAMMAR", () =>
          analyseSentence(rnd, level)
        );

        if (analysisRes?.success) {
          setResult(analysisRes.data);
        }
      }
    } catch (err) {
      console.error(err);
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
