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
  startJlptTest,
  setLocalAnswer,
  submitJlptAnswer,
} from "../../redux/features/jlptLearnerSlice";

const JLPTTestPage = () => {
  const { testId } = useParams();
  const numericTestId = Number(testId);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    currentTestMeta,
    questions,
    answers,
    loadingStart,
    loadingQuestions,
    submittingAnswer,
  } = useSelector((state) => state.jlptLearner);

  // index câu hiện tại
  const [currentIndex, setCurrentIndex] = useState(0);

  // timer
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  // modal nộp bài
  const [submitModalOpen, setSubmitModalOpen] = useState(false);

  // ----- gọi API start khi mở trang -----
  useEffect(() => {
    if (!numericTestId) return;
    dispatch(startJlptTest(numericTestId));
  }, [dispatch, numericTestId]);

  // ----- set timer từ durationMin -----
  useEffect(() => {
    if (!currentTestMeta?.durationMin) return;
    setRemainingSeconds(currentTestMeta.durationMin * 60);
  }, [currentTestMeta]);

  // ----- đếm ngược -----
  useEffect(() => {
    if (remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds]);

  // Khi hết giờ → tự mở modal nộp bài
  useEffect(() => {
    if (remainingSeconds === 0 && questions.length > 0) {
      setSubmitModalOpen(true);
    }
  }, [remainingSeconds, questions.length]);

  // ----- dữ liệu đã load xong chưa -----
  const isLoading = loadingStart || loadingQuestions;

  const totalQuestions = questions.length;
  const answeredCount = useMemo(
    () => Object.keys(answers || {}).length,
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

  const currentQuestionRaw =
    totalQuestions > 0 ? questions[currentIndex] : null;

  const uiQuestion = currentQuestionRaw
    ? {
        question_id: currentQuestionRaw.id,
        order_index:
          currentQuestionRaw.orderIndex ?? currentIndex + 1,
        content: currentQuestionRaw.content,
        options: (currentQuestionRaw.options || []).map((opt, idx) => ({
          option_id: opt.id,
          label: String.fromCharCode(
            65 + (opt.orderIndex ?? idx)
          ), // A, B, C, D
          text: opt.content,
        })),
      }
    : null;

  const handleSelectOption = (questionId, optionId) => {
    // cập nhật local để UI phản hồi ngay
    dispatch(setLocalAnswer({ questionId, selectedOptionId: optionId }));
    // gọi API lưu đáp án
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
    // Không có API "submit test" riêng, chỉ cần chuyển qua trang kết quả
    navigate(`/jlpt/test/${numericTestId}/result`);
  };

  const testTitle =
    currentTestMeta?.title ||
    `JLPT ${currentTestMeta?.level || ""} - Mock Test`;

  return (
    <div className={styles.wrapper}>
      {/* HEADER */}
      <HeaderBar
        title={testTitle}
        remainingSeconds={remainingSeconds}
        onSubmit={handleOpenSubmitModal}
      />

      {/* MAIN */}
      <main className={styles.main}>
        {/* SIDEBAR LIST QUESTION */}
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

        {/* QUESTION + PROGRESS */}
        <section className={styles.content}>
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
              selectedOptionId={
                answers[uiQuestion.question_id] ?? null
              }
              onSelectOption={handleSelectOption}
              onPrev={handlePrev}
              onNext={handleNext}
              lastSavedAt={
                submittingAnswer ? "Đang lưu..." : "Tự động lưu"
              }
            />
          )}
        </section>
      </main>

      {/* FOOTER PROGRESS (hiển thị lại %) */}
      <FooterProgress
        currentIndex={currentIndex}
        totalQuestions={totalQuestions}
        progressPercent={progressPercent}
      />

      {/* MODAL NỘP BÀI */}
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
