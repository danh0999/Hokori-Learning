import React from "react";
import styles from "./Result.module.scss";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

export const Result = ({ sectionScores = {} }) => {
  const sections = [
    { key: "multiple", name: "Từ vựng & Ngữ pháp", score: sectionScores.multiple },
    { key: "reading", name: "Đọc hiểu", score: sectionScores.reading },
    { key: "listening", name: "Nghe hiểu", score: sectionScores.listening },
  ];

  const validScores = sections
    .map((s) => s.score)
    .filter((v) => Number.isFinite(v));

  const overall =
    validScores.length > 0
      ? validScores.reduce((acc, cur) => acc + cur, 0) / validScores.length
      : 0;

  return (
    <div className={styles.resultWrapper}>
      <div className={styles.resultCard}>
        <h1 className={styles.title}>JLPT N3 - Kết quả thi</h1>
        <p className={styles.subtitle}>
          {validScores.length === 3
            ? "Chúc mừng bạn đã hoàn thành toàn bộ bài thi JLPT N3!"
            : validScores.length > 0
            ? "Bạn đã nộp bài thi, một số phần chưa hoàn thành."
            : "Chưa hoàn thành phần nào."}
        </p>

        <div className={styles.overallBox}>
          <div className={styles.chart}>
            <CircularProgressbar
              value={overall}
              text={`${overall.toFixed(0)}%`}
              styles={buildStyles({
                textColor: "#2563eb",
                pathColor: "#2563eb",
                trailColor: "#e5e7eb",
              })}
            />
          </div>
          <div className={styles.overallInfo}>
            <h2>Tổng điểm trung bình</h2>
            <p>
              {validScores.length > 0
                ? `${overall.toFixed(0)} / 100 điểm trung bình từ ${validScores.length} phần thi`
                : "Chưa hoàn thành phần nào"}
            </p>
          </div>
        </div>

        <div className={styles.sectionList}>
          {sections.map((sec) => {
            const hasScore = Number.isFinite(sec.score);
            const displayScore = hasScore ? sec.score : 0;
            return (
              <div key={sec.key} className={styles.sectionItem}>
                <div className={styles.sectionHeader}>
                  <h3>{sec.name}</h3>
                  <span
                    className={`${styles.score} ${
                      hasScore ? "" : styles.incomplete
                    }`}
                  >
                    {hasScore ? `${sec.score}%` : "Chưa làm"}
                  </span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${displayScore}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.actions}>
          <button
            className={styles.retryBtn}
            onClick={() => window.location.reload()}
          >
            Làm lại bài thi
          </button>
          <button
            className={styles.backBtn}
            onClick={() => (window.location.href = "/jlpt")}
          >
            Trở về danh sách đề thi
          </button>
        </div>
      </div>
    </div>
  );
};
