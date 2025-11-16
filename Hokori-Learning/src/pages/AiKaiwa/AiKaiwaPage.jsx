import React, { useState } from "react";
import HeroSection from "./components/HeroSection";
import RecordingPanel from "./components/RecordingPanel";
import FeedbackPanel from "./components/FeedbackPanel";
import AudioRecorder from "./components/AudioRecorder";
import styles from "./AiKaiwaPage.module.scss";

const AiKaiwaPage = () => {
  const [audioBlob, setAudioBlob] = useState(null);

  // câu mẫu người dùng phải đọc
  const targetText = "私は日本語を勉強しています";  
  const level = "N5";

  return (
    <div className={styles.wrapper}>
      <HeroSection />

      <main className={styles.main}>
        <AudioRecorder onAudioReady={setAudioBlob} />

        <div className={styles.grid}>
          <RecordingPanel
            audioBlob={audioBlob}
            targetText={targetText}
            level={level}
          />

          <FeedbackPanel />
        </div>
      </main>
    </div>
  );
};

export default AiKaiwaPage;
