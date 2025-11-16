import React, { useState, useEffect } from "react";
import styles from "./MultipleChoice.module.scss";

import SidebarQuestionList from "./components/SidebarQuestionList";
import QuestionCard from "./components/QuestionCard";
import JLPTModal from "./components/JLPTModal";

const MultipleChoice = ({ onNextSection, onFinishTest }) => {
  // ===== MOCK DATA =====
  const jlpt_test = {
    test_id: 101,
    title: "JLPT N3 - Từ vựng & Ngữ pháp",
    time_limit_minutes: 30,
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

  // ===== STATE =====
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(jlpt_test.time_limit_minutes * 60);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalContext, setModalContext] = useState(null); // "submit" | "next"

  // ===== TIMER =====
  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  const formatTime = (sec = 0) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // ===== LOGIC =====
  const total = jlpt_questions.length;
  const answered = Object.keys(answers).length;
  const hasUnanswered = answered < total;
  const progress = Math.round((answered / total) * 100);

  const currentQ = jlpt_questions[currentIndex];

  const handleSelectAnswer = (qid, opt) =>
    setAnswers((prev) => ({ ...prev, [qid]: opt }));

 const handleNextQuestion = () => {
  if (currentIndex < total - 1) {
    setCurrentIndex((i) => i + 1);
  } else {
    // Khi đã ở câu cuối cùng
    const answeredCount = Object.keys(answers).length;

    // Nếu tất cả đều được chọn rồi → quay lại câu 1
    if (answeredCount === total) {
      setCurrentIndex(0);
    } else {
      // Nếu chưa làm hết thì không vòng lại (tuỳ ý bạn)
      // Hoặc có thể alert người dùng:
      // alert("Bạn chưa làm hết các câu hỏi!");
    }
  }
};


  const handlePrevQuestion = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const calcScorePercent = () => {
    let correct = 0;
    jlpt_questions.forEach((q) => {
      if (answers[q.id] === q.correct) correct++;
    });
    return Math.round((correct / total) * 100);
  };

  // Nút "Nộp bài"
  const handleClickSubmit = () => {
    setModalContext("submit");
    setModalOpen(true);
  };

  // Nút "Tiếp tục phần Đọc hiểu"
  const handleClickNextSection = () => {
    const scorePercent = calcScorePercent();

    if (hasUnanswered) {
      setModalContext("next");
      setModalOpen(true);
    } else {
      // Đã làm đủ → chuyển thẳng, không modal
      onNextSection && onNextSection(scorePercent);
    }
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    setModalContext(null);
  };

  const handleModalConfirm = () => {
    const scorePercent = calcScorePercent();

    if (modalContext === "submit") {
      onFinishTest && onFinishTest(scorePercent);
    } else if (modalContext === "next") {
      onNextSection && onNextSection(scorePercent);
    }

    setModalOpen(false);
    setModalContext(null);
  };

  return (
    <div className={styles.wrapper}>
      {/* HEADER */}

      <header className={styles.headerBar}>
        <h1 className={styles.testTitle}>{jlpt_test.title}</h1>
        <div className={styles.headerRight}>
          <div className={styles.timerBox}>
            <i className="fa-regular fa-clock" />
            <span className={styles.timerText}>{formatTime(timeLeft)}</span>
          </div>
          <button className={styles.submitBtn} onClick={handleClickSubmit}>
            Nộp bài
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className={styles.main}>
        {/* SIDEBAR */}
        <aside className={styles.sidebarCard}>
          <SidebarQuestionList
            questions={jlpt_questions.map((q, i) => ({
              question_id: q.id,
              order_index: i + 1,
            }))}
            currentIndex={currentIndex}
            answersByQuestion={answers}
            onJumpTo={setCurrentIndex}
          />
        </aside>

        {/* CÂU HỎI + TIẾN ĐỘ */}
        <section className={styles.questionArea}>
          <div className={styles.questionCardWrap}>
            <div className={styles.progressCard}>
              <div className={styles.progressTopRow}>
                <span className={styles.progressLabel}>Tiến độ hoàn thành</span>
                <span className={styles.progressPct}>{progress}%</span>
              </div>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressBar}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <QuestionCard
              question={{
                question_id: currentQ.id,
                order_index: currentIndex + 1,
                content: currentQ.content,
                options: currentQ.options.map((opt, i) => ({
                  option_id: i,
                  label: String.fromCharCode(65 + i),
                  text: opt,
                })),
              }}
              selectedOptionId={answers[currentQ.id]}
              onSelectOption={handleSelectAnswer}
              onPrev={handlePrevQuestion}
              onNext={handleNextQuestion}
              lastSavedAt={"Tự động lưu"}
            />
          </div>

          <div className={styles.nextSection}>
            <button
              className={styles.nextSectionBtn}
              onClick={handleClickNextSection}
            >
              Tiếp tục phần Đọc hiểu
            </button>
          </div>
        </section>
      </main>

      {/* MODAL JLPT */}
      <JLPTModal
        open={modalOpen}
        title={
          modalContext === "submit"
            ? "Nộp bài phần Từ vựng & Ngữ pháp?"
            : "Chuyển sang phần Đọc hiểu?"
        }
        message={
          modalContext === "submit"
            ? hasUnanswered
              ? `Bạn mới trả lời ${answered}/${total} câu. Nếu nộp bây giờ, các câu chưa làm sẽ bị tính sai.`
              : "Bạn đã hoàn thành toàn bộ câu hỏi phần này. Nộp bài và xem kết quả luôn chứ?"
            : hasUnanswered
            ? `Bạn mới trả lời ${answered}/${total} câu. Sang phần Đọc hiểu, các câu chưa làm sẽ bị tính sai.`
            : "Bạn đã hoàn thành phần Từ vựng & Ngữ pháp. Sang phần Đọc hiểu chứ?"
        }
        confirmLabel={
          modalContext === "submit" ? "Nộp bài" : "Sang phần Đọc hiểu"
        }
        cancelLabel="Ở lại làm tiếp"
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
      />
    </div>
  );
};

export default MultipleChoice;
