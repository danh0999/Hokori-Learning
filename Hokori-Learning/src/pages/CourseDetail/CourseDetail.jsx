// src/pages/CourseDetail/CourseDetail.jsx
import React, { useEffect } from "react";
import "./CourseDetail.scss";

import CourseHero from "./components/CourseHero";
import CourseOverview from "./components/CourseOverview";
import CourseFeedback from "./components/CourseFeedback";

import { useSelector, useDispatch } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";

import {
  fetchCourseTree,
  fetchTrialTree,
} from "../../redux/features/courseSlice";

const CourseDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { current, loading, error } = useSelector((state) => state.courses);

  useEffect(() => {
    if (id) {
      dispatch(fetchCourseTree(id)); // /courses/{id}/tree
    }
  }, [id, dispatch]);

  const handleTrialLearn = async () => {
    if (!id) return;

    try {
      // 1. Lấy trial tree
      const trial = await dispatch(fetchTrialTree(id)).unwrap();

      const trialChapter = trial.chapters?.[0];
      if (!trialChapter) {
        alert("Khóa học này chưa cấu hình chương học thử.");
        return;
      }

      const firstLesson = trialChapter.lessons?.[0];
      if (!firstLesson) {
        alert("Chưa có bài học nào trong chương học thử.");
        return;
      }

      const lessonId = firstLesson.id;

      // 2. Điều hướng sang trang trial lesson
      navigate(`/course/${id}/trial-lesson/${lessonId}`);
    } catch (err) {
      console.error("Học thử thất bại:", err);
      alert(
        err?.message || "Không thể tải nội dung học thử, vui lòng thử lại sau."
      );
    }
  };

  if (loading) return <div className="loading">Đang tải...</div>;
  if (error)
    return <div className="error">Lỗi tải dữ liệu: {String(error)}</div>;
  if (!current)
    return <div className="loading">Không tìm thấy dữ liệu khóa học</div>;

  const course = current;

  return (
    <main className="course-detail">
      {/* HERO */}
      <CourseHero course={course} onTrialLearn={handleTrialLearn} />

      {/* MAIN CONTENT: Overview + Feedback song song */}
      <section className="course-main">
        <div className="course-main__grid container">
          <div className="course-main__left">
            <CourseOverview course={course} />
          </div>

          <aside className="course-main__right">
            <CourseFeedback course={course} />
          </aside>
        </div>
      </section>
    </main>
  );
};

export default CourseDetail;
