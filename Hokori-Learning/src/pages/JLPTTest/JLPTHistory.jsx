import React, { useEffect, useState } from "react";
import styles from "./JLPTHistory.module.scss";
import api from "../../configs/axios";
import { useNavigate } from "react-router-dom";

const JLPTHistory = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const loadAllAttempts = async () => {
      try {
        setLoading(true);

        // 1) Lấy tất cả event mở
        const eventRes = await api.get("/jlpt/events/open");
        const events = eventRes.data || [];

        let allAttempts = [];

        // 2) Mỗi event → lấy danh sách test
        for (const ev of events) {
          const testsRes = await api.get(`/learner/jlpt/events/${ev.id}/tests`);
          const tests = testsRes.data || [];

          // 3) Mỗi test → lấy danh sách attempt
          for (const t of tests) {
            const attemptRes = await api.get(
              `/learner/jlpt/tests/${t.id}/attempts`
            );
            const attempts = attemptRes.data || [];

            attempts.forEach((a) => {
              allAttempts.push({
                id: a.id,
                testId: t.id,
                level: t.level,
                title: t.title || `Mock Test #${t.id}`,
                takenAt: a.submittedAt || a.startedAt,
                score: Math.round(a.score ?? 0),
                correctCount: a.correctCount ?? 0,
                totalQuestions: a.totalQuestions ?? 0,
              });
            });
          }
        }

        // Sort theo thời gian mới → cũ
        allAttempts.sort((a, b) => new Date(b.takenAt) - new Date(a.takenAt));

        setHistory(allAttempts);
      } catch (err) {
        console.error("Lỗi tải lịch sử JLPT:", err);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    loadAllAttempts();
  }, []);

  // ========== UI STATE ==========

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.loading}>Đang tải lịch sử...</p>
      </div>
    );
  }

  if (!history.length) {
    return (
      <div className={styles.page}>
        <p className={styles.empty}>Bạn chưa làm bài thi nào.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.header}>Lịch sử làm bài JLPT</h1>

      <div className={styles.container}>
        <div className={styles.list}>
          {history.map((h) => (
            <div
              key={h.id}
              className={styles.item}
              onClick={() =>
                navigate(`/jlpt/test/${h.testId}/review?attemptId=${h.id}`)
              }
            >
              {/* LEFT */}
              <div className={styles.left}>
                <div className={styles.icon}>
                  <i className="fa-solid fa-chart-line"></i>
                </div>

                <div className={styles.info}>
                  <div className={styles.title}>
                    Đề thi JLPT N{h.level} – {h.title}
                  </div>
                  <div className={styles.date}>
                    {new Date(h.takenAt).toLocaleDateString("vi-VN")}
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div className={styles.right}>
                <div className={styles.score}>
                  {h.score}đ <span>Tổng điểm</span>
                </div>

                <div className={styles.correct}>
                  {h.correctCount}/{h.totalQuestions} Câu đúng
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default JLPTHistory;
