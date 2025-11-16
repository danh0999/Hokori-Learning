// src/pages/AiKaiwa/AiKaiwaPage.jsx
import React from "react";
import HeroSection from "./components/HeroSection";
import RecordingPanel from "./components/RecordingPanel";
import FeedbackPanel from "./components/FeedbackPanel";
import styles from "./AiKaiwaPage.module.scss";

const AiKaiwaPage = () => {
  return (
    <div className={styles.wrapper}>
      <HeroSection />

      <main className={styles.main}>
        <div className={styles.grid}>
          <RecordingPanel />
          <FeedbackPanel />
        </div>
      </main>
    </div>
  );
};

export default AiKaiwaPage;
