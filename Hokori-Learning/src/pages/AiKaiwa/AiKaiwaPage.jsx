import React, { useState } from "react";
import HeroSection from "./components/HeroSection";
import RecordingPanel from "./components/RecordingPanel";
import FeedbackPanel from "./components/FeedbackPanel";
import AudioRecorder from "./components/AudioRecorder";
import styles from "./AiKaiwaPage.module.scss";

const AiKaiwaPage = () => {
  const [audioBlob, setAudioBlob] = useState(null);

  // Câu mẫu người dùng phải đọc (sau này có thể lấy từ API)
  const targetText = "私は日本語を勉強しています";
  const level = "N5";

  return (
    <div className={styles.wrapper}>
      <HeroSection />

      <main className={styles.main}>
        {/* Cột trái: Ghi âm */}
        <section className={styles.leftColumn}>
          <AudioRecorder onAudioReady={setAudioBlob} />
        </section>

        {/* Cột phải: Phản hồi AI */}
        <section className={styles.rightColumn}>
          <FeedbackPanel />
        </section>

        {/* Không hiển thị UI, chỉ lo dispatch gọi API */}
        <RecordingPanel
          audioBlob={audioBlob}
          targetText={targetText}
          level={level}
        />
      </main>
    </div>
  );
};

export default AiKaiwaPage;
