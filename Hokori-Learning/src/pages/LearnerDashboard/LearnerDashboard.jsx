import React, { useMemo, useState } from "react";
import styles from "./LearnerDashboard.module.scss";
import {Button} from "../../components/Button/Button";

import UserProfile from "./components/UserProfile";
import ProgressTracker from "./components/ProgressTracker";
import CompletedLessons from "./components/CompletedLessons";
import QuizResults from "./components/QuizResults";
import SubscriptionPlan from "./components/SubscriptionPlan";
import UpcomingLessons from "./components/UpcomingLessons";
import Flashcards from "./components/Flashcards";
import AIAssistant from "./components/AIAssistant";

const LearnerDashboard = () => {
  const [showRenew, setShowRenew] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);

  const learner = useMemo(
    () => ({
      name: "Nguyễn Minh Anh",
      role: "Học viên tiếng Nhật",
      goal: "JLPT N3",
      joinedAt: "Tháng 1, 2025",
      streakDays: 127,
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=456",
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

  const subscription = {
    planName: "Premium",
    features: ["Truy cập không giới hạn"],
    renewAt: "20/04/2025",
  };

  const aiTip =
    "Hôm nay bạn nên ôn tập từ vựng về gia đình và luyện tập Hiragana. Bạn đang tiến bộ rất tốt!";

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
            <SubscriptionPlan {...subscription} onRenew={() => setShowRenew(true)} />
            <UpcomingLessons />
            <Flashcards onStartReview={() => alert("Ôn tập")} />
            <AIAssistant message={aiTip} onChat={() => setShowAIChat(true)} />
          </div>
        </div>

        {/* Modal Gia hạn */}
        {showRenew && (
          <div className={styles.overlay}>
            <div className={styles.modal}>
              <h3>Gia hạn gói Premium</h3>
              <p>Tính năng demo — sau này gọi API thanh toán.</p>
              <div className={styles.modalActions}>
                <Button variant="primary" size="sm" onClick={() => setShowRenew(false)}>
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Trợ lý AI */}
        {showAIChat && (
          <div className={styles.overlay}>
            <div className={styles.modal}>
              <h3>Trợ lý AI</h3>
              <textarea
                placeholder="Nhập câu hỏi của bạn..."
                rows={3}
                className={styles.chatBox}
              />
              <div className={styles.modalActions}>
                <Button variant="secondary" size="sm" onClick={() => alert("Gửi demo")}>
                  Gửi
                </Button>
                <Button variant="primary" size="sm" onClick={() => setShowAIChat(false)}>
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default LearnerDashboard;
