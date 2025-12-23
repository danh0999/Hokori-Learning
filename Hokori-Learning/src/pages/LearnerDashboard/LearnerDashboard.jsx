// src/pages/LearnerDashboard/LearnerDashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./LearnerDashboard.module.scss";
import api from "../../configs/axios";
import { toast } from "react-toastify";

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
import AiQuotaOverview from "./components/AiQuotaOverview";

const LearnerDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const aiPackage = useSelector((state) => state.aiPackage);

  // ====== STATE ======
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // State quản lý khóa học
  const [recentCourses, setRecentCourses] = useState([]); // Danh sách khóa ĐANG học (cho ProgressTracker)
  const [completedCourses, setCompletedCourses] = useState([]); // Danh sách khóa ĐÃ xong (cho CompletedLessons)
  const [incompleteCount, setIncompleteCount] = useState(0); // Số lượng khóa chưa xong

  // State lịch sử thi JLPT
  const [jlptResults, setJlptResults] = useState([]);

  // ====== HANDLERS ======

  // Xử lý xem chứng chỉ
  const handleViewCertificate = async (courseId) => {
    try {
      const res = await api.get(`/learner/certificates/course/${courseId}`);
      // Xử lý response tùy theo cấu trúc trả về của BE
      const cert = res.data?.data ?? res.data;

      if (!cert?.id) {
        toast.error("Không tìm thấy chứng chỉ cho khóa học này.");
        return;
      }
      navigate(`/certificates/${cert.id}`);
    } catch (err) {
      if (err?.response?.status === 404) {
        toast.info("Bạn chưa hoàn thành khóa học để nhận chứng chỉ.");
        return;
      }
      toast.error("Không thể lấy chứng chỉ. Vui lòng thử lại.");
    }
  };

  // ====== FETCH DASHBOARD DATA ======
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // 1. Lấy thông tin User
        const userRes = await api.get("/profile/me");
        const userData = userRes.data?.data;

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

        // 2. Lấy danh sách khóa học & Enrich dữ liệu (Progress thực tế)
        const enrollRes = await api.get("/learner/courses");
        const enrollments = enrollRes.data?.data || enrollRes.data || [];

        // Dùng Promise.all để gọi API learning-tree cho từng khóa nhằm lấy progress chính xác nhất
        const detailedCourses = await Promise.all(
          enrollments.map(async (enroll) => {
            try {
              const treeRes = await api.get(
                `/learner/courses/${enroll.courseId}/learning-tree`
              );
              const tree = treeRes.data;

              // Ưu tiên lấy progress từ tree, nếu null mới lấy từ enroll
              const progress =
                tree.progressPercent ?? enroll.progressPercent ?? 0;
              
              // Lấy thời gian truy cập gần nhất để sắp xếp
              const lastAccessRaw = tree.lastAccessAt || enroll.lastAccessAt || 0;

              return {
                courseId: enroll.courseId,
                title: tree.courseTitle || enroll.title || "Khóa học",
                level: enroll.level || tree.level || "N5",
                coverUrl: tree.coverImagePath, 
                progress,
                completed: progress >= 100, // Đánh dấu là đã hoàn thành
                lastAccessRaw: new Date(lastAccessRaw).getTime(),
              };
            } catch (err) {
              console.error(`Lỗi load tree course ${enroll.courseId}:`, err);
              // Fallback nếu API tree lỗi
              return {
                courseId: enroll.courseId,
                title: enroll.title || "Khóa học",
                level: enroll.level || "N5",
                progress: enroll.progressPercent || 0,
                completed: (enroll.progressPercent || 0) >= 100,
                lastAccessRaw: 0
              };
            }
          })
        );

        // Loại bỏ các giá trị null/undefined
        const validCourses = detailedCourses.filter(Boolean);

        // --- PHÂN LOẠI DATA ---

        // Nhóm 1: Khóa chưa hoàn thành (Cho ProgressTracker)
        const unfinished = validCourses.filter((c) => !c.completed);
        setIncompleteCount(unfinished.length);
        // Sắp xếp: Mới học gần nhất lên đầu
        unfinished.sort((a, b) => b.lastAccessRaw - a.lastAccessRaw);
        // Chỉ lấy 3 khóa đầu tiên
        setRecentCourses(unfinished.slice(0, 3));

        // Nhóm 2: Khóa ĐÃ hoàn thành (Cho CompletedLessons)
        const finished = validCourses.filter((c) => c.completed);
        // Cũng sắp xếp mới nhất lên đầu
        finished.sort((a, b) => b.lastAccessRaw - a.lastAccessRaw);
        setCompletedCourses(finished);

      } catch (err) {
        console.error("Dashboard API error:", err);
        // Fallback data user để không vỡ giao diện
        if (!user) {
             setUser({
              name: "Người học Hokori",
              role: "Học viên",
              goal: "Hoàn thành khóa đầu tiên",
              joinedAt: "—",
              streakDays: 0,
              avatar: "https://cdn-icons-png.flaticon.com/512/9131/9131529.png",
            });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // ====== FETCH JLPT TEST HISTORY ======
  useEffect(() => {
    const loadJlptAttempts = async () => {
      try {
        const eventsRes = await api.get("/jlpt/events/open");
        const events = eventsRes.data || [];
        let allAttempts = [];

        for (const ev of events) {
          const testsRes = await api.get(`/learner/jlpt/events/${ev.id}/tests`);
          const tests = testsRes.data || [];
          for (const t of tests) {
            const attemptsRes = await api.get(`/learner/jlpt/tests/${t.id}/attempts`);
            const attempts = attemptsRes.data || [];
            attempts.forEach((a) => {
              allAttempts.push({
                id: a.id,
                testId: t.id,
                title: `Đề thi JLPT ${t.level} – ${t.title}`,
                takenAt: a.submittedAt || a.startedAt,
                score: Math.round(a.score || 0),
                correct: `${a.correctCount}/${a.totalQuestions}`,
              });
            });
          }
        }
        // Sắp xếp mới nhất -> cũ nhất
        allAttempts.sort((a, b) => new Date(b.takenAt) - new Date(a.takenAt));
        // Lấy 5 kết quả gần nhất
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
          Không thể tải dữ liệu người dùng. Vui lòng thử lại sau.
        </div>
      </main>
    );
  }

  return (
    <main className={styles.dashboard}>
      <div className={styles.container}>
        {/* Phần thông tin User */}
        <UserProfile {...user} />

        <div className={styles.grid}>
          <div className={styles.left}>
            {/* 1. Tiến độ học tập (chỉ hiện khóa chưa xong) */}
            <ProgressTracker 
              courses={recentCourses} 
              incompleteCount={incompleteCount} 
            />
            
            {/* 2. Bài học đã hoàn thành (kèm nút xem chứng chỉ) */}
            <CompletedLessons 
              courses={completedCourses}
              onViewCertificate={handleViewCertificate}
              onViewAll={() => navigate("/my-courses")} 
            />

            {/* 3. Kết quả thi thử JLPT */}
            <QuizResults
              results={jlptResults}
              onViewAll={() => navigate("/jlpt/history")}
            />
          </div>

          <div className={styles.right}>
             {/* Flashcard Widget */}
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

            {/* AI Widgets */}
            <AISidebar />
            <AiQuotaOverview />
          </div>
        </div>
      </div>

      {/* Modal mua gói AI */}
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