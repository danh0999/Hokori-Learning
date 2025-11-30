// src/pages/JLPTTest/JLPTTestPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import styles from "./JLPTTestPage.module.scss";

import HeaderBar from "./components/HeaderBar";
import FooterProgress from "./components/FooterProgress";
import SidebarQuestionList from "./components/SidebarQuestionList";
import QuestionCard from "./components/QuestionCard";
import JLPTModal from "./components/JLPTModal";

import {
  fetchLearnerTests,
  fetchGrammarVocab,
  fetchReading,
  fetchListening,
  fetchActiveUsers,
  submitAnswer,
  clearTestData,
} from "../../redux/features/jlptLearnerSlice";

const JLPTTestPage = () => {
  const { testId } = useParams();
  const numericTestId = Number(testId);

  const [params] = useSearchParams();
  const eventId = params.get("eventId"); 

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
    activeUsers,
  } = useSelector((state) => state.jlptLearner);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);

  /* ============================================================
     CLEAR OLD TEST DATA khi rời trang
  ============================================================ */
  useEffect(() => {
    return () => dispatch(clearTestData());
  }, [dispatch]);

  /* ============================================================
     FETCH TEST LIST BY EVENT
  ============================================================ */
  useEffect(() => {
    if (!eventId) {
      console.error("❌ eventId not found in URL");
      return;
    }
    dispatch(fetchLearnerTests(eventId));
  }, [dispatch, eventId]);

  /* ============================================================
     LẤY META TEST THEO testId
  ============================================================ */
  const testMeta = useMemo(() => {
    return allTests.find((t) => t.id === numericTestId);
  }, [allTests, numericTestId]);

  /* ============================================================
     SET TIMER THEO durationMin
  ============================================================ */
  useEffect(() => {
    if (testMeta?.durationMin) {
      setRemainingSeconds(testMeta.durationMin * 60);
    }
  }, [testMeta]);

  /* ============================================================
     FETCH 3 LOẠI CÂU HỎI
  ============================================================ */
  useEffect(() => {
    if (!numericTestId) return;

    const load = async () => {
      await Promise.all([
        dispatch(fetchGrammarVocab(numericTestId)),
        dispatch(fetchReading(numericTestId)),
        dispatch(fetchListening(numericTestId)),
      ]);
    };

    load();
  }, [dispatch, numericTestId]);

  /* ============================================================
     🟦 REALTIME ACTIVE USERS (POLLING 3s)
  ============================================================ */
  useEffect(() => {
    if (!numericTestId) return;

    const fetchOnce = () => dispatch(fetchActiveUsers(numericTestId));

    fetchOnce();
    const interval = setInterval(fetchOnce, 3000);

    return () => clearInterval(interval);
  }, [dispatch, numericTestId]);

  /* ============================================================
     GỘP TẤT CẢ CÂU HỎI
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
     RESTORE current index dựa vào answered
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
     TIMER GIẢM DẦN
  ============================================================ */
  useEffect(() => {
    if (remainingSeconds <= 0) return;

    const t = setInterval(() => {
      setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(t);
  }, [remainingSeconds]);

  /* ============================================================
     TIMEOUT → AUTO OPEN SUBMIT MODAL
  ============================================================ */
  useEffect(() => {
    if (remainingSeconds === 0 && totalQuestions > 0) {
      setSubmitModalOpen(true);
    }
  }, [remainingSeconds, totalQuestions]);

  /* ============================================================
     FORMAT QUESTION CHO QuestionCard
  ============================================================ */
  const curRaw = totalQuestions > 0 ? mergedQuestions[currentIndex] : null;

  const uiQuestion = curRaw
    ? {
        question_id: curRaw.id,
        order_index: currentIndex + 1,
        content: curRaw.content,
        audio: curRaw.audioUrl || null,
        image: curRaw.imagePath || null,
        options: (curRaw.options || []).map((opt, idx) => ({
          option_id: opt.id,
          label: String.fromCharCode(65 + idx),
          text: opt.content,
        })),
      }
    : null;

  /* ============================================================
     HANDLERS
  ============================================================ */
  const handleSelectOption = (qid, optionId) => {
    dispatch(
      submitAnswer({
        testId: numericTestId,
        questionId: qid,
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

  const activeCount = activeUsers?.[numericTestId] ?? 0;

  const isLoading = loadingAllTests || loadingQuestions || !testMeta;

  /* ============================================================
     RENDER UI
  ============================================================ */
  return (
    <div className={styles.wrapper}>
      <HeaderBar
        title={testMeta?.title || `JLPT Test #${testId}`}
        remainingSeconds={remainingSeconds}
        activeUsers={activeCount}   // ⭐ Thêm realtime vào HeaderBar
        onSubmit={handleSubmit}
      />

      <main className={styles.main}>
        {/* SIDEBAR */}
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

        {/* CONTENT */}
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
