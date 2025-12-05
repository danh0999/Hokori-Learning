import React, { useEffect, useState } from "react";
import api from "../../configs/axios";
import CourseCard from "./components/CourseCard";
import styles from "./MyCourses.module.scss";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { buildFileUrl } from "../../utils/fileUrl";


const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 🔹 Lấy danh sách enrollment + enrich course info
  useEffect(() => {
  const fetchCourses = async () => {
    try {
      // 1️⃣ Lấy danh sách enrollment
      const enrollRes = await api.get("/learner/courses");
      const enrollments = enrollRes.data || [];

      // 2️⃣ Duyệt từng course → lấy thông tin bằng TREE API
      const detailed = await Promise.all(
        enrollments.map(async (enroll) => {
          try {
            const treeRes = await api.get(`/courses/${enroll.courseId}/tree`);
            const tree = treeRes.data;

            // Tính tổng số lessons từ tree
            let totalLessons = 0;
            tree.chapters?.forEach((ch) => {
              totalLessons += ch.lessons?.length || 0;
            });

            return {
              // ---- Thông tin Course ----
              id: tree.id,
              courseId: enroll.courseId,
              title: tree.title || "Khóa học",
              level: tree.level || "N5",
              teacher: tree.teacherName || "Giảng viên",
              coverUrl: tree.coverImagePath
              ? buildFileUrl(tree.coverImagePath)
              : "https://cdn.pixabay.com/photo/2017/01/31/13/14/book-2024684_1280.png",

              lessons: totalLessons,

              // ---- Tiến độ ----
              progress: enroll.progressPercent || 0,
              completed: enroll.progressPercent >= 100,
              lastStudy: enroll.lastAccessAt
                ? new Date(enroll.lastAccessAt).toLocaleDateString()
                : "Chưa học",

              enrollmentId: enroll.enrollmentId,
            };
          } catch (err) {
            console.error("Lỗi load course tree:", err);
            return null;
          }
        })
      );

      setCourses(detailed.filter(Boolean));
    } catch (err) {
      console.error("Không thể tải danh sách khóa học:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchCourses();
}, []);


  // 🔹 Khi user nhấn “Tiếp tục học”
  const handleContinue = async (course) => {
    try {
      const res = await api.get(`/learner/courses/${course.courseId}/lessons`);
      const lessons = res.data ?? [];

      if (!lessons.length) {
        toast.error("Khóa học chưa có bài học.");
        return;
      }

      const firstLesson = lessons.sort((a, b) => a.orderIndex - b.orderIndex)[0];
      const lessonId = firstLesson.lessonId ?? firstLesson.id;

      navigate(`/course/${course.courseId}/lesson/${lessonId}`);
    } catch (err) {
      console.error("Không thể điều hướng vào bài học:", err);
    }
  };

  if (loading) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>Đang tải khóa học của bạn...</div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>Khóa học của tôi</h1>

        {courses.length === 0 ? (
          <p className={styles.empty}>
            Bạn chưa ghi danh khóa học nào.{" "}
            <a href="/marketplace">Khám phá thêm khóa học →</a>
          </p>
        ) : (
          <div className={styles.grid}>
            {courses.map((c) => (
              <CourseCard key={c.enrollmentId} course={c} onContinue={handleContinue} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default MyCourses;
