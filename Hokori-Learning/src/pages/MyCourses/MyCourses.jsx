import React from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../MyCourses/components/Sidebar";

import Filters from "../MyCourses/components/Filters";
import CourseCard from "../MyCourses/components/CourseCard";
import styles from "./MyCourses.module.scss";

const courses = [
  {
    id: 1,
    level: "N4",
    title: "Tiếng Nhật Cơ Bản N4",
    teacher: "Sensei Tanaka",
    progress: 65,
    lessons: "13/20",
    lastStudy: "2 ngày trước",
  },
  {
    id: 2,
    level: "N3",
    title: "Kanji Thực Hành N3",
    teacher: "Sensei Yamamoto",
    progress: 100,
    lessons: "25/25",
    lastStudy: "1 tuần trước",
  },
];

const MyCourses = () => {
  const navigate = useNavigate();

  const handleContinue = (course) => {
    navigate(`/lesson/${course.id}`);
  };

  return (
    <div className={styles.layout}>
      {/* <Sidebar /> */}

      <main className={styles.main}>
        {/* Phần đầu trang (breadcrumb + heading + subheading) */}
        <div className={styles.pageHeader}>
          <nav className={styles.breadcrumb}>
            <span className={styles.link} onClick={() => navigate("/")}>
              Trang chủ
            </span>
            {" / "}
            <span>Khóa học của tôi</span>
          </nav>

          <h1 className={styles.heading}>Khóa học của tôi</h1>
          <p className={styles.subheading}> 
            Quản lý và theo dõi tiến độ học tập của bạn
          </p>
        </div>

        {/* Bộ lọc + Grid */}
        <Filters />
        <div className={styles.grid}>
          {courses.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              onContinue={() => handleContinue(c)}
            />
          ))}
        </div>
      </main>

    </div>
  );
};

export default MyCourses;