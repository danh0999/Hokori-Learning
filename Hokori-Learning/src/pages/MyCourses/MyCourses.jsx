import React, { useEffect, useState, useMemo } from "react";
import api from "../../configs/axios";
import CourseCard from "./components/CourseCard";
import styles from "./MyCourses.module.scss";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { buildFileUrl } from "../../utils/fileUrl";
import LoadingOverlay from "../../components/Loading/LoadingOverlay";
import { SearchBar } from "../../components/SearchBar/SearchBar";

/* =======================
   Utils
======================= */
const slugify = (str = "") =>
  str
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "") || "khoa-hoc";

/* =======================
   Component
======================= */
const MyCourses = () => {
  const navigate = useNavigate();

  // data
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("ALL");

  /* =======================
     Fetch courses
  ======================= */
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // 1. danh sách enrollment
        const enrollRes = await api.get("/learner/courses");
        const enrollments = enrollRes.data || [];

        // 2. enrich từng course bằng learning-tree
        const detailed = await Promise.all(
          enrollments.map(async (enroll) => {
            try {
              const treeRes = await api.get(
                `/learner/courses/${enroll.courseId}/learning-tree`
              );
              const tree = treeRes.data;

              // tổng lesson
              let totalLessons = 0;
              tree.chapters?.forEach((ch) => {
                totalLessons += ch.lessons?.length || 0;
              });

              const chapters = tree?.chapters ?? [];
              const nonTrialChapters = chapters.filter(
                (c) => Number(c.orderIndex) > 0
              );

              // ✅ trial-only: chỉ có chapterIndex=0
              const isTrialOnly =
                chapters.length > 0 && nonTrialChapters.length === 0;

              const progress =
                tree.progressPercent ?? enroll.progressPercent ?? 0;

              return {
                courseId: enroll.courseId,
                title: tree.courseTitle || "Khóa học",
                teacherName: tree.teacherName,
                level: enroll.level || tree.level || "N5",
                coverUrl: tree.coverImagePath
                  ? buildFileUrl(tree.coverImagePath)
                  : null,

                lessons: totalLessons,

                // ✅ course status lấy từ learning-tree (BE đã thêm)
                courseStatus: tree.courseStatus, // "FLAGGED" | ...
                // nếu BE chưa có message thì FE tự set message cố định
                courseStatusMessage:
                  tree.courseStatus === "FLAGGED"
                    ? "Khóa học đang được cập nhật nội dung do kiểm duyệt. Một số bài học có thể thay đổi tạm thời."
                    : tree.courseStatus === "REJECTED"
                    ? "Bản cập nhật gần nhất đã bị từ chối. Khóa học đang chờ giáo viên chỉnh sửa và gửi lại."
                    : tree.courseStatus === "PENDING_UPDATE"
                    ? "Khóa học đang chờ duyệt bản cập nhật. Bạn vẫn có thể học nội dung hiện tại."
                    : null,

                // enrollment status nếu bạn còn cần ở chỗ khác
                enrollmentStatus: enroll.status,
                enrollmentStatusMessage: enroll.statusMessage,

                // ✅ để UI quyết định có hiện progress hay không
                isTrialOnly,
                progress,
                completed: progress >= 100,
                lastStudy: tree.lastAccessAt
                  ? new Date(tree.lastAccessAt).toLocaleDateString("vi-VN")
                  : "Chưa học",

                enrollmentId: enroll.enrollmentId,
              };
            } catch (err) {
              console.error("Lỗi load learning-tree:", err);
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

  /* =======================
     Filtered courses
  ======================= */
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());

      const matchLevel = levelFilter === "ALL" || c.level === levelFilter;

      return matchSearch && matchLevel;
    });
  }, [courses, search, levelFilter]);

  /* =======================
     Handlers
  ======================= */

  const handleContinue = async (course) => {
    try {
      const slug = slugify(course.title);

      // Lấy learning tree để biết course có chapter học thật hay chỉ trial
      const res = await api.get(
        `/learner/courses/${course.courseId}/learning-tree`
      );
      const tree = res.data;
      const chapters = tree?.chapters ?? [];

      if (!chapters.length) {
        toast.info("Khóa học chưa có nội dung.");
        return;
      }

      const trialChapter = chapters.find((c) => Number(c.orderIndex) === 0);
      const nonTrialChapters = chapters
        .filter((c) => Number(c.orderIndex) > 0)
        .sort((a, b) => Number(a.orderIndex) - Number(b.orderIndex));

      // ✅ Case: chỉ có trial -> đi trang trial, KHÔNG vào LearningTree
      if (nonTrialChapters.length === 0) {
        if (trialChapter?.chapterId) {
          navigate(
            `/course/${course.courseId}/trial-lesson/${trialChapter.chapterId}`
          );
        } else {
          toast.info("Khóa học chưa có chương để học.");
        }
        return;
      }

      // ✅ Case: có chapter học thật -> vào LearningTree đúng chapterIndex
      const firstNonTrial = nonTrialChapters[0];
      navigate(
        `/learn/${course.courseId}/${slug}/home/chapter/${firstNonTrial.orderIndex}`
      );
    } catch (e) {
      console.error(e);
      toast.error("Không thể mở khóa học. Vui lòng thử lại.");
    }
  };

  const handleViewCertificate = async (course) => {
    try {
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
      if (err?.response?.status === 404) {
        toast.info("Bạn chưa hoàn thành khóa học để nhận chứng chỉ.");
        return;
      }
      toast.error("Không thể lấy chứng chỉ. Vui lòng thử lại.");
    }
  };

  /* =======================
     Loading
  ======================= */
  if (loading) {
    return (
      <>
        <LoadingOverlay />
        <main className={styles.main}>
          <div className={styles.container} />
        </main>
      </>
    );
  }

  /* =======================
     Render
  ======================= */
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>Khóa học của tôi</h1>

        {/* FILTER BAR */}
        <div className={styles.filtersRow}>
          {/* Level select */}
          <div className={styles.levelFilter}>
            <label>Cấp độ JLPT:</label>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
            >
              <option value="ALL">Tất cả</option>
              <option value="N1">N1</option>
              <option value="N2">N2</option>
              <option value="N3">N3</option>
              <option value="N4">N4</option>
              <option value="N5">N5</option>
            </select>
          </div>

          <div className={styles.searchWrapper}>
            <SearchBar
              placeholder="Tìm khóa học của bạn..."
              value={search}
              onSearch={setSearch}
            />
          </div>
        </div>

        {/* CONTENT */}
        {filteredCourses.length === 0 ? (
          <p className={styles.empty}>
            {search || levelFilter !== "ALL" ? (
              "Không tìm thấy khóa học phù hợp."
            ) : (
              <>
                Bạn chưa ghi danh khóa học nào.{" "}
                <span
                  className={styles.link}
                  onClick={() => navigate("/courses")}
                >
                  Khám phá khóa học
                </span>
              </>
            )}
          </p>
        ) : (
          <div className={styles.grid}>
            {filteredCourses.map((course) => (
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
