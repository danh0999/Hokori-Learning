// src/pages/JLPTTest/Result.jsx
import React, { useEffect } from "react";
import styles from "./Result.module.scss";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMyJlptResult,
  clearResult,
} from "../../redux/features/jlptLearnerSlice";

const Result = () => {
  const { testId } = useParams();
  const numericTestId = Number(testId);

  const [params] = useSearchParams();
  let eventId = params.get("eventId");

  if (!eventId || eventId === "null" || eventId === "undefined") {
    eventId = null;
  }

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { result, loadingResult, resultError } = useSelector(
    (state) => state.jlptLearner
  );

  // =======================================
  // FIX LỖI: reset result trước khi fetch mới
  // =======================================
  useEffect(() => {
    dispatch(clearResult()); // <-- xoá kết quả cũ khỏi redux
    dispatch(fetchMyJlptResult(numericTestId)); // fetch kết quả mới nhất
  }, [dispatch, numericTestId]);

  // ===== ERROR STATE =====
  if (resultError) {
    return (
      <div className={styles.errorState}>
        <div className={styles.errorBox}>
          <h2 className={styles.errorTitle}>Lỗi tải kết quả</h2>
          <p className={styles.errorMessage}>
            Không thể tải kết quả kỳ thi. Vui lòng thử lại sau.
          </p>

          <button
            className={styles.errorBtn}
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
  const g = {
    ...result.grammarVocab,
    score: Math.round(result?.grammarVocab?.score ?? 0),
    correctCount: result?.grammarVocab?.correctCount ?? 0,
    totalQuestions: result?.grammarVocab?.totalQuestions ?? 0,
    maxScore: result?.grammarVocab?.maxScore ?? 60,
  };

  const r = {
    ...result.reading,
    score: Math.round(result?.reading?.score ?? 0),
    correctCount: result?.reading?.correctCount ?? 0,
    totalQuestions: result?.reading?.totalQuestions ?? 0,
    maxScore: result?.reading?.maxScore ?? 60,
  };

  const l = {
    ...result.listening,
    score: Math.round(result?.listening?.score ?? 0),
    correctCount: result?.listening?.correctCount ?? 0,
    totalQuestions: result?.listening?.totalQuestions ?? 0,
    maxScore: result?.listening?.maxScore ?? 60,
  };

  const totalQuestions =
    (g.totalQuestions ?? 0) + (r.totalQuestions ?? 0) + (l.totalQuestions ?? 0);

  const correctCount =
    (g.correctCount ?? 0) + (r.correctCount ?? 0) + (l.correctCount ?? 0);

  const totalScore = Math.round(result.score ?? 0);
  const percent = Math.round((totalScore / 180) * 100);

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
                {g.correctCount} / {g.totalQuestions} câu đúng
              </p>
              <p>
                Điểm: <strong>{g.score}</strong> / {g.maxScore}
              </p>
            </div>

            <div className={styles.breakdownItem}>
              <h3>Đọc hiểu</h3>
              <p>
                {r.correctCount} / {r.totalQuestions} câu đúng
              </p>
              <p>
                Điểm: <strong>{r.score}</strong> / {r.maxScore}
              </p>
            </div>

            <div className={styles.breakdownItem}>
              <h3>Nghe hiểu</h3>
              <p>
                {l.correctCount} / {l.totalQuestions} câu đúng
              </p>
              <p>
                Điểm: <strong>{l.score}</strong> / {l.maxScore}
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
