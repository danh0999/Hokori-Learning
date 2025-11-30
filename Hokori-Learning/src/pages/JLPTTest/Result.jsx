// src/pages/JLPTTest/Result.jsx
import React, { useEffect } from "react";
import styles from "./Result.module.scss";
import {
  CircularProgressbar,
  buildStyles,
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { fetchMyJlptResult } from "../../redux/features/jlptLearnerSlice";

const Result = () => {
  const { testId } = useParams();
  const numericTestId = Number(testId);

  const [params] = useSearchParams();
  const eventId = params.get("eventId");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { result, loadingResult } = useSelector(
    (state) => state.jlptLearner
  );

  // CALL API
  useEffect(() => {
    if (!numericTestId) return;
    dispatch(fetchMyJlptResult(numericTestId));
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

  const percent = Number.isFinite(result.score)
    ? Number(result.score)
    : 0;

  return (
    <div className={styles.resultWrapper}>
      <div className={styles.resultCard}>
        <h1 className={styles.title}>Kết quả bài thi JLPT</h1>
        <p className={styles.subtitle}>
          Cảm ơn bạn đã hoàn thành bài thi. Dưới đây là kết quả của bạn.
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
          </div>
        </div>

        <div className={styles.actions}>

          {/* ❗ FIX LẠI ĐÚNG ROUTE */}
          <button
            className={styles.retryBtn}
            onClick={() =>
              navigate(`/jlpt/test/${numericTestId}/grammar${eventId ? `?eventId=${eventId}` : ""}`)
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
