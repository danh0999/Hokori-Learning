import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../../../configs/axios.js";
import "./QuizTrialPage.scss";

const unwrap = (res) =>
  res?.data && "data" in res.data ? res.data.data : res.data;

const QuizTrialPage = () => {
  const { lessonId, sectionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [loadingQuestion, setLoadingQuestion] = useState(false);

  const [error, setError] = useState(null);
  const [quizSectionId, setQuizSectionId] = useState(sectionId || null);

  const [attemptId, setAttemptId] = useState(null);
  const [attemptInfo, setAttemptInfo] = useState(null);

  // meta các câu hỏi (từ GET attempt detail)
  // { [questionId]: { correctOptionId } }
  const [questionMeta, setQuestionMeta] = useState({});

  // Câu hiện tại (từ /next)
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentAnswer, setCurrentAnswer] = useState(null);

  // Đáp án learner đã chọn
  // answers = { [questionId]: { chosenOptionId, isCorrect } }
  const [answers, setAnswers] = useState({});

  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [finishedAllQuestions, setFinishedAllQuestions] = useState(false);

  const back = () => navigate(-1);

  const totalQuestions =
    attemptInfo?.totalQuestions || Object.keys(questionMeta).length || 0;

  const answeredCount = Object.values(answers).filter(
    (a) => a && a.chosenOptionId != null
  ).length;

  // ============================
  // 0. TÌM QUIZ SECTION NẾU CHƯA CÓ
  // ============================
  useEffect(() => {
    if (quizSectionId || !lessonId) return;

    const findQuizSection = async () => {
      try {
        // Lấy learning tree để tìm quiz section
        // Note: Cần courseId từ route hoặc context
        const courseId = location.pathname.split("/")[2]; // Adjust based on your route structure
        if (courseId) {
          const treeRes = await api.get(
            `/learner/courses/${courseId}/learning-tree`
          );
          const tree = treeRes.data?.data || treeRes.data;
          const lesson = tree?.lessons?.find(
            (l) => l.lessonId === Number(lessonId)
          );
          const quizSection = lesson?.sections?.find(
            (s) => s.studyType === "QUIZ"
          );

          if (quizSection?.id) {
            setQuizSectionId(quizSection.id);
          } else {
            setError("Không tìm thấy quiz section cho lesson này.");
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("Lỗi tìm quiz section:", err);
        setError("Không thể tải thông tin quiz section.");
        setLoading(false);
      }
    };

    findQuizSection();
  }, [lessonId, quizSectionId, location.pathname]);

  // ============================
  // 1. INIT: info + start + detail + câu đầu tiên
  // ============================
  useEffect(() => {
    if (!quizSectionId) return;

    const load = async () => {
      const token =
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken") ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

      if (!token) {
        navigate("/login", {
          state: { redirectTo: location.pathname },
          replace: true,
        });
        return;
      }

      setLoading(true);
      setError(null);

      setAttemptId(null);
      setAttemptInfo(null);
      setQuestionMeta({});
      setCurrentQuestion(null);
      setCurrentAnswer(null);
      setAnswers({});
      setSubmitted(false);
      setScore(null);
      setFinishedAllQuestions(false);

      try {
        // 1) Xem info
        await api.get(`/learner/sections/${quizSectionId}/quiz/info`);

        // 2) Start (hoặc resume) attempt
        const startRes = await api.post(
          `/learner/sections/${quizSectionId}/quiz/attempts/start`,
          { forceNew: false }
        );
        const attempt = unwrap(startRes);
        const newAttemptId = attempt?.id || attempt?.attemptId;
        if (!newAttemptId) {
          throw new Error("Không lấy được attemptId từ start.");
        }
        setAttemptId(newAttemptId);

        // 3) Lấy detail để biết totalQuestions + correctOptionId
        const detailRes = await api.get(
          `/learner/sections/${quizSectionId}/quiz/attempts/${newAttemptId}`
        );
        const detail = unwrap(detailRes);

        const attemptData = detail?.attempt || detail;
        setAttemptInfo(attemptData || null);

        const items =
          detail?.items || detail?.questions || detail?.quizQuestions || [];

        const metaMap = {};
        if (Array.isArray(items)) {
          items.forEach((item) => {
            if (!item) return;
            const qId = item.questionId || item.id;
            if (!qId) return;
            metaMap[qId] = {
              correctOptionId: item.correctOptionId ?? item.correctAnswerId,
            };
          });
        }
        setQuestionMeta(metaMap);

        // 4) Câu đầu tiên bằng /next
        await fetchNextQuestion(newAttemptId, metaMap, {}, false);
      } catch (err) {
        console.error("Quiz trial error:", err);
        setError(
          err?.response?.data?.message ||
            err.message ||
            "Không tải được quiz thử."
        );
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizSectionId, navigate, location.pathname]);

  // ============================
  // 2. GỌI /next
  // ============================
  const fetchNextQuestion = async (
    _attemptId = attemptId,
    //eslint-disable-next-line
    meta = questionMeta,
    currentAnswers = answers,
    ignoreFinished = false
  ) => {
    if (!_attemptId) return;

    const answered = Object.values(currentAnswers).filter(
      (a) => a && a.chosenOptionId != null
    ).length;

    if (!ignoreFinished && totalQuestions && answered >= totalQuestions) {
      setFinishedAllQuestions(true);
      setCurrentQuestion(null);
      setCurrentAnswer(null);
      return;
    }

    setLoadingQuestion(true);
    setError(null);

    if (!quizSectionId) {
      setError("Chưa xác định được quiz section.");
      return;
    }

    try {
      const res = await api.get(
        `/learner/sections/${quizSectionId}/quiz/attempts/${_attemptId}/next`
      );
      const q = unwrap(res);

      if (!q || !q.questionId) {
        // Hết câu
        setFinishedAllQuestions(true);
        setCurrentQuestion(null);
        setCurrentAnswer(null);
        return;
      }

      setCurrentQuestion(q);

      const exist = currentAnswers[q.questionId];
      setCurrentAnswer(exist?.chosenOptionId ?? null);
    } catch (err) {
      console.error("Load next question error:", err);
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Không tải được câu hỏi tiếp theo."
      );
    } finally {
      setLoadingQuestion(false);
    }
  };

  // ============================
  // 3. Chọn option
  // ============================
  const handleSelectOption = (optionId) => {
    if (submitted) return;
    setCurrentAnswer(optionId);
  };

  // ============================
  // 4. Lưu câu hiện tại (answer) + NEXT
  // ============================
  const handleNextQuestion = async () => {
    if (!currentQuestion || currentAnswer == null) return;
    if (!attemptId) return;

    const qId = currentQuestion.questionId || currentQuestion.id;

    // Lấy correctOptionId từ meta để chấm local
    const correctOptionId = questionMeta[qId]?.correctOptionId ?? null;

    const isCorrect =
      correctOptionId != null &&
      String(correctOptionId) === String(currentAnswer);

    const newAnswers = {
      ...answers,
      [qId]: {
        chosenOptionId: currentAnswer,
        isCorrect,
      },
    };

    setAnswers(newAnswers);

    // GỌI API ANSWER
    if (!quizSectionId) {
      console.error("Chưa xác định được quiz section.");
      return;
    }

    try {
      await api.post(
        `/learner/sections/${quizSectionId}/quiz/attempts/${attemptId}/questions/${qId}/answer`,
        {
          optionId: currentAnswer,
        }
      );
    } catch (err) {
      console.error("Save answer error:", err);
      // Không chặn flow, chỉ log lỗi
    }

    const answeredAfter = Object.values(newAnswers).filter(
      (a) => a && a.chosenOptionId != null
    ).length;

    if (totalQuestions && answeredAfter >= totalQuestions) {
      setFinishedAllQuestions(true);
      setCurrentQuestion(null);
      setCurrentAnswer(null);
      return;
    }

    await fetchNextQuestion(attemptId, questionMeta, newAnswers, true);
  };

  // ============================
  // 5. SUBMIT – gọi BE chấm điểm
  // ============================
  const handleSubmitQuiz = async () => {
    if (!attemptId) return;

    setLoadingQuestion(true);
    setError(null);

    if (!quizSectionId) {
      setError("Chưa xác định được quiz section.");
      return;
    }

    try {
      const res = await api.post(
        `/learner/sections/${quizSectionId}/quiz/attempts/${attemptId}/submit`
      );
      const data = unwrap(res);
      const attempt = data?.attempt || data;

      const correct =
        attempt?.correctCount ??
        Object.values(answers).filter((a) => a?.isCorrect).length;

      const total = attempt?.totalQuestions ?? totalQuestions;

      const percent =
        attempt?.scorePercent ??
        (total ? Math.round((correct / total) * 100) : 0);

      setScore({
        correct,
        total,
        percent,
      });
      setAttemptInfo(attempt || null);
      setSubmitted(true);
    } catch (err) {
      console.error("Submit quiz error:", err);
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Nộp bài không thành công."
      );
    } finally {
      setLoadingQuestion(false);
    }
  };

  const handleRetry = async () => {
    if (!quizSectionId) {
      setError("Chưa xác định được quiz section.");
      return;
    }

    try {
      // 1) Gọi START để tạo attempt mới
      const startRes = await api.post(
        `/learner/sections/${quizSectionId}/quiz/attempts/start`,
        { forceNew: true }
      );

      const newAttempt = unwrap(startRes);
      const newAttemptId = newAttempt?.id || newAttempt?.attemptId;

      if (!newAttemptId) {
        throw new Error("Không lấy được attempt mới khi làm lại.");
      }

      // 2) Reset state
      setAttemptId(newAttemptId);
      setAnswers({});
      setSubmitted(false);
      setScore(null);
      setFinishedAllQuestions(false);
      setCurrentQuestion(null);
      setCurrentAnswer(null);

      // 3) Lấy detail để lấy meta (correctOptionId)
      const detailRes = await api.get(
        `/learner/sections/${quizSectionId}/quiz/attempts/${newAttemptId}`
      );
      const detail = unwrap(detailRes);
      const attemptData = detail?.attempt || detail;
      setAttemptInfo(attemptData || null);

      const items =
        detail?.items || detail?.questions || detail?.quizQuestions || [];

      const metaMap = {};
      items.forEach((item) => {
        const qId = item.questionId || item.id;
        if (!qId) return;
        metaMap[qId] = {
          correctOptionId: item.correctOptionId ?? item.correctAnswerId,
        };
      });
      setQuestionMeta(metaMap);

      // 4) Lấy câu đầu tiên của attempt mới
      await fetchNextQuestion(newAttemptId, metaMap, {}, false);
    } catch (err) {
      console.error("Retry (force new attempt) error:", err);
      setError(err?.response?.data?.message || "Không tạo được attempt mới.");
    }
  };

  // ============================
  // RENDER
  // ============================

  if (loading) {
    return (
      <main className="quiz-trial-page">
        <h1>Đang tải quiz thử…</h1>
      </main>
    );
  }

  if (error && !attemptId) {
    return (
      <main className="quiz-trial-page">
        <button className="back-btn" onClick={back}>
          ← Quay lại
        </button>
        <p className="error">{String(error)}</p>
      </main>
    );
  }

  if (!totalQuestions) {
    return (
      <main className="quiz-trial-page">
        <button className="back-btn" onClick={back}>
          ← Quay lại
        </button>
        <p>Quiz chưa được cấu hình.</p>
      </main>
    );
  }

  const currentIndex = (currentQuestion?.orderIndex ?? answeredCount) + 1;

  const options = currentQuestion?.options || [];

  return (
    <main className="quiz-trial-page">
      <button className="back-btn" onClick={back}>
        ← Quay lại
      </button>

      <h1>Quiz thử</h1>

      <div className="quiz-trial-layout">
        {/* LEFT: Câu hỏi hiện tại */}
        <ol className="quiz-list">
          <li className="quiz-question">
            {loadingQuestion && !currentQuestion && !finishedAllQuestions ? (
              <p>Đang tải câu hỏi…</p>
            ) : finishedAllQuestions && !currentQuestion ? (
              <p>Đã làm xong tất cả câu hỏi.</p>
            ) : currentQuestion ? (
              <>
                <p className="q-text">
                  Câu {currentIndex} / {totalQuestions}.{" "}
                  {currentQuestion.content}
                </p>

                <ul className="opt-list">
                  {options.map((opt) => {
                    const optId = opt.optionId || opt.id;
                    const label =
                      opt.content || opt.text || opt.answerText || opt.label;

                    const isSelected = String(currentAnswer) === String(optId);

                    const qId =
                      currentQuestion.questionId || currentQuestion.id;
                    const correctId =
                      questionMeta[qId]?.correctOptionId ?? null;

                    const isCorrect =
                      submitted &&
                      correctId != null &&
                      String(optId) === String(correctId);

                    const isWrongSelected =
                      submitted &&
                      isSelected &&
                      correctId != null &&
                      String(optId) !== String(correctId);

                    return (
                      <li
                        key={optId}
                        className={`opt-item ${isCorrect ? "correct" : ""} ${
                          isWrongSelected ? "wrong" : ""
                        }`}
                      >
                        <label>
                          <input
                            type="radio"
                            disabled={submitted}
                            checked={isSelected}
                            onChange={() => handleSelectOption(optId)}
                          />
                          <span className="opt-label">{label}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <p>Không có câu hỏi nào để hiển thị.</p>
            )}
          </li>
        </ol>

        {/* RIGHT: Sidebar */}
        <aside className="quiz-sidebar">
          <div className="box">
            <p>Tổng số câu: {totalQuestions}</p>
            <p>Đã trả lời: {answeredCount}</p>

            {submitted && score && (
              <div className="score-box">
                <p>
                  Đúng: {score.correct}/{score.total}
                </p>
                <p>
                  Điểm: <strong>{score.percent}%</strong>
                </p>
              </div>
            )}

            {!submitted ? (
              <>
                {!finishedAllQuestions && currentQuestion && (
                  <button
                    className="submit-btn"
                    onClick={handleNextQuestion}
                    disabled={currentAnswer == null || loadingQuestion}
                  >
                    Câu tiếp theo
                  </button>
                )}

                {finishedAllQuestions && (
                  <button
                    className="submit-btn"
                    onClick={handleSubmitQuiz}
                    disabled={answeredCount === 0 || loadingQuestion}
                  >
                    Nộp bài &amp; xem điểm
                  </button>
                )}
              </>
            ) : (
              <>
                <button className="retry-btn" onClick={handleRetry}>
                  Làm lại
                </button>
                <button className="back-btn-small" onClick={back}>
                  Quay lại học thử
                </button>
              </>
            )}

            {error && (
              <p className="error" style={{ marginTop: 8 }}>
                {String(error)}
              </p>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
};

export default QuizTrialPage;
