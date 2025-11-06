import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./LearnerDashboard.module.scss";

// === Components ===
import UserProfile from "./components/UserProfile";
import ProgressTracker from "./components/ProgressTracker";
import CompletedLessons from "./components/CompletedLessons";
import QuizResults from "./components/QuizResults";
import UpcomingLessons from "./components/UpcomingLessons";
import AISidebar from "./components/AISidebar";

const LearnerDashboard = () => {
  const navigate = useNavigate();
  const learner = useMemo(
    () => ({
      name: "Nguyễn Minh Anh",
      role: "Học viên tiếng Nhật",
      goal: "JLPT N3",
      joinedAt: "Tháng 1, 2025",
      streakDays: 127,
      avatar:
        "https://avatardep.info/wp-content/uploads/2025/01/avt-mac-dinh-fb-moi.jpg",
    }),
    []
  );

  const progress = useMemo(
    () => ({
      overall: 68,
      jlptLevels: [
        { level: "JLPT N5", status: "Hoàn thành", progress: 100 },
        { level: "JLPT N4", status: "Đang học", progress: 85 },
        { level: "JLPT N3", status: "Chưa bắt đầu", progress: 0 },
      ],
    }),
    []
  );

  return (
    <main className={styles.dashboard}>
      <div className={styles.container}>
        <UserProfile {...learner} />
        <div className={styles.grid}>
          <div className={styles.left}>
            <ProgressTracker {...progress} />
            <CompletedLessons onViewAll={() => alert("Xem tất cả bài học")} />
            <QuizResults />
          </div>

          <div className={styles.right}>
            {/* <UpcomingLessons /> */}

            {/*  Nút điều hướng tới trang Flashcard cá nhân */}
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
