import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchCourses } from "../../../redux/features/courseSlice";
import CourseCard from "../../Marketplace/components/CourseCard/CourseCard";
import styles from "./RecommendedCourses.module.scss";

const RecommendedCourses = () => {
  const dispatch = useDispatch();
  const { list: courses, loading } = useSelector((state) => state.courses);

  useEffect(() => {
    //  Lấy danh sách khóa học từ Redux (mock hoặc API)
    if (!courses.length) dispatch(fetchCourses());
  }, [dispatch, courses.length]);

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Có thể bạn sẽ thích</h2>
      </div>

      <div className={styles.grid}>
        {loading ? (
          <div className={styles.loading}>Đang tải...</div>
        ) : (
          courses
            .slice(0, 4)
            .map((course) => <CourseCard key={course.id} course={course} />)
        )}
      </div>
    </section>
  );
};

export default RecommendedCourses;
