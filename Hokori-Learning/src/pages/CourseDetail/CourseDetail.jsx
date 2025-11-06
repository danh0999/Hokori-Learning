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
} from "../../redux/features/courseSlice"; //  mock Redux slice (sau này sẽ gọi API thật)

/**
 * Trang chi tiết khóa học (Course Detail)
 * Hiện tại đang chạy DEMO bằng MOCK DATA từ Redux
 * 🔜 Sau này khi backend sẵn sàng, chỉ cần bật các dòng được note là "API MODE"
 */

const CourseDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();

  // Lấy dữ liệu khóa học từ Redux store
  const { current, list } = useSelector((state) => state.courses);

  useEffect(() => {
    // ================================================
    // 🔹 DEMO MODE — đọc từ MOCK_COURSES trong Redux
    // ================================================
    if (list?.length > 0) {
      const found = list.find((c) => c.id === Number(id));
      if (found) {
        dispatch(setCurrentCourse(found)); //  mapping sang Redux để render demo
        return;
      }
    }

    // ==========================================================
    // 🔜 API MODE — bật đoạn dưới khi backend có endpoint thật
    // ==========================================================
    // dispatch(fetchCourseById(id)); // <-- gọi API /courses/:id
  }, [id, list, dispatch]);

  // Nếu chưa có dữ liệu → hiển thị loading
  if (!current) return <div className="loading">Đang tải...</div>;

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
