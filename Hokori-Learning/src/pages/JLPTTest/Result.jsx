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
  let eventId = params.get("eventId");

  // ==========================
  // CLEAN eventId để tránh lỗi "null"
  // ==========================
  if (!eventId || eventId === "null" || eventId === "undefined") {
    eventId = null;
  }

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { result, loadingResult, resultError } = useSelector(
    (state) => state.jlptLearner
  );

  useEffect(() => {
    if (numericTestId) {
      dispatch(fetchMyJlptResult(numericTestId));
    }
  }, [dispatch, numericTestId]);

  // ===== ERROR STATE =====
  if (resultError) {
    return (
      <div className={styles.resultWrapper}>
        <div className={styles.resultCard}>
          <h2>Lỗi tải kết quả</h2>
          <p>Không thể tải kết quả kỳ thi. Vui lòng thử lại sau.</p>

          {/* Fallback nếu eventId không hợp lệ */}
          <button
            className={styles.backBtn}
            onClick={() => {
              if (eventId) navigate(`/jlpt/events/${eventId}`);
              else navigate("/jlpt");
            }}
          >
            Quay về danh sách đề thi
          </button>
        </div>
      </div>
    );
  }

  // ===== LOADING =====
  if (loadingResult || !result) {
    return (
      <div className={styles.resultWrapper}>
        <div className={styles.resultCard}>
          <p>Đang tải kết quả bài thi...</p>
        </div>
      </div>
    );
  }

  // ===== SAFE ACCESS ====
  const g = result.grammarVocab || {};
  const r = result.reading || {};
  const l = result.listening || {};

  const totalQuestions =
    (g.totalQuestions ?? 0) + (r.totalQuestions ?? 0) + (l.totalQuestions ?? 0);

  const correctCount =
    (g.correctCount ?? 0) + (r.correctCount ?? 0) + (l.correctCount ?? 0);

  const totalScore = result.score ?? 0;
  const percent = (totalScore / 180) * 100;

  const passScore = result.passScore ?? 0;
  const passed = Boolean(result.passed);

  return (
    <div className={styles.resultWrapper}>
      <div className={styles.resultCard}>
        <h1 className={styles.title}>Kết quả bài thi JLPT</h1>

        <p className={styles.subtitle}>Dưới đây là kết quả tổng hợp của bạn.</p>

        {/* ===== OVERALL SCORE BOX ===== */}
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
              Bạn đạt <strong>{totalScore}</strong> / 180 điểm.
            </p>

            <p>
              Tổng số câu hỏi: <strong>{totalQuestions}</strong> – Số câu đúng:{" "}
              <strong>{correctCount}</strong>.
            </p>

            {/* PASS / FAIL */}
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

        {/* ===== BREAKDOWN 3 PARTS ===== */}
        <div className={styles.breakdownBox}>
          <h2>Chi tiết từng phần</h2>

          <div className={styles.breakdownGrid}>
            <div className={styles.breakdownItem}>
              <h3>Từ vựng & Ngữ pháp</h3>
              <p>
                {g.correctCount ?? 0} / {g.totalQuestions ?? 0} câu đúng
              </p>
              <p>
                Điểm: <strong>{g.score ?? 0}</strong> / {g.maxScore ?? 60}
              </p>
            </div>

            <div className={styles.breakdownItem}>
              <h3>Đọc hiểu</h3>
              <p>
                {r.correctCount ?? 0} / {r.totalQuestions ?? 0} câu đúng
              </p>
              <p>
                Điểm: <strong>{r.score ?? 0}</strong> / {r.maxScore ?? 60}
              </p>
            </div>

            <div className={styles.breakdownItem}>
              <h3>Nghe hiểu</h3>
              <p>
                {l.correctCount ?? 0} / {l.totalQuestions ?? 0} câu đúng
              </p>
              <p>
                Điểm: <strong>{l.score ?? 0}</strong> / {l.maxScore ?? 60}
              </p>
            </div>
          </div>
        </div>

        {/* ===== ACTION BUTTONS ===== */}
        <div className={styles.actions}>
          <button
            className={styles.retryBtn}
            onClick={() => navigate(`/jlpt/test/${numericTestId}/review`)}
          >
            Xem kết quả chi tiết
          </button>

          <button
            className={styles.backBtn}
            onClick={() => {
              if (eventId) navigate(`/jlpt/events/${eventId}`);
              else navigate("/jlpt");
            }}
          >
            Quay về sự kiện
          </button>
        </div>
      </div>
    </div>
  );
};

export default Result;
