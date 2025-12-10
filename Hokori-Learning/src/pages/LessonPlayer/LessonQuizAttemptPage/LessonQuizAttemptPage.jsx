// src/pages/LessonPlayer/LessonQuizAttemptPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../configs/axios.js";
import styles from "./LessonPlayerPage.module.scss";

export default function LessonQuizAttemptPage() {
  const { courseId, slug, lessonId, attemptId } = useParams();
  const navigate = useNavigate();

  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [question, setQuestion] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [error, setError] = useState(null);

  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  const [isFinished, setIsFinished] = useState(false);
  const [summary, setSummary] = useState(null); // tổng điểm, số câu
  const [detail, setDetail] = useState(null); // chi tiết đúng/sai

  // ===== LẤY CÂU HỎI TIẾP THEO =====
  const fetchNextQuestion = async () => {
    try {
      setLoadingQuestion(true);
      setError(null);
      setSelectedOptionId(null);

      const res = await api.get(
        `/learner/lessons/${lessonId}/quiz/attempts/${attemptId}/next`
      );

      console.log("next question res", res.data);

      const wrapper = res.data || {};
      const data = wrapper.data; // object câu hỏi thật sự nằm ở đây

      // nếu null → hết câu hỏi
      if (!data) {
        setQuestion(null);
      } else {
        setQuestion(data); // { questionId, content, options, ... }
      }
    } catch (err) {
      console.error("Lỗi load câu hỏi:", err);
      setError("Không thể tải câu hỏi tiếp theo");
    } finally {
      setLoadingQuestion(false);
    }
  };

  // ===== LẤY THÔNG TIN ATTEMPT BAN ĐẦU (quyết định resume hay xem kết quả) =====
  useEffect(() => {
    const initAttempt = async () => {
      try {
        setLoadingQuestion(true);
        setError(null);

        const res = await api.get(
          `/learner/lessons/${lessonId}/quiz/attempts/${attemptId}`
        );
        console.log("attempt detail res", res.data);

        const wrapper = res.data || {};
        const data = wrapper.data || wrapper;

        // object attempt thật sự (BE đang trả { data: { attempt: {...} } })
        const attempt = data.attempt || data;

        const status = (attempt.status || "").toUpperCase();

        if (status === "IN_PROGRESS") {
          // Attempt đang làm dở -> chỉ cần load câu tiếp theo
          setIsFinished(false);
          setSummary(null);
          setDetail(null);
          await fetchNextQuestion();
        } else {
          // Attempt đã nộp -> không gọi /next, hiển thị kết quả luôn
          setIsFinished(true);

          setSummary({
            score: attempt.scorePercent ?? attempt.score ?? null,
            totalQuestions:
              attempt.totalQuestions ??
              (attempt.items ? attempt.items.length : null),
            correctCount: attempt.correctCount ?? null,
          });

          setDetail({
            questions: attempt.items || [],
          });
        }
      } catch (err) {
        console.error("Lỗi tải thông tin attempt:", err);
        setError("Không thể tải thông tin bài làm.");
      } finally {
        setLoadingQuestion(false);
      }
    };

    initAttempt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, attemptId]);

  // ===== CHỌN ĐÁP ÁN & LƯU =====
  const handleSubmitAnswer = async () => {
    if (!question || !selectedOptionId) return;

    try {
      setSubmittingAnswer(true);
      setError(null);

      const qId = question.questionId || question.id;

      // SINGLE_CHOICE: BE nhận optionId
      await api.post(
        `/learner/lessons/${lessonId}/quiz/attempts/${attemptId}/questions/${qId}/answer`,
        { optionId: selectedOptionId }
      );

      await fetchNextQuestion();
    } catch (err) {
      console.error("Lỗi lưu câu trả lời:", err);
      setError("Không thể lưu câu trả lời. Vui lòng thử lại.");
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // ===== NỘP BÀI =====
  const handleSubmitQuiz = async () => {
    try {
      setSubmittingQuiz(true);
      setError(null);

      const submitRes = await api.post(
        `/learner/lessons/${lessonId}/quiz/attempts/${attemptId}/submit`
      );
      console.log("submit res", submitRes.data);

      const submitWrapper = submitRes.data || {};
      const submitData = submitWrapper.data || submitWrapper;
      const submitAttempt = submitData.attempt || submitData;

      setSummary({
        score: submitAttempt.scorePercent ?? submitAttempt.score ?? null,
        totalQuestions:
          submitAttempt.totalQuestions ??
          (submitAttempt.items ? submitAttempt.items.length : null),
        correctCount: submitAttempt.correctCount ?? null,
      });

      const detailRes = await api.get(
        `/learner/lessons/${lessonId}/quiz/attempts/${attemptId}`
      );
      console.log("detail res after submit", detailRes.data);
      const detailWrapper = detailRes.data || {};
      const detailData = detailWrapper.data || detailWrapper;
      const detailAttempt = detailData.attempt || detailData;

      setDetail({
        questions: detailAttempt.items || [],
      });

      setIsFinished(true);
    } catch (err) {
      console.error("Lỗi nộp bài:", err);
      setError("Không thể nộp bài. Vui lòng thử lại.");
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleBack = () => {
    navigate(`/learn/${courseId}/${slug}/lesson/${lessonId}/content/${0}`, {
      replace: false,
    });
  };

  /* =====================
     RENDER
  ====================== */

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
                ← Quay lại khóa học
              </button>
              <h2>Làm quiz</h2>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            {/* Đã nộp bài → hiển thị kết quả */}
            {isFinished ? (
              <div className={styles.quizResult}>
                <h3>Kết quả bài làm</h3>

                {summary && (
                  <div className={styles.quizMeta}>
                    {summary.score != null &&
                      summary.totalQuestions != null && (
                        <p>
                          Điểm: {summary.score}/{summary.totalQuestions}
                        </p>
                      )}
                    {summary.correctCount != null &&
                      summary.totalQuestions != null && (
                        <p>
                          Số câu đúng: {summary.correctCount}/
                          {summary.totalQuestions}
                        </p>
                      )}
                  </div>
                )}

                {detail?.questions && detail.questions.length > 0 && (
                  <div className={styles.quizDetail}>
                    <h4 className={styles.quizDetailTitle}>Chi tiết câu hỏi</h4>
                    <ol className={styles.quizQuestionList}>
                      {detail.questions.map((q, idx) => {
                        const options = q.options || [];
                        const userOption = options.find(
                          (op) =>
                            op.optionId === q.chosenOptionId ||
                            op.id === q.chosenOptionId
                        );
                        const correctOption = options.find(
                          (op) =>
                            op.optionId === q.correctOptionId ||
                            op.id === q.correctOptionId
                        );

                        const userId =
                          (userOption &&
                            (userOption.optionId ?? userOption.id)) ??
                          null;
                        const correctId =
                          (correctOption &&
                            (correctOption.optionId ?? correctOption.id)) ??
                          null;

                        const isCorrect =
                          userId != null &&
                          correctId != null &&
                          userId === correctId;

                        return (
                          <li
                            key={q.questionId || q.id}
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
                              {q.content || q.text}
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
                                  {userOption?.content ||
                                    userOption?.text ||
                                    "Không chọn"}
                                </div>
                              </div>

                              <div className={styles.quizAnswerBlock}>
                                <div className={styles.quizAnswerLabel}>
                                  Đáp án đúng
                                </div>
                                <div
                                  className={`${styles.quizAnswerValue} ${styles.quizAnswerCorrect}`}
                                >
                                  {correctOption?.content ||
                                    correctOption?.text ||
                                    "Không có dữ liệu"}
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                )}

                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={handleBack}
                >
                  Quay lại khóa học
                </button>
              </div>
            ) : (
              <>
                {/* Chưa nộp bài */}
                {loadingQuestion ? (
                  <p>Đang tải câu hỏi...</p>
                ) : !question ? (
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
