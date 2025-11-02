import React, { useState, useEffect } from "react";
import styles from "./Reading.module.scss";
import SidebarQuestionList from "./components/SidebarQuestionList";
import QuestionCard from "./components/QuestionCard";
import SubmitModal from "../QuizPage/components/SubmitModal";

const Reading = ({ onNextSection }) => {
  // ===== MOCK DATA =====
  const jlpt_test = {
    test_id: 101,
    title: "JLPT N3 - Đọc hiểu",
    time_limit_minutes: 45,
    total_questions: 3,
  };

  // Reading có passage dài
  const reading_passage = {
    passage_id: 901,
    title: "駅での出来事",
    content:
      "昨日、私は駅で面白いことを見ました。ある男性が切符を落として、それを拾った子どもが笑顔で渡しました。周りの人々も優しい気持ちになりました。",
  };

  const jlpt_questions = [
    {
      id: 1,
      passage_id: 901,
      content: "この文章のテーマは何ですか？",
      options: ["親切な行動", "子どもの遊び", "駅の問題", "天気の話"],
      correct: "親切な行動",
    },
    {
      id: 2,
      passage_id: 901,
      content: "子どもは何をしましたか？",
      options: ["切符を拾って渡した", "駅で遊んだ", "電車を待っていた", "泣いていた"],
      correct: "切符を拾って渡した",
    },
    {
      id: 3,
      passage_id: 901,
      content: "この文章を読んで、あなたはどう感じましたか？",
      options: ["嬉しい", "怖い", "驚いた", "悲しい"],
      correct: "嬉しい",
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
    `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

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
  const progress = Math.round((Object.keys(answers).length / jlpt_questions.length) * 100);

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
          <button className={styles.submitBtn} onClick={() => handleSubmit(false)}>
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
          {/* ✅ Hiển thị đoạn văn ở đầu */}
          <div className={styles.readingPassage}>
            <h3 className={styles.readingTitle}>{reading_passage.title}</h3>
            <p className={styles.readingText}>{reading_passage.content}</p>
          </div>

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
                if (onNextSection) onNextSection();
              }}
            >
              Tiếp tục phần nghe hiểu
            </button>
          </div>

          {/* Progress Bar */}
          <div className={styles.progressCard}>
            <div className={styles.progressTopRow}>
              <span>Tiến độ hoàn thành</span>
              <span>{progress}%</span>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressBar} style={{ width: `${progress}%` }} />
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

export default Reading;
