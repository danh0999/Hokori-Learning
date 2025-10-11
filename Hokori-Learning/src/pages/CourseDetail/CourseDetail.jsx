import React, { useEffect, useState } from "react";
import "./CourseDetail.scss";
import CourseHero from "./components/CourseHero";
import CourseOverview from "./components/CourseOverview";
import CourseFeedback from "./components/CourseFeedback";

// Giả sử sau này dùng useParams() để lấy courseId từ URL
// import { useParams } from "react-router-dom";

const CourseDetail = () => {
  const [course, setCourse] = useState(null);

  useEffect(() => {
    // sau này thay bằng API thật: fetch(`/api/courses/${id}`)
    const mockData = {
      id: 1,
      title: "JLPT N5 – Nền tảng tiếng Nhật",
      shortDesc: "Khóa học cơ bản dành cho người mới bắt đầu học tiếng Nhật",
      rating: 4.8,
      students: 1200,
      tags: ["Bán chạy", "Kèm AI"],
      price: 1200000,
      oldPrice: 1800000,
      discount: 33,
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?si=kT5iO2icHtEmXA2r",
      teacher: {
        name: "Sensei Tanaka",
        role: "Chuyên gia tiếng Nhật",
        avatar:
          "https://thumbs.dreamstime.com/b/teacher-icon-vector-male-person-profile-avatar-book-teaching-school-college-university-education-glyph-113755262.jpg",
      },
      overview: {
        intro: [
          "Khóa học JLPT N5 được thiết kế dành cho người mới bắt đầu...",
          "Với phương pháp giảng dạy hiện đại kết hợp công nghệ AI...",
        ],
        features: [
          { icon: "fa-headphones", title: "Luyện nghe", desc: "Nghe hiểu" },
          { icon: "fa-comments", title: "Kaiwa thực tế", desc: "Hội thoại" },
          { icon: "fa-brain", title: "Từ vựng AI", desc: "Gợi ý thông minh" },
        ],
      },
      chapters: [
        { title: "Giới thiệu Hiragana", lessons: 5, time: "45 phút" },
        { title: "Katakana cơ bản", lessons: 4, time: "35 phút" },
      ],
      info: {
        totalVideos: 23,
        duration: "3.5 giờ",
        level: "Sơ cấp",
        certificate: true,
      },
      instructor: {
        name: "Sensei Tanaka",
        bio: "Chuyên gia giảng dạy tiếng Nhật với hơn 10 năm kinh nghiệm.",
        stats: { students: 15000, rating: 4.9, courses: 25 },
      },
      reviews: [],
      relatedCourses: [],
    };

    setCourse(mockData);
  }, []);

  if (!course) return <div>Loading...</div>;

  return (
    <main className="course-detail">
      <CourseHero course={course} />
      <CourseOverview course={course} />
      <CourseFeedback course={course} />
    </main>
  );
};

export default CourseDetail;
