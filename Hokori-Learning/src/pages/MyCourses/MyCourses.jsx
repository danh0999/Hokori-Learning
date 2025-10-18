import React from "react";  
import Sidebar from "../MyCourses/components/Sidebar";
import AISidebar from "../MyCourses/components/AISidebar";
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
    favorite: false,
    completed: false,
  },
  {
    id: 2,
    level: "N3",
    title: "Kanji Thực Hành N3",
    teacher: "Sensei Yamamoto",
    progress: 100,
    lessons: "25/25",
    lastStudy: "1 tuần trước",
    favorite: true,
    completed: true,
  },
  {
    id: 3,
    level: "N5",
    title: "Hiragana & Katakana Mastery",
    teacher: "Sensei Sato",
    progress: 30,
    lessons: "6/20",
    lastStudy: "5 ngày trước",
    favorite: false,
    completed: false,
  },
  {
    id: 4,
    level: "N2",
    title: "Ngữ Pháp Nâng Cao N2",
    teacher: "Sensei Watanabe",
    progress: 85,
    lessons: "17/20",
    lastStudy: "1 ngày trước",
    favorite: false,
    completed: false,
  },
  {
    id: 5,
    level: "N4",
    title: "Giao Tiếp Hàng Ngày",
    teacher: "Sensei Nakamura",
    progress: 45,
    lessons: "9/20",
    lastStudy: "3 ngày trước",
    favorite: true,
    completed: false,
  },
  {
    id: 6,
    level: "N1",
    title: "Tiếng Nhật Thương Mại",
    teacher: "Sensei Kimura",
    progress: 15,
    lessons: "3/20",
    lastStudy: "1 tuần trước",
    favorite: false,
    completed: false,
  },
];

const MyCourses = () => {
  return (
    <div className={styles.layout}>
      <Sidebar />

      <main className={styles.main}>
        <header className={styles.header}>
          <h1>Khóa học của tôi</h1>
          <p>Quản lý và theo dõi tiến độ học tập của bạn</p>
        </header>

        <Filters />

        <div className={styles.grid}>
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      </main>

      <AISidebar />
    </div>
  );
};

export default MyCourses;
