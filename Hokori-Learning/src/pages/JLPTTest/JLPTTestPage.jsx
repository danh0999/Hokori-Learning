// src/pages/JLPTTest/JLPTTestPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./JLPTTestPage.module.scss";

import HeaderBar from "./components/HeaderBar";
import FooterProgress from "./components/FooterProgress";
import SidebarQuestionList from "./components/SidebarQuestionList";
import QuestionCard from "./components/QuestionCard";
import JLPTModal from "./components/JLPTModal";

import {
  fetchTestQuestions,
  setLocalAnswer,
  submitJlptAnswer,
} from "../../redux/features/jlptLearnerSlice";

// BE hiện chưa trả duration → tạm 120 phút
const DEFAULT_DURATION_MIN = 120;

const JLPTTestPage = () => {
  const { testId } = useParams();
  const numericTestId = Number(testId);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    questions,
    answers,
    loadingQuestions,
    submittingAnswer,
  } = useSelector((state) => state.jlptLearner);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(
    DEFAULT_DURATION_MIN * 60
  );

  const [submitModalOpen, setSubmitModalOpen] = useState(false);

  /* ============================
     LOAD QUESTIONS
  ============================= */
  useEffect(() => {
    if (!numericTestId) return;

    dispatch(fetchTestQuestions(numericTestId));
    setRemainingSeconds(DEFAULT_DURATION_MIN * 60);
  }, [dispatch, numericTestId]);

  /* ============================
     RESTORE CURRENT QUESTION BASED ON ANSWERS
     (Fix F5 quay lại câu 1)
  ============================= */
  useEffect(() => {
    if (questions.length === 0) return;

    const answeredIds = Object.keys(answers).map(Number);

    const firstUnansweredIndex = questions.findIndex(
      (q) => !answeredIds.includes(q.id)
    );

    setCurrentIndex(
      firstUnansweredIndex === -1 ? 0 : firstUnansweredIndex
    );
  }, [questions]);

  /* ============================
     TIMER COUNTDOWN
  ============================= */
  useEffect(() => {
    if (remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds]);

  useEffect(() => {
    if (remainingSeconds === 0 && questions.length > 0) {
      setSubmitModalOpen(true);
    }
  }, [remainingSeconds, questions.length]);

  /* ============================
     UI CALCULATIONS
  ============================= */
  const isLoading = loadingQuestions;

  const totalQuestions = questions.length;
  const answeredCount = useMemo(
    () => Object.keys(answers).length,
    [answers]
  );

  const progressPercent =
    totalQuestions > 0
      ? Math.round((answeredCount / totalQuestions) * 100)
      : 0;

  const sidebarQuestions = useMemo(
    () =>
      questions.map((q, idx) => ({
        question_id: q.id,
        order_index: q.orderIndex ?? idx + 1,
      })),
    [questions]
  );

  /* ============================
     CURRENT QUESTION MAPPING (API → UI)
  ============================= */
  const currentQuestionRaw =
    totalQuestions > 0 ? questions[currentIndex] : null;

  const uiQuestion = currentQuestionRaw
    ? {
        question_id: currentQuestionRaw.id,
        order_index: currentQuestionRaw.orderIndex ?? currentIndex + 1,
        content: currentQuestionRaw.content,
        audio: currentQuestionRaw.audioUrl || null,
        image: currentQuestionRaw.imagePath || null,
        options: (currentQuestionRaw.options || []).map((opt, idx) => ({
          option_id: opt.id,
          label: String.fromCharCode(65 + idx), // A, B, C, D
          text: opt.content,
        })),
      }
    : null;

  /* ============================
     HANDLERS
  ============================= */

  const handleSelectOption = (questionId, optionId) => {
    dispatch(setLocalAnswer({ questionId, selectedOptionId: optionId }));

    dispatch(
      submitJlptAnswer({
        testId: numericTestId,
        questionId,
        selectedOptionId: optionId,
      })
    );
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev < totalQuestions - 1 ? prev + 1 : prev
    );
  };

  const handleOpenSubmitModal = () => {
    setSubmitModalOpen(true);
  };

  const handleCancelSubmit = () => {
    setSubmitModalOpen(false);
  };

  const handleConfirmSubmit = () => {
    setSubmitModalOpen(false);
    navigate(`/jlpt/test/${numericTestId}/result`);
  };

  const testTitle = `JLPT Test #${numericTestId}`;

  /* ============================
     RENDER
  ============================= */

  return (
    <div className={styles.wrapper}>
      <HeaderBar
        title={testTitle}
        remainingSeconds={remainingSeconds}
        onSubmit={handleOpenSubmitModal}
      />

      <main className={styles.main}>
        <aside className={styles.sidebar}>
          {isLoading && <p>Đang tải câu hỏi...</p>}

          {!isLoading && (
            <SidebarQuestionList
              questions={sidebarQuestions}
              currentIndex={currentIndex}
              answersByQuestion={answers}
              onJumpTo={setCurrentIndex}
            />
          )}
        </aside>

        <section className={styles.content}>
          {/* PROGRESS CARD */}
          <div className={styles.progressCard}>
            <div className={styles.progressTopRow}>
              <span className={styles.progressLabel}>
                Tiến độ hoàn thành
              </span>
              <span className={styles.progressPct}>
                {progressPercent}%
              </span>
            </div>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressBar}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {uiQuestion && (
            <QuestionCard
              question={uiQuestion}
              selectedOptionId={answers[uiQuestion.question_id] ?? null}
              onSelectOption={handleSelectOption}
              onPrev={handlePrev}
              onNext={handleNext}
              lastSavedAt={submittingAnswer ? "Đang lưu..." : "Tự động lưu"}
            />
          )}
        </section>
      </main>

      <FooterProgress
        currentIndex={currentIndex}
        totalQuestions={totalQuestions}
        progressPercent={progressPercent}
      />

      <JLPTModal
        open={submitModalOpen}
        title="Nộp bài JLPT Test?"
        message="Hệ thống sẽ chấm điểm dựa trên các câu đã trả lời. Bạn chắc chắn muốn nộp bài chứ?"
        confirmLabel="Nộp bài"
        cancelLabel="Quay lại"
        onConfirm={handleConfirmSubmit}
        onCancel={handleCancelSubmit}
      />
    </div>
  );
};

export default JLPTTestPage;
