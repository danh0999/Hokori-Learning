import React, { useEffect } from "react";
import "./CourseDetail.scss";

import CourseHero from "./components/CourseHero";
import CourseOverview from "./components/CourseOverview";
import CourseFeedback from "./components/CourseFeedback";

import { useSelector, useDispatch } from "react-redux";
import { useParams } from "react-router-dom";

import { fetchCourseTree } from "../../redux/features/courseSlice";

const CourseDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();

  const { current, loading, error } = useSelector((state) => state.courses);

  useEffect(() => {
    if (id) {
      dispatch(fetchCourseTree(id)); // 🔥 GỌI API /courses/{id}/tree
    }
  }, [id, dispatch]);

  // =============== STATE HIỂN THỊ ===============
  if (loading) return <div className="loading">Đang tải...</div>;

  if (error)
    return (
      <div className="error">
        Lỗi tải dữ liệu: {error}
      </div>
    );

  if (!current)
    return <div className="loading">Không tìm thấy dữ liệu khóa học</div>;

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
