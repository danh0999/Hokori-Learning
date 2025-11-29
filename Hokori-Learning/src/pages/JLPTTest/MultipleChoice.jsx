// src/pages/JLPTTest/MultipleChoice.jsx
import React, { useEffect, useState, useMemo } from "react";
import styles from "./MultipleChoice.module.scss";
import LoadingOverlay from "../../components/Loading/LoadingOverlay";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";

import SidebarQuestionList from "./components/SidebarQuestionList";
import QuestionCard from "./components/QuestionCard";
import JLPTModal from "./components/JLPTModal";

// DÙNG ĐÚNG ACTION TỪ SLICE MỚI
import {
  fetchGrammarVocab,
  submitAnswer,
  clearTestData,
} from "../../redux/features/jlptLearnerSlice";

const MultipleChoice = () => {
  const { testId } = useParams();
  const numericTestId = Number(testId);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { grammarVocab, answers, loadingQuestions } = useSelector(
    (state) => state.jlptLearner
  );

  // ==== LOCAL ANSWERS: để UI highlight ngay ====
  const [localAnswers, setLocalAnswers] = useState({});

  useEffect(() => {
    // sync lại nếu slice có dữ liệu (VD: reload)
    if (answers) {
      setLocalAnswers((prev) => ({ ...prev, ...answers }));
    }
  }, [answers]);

  const grammarQuestions = grammarVocab || [];

  // ===== STATE LOCAL =====
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0); // giây

  const [modalOpen, setModalOpen] = useState(false);
  const [modalContext, setModalContext] = useState(null); // "submit" | "next"

  // CLEAR KHI RỜI TRANG
  useEffect(() => {
    return () => {
      dispatch(clearTestData());
    };
  }, [dispatch]);

  // ===== INIT: fetch grammar questions =====
  useEffect(() => {
    if (!numericTestId) return;

    const load = async () => {
      await dispatch(fetchGrammarVocab(numericTestId));
      // Giả định phần này 30 phút
      setTimeLeft(30 * 60);
    };

    load();
  }, [dispatch, numericTestId]);

  // ===== TIMER LOCAL CHO PHẦN NÀY =====
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

  // ===== DERIVED =====
  const total = grammarQuestions.length;
  const answered = useMemo(
    () => grammarQuestions.filter((q) => localAnswers[q.id] !== undefined).length,
    [grammarQuestions, localAnswers]
  );
  const hasUnanswered = answered < total;
  const progress = total > 0 ? Math.round((answered / total) * 100) : 0;

  const currentQ = total > 0 ? grammarQuestions[currentIndex] : null;

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

  // ===== HANDLERS =====
  const handleSelectAnswer = (questionId, optionId) => {
    // 1. Cập nhật UI ngay
    setLocalAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));

    // 2. Gửi lên backend
    dispatch(
      submitAnswer({
        testId: numericTestId,
        questionId,
        selectedOptionId: optionId,
      })
    );
  };

  const handleNextQuestion = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  // Nút "Nộp bài"
  const handleClickSubmit = () => {
    setModalContext("submit");
    setModalOpen(true);
  };

  // Nút "Tiếp tục phần Đọc hiểu"
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
      // Nộp bài luôn -> sang result
      navigate(`/jlpt/test/${numericTestId}/result`);
    } else if (modalContext === "next") {
      // Sang phần Đọc hiểu (nếu learner skip, các câu chưa làm = sai)
      navigate(`/jlpt/test/${numericTestId}/reading`);
    }
    setModalOpen(false);
    setModalContext(null);
  };

  const isLoading = loadingQuestions;

  // ============================
  //  UI GỐC — GIỮ NGUYÊN
  // ============================
  return (
    <>
    {(loadingQuestions || grammarQuestions.length === 0) && <LoadingOverlay />}

    <div className={styles.wrapper}>
      {/* HEADER */}
      <header className={styles.headerBar}>
        <h1 className={styles.testTitle}>JLPT - Từ vựng &amp; Ngữ pháp</h1>
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
              questions={grammarQuestions.map((q, i) => ({
                question_id: q.id,
                order_index: i + 1,
              }))}
              currentIndex={currentIndex}
              // DÙNG localAnswers ĐỂ TO MÀU Ô ĐÃ CHỌN
              answersByQuestion={localAnswers}
              onJumpTo={setCurrentIndex}
            />
          )}
        </aside>

        {/* CONTENT */}
        <section className={styles.questionArea}>
          <div className={styles.questionCardWrap}>
            {/* Thanh tiến độ (UI gốc) */}
            <div className={styles.progressCard}>
              <div className={styles.progressTopRow}>
                <span className={styles.progressLabel}>
                  Tiến độ hoàn thành
                </span>
                <span className={styles.progressPct}>{progress}%</span>
              </div>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressBar}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Câu hỏi */}
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

          {/* Nút sang phần Đọc hiểu */}
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
          hasUnanswered
            ? `Bạn mới trả lời ${answered}/${total} câu. Nếu tiếp tục, các câu chưa làm sẽ bị tính sai.`
            : "Bạn đã hoàn thành toàn bộ câu hỏi trong phần này."
        }
        confirmLabel={modalContext === "submit" ? "Nộp bài" : "Sang phần Đọc hiểu"}
        cancelLabel="Ở lại làm tiếp"
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
      />
    </div>
    </>
  );
};

export default MultipleChoice;
 