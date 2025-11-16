import React from "react";
import { FaTrophy, FaChartLine } from "react-icons/fa";
import styles from "./QuizResults.module.scss";

const QuizResults = ({ results = [] }) => (
  <section className="card">
    <h3 className={styles.title}>Kết quả kiểm tra gần đây</h3>
    <div className={styles.list}>
      {results.length ? (
        results.map((r) => (
          <div className={styles.item} key={r.id}>
            <div className={styles.left}>
              <div className={styles.icon}>
                {r.title.toLowerCase().includes("từ vựng") ? (
                  <FaTrophy />
                ) : (
                  <FaChartLine />
                )}
              </div>
              <div>
                <div className={styles.name}>{r.title}</div>
                <div className={styles.date}>
                  {new Date(r.takenAt).toLocaleDateString("vi-VN")}
                </div>
              </div>
            </div>
            <div className={styles.right}>
              <div className={styles.score}>{r.score}%</div>
              <div className={styles.correct}>{r.correct}</div>
            </div>
          </div>
        ))
      ) : (
        <div className={styles.empty}>Chưa có bài kiểm tra.</div>
      )}
    </div>
  </section>
);

export default QuizResults;
