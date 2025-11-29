// src/pages/QuizPage/QuizPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

import styles from "./QuizPage.module.scss";
import QuizHeader from "./components/QuizHeader";
import QuestionCard from "./components/QuestionCard";
import Sidebar from "./components/Sidebar";
import SubmitModal from "./components/SubmitModal";

import {
  fetchQuizInfoThunk,
  startAttemptThunk,
  loadAllQuestionsThunk,
  answerQuestionThunk,
  submitAttemptThunk,
  resetQuizAttempt,
} from "../../redux/features/quizAttemptSlice";

const QuizPage = () => {
  const { courseId, lessonId, quizId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    quizInfo,
    attemptId,
    questions,
    answers,
    loading,
    error,
    submitting,
    result,
  } = useSelector((state) => state.quizAttempt);

  const [timeLeft, setTimeLeft] = useState(null); // seconds
  const [activeIndex, setActiveIndex] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // ====== 1) Fetch info + start attempt + load all questions ======
  useEffect(() => {
    if (!lessonId) return;

    const initQuiz = async () => {
      try {
        // 1) Lấy quiz info
        const infoAction = await dispatch(fetchQuizInfoThunk(lessonId));
        if (fetchQuizInfoThunk.rejected.match(infoAction)) return;

        const info = infoAction.payload.quizInfo;
        // set time limit nếu có
        if (info?.timeLimitSec) {
          setTimeLeft(info.timeLimitSec);
        } else {
          // default 30 phút nếu không set
          setTimeLeft(30 * 60);
        }

        // 2) Start attempt
        const attemptAction = await dispatch(startAttemptThunk(lessonId));
        if (startAttemptThunk.rejected.match(attemptAction)) return;

        const startedAttempt = attemptAction.payload.attempt;
        const id =
          startedAttempt?.attemptId || startedAttempt?.id || attemptId;
        if (!id) return;

        // 3) Load toàn bộ câu hỏi
        await dispatch(
          loadAllQuestionsThunk({ lessonId, attemptId: id })
        );
      } catch (err) {
        console.error("Init quiz error:", err);
      }
    };

    initQuiz();

    // cleanup
    return () => {
      dispatch(resetQuizAttempt());
    };
  }, [lessonId, dispatch]);

  // ====== 2) Countdown timer ======
  useEffect(() => {
    if (timeLeft == null) return;
    if (timeLeft <= 0) {
      setShowSubmitModal(true); // auto gợi ý submit khi hết giờ
      return;
    }

    const t = setInterval(() => {
      setTimeLeft((prev) => (prev != null ? prev - 1 : prev));
    }, 1000);

    return () => clearInterval(t);
  }, [timeLeft]);

  // ====== 3) Derived state ======
  const totalQuestions = questions.length;
  const answeredCount = useMemo(
    () =>
      questions.filter((q) => answers && answers[q.questionId] != null).length,
    [questions, answers]
  );

  // ====== 4) Handlers ======
  const handleSelectAnswer = (questionId, optionId) => {
    if (!lessonId || !attemptId) return;
    dispatch(
      answerQuestionThunk({ lessonId, attemptId, questionId, optionId })
    );
  };

  const handleClickQuestionNumber = (index) => {
    setActiveIndex(index);
    const el = document.getElementById(`question-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleOpenSubmit = () => {
    setShowSubmitModal(true);
  };

  const handleConfirmSubmit = async () => {
    if (!lessonId || !attemptId) return;
    const action = await dispatch(
      submitAttemptThunk({ lessonId, attemptId })
    );
    if (submitAttemptThunk.fulfilled.match(action)) {
      // ở đây bạn có thể điều hướng sang trang kết quả riêng:
      // navigate(`/course/${courseId}/lesson/${lessonId}/quiz/${quizId}/result`);
    }
  };

  const handleCloseModal = () => {
    setShowSubmitModal(false);
  };

  // ====== 5) Render ======
  if (loading && !quizInfo) {
    return <div className={styles.loading}>Đang tải bài quiz...</div>;
  }

  if (error) {
    return (
      <div className={styles.error}>
        Lỗi tải quiz: {String(error)}
        <button onClick={() => navigate(-1)}>Quay lại</button>
      </div>
    );
  }

  if (!quizInfo) {
    return (
      <div className={styles.empty}>
        <p>Bài học này chưa có quiz.</p>
        <button onClick={() => navigate(-1)}>Quay lại bài học</button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <QuizHeader
        title={quizInfo.title}
        totalQuestions={totalQuestions}
        answeredCount={answeredCount}
        timeLeft={timeLeft}
        onSubmit={handleOpenSubmit}
      />

      <main className={styles.main}>
        <div className={styles.content}>
          {questions.map((q, idx) => (
            <div
              key={q.questionId}
              id={`question-${idx}`}
              className={styles.questionWrapper}
            >
              <QuestionCard
                question={q}
                index={idx}
                total={totalQuestions}
                selectedOptionId={answers[q.questionId]}
                onSelectAnswer={(optionId) =>
                  handleSelectAnswer(q.questionId, optionId)
                }
              />
            </div>
          ))}

          {questions.length === 0 && (
            <p className={styles.emptyQuestions}>Chưa có câu hỏi.</p>
          )}
        </div>

        <aside className={styles.sidebar}>
          <Sidebar
            total={totalQuestions}
            activeIndex={activeIndex}
            answers={answers}
            questions={questions}
            onSelectQuestion={handleClickQuestionNumber}
          />
        </aside>
      </main>

      <SubmitModal
        open={showSubmitModal}
        loading={submitting}
        result={result}
        totalQuestions={totalQuestions}
        answeredCount={answeredCount}
        onCancel={handleCloseModal}
        onConfirm={handleConfirmSubmit}
      />
    </div>
  );
};

export default QuizPage;
