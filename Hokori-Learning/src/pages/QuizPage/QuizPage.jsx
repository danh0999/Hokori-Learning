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
  fetchNextQuestionThunk,
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

        // 3) Nạp câu hỏi đầu tiên bằng /next
        await dispatch(
          fetchNextQuestionThunk({ lessonId, attemptId: id })
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
    // chỉ cho phép nhảy tới câu đã nạp
    if (index < questions.length) {
      setActiveIndex(index);
      const el = document.getElementById(`question-${index}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
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
      // Ẩn modal để người học có thể xem lại câu hỏi
      setShowSubmitModal(false);
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
        <div className={styles.layoutTwoCol}>
          <div className={styles.content}>
          {questions.length > 0 ? (
            <div
              key={questions[activeIndex]?.questionId}
              id={`question-${activeIndex}`}
              className={styles.questionWrapper}
            >
              <QuestionCard
                question={questions[activeIndex]}
                index={activeIndex}
                total={quizInfo?.totalQuestions || totalQuestions}
                selectedOptionId={
                  answers[questions[activeIndex].questionId]
                }
                onSelectAnswer={(optionId) =>
                  handleSelectAnswer(
                    questions[activeIndex].questionId,
                    optionId
                  )
                }
              />

              <div className={styles.navButtons}>
                <button
                  type="button"
                  className={styles.prevBtn}
                  onClick={() => setActiveIndex((i) => (i > 0 ? i - 1 : i))}
                  disabled={activeIndex === 0}
                >
                  Câu trước
                </button>
                <button
                  type="button"
                  className={styles.nextBtn}
                  onClick={async () => {
                    // nếu đã nạp sẵn câu tiếp theo
                    if (activeIndex < questions.length - 1) {
                      setActiveIndex((i) => i + 1);
                      return;
                    }
                    // cần gọi API /next để nạp thêm
                    if (!lessonId || !attemptId) return;
                    const action = await dispatch(
                      fetchNextQuestionThunk({ lessonId, attemptId })
                    );
                    if (
                      fetchNextQuestionThunk.fulfilled.match(action) &&
                      action.payload.question
                    ) {
                      setActiveIndex((i) => i + 1);
                    }
                  }}
                  disabled={
                    // disable nếu đã ở câu cuối cùng theo totalQuestions
                    quizInfo?.totalQuestions
                      ? activeIndex >= quizInfo.totalQuestions - 1
                      : false
                  }
                >
                  Câu tiếp
                </button>
              </div>
            </div>
          ) : (
            <p className={styles.emptyQuestions}>Chưa có câu hỏi.</p>
          )}
          </div>

          <aside className={styles.sidebarSticky}>
            <Sidebar
              total={quizInfo?.totalQuestions || totalQuestions}
              activeIndex={activeIndex}
              answers={answers}
              questions={questions}
              onSelectQuestion={handleClickQuestionNumber}
            />
          </aside>
        </div>
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
