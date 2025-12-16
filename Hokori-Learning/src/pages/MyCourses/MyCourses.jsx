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
  const handleContinue = (course) => {
    try {
      const slug = slugify(course.title);
      navigate(`/learn/${course.courseId}/${slug}/home/chapter/1`);
    } catch (err) {
      console.error(err);
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
