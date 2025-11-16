import React, { useEffect, useState } from "react";
import api from "../../configs/axios";
import CourseCard from "./components/CourseCard";
import styles from "./MyCourses.module.scss";

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Lấy danh sách khóa học học viên đã ghi danh
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get("/learner/courses");
        setCourses(res.data?.data || []);
      } catch (err) {
        console.error("Không thể tải danh sách khóa học:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  // 🔹 Callback khi người học muốn tiếp tục khóa học
  const handleContinue = (course) => {
    console.log("Tiếp tục học:", course.title);
    // TODO: điều hướng sang trang học
    // navigate(`/courses/${course.id}`);
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
            Bạn chưa ghi danh khóa học nào.  
            <a href="/marketplace">Khám phá thêm khóa học →</a>
          </p>
        ) : (
          <div className={styles.grid}>
            {courses.map((c) => (
              <CourseCard key={c.id} course={c} onContinue={handleContinue} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default MyCourses;
