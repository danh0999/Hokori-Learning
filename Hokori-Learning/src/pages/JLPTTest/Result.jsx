// src/pages/JLPTTest/Result.jsx
import React, { useEffect } from "react";
import styles from "./Result.module.scss";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyJlptResult } from "../../redux/features/jlptLearnerSlice";

const Result = () => {
  const { testId } = useParams();
  const numericTestId = Number(testId);

  const [params] = useSearchParams();
  const eventId = params.get("eventId"); // optional

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { result, loadingResult } = useSelector((state) => state.jlptLearner);

  useEffect(() => {
    if (numericTestId) {
      dispatch(fetchMyJlptResult(numericTestId));
    }
  }, [dispatch, numericTestId]);

  if (loadingResult || !result) {
    return (
      <div className={styles.resultWrapper}>
        <div className={styles.resultCard}>
          <p>Đang tải kết quả bài thi...</p>
        </div>
      </div>
    );
  }

  const totalQuestions = result.totalQuestions ?? 0;
  const correctCount = result.correctCount ?? 0;
  const percent = Number(result.score) || 0;

  const passScore = result.passScore ?? 0;
  const passed = result.passed ?? false;

  return (
    <div className={styles.resultWrapper}>
      <div className={styles.resultCard}>
        <h1 className={styles.title}>Kết quả bài thi JLPT</h1>

        <p className={styles.subtitle}>
          Dưới đây là kết quả tổng hợp của bạn trong toàn bộ bài thi.
        </p>

        <div className={styles.overallBox}>
          <div className={styles.chart}>
            <CircularProgressbar
              value={percent}
              text={`${percent.toFixed(0)}%`}
              styles={buildStyles({
                textColor: "#2563eb",
                pathColor: "#2563eb",
                trailColor: "#e5e7eb",
              })}
            />
          </div>

          <div className={styles.overallInfo}>
            <h2>Tổng điểm quy đổi</h2>
            <p>
              Bạn đạt <strong>{percent.toFixed(0)}</strong> / 100 điểm.
            </p>

            <p>
              Tổng số câu hỏi:{" "}
              <strong>{totalQuestions}</strong> – Số câu đúng:{" "}
              <strong>{correctCount}</strong>.
            </p>

            {/* NEW — Pass / Fail */}
            <p style={{ marginTop: "0.5rem", fontWeight: 600 }}>
              {passed ? (
                <span style={{ color: "#10b981" }}>
                  ✔ Chúc mừng! Bạn đã ĐẬU kỳ thi!
                </span>
              ) : (
                <span style={{ color: "#ef4444" }}>
                  ✘ Bạn chưa đạt yêu cầu. Điểm đạt là {passScore}.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* ACTIONS */}
        <div className={styles.actions}>
          <button
            className={styles.retryBtn}
            onClick={() =>
              navigate(
                `/jlpt/test/${numericTestId}${eventId ? `?eventId=${eventId}` : ""}`
              )
            }
          >
            Làm lại bài thi
          </button>

          <button
            className={styles.backBtn}
            onClick={() => navigate("/jlpt")}
          >
            Quay về danh sách đề thi
          </button>
        </div>
      </div>
    </div>
  );
};

export default Result;
