// src/pages/LearnerDashboard/LearnerDashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./LearnerDashboard.module.scss";
import api from "../../configs/axios";
import AiQuotaOverview from "./components/AiQuotaOverview";
// === Redux for AI Modal ===
import { useSelector, useDispatch } from "react-redux";
import AiPackageModal from "../AiPackage/components/AiPackageModal.jsx";
import {
  closeModal,
  purchaseAiPackage,
} from "../../redux/features/aiPackageSlice";

// === Components ===
import UserProfile from "./components/UserProfile";
import ProgressTracker from "./components/ProgressTracker";
import CompletedLessons from "./components/CompletedLessons";
import QuizResults from "./components/QuizResults";
import AISidebar from "./components/AISidebar";

const LearnerDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const aiPackage = useSelector((state) => state.aiPackage);

  // ====== STATE ======
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  // JLPT history (5 bài gần nhất để show dashboard)
  const [jlptResults, setJlptResults] = useState([]);

  // ====== FETCH DASHBOARD DATA ======
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const userRes = await api.get("/profile/me");
        const userData = userRes.data?.data;

        const courseRes = await api.get("/learner/courses");
        const courseList = courseRes.data?.data || [];

        if (courseList.length > 0) {
          const byLevel = {};
          courseList.forEach((c) => {
            const lvl = c.level || "Unknown";
            if (!byLevel[lvl]) byLevel[lvl] = [];
            byLevel[lvl].push(c.progress || 0);
          });

          const jlptLevels = Object.entries(byLevel).map(([level, list]) => {
            const avg =
              list.reduce((sum, v) => sum + v, 0) / (list.length || 1);
            return {
              level: `JLPT ${level}`,
              progress: Math.round(avg),
              status:
                avg === 0
                  ? "Chưa bắt đầu"
                  : avg === 100
                  ? "Hoàn thành"
                  : "Đang học",
            };
          });

          const overall = Math.round(
            courseList.reduce((sum, c) => sum + (c.progress || 0), 0) /
              courseList.length
          );

          setProgress({ overall, jlptLevels });
        } else {
          setProgress({ overall: 0, jlptLevels: [] });
        }

        setUser({
          name: userData.displayName,
          role: userData.roleName || "Học viên tiếng Nhật",
          goal: userData.goal || "Chưa cập nhật",
          joinedAt: new Date(userData.createdAt).toLocaleDateString("vi-VN"),
          streakDays: userData.streakDays || 0,
          avatar:
            userData.avatarUrl ||
            "https://cdn-icons-png.flaticon.com/512/9131/9131529.png",
        });
      } catch (err) {
        console.error(
          "Dashboard API error:",
          err.response?.data || err.message
        );
        setProgress({ overall: 0, jlptLevels: [] });
        setUser({
          name: "Người học Hokori",
          role: "Học viên",
          goal: "Hoàn thành khóa đầu tiên",
          joinedAt: "—",
          streakDays: 0,
          avatar: "https://cdn-icons-png.flaticon.com/512/9131/9131529.png",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // ====== FETCH JLPT TEST HISTORY (chỉ để show 5 dòng gần nhất) ======
  useEffect(() => {
    const loadJlptAttempts = async () => {
      try {
        const eventsRes = await api.get("/jlpt/events/open");
        const events = eventsRes.data || [];

        let allAttempts = [];

        for (const ev of events) {
          const testsRes = await api.get(
            `/learner/jlpt/events/${ev.id}/tests`
          );
          const tests = testsRes.data || [];

          for (const t of tests) {
            const attemptsRes = await api.get(
              `/learner/jlpt/tests/${t.id}/attempts`
            );
            const attempts = attemptsRes.data || [];

            attempts.forEach((a) => {
              allAttempts.push({
                id: a.id,
                testId: t.id, // QUAN TRỌNG: dùng để mở trang review
                title: `Đề thi JLPT ${t.level} – ${t.title}`,
                takenAt: a.submittedAt || a.startedAt,
                score: Math.round(a.score || 0),
                correct: `${a.correctCount}/${a.totalQuestions}`,
              });
            });
          }
        }

        // sort mới → cũ
        allAttempts.sort(
          (a, b) => new Date(b.takenAt) - new Date(a.takenAt)
        );

        // chỉ giữ 5 bài gần nhất để tránh list quá dài
        setJlptResults(allAttempts.slice(0, 5));
      } catch (err) {
        console.error("Lỗi tải lịch sử JLPT:", err);
        setJlptResults([]);
      }
    };

    loadJlptAttempts();
  }, []);

  // ====== RENDER ======
  if (loading) {
    return (
      <main className={styles.dashboard}>
        <div className={styles.container}>Đang tải dữ liệu học viên...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className={styles.dashboard}>
        <div className={styles.container}>
          Không thể tải dữ liệu người dùng.
        </div>
      </main>
    );
  }

  return (
    <main className={styles.dashboard}>
      <div className={styles.container}>
        <UserProfile {...user} />

        <div className={styles.grid}>
          <div className={styles.left}>
            {progress && <ProgressTracker {...progress} />}
            <CompletedLessons onViewAll={() => navigate("/my-courses")} />

            {/* Chỉ 5 kết quả gần nhất + nút Xem tất cả */}
            <QuizResults
              results={jlptResults}
              onViewAll={() => navigate("/jlpt/history")}
            />
          </div>

          <div className={styles.right}>
            <div className={styles.flashcardBox}>
              <h3>Flashcard của bạn</h3>
              <p>Ôn lại từ vựng, kanji hoặc cụm từ đã lưu.</p>
              <button
                className={styles.flashcardBtn}
                onClick={() => navigate("/my-flashcards")}
              >
                <i className="fa-solid fa-layer-group"></i> Bắt đầu ôn tập
              </button>
            </div>

            <AISidebar />
             <AiQuotaOverview />
          </div>
          
        </div>
      </div>

      {/* AI PACKAGE MODAL */}
      {aiPackage.showModal && (
        <AiPackageModal
          onClose={() => dispatch(closeModal())}
          onSelect={(pkgId) => dispatch(purchaseAiPackage(pkgId))}
        />
      )}
    </main>
  );
};

export default LearnerDashboard;
