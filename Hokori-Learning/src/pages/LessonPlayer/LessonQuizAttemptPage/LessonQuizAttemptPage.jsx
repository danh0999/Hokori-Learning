// src/pages/LessonPlayer/LessonQuizAttemptPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import api from "../../../configs/axios.js";
import styles from "./LessonQuizAttemptPage.module.scss";

export default function LessonQuizAttemptPage() {
  const { courseId, slug, lessonId, sectionId, attemptId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [question, setQuestion] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [error, setError] = useState(null);

  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  const [isFinished, setIsFinished] = useState(false);
  const [summary, setSummary] = useState(null);
  const [detail, setDetail] = useState(null);
  const [noMoreQuestions, setNoMoreQuestions] = useState(false);

  // timer
  const [timeLimitSec, setTimeLimitSec] = useState(null);
  const [startedAt, setStartedAt] = useState(null);
  const [submittedAt, setSubmittedAt] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const autoSubmitOnceRef = useRef(false);

  const quizIdFromState = location.state?.quizId;
  const returnContentId = location.state?.returnContentId;
  const chapterOrderIndex = location.state?.chapterOrderIndex ?? 1;

  const unwrap = (res) => {
    const payload = res?.data;
    if (!payload) return null;
    if (Object.prototype.hasOwnProperty.call(payload, "data"))
      return payload.data;
    return payload;
  };

  const formatClock = (totalSec) => {
    const s = Math.max(0, Math.floor(Number(totalSec) || 0));
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const remainingSec = useMemo(() => {
    if (!timeLimitSec || !startedAt) return null;
    const startMs = new Date(startedAt).getTime();
    if (!Number.isFinite(startMs)) return null;
    const endMs = startMs + Number(timeLimitSec) * 1000;
    const remain = Math.ceil((endMs - nowTick) / 1000);
    return Math.max(0, remain);
  }, [timeLimitSec, startedAt, nowTick]);

  const durationSec = useMemo(() => {
    if (!startedAt) return null;
    const s = new Date(startedAt).getTime();
    if (!Number.isFinite(s)) return null;
    const e = submittedAt ? new Date(submittedAt).getTime() : Date.now();
    if (!Number.isFinite(e)) return null;
    return Math.max(0, Math.floor((e - s) / 1000));
  }, [startedAt, submittedAt]);

  const fetchNextQuestion = async () => {
    try {
      setLoadingQuestion(true);
      setError(null);
      setSelectedOptionId(null);

      const res = await api.get(
        `/learner/sections/${sectionId}/quiz/attempts/${attemptId}/next`
      );

      const q = unwrap(res);

      if (q == null) {
        setQuestion(null);
        setNoMoreQuestions(true);
        return false;
      }

      setNoMoreQuestions(false);
      setQuestion(q);
      return true;
    } catch (err) {
      console.error(err);
      setError("Không thể tải câu hỏi tiếp theo");
      return false;
    } finally {
      setLoadingQuestion(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoadingQuestion(true);
        setError(null);

        const [attemptRes, quizInfoRes] = await Promise.all([
          api.get(`/learner/sections/${sectionId}/quiz/attempts/${attemptId}`),
          api.get(`/learner/sections/${sectionId}/quiz/info`).catch(() => null),
        ]);

        const data = unwrap(attemptRes);
        const attempt = data?.attempt ?? data;

        const quizInfo = quizInfoRes ? unwrap(quizInfoRes) : null;
        setTimeLimitSec(quizInfo?.timeLimitSec ?? null);

        setStartedAt(attempt?.startedAt ?? null);
        setSubmittedAt(attempt?.submittedAt ?? null);

        const status = String(attempt?.status || "").toUpperCase();
        if (status === "IN_PROGRESS") {
          setIsFinished(false);
          setSummary(null);
          setDetail(null);
          autoSubmitOnceRef.current = false;
          await fetchNextQuestion();
        } else {
          setIsFinished(true);
          setSummary({
            scorePercent: attempt?.scorePercent ?? null,
            passScorePercent: attempt?.passScorePercent ?? null,
            totalQuestions: attempt?.totalQuestions ?? null,
            correctCount: attempt?.correctCount ?? null,
            passed: attempt?.passed ?? null,
          });
          setDetail({ questions: data?.items || attempt?.items || [] });
        }
      } catch (err) {
        console.error(err);
        setError("Không thể tải thông tin bài làm.");
      } finally {
        setLoadingQuestion(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId, attemptId]);

  // tick mỗi 1s để update timer
  useEffect(() => {
    if (isFinished) return;
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, [isFinished]);

  // auto submit khi hết giờ (UI level)
  useEffect(() => {
    if (isFinished) return;
    if (remainingSec == null) return;
    if (remainingSec > 0) return;
    if (autoSubmitOnceRef.current) return;
    autoSubmitOnceRef.current = true;
    handleSubmitQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSec, isFinished]);

  const handleSubmitAnswer = async () => {
    if (!question || !selectedOptionId) return;

    try {
      setSubmittingAnswer(true);
      setError(null);

      const qId = question.questionId || question.id;

      await api.post(
        `/learner/sections/${sectionId}/quiz/attempts/${attemptId}/questions/${qId}/answer`,
        { optionId: selectedOptionId }
      );

      await fetchNextQuestion();
    } catch (err) {
      console.error(err);
      setError("Không thể lưu câu trả lời. Vui lòng thử lại.");
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleSubmitQuiz = async () => {
    try {
      setSubmittingQuiz(true);
      setError(null);

      const submitRes = await api.post(
        `/learner/sections/${sectionId}/quiz/attempts/${attemptId}/submit`
      );

      const submitData = unwrap(submitRes);
      const submitAttempt = submitData?.attempt ?? submitData;

      setSubmittedAt(submitAttempt?.submittedAt ?? new Date().toISOString());

      setSummary({
        scorePercent: submitAttempt?.scorePercent ?? null,
        passScorePercent: submitAttempt?.passScorePercent ?? null,
        totalQuestions: submitAttempt?.totalQuestions ?? null,
        correctCount: submitAttempt?.correctCount ?? null,
        passed: submitAttempt?.passed ?? null,
      });

      const detailRes = await api.get(
        `/learner/sections/${sectionId}/quiz/attempts/${attemptId}`
      );
      const detailData = unwrap(detailRes);
      const detailAttempt = detailData?.attempt ?? detailData;

      setDetail({ questions: detailData?.items || detailAttempt?.items || [] });
      setIsFinished(true);
    } catch (err) {
      console.error(err);
      setError("Không thể nộp bài. Vui lòng thử lại.");
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleBack = () => {
    if (returnContentId) {
      navigate(
        `/learn/${courseId}/${slug}/lesson/${lessonId}/content/${returnContentId}`,
        { state: { chapterOrderIndex, justFinishedQuiz: true } }
      );
      return;
    }
    navigate(`/learn/${courseId}/${slug}/home/chapter/${chapterOrderIndex}`);
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <section className={styles.mainLayout}>
          <section className={styles.playerPanel}>
            <div className={styles.quizPlayHeader}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={handleBack}
              >
                ← Quay lại
              </button>

              <div className={styles.quizPlayHeaderMain}>
                <h2>
                  Làm quiz{quizIdFromState ? ` (#${quizIdFromState})` : ""}
                </h2>

                <div className={styles.quizPlaySubRow}>
                  {timeLimitSec != null && (
                    <span className={styles.timeChip}>
                      Thời gian: {formatClock(timeLimitSec)}
                    </span>
                  )}

                  {!isFinished && remainingSec != null && (
                    <span
                      className={`${styles.timeChip} ${
                        remainingSec <= 30 ? styles.timeChipDanger : ""
                      }`}
                    >
                      Còn lại: {formatClock(remainingSec)}
                    </span>
                  )}

                  {isFinished && durationSec != null && (
                    <span className={styles.timeChip}>
                      Thời gian làm: {formatClock(durationSec)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            {isFinished ? (
              <div className={styles.resultCard}>
                <div className={styles.resultHeader}>
                  <h3>Kết quả bài làm</h3>
                  {summary?.passed != null && (
                    <span
                      className={`${styles.badge} ${
                        summary.passed
                          ? styles.badgeSuccess
                          : styles.badgeDanger
                      }`}
                    >
                      {summary.passed ? "PASSED" : "FAILED"}
                    </span>
                  )}
                </div>

                {summary && (
                  <div className={styles.resultGrid}>
                    <div className={styles.metaBox}>
                      <div className={styles.metaLabel}>Điểm</div>
                      <div className={styles.metaValue}>
                        {summary.scorePercent != null
                          ? `${summary.scorePercent}%`
                          : "—"}
                      </div>
                    </div>

                    <div className={styles.metaBox}>
                      <div className={styles.metaLabel}>Điểm đạt</div>
                      <div className={styles.metaValue}>
                        {summary.passScorePercent != null
                          ? `${summary.passScorePercent}%`
                          : "—"}
                      </div>
                    </div>

                    <div className={styles.metaBox}>
                      <div className={styles.metaLabel}>Số câu đúng</div>
                      <div className={styles.metaValue}>
                        {summary.correctCount != null &&
                        summary.totalQuestions != null
                          ? `${summary.correctCount}/${summary.totalQuestions}`
                          : "—"}
                      </div>
                    </div>

                    <div className={styles.metaBox}>
                      <div className={styles.metaLabel}>Trạng thái</div>
                      <div className={styles.metaValue}>
                        {summary.passed == null
                          ? "—"
                          : summary.passed
                          ? "Đạt yêu cầu"
                          : "Chưa đạt"}
                      </div>
                    </div>
                  </div>
                )}

                {/* {!!detail?.questions?.length && (
                  <div className={styles.quizDetail}>
                    <h4 className={styles.quizDetailTitle}>
                      Chi tiết câu trả lời
                    </h4>

                    <ul className={styles.quizQuestionList}>
                      {detail.questions.map((it, idx) => {
                        const isCorrect = it?.isCorrect === true;
                        const chosen = it?.chosenOptionId ?? it?.chosenOption;
                        const correct =
                          it?.correctOptionId ?? it?.correctOption;

                        return (
                          <li
                            key={it?.questionId ?? idx}
                            className={styles.quizQuestionRow}
                          >
                            <div className={styles.quizQuestionHeader}>
                              <span className={styles.quizQuestionIndex}>
                                Câu {idx + 1}
                              </span>
                              <span
                                className={`${styles.quizQuestionResultTag} ${
                                  isCorrect
                                    ? styles.quizQuestionResultCorrect
                                    : styles.quizQuestionResultWrong
                                }`}
                              >
                                {isCorrect ? "Đúng" : "Sai"}
                              </span>
                            </div>

                            <p className={styles.quizQuestionText}>
                              {it?.content || "—"}
                            </p>

                            <div className={styles.quizAnswerRow}>
                              <div className={styles.quizAnswerBlock}>
                                <div className={styles.quizAnswerLabel}>
                                  Bạn chọn
                                </div>
                                <div
                                  className={`${styles.quizAnswerValue} ${
                                    isCorrect
                                      ? styles.quizAnswerCorrect
                                      : styles.quizAnswerWrong
                                  }`}
                                >
                                  {chosen != null ? `#${chosen}` : "—"}
                                </div>
                              </div>

                              <div className={styles.quizAnswerBlock}>
                                <div className={styles.quizAnswerLabel}>
                                  Đáp án đúng
                                </div>
                                <div
                                  className={`${styles.quizAnswerValue} ${styles.quizAnswerCorrect}`}
                                >
                                  {correct != null ? `#${correct}` : "—"}
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )} */}
              </div>
            ) : (
              <>
                {loadingQuestion ? (
                  <p>Đang tải câu hỏi...</p>
                ) : noMoreQuestions || !question ? (
                  <div className={styles.quizNoMoreQuestion}>
                    <p>Bạn đã trả lời tất cả câu hỏi.</p>
                    <button
                      type="button"
                      className={styles.primaryBtn}
                      disabled={submittingQuiz}
                      onClick={handleSubmitQuiz}
                    >
                      {submittingQuiz
                        ? "Đang nộp bài..."
                        : "Nộp bài và xem kết quả"}
                    </button>
                  </div>
                ) : (
                  <div className={styles.quizQuestionBlock}>
                    <h3>{question.title || "Câu hỏi"}</h3>
                    <p className={styles.quizQuestionText}>
                      {question.content || question.text}
                    </p>

                    <div className={styles.quizOptions}>
                      {(question.options || []).map((op) => {
                        const opId = op.optionId || op.id;
                        return (
                          <label key={opId} className={styles.quizOptionItem}>
                            <input
                              type="radio"
                              name="quiz-option"
                              value={opId}
                              checked={selectedOptionId === opId}
                              onChange={() => setSelectedOptionId(opId)}
                            />
                            <span>{op.content || op.text}</span>
                          </label>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      className={styles.primaryBtn}
                      disabled={!selectedOptionId || submittingAnswer}
                      onClick={handleSubmitAnswer}
                    >
                      {submittingAnswer
                        ? "Đang lưu..."
                        : "Lưu và sang câu tiếp"}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
