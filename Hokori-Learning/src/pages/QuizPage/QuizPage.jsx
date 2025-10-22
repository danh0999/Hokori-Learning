import React, { useEffect, useState } from "react";
import styles from "./QuizPage.module.scss";
import QuizHeader from "./components/QuizHeader";
import QuestionCard from "./components/QuestionCard";
import Sidebar from "./components/Sidebar";
import SubmitModal from "./components/SubmitModal";

const QuizPage = () => {
  const [quizData, setQuizData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // ⚙️ MOCK DATA – sẽ xóa khi call API thật
    const mockQuiz = {
      title: "JLPT N3 Mock Test – Grammar Section",
      duration: "30:00",
      totalQuestions: 5,
      questions: [
        {
          id: 1,
          question: "この文に合う助詞を選んでください：私は毎朝コーヒー___飲みます。",
          options: ["が", "を", "に", "へ"],
          correct: "を",
          explanation:
            "動作の対象を示すときには「を」を使います。→ コーヒーを飲みます。",
        },
        {
          id: 2,
          question: "「行きます」の過去形はどれですか？",
          options: ["行きました", "行った", "行って", "行かない"],
          correct: "行きました",
        },
        {
          id: 3,
          question: "この中で形容詞ではないのはどれですか？",
          options: ["大きい", "静か", "高い", "明るい"],
          correct: "静か",
        },
      ],
    };
    setQuizData(mockQuiz);
    // ❌ END MOCK DATA – thay bằng call API sau này, ví dụ:
    // fetch(`/api/quiz/${quizId}`).then(res => res.json()).then(setQuizData);
  }, []);

  const handleNext = () => {
    setCurrentIndex((prev) =>
      quizData && prev < quizData.questions.length - 1 ? prev + 1 : prev
    );
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : 0));
  };

  return (
    <div className={styles.page}>
      <QuizHeader quiz={quizData} />
      <main className={styles.main}>
        <div className={styles.layout}>
          <section className={styles.quizArea}>
            <QuestionCard
              question={quizData?.questions[currentIndex]}
              index={currentIndex}
              total={quizData?.questions?.length || 0}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          </section>
          <aside className={styles.sidebarArea}>
            <Sidebar
              total={quizData?.totalQuestions}
              current={currentIndex + 1}
            />
          </aside>
        </div>
      </main>
      <SubmitModal />
    </div>
  );
};

export default QuizPage;
