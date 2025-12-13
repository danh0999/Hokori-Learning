// src/pages/MyCourses/MyCourses.jsx
import React, { useEffect, useState } from "react";
import api from "../../configs/axios";
import CourseCard from "./components/CourseCard";
import styles from "./MyCourses.module.scss";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { buildFileUrl } from "../../utils/fileUrl";

// Tạo slug giống coursera từ title
const slugify = (str = "") =>
  str
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "") || "khoa-hoc";

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 🔹 Lấy danh sách enrollment + enrich course info
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // 1. Danh sách khóa đã enroll
        const enrollRes = await api.get("/learner/courses");
        const enrollments = enrollRes.data || [];

        // 2. Với mỗi course → lấy learning-tree (learner endpoint)
        const detailed = await Promise.all(
          enrollments.map(async (enroll) => {
            try {
              const treeRes = await api.get(
                `/learner/courses/${enroll.courseId}/learning-tree`
              );
              const tree = treeRes.data;

              // Đếm tổng lesson
              let totalLessons = 0;
              tree.chapters?.forEach((ch) => {
                totalLessons += ch.lessons?.length || 0;
              });

              const progress =
                tree.progressPercent ?? enroll.progressPercent ?? 0;

              return {
                courseId: enroll.courseId,
                title: tree.courseTitle || "Khóa học",
                level: enroll.level || tree.level || "N5",
                teacher: enroll.teacherName || tree.teacherName || "Giảng viên",
                coverUrl: tree.coverImagePath
                  ? buildFileUrl(tree.coverImagePath)
                  : null,

                lessons: totalLessons,
                // learner my-courses thực ra không cần status, nhưng giữ lại nếu BE có
                status: enroll.status,
                statusMessage: enroll.statusMessage,

                progress,
                completed: progress >= 100,
                lastStudy: tree.lastAccessAt
                  ? new Date(tree.lastAccessAt).toLocaleDateString("vi-VN")
                  : "Chưa học",

                enrollmentId: enroll.enrollmentId,
              };
            } catch (err) {
              console.error("Lỗi load course learning-tree:", err);
              // nếu 1 course lỗi thì bỏ qua, không làm vỡ cả list
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

  // 🔹 Click card / nút "Tiếp tục học" → sang trang Coursera-style learning tree
  const handleContinue = (course) => {
    try {
      const slug = slugify(course.title);
      // vào thẳng learning tree của chapter 1
      navigate(`/learn/${course.courseId}/${slug}/home/chapter/1`);
    } catch (err) {
      console.error("Không thể điều hướng vào bài học:", err);
      toast.error("Không thể mở khóa học. Vui lòng thử lại sau.");
    }
  };

  const handleViewCertificate = async (course) => {
    try {
      // ✅ BE confirm dùng GET này
      const res = await api.get(
        `/learner/certificates/course/${course.courseId}`
      );
      const cert = res.data?.data ?? res.data;

      if (!cert?.id) {
        toast.error("Không tìm thấy chứng chỉ cho khóa học này.");
        return;
      }

      navigate(`/certificates/${cert.id}`);
    } catch (err) {
      console.error(err);

      // tuỳ BE trả 404 khi chưa đủ điều kiện
      if (err?.response?.status === 404) {
        toast.info("Bạn chưa hoàn thành khóa học để nhận chứng chỉ.");
        return;
      }

      toast.error("Không thể lấy chứng chỉ. Vui lòng thử lại.");
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
            <span className={styles.link} onClick={() => navigate("/courses")}>
              Khám phá khóa học
            </span>
          </p>
        ) : (
          <div className={styles.grid}>
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
