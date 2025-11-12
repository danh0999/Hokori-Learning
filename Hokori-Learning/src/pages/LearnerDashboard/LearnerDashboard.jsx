import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./LearnerDashboard.module.scss";
import api from "../../configs/axios"; // ✅ axios instance Hokori

// === Components ===
import UserProfile from "./components/UserProfile";
import ProgressTracker from "./components/ProgressTracker";
import CompletedLessons from "./components/CompletedLessons";
import QuizResults from "./components/QuizResults";
import UpcomingLessons from "./components/UpcomingLessons";
import AISidebar from "./components/AISidebar";

const LearnerDashboard = () => {
  const navigate = useNavigate();

  // ====== STATE ======
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  // ====== FETCH DATA ======
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Lấy thông tin cá nhân
        const userRes = await api.get("/profile/me");
        const userData = userRes.data?.data;

        // Lấy danh sách khóa học đã ghi danh
        const courseRes = await api.get("/learner/courses");
        const courseList = courseRes.data?.data || [];

        // Tính toán tiến độ tổng thể
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
          "🚨 Dashboard API error:",
          err.response?.data || err.message
        );

        // Nếu backend lỗi 500 => hiển thị mặc định rỗng
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
        {/* Hồ sơ người dùng */}
        <UserProfile {...user} />

        <div className={styles.grid}>
          {/* Cột trái */}
          <div className={styles.left}>
            {progress && <ProgressTracker {...progress} />}
            <CompletedLessons onViewAll={() => navigate("/my-courses")} />
            <QuizResults />
          </div>

          {/* Cột phải */}
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
          </div>
        </div>
      </div>
    </main>
  );
};

export default LearnerDashboard;
