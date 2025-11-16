import React, { useState, useEffect } from "react";
import styles from "./MultipleChoice.module.scss";
import SidebarQuestionList from "./components/SidebarQuestionList";
import QuestionCard from "./components/QuestionCard";
import JLPTModal from "./components/JLPTModal";

const reading_passages = [
  {
    passage_id: 901,
    test_id: 101,
    title: "駅での出来事",
    content:
      "昨日、私は駅で面白いことを見ました。ある男性が切符を落として、それを拾った子どもが笑顔で渡しました。周りの人々も優しい気持ちになりました。",
  },
];

const jlpt_reading_questions = [
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
    options: [
      "切符を拾って渡した",
      "駅で遊んだ",
      "電車を待っていた",
      "泣いていた",
    ],
    correct: "切符を拾って渡した",
  },
];

const Reading = ({ onNextSection, onFinishTest }) => {
  const jlpt_test = {
    test_id: 101,
    title: "JLPT N3 - Đọc hiểu",
    time_limit_minutes: 45,
  };

  // ===== STATE =====
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContext, setModalContext] = useState(null); // "submit" | "next"
  const [timeLeft, setTimeLeft] = useState(jlpt_test.time_limit_minutes * 60);

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
  const questions = jlpt_reading_questions;
  const total = questions.length;
  const answered = Object.keys(answers).length;
  const hasUnanswered = answered < total;
  const progress = Math.round((answered / total) * 100);

  const passage = reading_passages[0];
  const currentQ = questions[currentIndex];

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
    questions.forEach((q) => {
      if (answers[q.id] === q.correct) correct++;
    });
    return Math.round((correct / total) * 100);
  };

  const handleClickSubmit = () => {
    setModalContext("submit");
    setModalOpen(true);
  };

  const handleClickNextSection = () => {
    const scorePercent = calcScorePercent();

    if (hasUnanswered) {
      setModalContext("next");
      setModalOpen(true);
    } else {
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

  // ===== RENDER =====
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
        <aside className={styles.sidebarCard}>
          <SidebarQuestionList
            questions={questions.map((q, i) => ({
              question_id: q.id,
              order_index: i + 1,
            }))}
            currentIndex={currentIndex}
            answersByQuestion={answers}
            onJumpTo={setCurrentIndex}
          />
        </aside>

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

            {/* Đoạn văn */}
            <div className={styles.passage}>
              <h3>{passage.title}</h3>
              <p>{passage.content}</p>
            </div>

            {/* Câu hỏi */}
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
              lastSavedAt="Tự động lưu"
            />
          </div>

          {/* Nút tiếp tục */}
          <div className={styles.nextSection}>
            <button
              className={styles.nextSectionBtn}
              onClick={handleClickNextSection}
            >
              Tiếp tục phần Nghe hiểu
            </button>
          </div>
        </section>
      </main>

      {/* MODAL */}
      <JLPTModal
        open={modalOpen}
        title={
          modalContext === "submit"
            ? "Nộp bài phần Đọc hiểu?"
            : "Chuyển sang phần Nghe hiểu?"
        }
        message={
          modalContext === "submit"
            ? hasUnanswered
              ? `Bạn mới trả lời ${answered}/${total} câu. Nếu nộp bây giờ, các câu chưa làm sẽ bị tính sai.`
              : "Bạn đã hoàn thành toàn bộ câu hỏi phần này. Nộp bài và xem kết quả luôn chứ?"
            : hasUnanswered
            ? `Bạn mới trả lời ${answered}/${total} câu. Sang phần Nghe hiểu, các câu chưa làm sẽ bị tính sai.`
            : "Bạn đã hoàn thành phần Đọc hiểu. Sang phần Nghe hiểu chứ?"
        }
        confirmLabel={
          modalContext === "submit" ? "Nộp bài" : "Sang phần Nghe hiểu"
        }
        cancelLabel="Ở lại làm tiếp"
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
      />
    </div>
  );
};

export default Reading;
