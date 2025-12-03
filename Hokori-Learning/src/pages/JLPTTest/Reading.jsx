// src/pages/JLPTTest/Reading.jsx (Original Simplified Version)
import React, { useEffect, useMemo, useState } from "react";
import styles from "./MultipleChoice.module.scss";
import LoadingOverlay from "../../components/Loading/LoadingOverlay";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";

import SidebarQuestionList from "./components/SidebarQuestionList";
import QuestionCard from "./components/QuestionCard";
import JLPTModal from "./components/JLPTModal";

import {
  fetchReading,
  submitAnswer,
  fetchActiveUsers,
} from "../../redux/features/jlptLearnerSlice";

const Reading = () => {
  const { testId } = useParams();
  const numericTestId = Number(testId);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { reading, answers, loadingQuestions, activeUsers, timeLeft } =
    useSelector((state) => state.jlptLearner);

  const readingQuestions = reading || [];

  // LOCAL UI ONLY — NO SAVING
  const [localAnswers, setLocalAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContext, setModalContext] = useState(null);

  /* ============================================================
        LOAD QUESTIONS
     ============================================================ */
  useEffect(() => {
    dispatch(fetchReading(numericTestId));
  }, [dispatch, numericTestId]);

  /* ============================================================
        SYNC ANSWERS FROM REDUX
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

  const formatTime = (sec = 0) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  /* ============================================================
        PROGRESS
     ============================================================ */
  const total = readingQuestions.length;
  const answered = useMemo(
    () =>
      readingQuestions.filter((q) => localAnswers[q.id] !== undefined).length,
    [readingQuestions, localAnswers]
  );

  const progress = total ? Math.round((answered / total) * 100) : 0;
  const hasUnanswered = answered < total;

  const currentQ = readingQuestions[currentIndex] || null;

  const uiQuestion =
    currentQ && {
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
        SELECT ANSWER (UI + BE)
     ============================================================ */
  const handleSelectAnswer = (qid, optionId) => {
    setLocalAnswers((prev) => ({ ...prev, [qid]: optionId }));

    dispatch(
      submitAnswer({
        testId: numericTestId,
        questionId: qid,
        selectedOptionId: optionId,
      })
    );
  };

  /* ============================================================
        NEXT/PREV
     ============================================================ */
  const findNextUnanswered = () => {
    for (let i = currentIndex + 1; i < total; i++) {
      if (!localAnswers[readingQuestions[i].id]) return i;
    }
    for (let i = 0; i < currentIndex; i++) {
      if (!localAnswers[readingQuestions[i].id]) return i;
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
        SUBMIT / MOVE TO LISTENING
     ============================================================ */
  const handleModalConfirm = () => {
    if (modalContext === "submit") {
      navigate(`/jlpt/test/${numericTestId}/result`);
    } else {
      navigate(`/jlpt/test/${numericTestId}/listening`);
    }
  };

  const activeCount = activeUsers?.[numericTestId] ?? 0;

  return (
    <>
      {(loadingQuestions || readingQuestions.length === 0) && (
        <LoadingOverlay />
      )}

      <div className={styles.wrapper}>
        <header className={styles.headerBar}>
          <h1 className={styles.testTitle}>JLPT - Đọc hiểu</h1>

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

        <main className={styles.main}>
          <aside className={styles.sidebarCard}>
            <SidebarQuestionList
              questions={readingQuestions.map((q, i) => ({
                question_id: q.id,
                order_index: i + 1,
              }))}
              currentIndex={currentIndex}
              answersByQuestion={localAnswers}
              onJumpTo={setCurrentIndex}
            />
          </aside>

          <section className={styles.questionArea}>
            <div className={styles.questionCardWrap}>
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

              {uiQuestion && (
                <QuestionCard
                  question={uiQuestion}
                  selectedOptionId={localAnswers[uiQuestion.question_id]}
                  onSelectOption={(qid, opt) => handleSelectAnswer(qid, opt)}
                  onPrev={prev}
                  onNext={next}
                />
              )}
            </div>

            <div className={styles.nextSection}>
              <button
                className={styles.nextSectionBtn}
                onClick={() => {
                  setModalContext("next");
                  setModalOpen(true);
                }}
              >
                Tiếp tục phần Nghe hiểu
              </button>
            </div>
          </section>
        </main>

        <JLPTModal
          open={modalOpen}
          title={
            modalContext === "submit"
              ? "Nộp bài phần Đọc hiểu?"
              : "Chuyển sang phần Nghe hiểu?"
          }
          message={
            hasUnanswered
              ? `Bạn mới trả lời ${answered}/${total} câu. Các câu chưa làm sẽ tính sai.`
              : "Bạn đã hoàn thành phần này."
          }
          confirmLabel={
            modalContext === "submit" ? "Nộp bài" : "Sang phần Nghe hiểu"
          }
          cancelLabel="Ở lại làm tiếp"
          onConfirm={handleModalConfirm}
          onCancel={() => setModalOpen(false)}
        />
      </div>
    </>
  );
};

export default Reading;
