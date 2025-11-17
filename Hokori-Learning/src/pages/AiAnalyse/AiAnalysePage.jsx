import React, { useState } from "react";
import HeroSection from "./components/HeroSection";
import SentenceInput from "./components/SentenceInput";
import AnalysisResult from "./components/AnalysisResult";
import { analyseSentence } from "../../services/aiAnalyseService";
import styles from "./AiAnalysePage.module.scss";

const AiAnalysePage = () => {
  const [sentence, setSentence] = useState("");
  const [level, setLevel] = useState("N5");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleAnalyse = async () => {
    if (!sentence.trim()) {
      setError("Vui lòng nhập câu tiếng Nhật");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const data = await analyseSentence(sentence, level);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi phân tích câu.");
    }

    setLoading(false);
  };

  return (
    <div className={styles.page}>
      <HeroSection />

      <div className={styles.content}>
        <SentenceInput
          sentence={sentence}
          onChangeSentence={setSentence}
          level={level}
          onChangeLevel={setLevel}
          onAnalyse={handleAnalyse}
        />

        <AnalysisResult 
          loading={loading} 
          error={error} 
          data={result} 
        />
      </div>
    </div>
  );
};

export default AiAnalysePage;
