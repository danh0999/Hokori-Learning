import React from "react";
import styles from "./Result.module.scss";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

const Result = ({ sectionScores }) => {
  const resultData = {
    testTitle: "JLPT N3 - Kết quả thi",
    sections: [
      { name: "Từ vựng & Ngữ pháp", score: sectionScores.multiple ?? 0 },
      { name: "Đọc hiểu", score: sectionScores.reading ?? 0 },
      { name: "Nghe hiểu", score: sectionScores.listening ?? 0 },
    ],
  };

  const overall =
    resultData.sections.reduce((acc, cur) => acc + cur.score, 0) /
    resultData.sections.length;

  return (
    <div className={styles.resultWrapper}>
      <div className={styles.resultCard}>
        <h1 className={styles.title}>{resultData.testTitle}</h1>
        <p className={styles.subtitle}>🎉 Bạn đã hoàn thành bài thi JLPT N3!</p>

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
            <p>{overall.toFixed(0)} / 100 điểm trung bình từ 3 phần thi</p>
          </div>
        </div>

        <div className={styles.sectionList}>
          {resultData.sections.map((sec, i) => (
            <div key={i} className={styles.sectionItem}>
              <div className={styles.sectionHeader}>
                <h3>{sec.name}</h3>
                <span className={styles.score}>{sec.score}%</span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${sec.score}%` }}
                />
              </div>
            </div>
          ))}
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

export default Result;
