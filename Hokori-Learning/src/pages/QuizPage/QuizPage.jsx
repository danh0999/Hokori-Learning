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
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 phút (demo)

  // ⚙️ MOCK DATA — sẽ xoá khi call API thật
  useEffect(() => {
    const mockQuiz = {
      title: "JLPT N3 Mock Test – Grammar Section",
      duration: 30 * 60, // giây
      questions: [
        {
          id: 1,
          question: "この文に合う助詞を選んでください：私は毎朝コーヒー___飲みます。",
          options: ["が", "を", "に", "へ"],
        },
        {
          id: 2,
          question: "「行きます」の過去形はどれですか？",
          options: ["行きました", "行った", "行って", "行かない"],
        },
        {
          id: 3,
          question: "この中で形容詞ではないのはどれですか？",
          options: ["大きい", "静か", "高い", "明るい"],
        },
        {
          id: 4,
          question: "『勉強』の動詞形はどれですか？",
          options: ["勉強します", "勉強が", "勉強を", "勉強に"],
        },
        {
          id: 5,
          question: "次の中で正しい助詞を選んでください：日本___住んでいます。",
          options: ["に", "を", "で", "が"],
        },
      ],
    };
    setQuizData(mockQuiz);
    setTimeLeft(mockQuiz.duration);
    // ❌ END MOCK — sau này thay bằng API:
    // fetch(`/api/quiz/${quizId}`).then(res => res.json()).then(data => {
    //   setQuizData(data);
    //   setTimeLeft(data.duration);
    // });
  }, []);

  // Bộ đếm thời gian
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleSelectAnswer = (questionId, answer) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleChangeQuestion = (index) => setCurrentIndex(index);
  const handleNext = () =>
    currentIndex < quizData.questions.length - 1 &&
    setCurrentIndex((prev) => prev + 1);
  const handlePrev = () => currentIndex > 0 && setCurrentIndex((prev) => prev - 1);

  return (
    <div className={styles.page}>
      {/* ✅ Header tách khỏi main, fixed theo viewport */}
      <QuizHeader quiz={quizData} timeLeft={formatTime(timeLeft)} />

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

      <SubmitModal />
    </div>
  );
};

export default QuizPage;
