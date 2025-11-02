import React, { useState, useEffect } from "react";
import styles from "./MultipleChoice.module.scss";

import SidebarQuestionList from "./components/SidebarQuestionList";
import QuestionCard from "./components/QuestionCard";
import SubmitModal from "../QuizPage/components/SubmitModal"; // có thể copy file sang folder JLPT nếu cần

const MultipleChoice = ({ onNextSection }) => {
  // ===== MOCK DATA =====
  const jlpt_test = {
    test_id: 101,
    title: "JLPT N3 - Từ vựng & Ngữ pháp",
    time_limit_minutes: 30,
    total_questions: 5,
  };

  const jlpt_questions = [
    {
      id: 1,
      content: "この漢字の読み方は（　　　）です。",
      options: ["かんじ", "かんし", "がんじ", "がんし"],
      correct: "かんじ",
    },
    {
      id: 2,
      content: "「食べる」の丁寧な言い方はどれですか。",
      options: ["食べます", "召し上がります", "いただきます", "食べたいです"],
      correct: "召し上がります",
    },
    {
      id: 3,
      content: "「勉強します」はどんな意味ですか。",
      options: ["Học", "Dạy", "Nghỉ ngơi", "Chơi"],
      correct: "Học",
    },
    {
      id: 4,
      content: "日本___住んでいます。",
      options: ["に", "を", "で", "が"],
      correct: "に",
    },
    {
      id: 5,
      content: "「速い」の trái nghĩa là gì？",
      options: ["遅い", "高い", "安い", "短い"],
      correct: "遅い",
    },
  ];

  // ===== STATES =====
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(jlpt_test.time_limit_minutes * 60);
  const [modalData, setModalData] = useState(null);

  // ===== TIMER =====
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit(true);
      return;
    }
    const t = setInterval(() => setTimeLeft((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  const formatTime = (sec) =>
    `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(
      sec % 60
    ).padStart(2, "0")}`;

  // ===== LOGIC =====
  const handleSelectAnswer = (qid, opt) =>
    setAnswers((prev) => ({ ...prev, [qid]: opt }));

  const handleChangeQuestion = (i) => setCurrentIndex(i);

  const handleNext = () => {
    if (currentIndex < jlpt_questions.length - 1) setCurrentIndex((i) => i + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  // Khi bấm “Nộp bài” hoặc “Tiếp tục phần đọc hiểu”
  const handleSubmit = (force = false) => {
    const total = jlpt_questions.length;
    const done = Object.keys(answers).length;

    if (done < total && !force) {
      setModalData({ type: "warn" });
      return;
    }

    let correct = 0;
    jlpt_questions.forEach((q) => {
      if (answers[q.id] === q.correct) correct++;
    });

    setModalData({
      type: "result",
      score: {
        correct,
        total,
        percent: Math.round((correct / total) * 100),
      },
    });
  };

  const currentQ = jlpt_questions[currentIndex];
  const progress = Math.round(
    (Object.keys(answers).length / jlpt_questions.length) * 100
  );

  // ===== RENDER =====
  return (
    <div className={styles.wrapper}>
      {/* HEADER */}
      <header className={styles.headerBar}>
        <h1 className={styles.testTitle}>{jlpt_test.title}</h1>
        <div className={styles.headerRight}>
          <div className={styles.timerBox}>
            <i className="fa-regular fa-clock" />
            <span>{formatTime(timeLeft)}</span>
          </div>
          <button
            className={styles.submitBtn}
            onClick={() => handleSubmit(false)}
          >
            Nộp bài
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className={styles.main}>
        {/* SIDEBAR */}
        <aside className={styles.sidebarCard}>
          <SidebarQuestionList
            questions={jlpt_questions.map((q) => ({
              question_id: q.id,
              order_index: q.id,
            }))}
            currentIndex={currentIndex}
            answersByQuestion={answers}
            totalQuestions={jlpt_questions.length}
            onJumpTo={handleChangeQuestion}
          />
        </aside>

        {/* QUESTION AREA */}
        <section className={styles.questionArea}>
          <QuestionCard
            question={{
              question_id: currentQ.id,
              order_index: currentQ.id,
              content: currentQ.content,
              options: currentQ.options.map((opt, i) => ({
                option_id: i,
                label: String.fromCharCode(65 + i),
                text: opt,
              })),
            }}
            selectedOptionId={answers[currentQ.id]}
            onSelectOption={(qid, opt) => handleSelectAnswer(qid, opt)}
            onPrev={handlePrev}
            onNext={handleNext}
            lastSavedAt={"Tự động lưu"}
          />

          <div className={styles.nextSection}>
            <button
              className={styles.nextSectionBtn}
              onClick={() => {
                handleSubmit(false);
                if (onNextSection) onNextSection(); // Gọi callback sang JLPTTestPage
              }}
            >
              Tiếp tục phần Đọc hiểu
            </button>
          </div>

          {/* Progress Bar */}
          <div className={styles.progressCard}>
            <div className={styles.progressTopRow}>
              <span>Tiến độ hoàn thành</span>
              <span>{progress}%</span>
            </div>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressBar}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </section>
      </main>

      {/* MODAL */}
      <SubmitModal
        data={modalData}
        onClose={() => setModalData(null)}
        onConfirm={() => {
          setModalData(null);
          handleSubmit(true);
        }}
      />
    </div>
  );
};

export default MultipleChoice;
