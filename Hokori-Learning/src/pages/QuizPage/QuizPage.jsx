import React, { useEffect, useState } from "react";
import styles from "./QuizPage.module.scss";
import QuizHeader from "./components/QuizHeader";
import QuestionCard from "./components/QuestionCard";
import Sidebar from "./components/Sidebar";
import SubmitModal from "./components/SubmitModal";

const QuizPage = () => {
  const [quizData, setQuizData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [modalData, setModalData] = useState(null);

  useEffect(() => {
    const mockQuiz = {
      title: "JLPT N3 Mock Test – Grammar Section",
      duration: 30 * 60,
      questions: [
        { id: 1, question: "私は毎朝コーヒー___飲みます。", options: ["が", "を", "に", "へ"], correct: "を" },
        { id: 2, question: "「行きます」の過去形はどれですか？", options: ["行きました", "行った", "行って", "行かない"], correct: "行きました" },
        { id: 3, question: "形容詞ではないのはどれ？", options: ["大きい", "静か", "高い", "明るい"], correct: "静か" },
        { id: 4, question: "『勉強』の動詞形はどれ？", options: ["勉強します", "勉強が", "勉強を", "勉強に"], correct: "勉強します" },
        { id: 5, question: "日本___住んでいます。", options: ["に", "を", "で", "が"], correct: "に" },
      ],
    };
    setQuizData(mockQuiz);
    setTimeLeft(mockQuiz.duration);
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) { handleSubmit(true); return; }
    const t = setInterval(() => setTimeLeft(v => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  const formatTime = (sec) =>
    `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

  const handleSelectAnswer = (id, ans) =>
    setAnswers(prev => ({ ...prev, [id]: ans }));

  const handleChangeQuestion = (i) => setCurrentIndex(i);
  const handleNext = () => quizData && currentIndex < quizData.questions.length - 1 && setCurrentIndex(i => i + 1);
  const handlePrev = () => currentIndex > 0 && setCurrentIndex(i => i - 1);

  const handleSubmit = (force = false) => {
    if (!quizData) return;
    const total = quizData.questions.length;
    const done = Object.keys(answers).length;
    if (done < total && !force) {
      setModalData({ type: "warn" });
      return;
    }

    let correct = 0;
    quizData.questions.forEach(q => {
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

  return (
    <div className={styles.page}>
      <QuizHeader
        quiz={quizData}
        timeLeft={formatTime(timeLeft)}
        onSubmit={() => handleSubmit(false)}
      />
      <main className={styles.main}>
        <div className={styles.layout}>
          <section className={styles.quizArea}>
            <QuestionCard
              question={quizData?.questions[currentIndex]}
              index={currentIndex}
              total={quizData?.questions?.length || 0}
              onNext={handleNext}
              onPrev={handlePrev}
              selectedAnswer={answers[quizData?.questions[currentIndex]?.id]}
              onSelectAnswer={handleSelectAnswer}
            />
          </section>
          <aside className={styles.sidebarArea}>
            <Sidebar
              total={quizData?.questions?.length || 0}
              current={currentIndex}
              answers={answers}
              onSelectQuestion={handleChangeQuestion}
            />
          </aside>
        </div>
      </main>
      <SubmitModal
        data={modalData}
        onClose={() => setModalData(null)}
        onConfirm={() => { setModalData(null); handleSubmit(true); }}
      />
    </div>
  );
};

export default QuizPage;
