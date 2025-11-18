// src/pages/CourseDetail/CourseDetail.jsx
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
      dispatch(fetchCourseTree(id)); // GỌI API /api/courses/{id}/tree
    }
  }, [id, dispatch]);

  if (loading) return <div className="loading">Đang tải...</div>;

  if (error)
    return <div className="error">Lỗi tải dữ liệu: {String(error)}</div>;

  if (!current)
    return <div className="loading">Không tìm thấy dữ liệu khóa học</div>;

  const course = current; // đây là object tree trả từ BE

  return (
    <main className="course-detail">
      {/* HERO */}
      <CourseHero course={course} />

      {/* OVERVIEW / CURRICULUM */}
      <CourseOverview course={course} />

      {/* FEEDBACK */}
      <CourseFeedback course={course} />
    </main>
  );
};

export default CourseDetail;
