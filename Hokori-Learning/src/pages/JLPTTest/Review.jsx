import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Tabs } from "antd";

import styles from "./Review.module.scss";
import { fetchAttemptDetail } from "../../redux/features/jlptLearnerSlice";

// Helper validateAttemptId giống BE guide
function validateAttemptId(attemptId) {
  if (attemptId === null || attemptId === undefined) return null;
  if (attemptId === "null" || attemptId === "undefined") return null;

  const numId = Number(attemptId);
  if (isNaN(numId) || numId <= 0) return null;

  return numId;
}

const Review = () => {
  const { testId } = useParams();
  const numericTestId = Number(testId);
  const [params] = useSearchParams();
  const rawAttemptId = params.get("attemptId");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { attemptDetail, loadingAttemptDetail, attemptDetailError } =
    useSelector((state) => state.jlptLearner);

  const validAttemptId = validateAttemptId(rawAttemptId);

  useEffect(() => {
    if (!numericTestId || !validAttemptId) return;

    dispatch(
      fetchAttemptDetail({
        testId: numericTestId,
        attemptId: validAttemptId,
      })
    );
  }, [dispatch, numericTestId, validAttemptId]);

  if (!validAttemptId) {
    return (
      <div className={styles.error}>
        ID attempt không hợp lệ. Vui lòng mở lại từ trang Kết quả mới nhất.
      </div>
    );
  }

  if (loadingAttemptDetail || !attemptDetail)
    return <div className={styles.loading}>Đang tải kết quả...</div>;

  if (attemptDetailError)
    return <div className={styles.error}>Không thể tải dữ liệu.</div>;

  // --- GROUP QUESTIONS ---
  const allQuestionsRaw = attemptDetail.questions || [];

  // Sort cho đẹp
  const allQuestions = [...allQuestionsRaw].sort(
    (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
  );

  // BE có thể dùng questionType hoặc type → xử lý cả 2
  const getType = (q) => (q.questionType || q.type || "").toUpperCase();

  const grammarVocabQs = allQuestions.filter((q) =>
    ["GRAMMAR", "VOCAB", "GRAMMAR_VOCAB"].includes(getType(q))
  );

  const readingQs = allQuestions.filter((q) => getType(q) === "READING");

  const listeningQs = allQuestions.filter((q) => getType(q) === "LISTENING");

  // --- RENDER 1 CÂU HỎI ---
  const renderQuestion = (q) => {
    const noAnswer =
      q.selectedOptionId === null ||
      q.selectedOptionId === undefined ||
      q.selectedOptionId === 0;

    const options = q.allOptions || q.options || [];

    return (
      <div key={q.questionId} className={styles.questionBox}>
        <div className={styles.questionHeader}>
          {/* Nếu không chọn → xem như sai nhưng ghi rõ */}
          <span className={q.isCorrect ? styles.correct : styles.wrong}>
            {q.isCorrect ? "✔ Đúng" : noAnswer ? "✘ Chưa trả lời" : "✘ Sai"}
          </span>

          <p className={styles.questionContent}>{q.questionContent}</p>
        </div>

        {/* KHÔNG HIỆN AUDIO NỮA */}

        {/* Image nếu có thì vẫn show */}
        {q.imagePath && (
          <img
            src={q.imagePath}
            alt={q.imageAltText || ""}
            className={styles.questionImg}
          />
        )}

        {/* Nếu learner không chọn thì báo 1 dòng */}
        {noAnswer && (
          <p className={styles.noAnswerNote}>
            Bạn chưa chọn đáp án cho câu hỏi này.
          </p>
        )}

        <div className={styles.optionsBox}>
          {options.map((op) => {
            const isCorrect = op.optionId === q.correctOptionId;
            const isSelected = op.optionId === q.selectedOptionId;

            return (
              <div
                key={op.optionId}
                className={`${styles.optionItem}
                  ${isCorrect ? styles.optionCorrect : ""}
                  ${isSelected && !isCorrect ? styles.optionWrong : ""}`}
              >
                <p>{op.content}</p>
                {op.imagePath && (
                  <img
                    src={op.imagePath}
                    alt={op.imageAltText || ""}
                    className={styles.optionImg}
                  />
                )}
              </div>
            );
          })}
        </div>

        {q.explanation && (
          <div className={styles.explanationBox}>
            <strong>Giải thích:</strong>
            <p>{q.explanation}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.reviewWrapper}>
      <h1 className={styles.title}>Xem lại bài làm</h1>
      <div className={styles.reviewActions}>
        <button
          className={styles.backResultBtn}
          onClick={() => {
            const params = new URLSearchParams();
            if (validAttemptId) params.set("attemptId", validAttemptId);
            if (params.toString()) {
              navigate(
                `/jlpt/test/${numericTestId}/result?${params.toString()}`
              );
            } else {
              navigate(`/jlpt/test/${numericTestId}/result`);
            }
          }}
        >
          ← Quay lại kết quả
        </button>

        <button className={styles.homeBtn} onClick={() => navigate("/")}>
          Về trang chủ
        </button>
      </div>

      <Tabs
        defaultActiveKey="all"
        className={styles.tabs}
        items={[
          {
            key: "all",
            label: "Tất cả câu hỏi",
            children: allQuestions.map(renderQuestion),
          },
          {
            key: "grammar",
            label: "Ngữ pháp & Từ vựng",
            children: grammarVocabQs.length
              ? grammarVocabQs.map(renderQuestion)
              : "Không có câu hỏi phần này.",
          },
          {
            key: "reading",
            label: "Đọc hiểu",
            children: readingQs.length
              ? readingQs.map(renderQuestion)
              : "Không có câu hỏi phần này.",
          },
          {
            key: "listening",
            label: "Nghe hiểu",
            children: listeningQs.length
              ? listeningQs.map(renderQuestion)
              : "Không có câu hỏi phần này.",
          },
        ]}
      />
    </div>
  );
};

export default Review;
