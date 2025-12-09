// src/pages/CourseDetail/CourseDetail.jsx
import React, { useEffect, useRef, useState } from "react";
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
import ScrollToTopButton from "../../components/SrcollToTopButton/ScrollToTopButton";

const CourseDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { current, loading, error } = useSelector((state) => state.courses);

  // ⭐ NEW: ref cho từng section & tab state
  const aboutRef = useRef(null);
  const contentRef = useRef(null);
  const feedbackRef = useRef(null);
  const [activeTab, setActiveTab] = useState("ABOUT"); // "ABOUT" | "CONTENT" | "FEEDBACK"

  useEffect(() => {
    if (id) {
      dispatch(fetchCourseTree(id)); // /courses/{id}/tree
    }
  }, [id, dispatch]);

  const handleTrialLearn = async () => {
    if (!id) return;

    try {
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
      navigate(`/course/${id}/trial-lesson/${lessonId}`);
    } catch (err) {
      console.error("Học thử thất bại:", err);
      alert(
        err?.message || "Không thể tải nội dung học thử, vui lòng thử lại sau."
      );
    }
  };

  // ⭐ NEW: scroll đến section khi bấm tab
  const scrollToSection = (tabKey, ref) => {
    setActiveTab(tabKey);
    if (ref?.current) {
      const yOffset = -80; // chừa chỗ cho navbar / header
      const top =
        ref.current.getBoundingClientRect().top + window.scrollY + yOffset;

      window.scrollTo({
        top,
        behavior: "smooth",
      });
    }
  };

  // ⭐ NEW: lắng nghe scroll để đổi active tab
  useEffect(() => {
    const handleScroll = () => {
      const offset = 120; // cao của header + tab
      const sections = [
        { key: "ABOUT", ref: aboutRef },
        { key: "CONTENT", ref: contentRef },
        { key: "FEEDBACK", ref: feedbackRef },
      ];

      let nearestKey = "ABOUT";
      let nearestDistance = Infinity;

      sections.forEach((s) => {
        if (!s.ref.current) return;
        const rect = s.ref.current.getBoundingClientRect();
        const distance = Math.abs(rect.top - offset);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestKey = s.key;
        }
      });

      setActiveTab(nearestKey);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

      {/* ⭐ NEW: TAB NAV GIỐNG COURSERA */}
      <nav className="course-tabs">
        <div className="course-tabs__inner container">
          <button
            className={
              activeTab === "ABOUT"
                ? "course-tabs__item course-tabs__item--active"
                : "course-tabs__item"
            }
            onClick={() => scrollToSection("ABOUT", aboutRef)}
          >
            Mô Tả
          </button>

          <button
            className={
              activeTab === "CONTENT"
                ? "course-tabs__item course-tabs__item--active"
                : "course-tabs__item"
            }
            onClick={() => scrollToSection("CONTENT", contentRef)}
          >
            Nội Dung
          </button>

          <button
            className={
              activeTab === "FEEDBACK"
                ? "course-tabs__item course-tabs__item--active"
                : "course-tabs__item"
            }
            onClick={() => scrollToSection("FEEDBACK", feedbackRef)}
          >
            Đánh Giá
          </button>
        </div>
      </nav>

      {/* ⭐ NEW: ABOUT SECTION (dùng description của course) */}
      <section className="course-about">
        <div className="container" ref={aboutRef}>
          <h2>Mô Tả Khóa Học</h2>
          <p className="course-about__description">
            {course.description ||
              "Mô tả chi tiết về khóa học sẽ được cập nhật trong thời gian sớm nhất."}
          </p>

          {/* nếu sau này BE có thêm các field khác thì show thêm */}
          {Array.isArray(course.learningOutcomes) &&
            course.learningOutcomes.length > 0 && (
              <div className="course-about__outcomes">
                <h3>Bạn sẽ học được gì</h3>
                <ul>
                  {course.learningOutcomes.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      </section>

      {/* MAIN CONTENT: Overview + Feedback song song */}
      <section className="course-main">
        <div className="course-main__grid container">
          <div className="course-main__left" ref={contentRef}>
            <CourseOverview course={course} />
          </div>

          <aside className="course-main__right" ref={feedbackRef}>
            <CourseFeedback courseId={course.id} />
          </aside>
        </div>
      </section>
      <ScrollToTopButton />
    </main>
  );
};

export default CourseDetail;
