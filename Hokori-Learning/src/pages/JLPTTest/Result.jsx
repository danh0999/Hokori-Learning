// src/pages/JLPTTest/Result.jsx
import React, { useEffect } from "react";
import styles from "./Result.module.scss";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { toast } from "react-toastify"; // 🔴 ADD

import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMyJlptResult,
  clearResult,
} from "../../redux/features/jlptLearnerSlice";

function validateAttemptId(attemptId) {
  if (attemptId === null || attemptId === undefined) return null;
  if (attemptId === "null" || attemptId === "undefined") return null;

  const numId = Number(attemptId);
  if (isNaN(numId) || numId <= 0) return null;

  return numId;
}

const Result = () => {
  const { testId } = useParams();
  const numericTestId = Number(testId);

  const [params] = useSearchParams();
  let eventId = params.get("eventId");
  const attemptIdFromUrl = validateAttemptId(params.get("attemptId"));

  if (!eventId || eventId === "null" || eventId === "undefined") {
    eventId = null;
  }
  const attemptIdFromStorage = validateAttemptId(
    localStorage.getItem(`jlpt_lastAttemptId_${numericTestId}`)
  );

  const attemptId = attemptIdFromUrl || attemptIdFromStorage || null;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { result, loadingResult, resultError } = useSelector(
    (state) => state.jlptLearner
  );

  // =======================================
  // RESET RESULT TRƯỚC KHI FETCH
  // =======================================
  useEffect(() => {
    dispatch(clearResult());
    dispatch(fetchMyJlptResult(numericTestId));
  }, [dispatch, numericTestId]);

  /* ========================================================================== 
      🔴 BLOCK BACK TRÌNH DUYỆT – CHỈ TOAST, KHÔNG REDIRECT
      - Chỉ trigger khi user bấm nút BACK
      - Không ảnh hưởng button trong UI
  ========================================================================== */
  useEffect(() => {
    const handlePopState = () => {
      toast.info(
        "Bạn đã nộp bài rồi, không thể quay lại làm tiếp. Vui lòng thi lại.",
        { autoClose: 2500 }
      );

      // đẩy history lại để giữ nguyên trang Result
      window.history.pushState(null, "", window.location.href);
    };

    // push state ban đầu để chặn back
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);
  /* ========================================================================== */

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

  // ===== SAFE ACCESS =====
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
    g.totalQuestions + r.totalQuestions + l.totalQuestions;

  const correctCount =
    g.correctCount + r.correctCount + l.correctCount;

  const totalScore = Math.round(result.score ?? 0);
  const percent = Math.round((totalScore / 180) * 100);

  const passScore = result.passScore ?? 0;
  const passed = Boolean(result.passed);

  return (
    <div className={styles.resultWrapper}>
      <div className={styles.resultCard}>
        <h1 className={styles.title}>Kết quả bài thi JLPT</h1>
        <p className={styles.subtitle}>
          Dưới đây là kết quả tổng hợp của bạn.
        </p>

        {/* ===== OVERALL SCORE ===== */}
        <div className={styles.overallBox}>
          <div className={styles.chart}>
            <CircularProgressbar
              value={percent}
              text={`${percent}%`}
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

        {/* ===== BREAKDOWN ===== */}
        <div className={styles.breakdownBox}>
          <h2>Chi tiết từng phần</h2>

          <div className={styles.breakdownGrid}>
            <div className={styles.breakdownItem}>
              <h3>Từ vựng & Ngữ pháp</h3>
              <p>{g.correctCount} / {g.totalQuestions} câu đúng</p>
              <p>Điểm: <strong>{g.score}</strong> / {g.maxScore}</p>
            </div>

            <div className={styles.breakdownItem}>
              <h3>Đọc hiểu</h3>
              <p>{r.correctCount} / {r.totalQuestions} câu đúng</p>
              <p>Điểm: <strong>{r.score}</strong> / {r.maxScore}</p>
            </div>

            <div className={styles.breakdownItem}>
              <h3>Nghe hiểu</h3>
              <p>{l.correctCount} / {l.totalQuestions} câu đúng</p>
              <p>Điểm: <strong>{l.score}</strong> / {l.maxScore}</p>
            </div>
          </div>
        </div>

        {/* ===== ACTIONS ===== */}
        <div className={styles.actions}>
          <button
            className={styles.retryBtn}
            onClick={() => {
              if (!attemptId) {
                alert("Không tìm được attempt hợp lệ.");
                return;
              }
              navigate(
                `/jlpt/test/${numericTestId}/review?attemptId=${attemptId}`
              );
            }}
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
