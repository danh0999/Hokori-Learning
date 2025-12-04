// src/pages/JLPTTest/MultipleChoice.jsx (Original Simplified Version)
import React, { useEffect, useState, useMemo } from "react";
import styles from "./MultipleChoice.module.scss";
import LoadingOverlay from "../../components/Loading/LoadingOverlay";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";

import SidebarQuestionList from "./components/SidebarQuestionList";
import QuestionCard from "./components/QuestionCard";
import JLPTModal from "./components/JLPTModal";

import {
  fetchGrammarVocab,
  submitAnswer,
  setTestTime,
  updateTimeLeft, 
  fetchActiveUsers,
} from "../../redux/features/jlptLearnerSlice";

import api from "../../configs/axios";
const MultipleChoice = () => {
  const { testId } = useParams();
  const numericTestId = Number(testId);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { grammarVocab, answers, loadingQuestions, activeUsers, timeLeft } =
    useSelector((state) => state.jlptLearner);

  const grammarQuestions = grammarVocab || [];

  // LOCAL UI STATE ONLY
  const [localAnswers, setLocalAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContext, setModalContext] = useState(null);
  // =======================================================
  // START TEST → lấy thời gian từ API
  // =======================================================
  useEffect(() => {
    async function startTest() {
      try {
        const res = await api.post(
          `/learner/jlpt/tests/${numericTestId}/start`
        );
        const duration = res.data?.durationMin || 180;

        dispatch(
          setTestTime({
            timeLeft: duration * 60,
            durationMin: duration,
          })
        );
      } catch (err) {
        console.error("Cannot start test", err);
        navigate("/jlpt");
      }
    }

    startTest();
  }, [dispatch, numericTestId, navigate]);
  /* ============================================================
      TIMER COUNTDOWN (NEEDED!)
============================================================ */
  useEffect(() => {
    if (!timeLeft || timeLeft <= 0) return;

    const timer = setInterval(() => dispatch(updateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [dispatch, timeLeft]);

  /* ============================================================
        LOAD QUESTIONS
     ============================================================ */
  useEffect(() => {
    dispatch(fetchGrammarVocab(numericTestId));
  }, [dispatch, numericTestId]);

  /* ============================================================
        SYNC ANSWERS FROM REDUX → LOCAL
     ============================================================ */
  useEffect(() => {
    if (answers) {
      setLocalAnswers((prev) => ({ ...prev, ...answers }));
    }
  }, [answers]);

  /* ============================================================
        ACTIVE USERS
     ============================================================ */
  useEffect(() => {
    const run = () => dispatch(fetchActiveUsers(numericTestId));
    run();
    const t = setInterval(run, 3000);
    return () => clearInterval(t);
  }, [dispatch, numericTestId]);

  /* ============================================================
        FORMAT TIME
     ============================================================ */
  const formatTime = (sec = 0) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  /* ============================================================
        PROGRESS
     ============================================================ */
  const total = grammarQuestions.length;

  const answered = useMemo(
    () =>
      grammarQuestions.filter((q) => localAnswers[q.id] !== undefined).length,
    [grammarQuestions, localAnswers]
  );

  const progress = total ? Math.round((answered / total) * 100) : 0;

  const currentQ = grammarQuestions[currentIndex] || null;

  const uiQuestion = currentQ && {
    question_id: currentQ.id,
    order_index: currentIndex + 1,
    content: currentQ.content,
    audio: currentQ.audioUrl || null,
    image: currentQ.imagePath || null,
    options: currentQ.options.map((opt, i) => ({
      option_id: opt.id,
      label: String.fromCharCode(65 + i),
      text: opt.content,
    })),
  };

  /* ============================================================
        SELECT ANSWER
     ============================================================ */
  const handleSelectAnswer = (questionId, optionId) => {
    setLocalAnswers((prev) => ({ ...prev, [questionId]: optionId }));

    dispatch(
      submitAnswer({
        testId: numericTestId,
        questionId,
        selectedOptionId: optionId,
      })
    );
  };

  /* ============================================================
        NEXT / PREV
     ============================================================ */
  const findNextUnanswered = () => {
    for (let i = currentIndex + 1; i < total; i++) {
      if (!localAnswers[grammarQuestions[i].id]) return i;
    }
    for (let i = 0; i < currentIndex; i++) {
      if (!localAnswers[grammarQuestions[i].id]) return i;
    }
    return null;
  };

  const next = () => {
    const nextIdx = findNextUnanswered();
    if (nextIdx !== null) setCurrentIndex(nextIdx);
    else if (currentIndex < total - 1) setCurrentIndex((i) => i + 1);
    else setCurrentIndex(0);
  };

  const prev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  /* ============================================================
        SUBMIT / GO TO READING
     ============================================================ */
  const handleModalConfirm = () =>
    navigate(
      modalContext === "submit"
        ? `/jlpt/test/${numericTestId}/result`
        : `/jlpt/test/${numericTestId}/reading`
    );

  const activeCount = activeUsers?.[numericTestId] ?? 0;

  /* ============================================================
        UI RENDER
     ============================================================ */
  return (
    <>
      {(loadingQuestions || grammarQuestions.length === 0) && (
        <LoadingOverlay />
      )}

      <div className={styles.wrapper}>
        {/* HEADER */}
        <header className={styles.headerBar}>
          <h1 className={styles.testTitle}>JLPT - Từ vựng & Ngữ pháp</h1>

          <div className={styles.headerRight}>
            <div className={styles.activeUsersBox}>
              <i className="fa-solid fa-user-group" />
              <span>Đang có {activeCount} người tham gia bài thi này</span>
            </div>

            <div className={styles.timerBox}>
              <i className="fa-regular fa-clock" />
              <span className={styles.timerText}>{formatTime(timeLeft)}</span>
            </div>

            <button
              className={styles.submitBtn}
              onClick={() => {
                setModalContext("submit");
                setModalOpen(true);
              }}
            >
              Nộp bài
            </button>
          </div>
        </header>

        {/* MAIN */}
        <main className={styles.main}>
          <aside className={styles.sidebarCard}>
            <SidebarQuestionList
              questions={grammarQuestions.map((q, i) => ({
                question_id: q.id,
                order_index: i + 1,
              }))}
              currentIndex={currentIndex}
              answersByQuestion={localAnswers}
              onJumpTo={setCurrentIndex}
            />
          </aside>

          {/* RIGHT */}
          <section className={styles.questionArea}>
            <div className={styles.questionCardWrap}>
              {/* PROGRESS */}
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

              {/* QUESTION */}
              {uiQuestion && (
                <QuestionCard
                  question={uiQuestion}
                  selectedOptionId={localAnswers[uiQuestion.question_id]}
                  onSelectOption={handleSelectAnswer}
                  onPrev={prev}
                  onNext={next}
                />
              )}
            </div>

            {/* NEXT SECTION */}
            <div className={styles.nextSection}>
              <button
                className={styles.nextSectionBtn}
                onClick={() => {
                  setModalContext("next");
                  setModalOpen(true);
                }}
              >
                Tiếp tục phần Đọc hiểu
              </button>
            </div>
          </section>
        </main>

        {/* MODAL */}
        <JLPTModal
          open={modalOpen}
          title={
            modalContext === "submit"
              ? "Nộp bài phần Từ vựng & Ngữ pháp?"
              : "Chuyển sang phần Đọc hiểu?"
          }
          message={
            answered < total
              ? `Bạn đã trả lời ${answered}/${total} câu. Câu chưa làm = tính sai.`
              : "Bạn đã hoàn thành toàn bộ phần này."
          }
          confirmLabel={
            modalContext === "submit" ? "Nộp bài" : "Sang phần Đọc hiểu"
          }
          cancelLabel="Ở lại làm tiếp"
          onConfirm={handleModalConfirm}
          onCancel={() => setModalOpen(false)}
        />
      </div>
    </>
  );
};

export default MultipleChoice;
