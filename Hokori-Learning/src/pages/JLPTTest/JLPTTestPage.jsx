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

// ====== Redux actions đúng với slice mới ======
import {
  fetchLearnerTests,
  fetchGrammarVocab,
  fetchReading,
  fetchListening,
  submitAnswer,
  clearTestData,
} from "../../redux/features/jlptLearnerSlice";

const JLPTTestPage = () => {
  const { testId } = useParams();
  const numericTestId = Number(testId);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    allTests,
    grammarVocab,
    reading,
    listening,
    answers,
    loadingAllTests,
    loadingQuestions,
  } = useSelector((state) => state.jlptLearner);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);

  /* ============================================================
     CLEAR OLD DATA when leaving test or switching test
  ============================================================ */
  useEffect(() => {
    return () => dispatch(clearTestData());
  }, [dispatch]);

  /* ============================================================
     STEP 1: Ensure we have all test metadata
  ============================================================ */
  useEffect(() => {
    if (!numericTestId) return;

    // Nếu allTests rỗng → fetch
    if (!allTests || allTests.length === 0) {
      dispatch(fetchLearnerTests());
    }
  }, [dispatch, numericTestId]);

  // Lấy test metadata theo testId
  const testMeta = useMemo(() => {
    return allTests.find((t) => t.id === numericTestId);
  }, [allTests, numericTestId]);

  /* ============================================================
     STEP 2: Set timer based on testMeta.durationMin
  ============================================================ */
  useEffect(() => {
    if (testMeta && testMeta.durationMin) {
      setRemainingSeconds(testMeta.durationMin * 60);
    }
  }, [testMeta]);

  /* ============================================================
     STEP 3: Load 3 groups of questions
  ============================================================ */
  useEffect(() => {
    if (!numericTestId) return;

    const loadQuestions = async () => {
      await Promise.all([
        dispatch(fetchGrammarVocab(numericTestId)),
        dispatch(fetchReading(numericTestId)),
        dispatch(fetchListening(numericTestId)),
      ]);
    };

    loadQuestions();
  }, [dispatch, numericTestId]);

  /* ============================================================
     MERGE 3 groups of questions
  ============================================================ */
  const mergedQuestions = useMemo(() => {
    return [
      ...(grammarVocab || []),
      ...(reading || []),
      ...(listening || []),
    ];
  }, [grammarVocab, reading, listening]);

  const totalQuestions = mergedQuestions.length;

  /* ============================================================
     RESTORE current question index based on answered
  ============================================================ */
  useEffect(() => {
    if (totalQuestions === 0) return;

    const answeredIds = Object.keys(answers).map(Number);

    const firstUnanswered = mergedQuestions.findIndex(
      (q) => !answeredIds.includes(q.id)
    );

    setCurrentIndex(firstUnanswered === -1 ? 0 : firstUnanswered);
  }, [mergedQuestions]);

  /* ============================================================
     TIMER
  ============================================================ */
  useEffect(() => {
    if (remainingSeconds <= 0) return;

    const t = setInterval(() => {
      setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(t);
  }, [remainingSeconds]);

  useEffect(() => {
    if (remainingSeconds === 0 && totalQuestions > 0) {
      setSubmitModalOpen(true);
    }
  }, [remainingSeconds, totalQuestions]);

  /* ============================================================
     MAP UI QUESTION
  ============================================================ */
  const currentQuestionRaw =
    totalQuestions > 0 ? mergedQuestions[currentIndex] : null;

  const uiQuestion = currentQuestionRaw
    ? {
        question_id: currentQuestionRaw.id,
        order_index: currentIndex + 1,
        content: currentQuestionRaw.content,
        audio: currentQuestionRaw.audioUrl || null,
        image: currentQuestionRaw.imagePath || null,
        options: (currentQuestionRaw.options || []).map((opt, idx) => ({
          option_id: opt.id,
          label: String.fromCharCode(65 + idx),
          text: opt.content,
        })),
      }
    : null;

  /* ============================================================
     HANDLERS
  ============================================================ */
  const handleSelectOption = (questionId, optionId) => {
    dispatch(
      submitAnswer({
        testId: numericTestId,
        questionId,
        selectedOptionId: optionId,
      })
    );
  };

  const handlePrev = () =>
    setCurrentIndex((i) => (i > 0 ? i - 1 : i));

  const handleNext = () =>
    setCurrentIndex((i) => (i < totalQuestions - 1 ? i + 1 : i));

  const handleSubmit = () => setSubmitModalOpen(true);

  const handleConfirmSubmit = () => {
    navigate(`/jlpt/test/${numericTestId}/result`);
  };

  /* ============================================================
     PROGRESS
  ============================================================ */
  const progressPercent =
    totalQuestions > 0
      ? Math.round((Object.keys(answers).length / totalQuestions) * 100)
      : 0;

  const isLoading = loadingAllTests || loadingQuestions || !testMeta;

  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <div className={styles.wrapper}>
      <HeaderBar
        title={testMeta?.title || `JLPT Test #${testId}`}
        remainingSeconds={remainingSeconds}
        onSubmit={handleSubmit}
      />

      <main className={styles.main}>
        <aside className={styles.sidebar}>
          {isLoading && <p>Đang tải câu hỏi...</p>}

          {!isLoading && (
            <SidebarQuestionList
              questions={mergedQuestions.map((q, idx) => ({
                question_id: q.id,
                order_index: idx + 1,
              }))}
              currentIndex={currentIndex}
              answersByQuestion={answers}
              onJumpTo={setCurrentIndex}
            />
          )}
        </aside>

        <section className={styles.content}>
          <div className={styles.progressCard}>
            <div className={styles.progressTopRow}>
              <span>Tiến độ làm bài</span>
              <span>{progressPercent}%</span>
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
            />
          )}
        </section>
      </main>

      <FooterProgress pct={progressPercent} />

      <JLPTModal
        open={submitModalOpen}
        title="Nộp bài JLPT"
        message="Sau khi nộp bài bạn sẽ không sửa được kết quả. Tiếp tục?"
        confirmLabel="Nộp bài"
        cancelLabel="Hủy"
        onConfirm={handleConfirmSubmit}
        onCancel={() => setSubmitModalOpen(false)}
      />
    </div>
  );
};

export default JLPTTestPage;
