import React, { useEffect } from "react";
import "./CourseDetail.scss";
import CourseHero from "./components/CourseHero";
import CourseOverview from "./components/CourseOverview";
import CourseFeedback from "./components/CourseFeedback";
import { useSelector, useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import {
  fetchCourseById,
  setCurrentCourse,
} from "../../redux/features/courseSlice";

/**
 * Trang chi tiết khóa học (Course Detail)
 *  Đã hỗ trợ gọi API backend /courses/:id
 *  Tự fallback sang mock data nếu backend chưa phản hồi
 */

const CourseDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();

  // Redux state
  const { current, list, loading } = useSelector((state) => state.courses);

  useEffect(() => {
    /**
     * ================================================
     * 🔹 API MODE — Gọi dữ liệu khóa học thật từ backend
     * ================================================
     */
    dispatch(fetchCourseById(id))
      .unwrap()
      .catch(() => {
        console.warn("⚠️ API /courses/:id thất bại, fallback sang mock data");
        // fallback demo nếu API lỗi
        if (list?.length > 0) {
          const found = list.find((c) => c.id === Number(id));
          if (found) dispatch(setCurrentCourse(found));
        }
      });
  }, [id, dispatch, list]);

  // Nếu đang loading hoặc chưa có dữ liệu
  if (loading || !current) {
    return <div className="loading">Đang tải khóa học...</div>;
  }

  const course = current;

  return (
    <main className="course-detail">
      {/* ===== HERO SECTION ===== */}
      <CourseHero course={course} />

      {/* ===== OVERVIEW SECTION ===== */}
      <CourseOverview course={course} />

      {/* ===== FEEDBACK SECTION ===== */}
      <CourseFeedback course={course} />
    </main>
  );
};

export default CourseDetail;
