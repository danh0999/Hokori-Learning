// src/pages/LessonPlayer/LessonQuizAttemptPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import api from "../../../configs/axios.js";
import styles from "./LessonPlayerPage.module.scss";

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

  const quizIdFromState = location.state?.quizId; // optional

  const unwrap = (res) => {
    const payload = res?.data;
    if (!payload) return null;

    // nếu response có field "data" thì lấy đúng field đó (kể cả null)
    if (Object.prototype.hasOwnProperty.call(payload, "data")) {
      return payload.data;
    }

    // fallback cho response không bọc
    return payload;
  };

  const fetchNextQuestion = async () => {
    try {
      setLoadingQuestion(true);
      setError(null);
      setSelectedOptionId(null);

      const res = await api.get(
        `/learner/sections/${sectionId}/quiz/attempts/${attemptId}/next`
      );

      const q = unwrap(res); // ✅ q có thể là object câu hỏi hoặc null

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

        const res = await api.get(
          `/learner/sections/${sectionId}/quiz/attempts/${attemptId}`
        );

        const data = unwrap(res);

        const attempt = data?.attempt ?? data;

        const status = String(attempt?.status || "").toUpperCase();
        if (status === "IN_PROGRESS") {
          setIsFinished(false);
          setSummary(null);
          setDetail(null);
          await fetchNextQuestion();
        } else {
          setIsFinished(true);
          setSummary({
            scorePercent: attempt?.scorePercent ?? null,
            passScorePercent: attempt?.passScorePercent ?? null,
            totalQuestions: attempt?.totalQuestions ?? null,
            correctCount: attempt?.correctCount ?? null,
          });
          setDetail({ questions: attempt?.items || [] });
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

      setSummary({
        scorePercent: submitAttempt?.scorePercent ?? null,
        passScorePercent: submitAttempt?.passScorePercent ?? null,
        totalQuestions: submitAttempt?.totalQuestions ?? null,
        correctCount: submitAttempt?.correctCount ?? null,
      });

      const detailRes = await api.get(
        `/learner/sections/${sectionId}/quiz/attempts/${attemptId}`
      );
      const detailData = unwrap(detailRes);
      const detailAttempt = detailData?.attempt ?? detailData;

      setDetail({ questions: detailAttempt?.items || [] });
      setIsFinished(true);
    } catch (err) {
      console.error(err);
      setError("Không thể nộp bài. Vui lòng thử lại.");
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleBack = () => {
    // quay về lesson (giữ behavior đơn giản)
    navigate(`/learn/${courseId}/${slug}/lesson/${lessonId}/content/0`);
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
              <h2>Làm quiz{quizIdFromState ? ` (#${quizIdFromState})` : ""}</h2>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            {isFinished ? (
              <div className={styles.quizResult}>
                <h3>Kết quả bài làm</h3>

                {summary && (
                  <div className={styles.quizMeta}>
                    {summary.scorePercent != null && (
                      <p>
                        Điểm: {summary.scorePercent}%
                        {summary.passScorePercent != null &&
                          ` (điểm đạt: ${summary.passScorePercent}%)`}
                      </p>
                    )}
                    {summary.correctCount != null &&
                      summary.totalQuestions != null && (
                        <p>
                          Số câu đúng: {summary.correctCount}/
                          {summary.totalQuestions}
                        </p>
                      )}
                    {summary.scorePercent != null && (
                      <p>
                        Trạng thái:{" "}
                        {summary.passScorePercent == null ||
                        summary.scorePercent >= summary.passScorePercent
                          ? "Đạt yêu cầu"
                          : "Chưa đạt yêu cầu"}
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={handleBack}
                >
                  Quay lại
                </button>
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
