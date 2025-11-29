// src/pages/JLPTTest/Reading.jsx
import React, { useEffect, useMemo, useState } from "react";
import styles from "./MultipleChoice.module.scss"; // UI GỐC
import LoadingOverlay from "../../components/Loading/LoadingOverlay";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";

import SidebarQuestionList from "./components/SidebarQuestionList";
import QuestionCard from "./components/QuestionCard";
import JLPTModal from "./components/JLPTModal";

// ĐÚNG ACTION TỪ SLICE
import {
  fetchReading,
  submitAnswer,
} from "../../redux/features/jlptLearnerSlice";

const Reading = () => {
  const { testId } = useParams();
  const numericTestId = Number(testId);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { reading, answers, loadingQuestions } = useSelector(
    (state) => state.jlptLearner
  );

  const readingQuestions = reading || [];

  // ===== LOCAL ANSWERS — để UI highlight ngay =====
  const [localAnswers, setLocalAnswers] = useState({});

  useEffect(() => {
    if (answers) {
      setLocalAnswers((prev) => ({ ...prev, ...answers }));
    }
  }, [answers]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalContext, setModalContext] = useState(null);

  // ===== FETCH READING QUESTIONS =====
  useEffect(() => {
    if (!numericTestId) return;

    const load = async () => {
      await dispatch(fetchReading(numericTestId));
      setTimeLeft(45 * 60); // Thời gian phần Reading
    };

    load();
  }, [dispatch, numericTestId]);

  // ===== TIMER =====
  useEffect(() => {
    if (timeLeft <= 0) return;

    const t = setInterval(() => {
      setTimeLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    return () => clearInterval(t);
  }, [timeLeft]);

  const formatTime = (sec = 0) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // ===== PROGRESS =====
  const total = readingQuestions.length;

  const answered = useMemo(
    () =>
      readingQuestions.filter((q) => localAnswers[q.id] !== undefined).length,
    [readingQuestions, localAnswers]
  );

  const hasUnanswered = answered < total;
  const progress = total > 0 ? Math.round((answered / total) * 100) : 0;

  // ===== CURRENT QUESTION =====
  const currentQ = total > 0 ? readingQuestions[currentIndex] : null;

  const uiQuestion =
    currentQ &&
    (() => ({
      question_id: currentQ.id,
      order_index: currentIndex + 1,
      content: currentQ.content,
      audio: currentQ.audioUrl || null,
      image: currentQ.imagePath || null,
      options: (currentQ.options || []).map((opt, i) => ({
        option_id: opt.id,
        label: String.fromCharCode(65 + i),
        text: opt.content,
      })),
    }))();

  // ===== SELECT ANSWER =====
  const handleSelectAnswer = (questionId, optionId) => {
    // Update UI immediately
    setLocalAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));

    // Send to BE
    dispatch(
      submitAnswer({
        testId: numericTestId,
        questionId,
        selectedOptionId: optionId,
      })
    );
  };

  const handleNextQuestion = () => {
    if (currentIndex < total - 1) setCurrentIndex((i) => i + 1);
  };

  const handlePrevQuestion = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  // ===== SUBMIT & NEXT SECTION =====
  const handleClickSubmit = () => {
    setModalContext("submit");
    setModalOpen(true);
  };

  const handleClickNextSection = () => {
    setModalContext("next");
    setModalOpen(true);
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    setModalContext(null);
  };

  const handleModalConfirm = () => {
    if (modalContext === "submit") {
      navigate(`/jlpt/test/${numericTestId}/result`);
    } else if (modalContext === "next") {
      navigate(`/jlpt/test/${numericTestId}/listening`);
    }
    setModalOpen(false);
    setModalContext(null);
  };

  const isLoading = loadingQuestions;


  return (
    <>
    {(loadingQuestions || readingQuestions.length === 0) && <LoadingOverlay />}

    <div className={styles.wrapper}>
      {/* HEADER */}
      <header className={styles.headerBar}>
        <h1 className={styles.testTitle}>JLPT - Đọc hiểu</h1>
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
          {isLoading && <p>Đang tải câu hỏi...</p>}

          {!isLoading && (
            <SidebarQuestionList
              questions={readingQuestions.map((q, i) => ({
                question_id: q.id,
                order_index: i + 1,
              }))}
              currentIndex={currentIndex}
              answersByQuestion={localAnswers}
              onJumpTo={setCurrentIndex}
            />
          )}
        </aside>

        {/* CONTENT */}
        <section className={styles.questionArea}>
          <div className={styles.questionCardWrap}>
            {/* PROGRESS BAR đẹp như UI gốc */}
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

            {/* QUESTION */}
            {uiQuestion && (
              <QuestionCard
                question={uiQuestion}
                selectedOptionId={localAnswers[uiQuestion.question_id] ?? null}
                onSelectOption={handleSelectAnswer}
                onPrev={handlePrevQuestion}
                onNext={handleNextQuestion}
                lastSavedAt="Tự động lưu"
              />
            )}
          </div>

          {/* NEXT BUTTON */}
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
          hasUnanswered
            ? `Bạn mới trả lời ${answered}/${total} câu. Nếu tiếp tục, các câu chưa làm sẽ bị tính sai.`
            : "Bạn đã hoàn thành toàn bộ phần Đọc hiểu."
        }
        confirmLabel={
          modalContext === "submit" ? "Nộp bài" : "Sang phần Nghe hiểu"
        }
        cancelLabel="Ở lại làm tiếp"
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
      />
    </div>
    </>
  );
};

export default Reading;
