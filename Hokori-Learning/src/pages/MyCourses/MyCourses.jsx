import React, { useEffect, useState } from "react";
import api from "../../configs/axios";
import CourseCard from "./components/CourseCard";
import styles from "./MyCourses.module.scss";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { buildFileUrl } from "../../utils/fileUrl";
import { ensureCertificateByCourse } from "../../services/certificateService";

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 🔹 Lấy danh sách enrollment + enrich course info
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const enrollRes = await api.get("/learner/courses");
        const enrollments = enrollRes.data || [];

        const detailed = await Promise.all(
          enrollments.map(async (enroll) => {
            try {
              const treeRes = await api.get(`/courses/${enroll.courseId}/tree`);
              const tree = treeRes.data;

              let totalLessons = 0;
              tree.chapters?.forEach((ch) => {
                totalLessons += ch.lessons?.length || 0;
              });

              return {
                id: tree.id,
                courseId: enroll.courseId,
                title: tree.title || "Khóa học",
                level: tree.level || "N5",
                teacher: tree.teacherName || "Giảng viên",
                coverUrl: tree.coverImagePath
                  ? buildFileUrl(tree.coverImagePath)
                  : "https://cdn.pixabay.com/photo/2017/01/31/13/14/book-2024684_1280.png",

                lessons: totalLessons,
                status: tree.status,
                statusMessage: tree.statusMessage,

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

  const handleContinue = async (course) => {
    try {
      const res = await api.get(`/learner/courses/${course.courseId}/lessons`);
      const lessons = (res.data ?? []).sort(
        (a, b) => a.orderIndex - b.orderIndex
      );

      if (!lessons.length) {
        toast.error("Khóa học chưa có bài học.");
        return;
      }

      const incompleteLesson = lessons.find((l) => !l.isCompleted);
      const targetLesson = incompleteLesson || lessons[0];
      const lessonId = targetLesson.lessonId ?? targetLesson.id;

      const contentsRes = await api.get(
        `/learner/lessons/${lessonId}/contents`
      );
      const contents = (contentsRes.data ?? []).sort(
        (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
      );

      const inProgressContent = contents.find(
        (c) => (c.lastPositionSec ?? 0) > 0 && !c.isCompleted
      );

      const nextContent = contents.find((c) => !c.isCompleted);
      const targetContent = inProgressContent || nextContent || null;

      // hiện tại route học vẫn là trang Tree
      navigate(`/my-courses/${course.courseId}/learn`);
    } catch (err) {
      console.error("Không thể điều hướng vào bài học:", err);
    }
  };

  const handleViewCertificate = async (course) => {
    try {
      const res = await ensureCertificateByCourse(course.courseId);
      const certificateId = res.data.data.id;
      navigate(`/certificates/${certificateId}`);
    } catch {
      toast.error("Không thể tạo hoặc lấy chứng chỉ");
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
          <div className={styles.courseList}>
            {courses.map((course) => (
              <CourseCard
                key={course.courseId}
                course={course}
                onContinue={handleContinue}
                onViewCertificate={handleViewCertificate}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default MyCourses;
