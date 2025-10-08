import React from "react";
import styles from "./styles.module.scss";
import { useNavigate } from "react-router-dom";

const courses = [
  {
    level: "n5",
    title: "Tiếng Nhật N5",
    desc: "Học hiragana, katakana và 800 từ vựng cơ bản nhất",
    price: "1.200.000đ",
    tag: "Cơ bản",
  },
  {
    level: "n4",
    title: "Tiếng Nhật N4",
    desc: "Mở rộng từ vựng và học ngữ pháp giao tiếp hàng ngày",
    price: "1.500.000đ",
    tag: "Sơ cấp",
  },
  {
    level: "n3",
    title: "Tiếng Nhật N3",
    desc: "Hiểu và sử dụng tiếng Nhật trong môi trường công việc",
    price: "1.800.000đ",
    tag: "Trung cấp",
  },
  {
    level: "n2",
    title: "Tiếng Nhật N2",
    desc: "Đọc hiểu báo chí và giao tiếp thành thạo",
    price: "2.200.000đ",
    tag: "Trung cao",
  },
  {
    level: "n1",
    title: "Tiếng Nhật N1",
    desc: "Thành thạo tiếng Nhật ở mức độ gần như người bản xứ",
    price: "2.800.000đ",
    tag: "Cao cấp",
  },
];

const Courses = () => {
  const navigate = useNavigate();

  return (
    <section className={styles.courses}>
      <h2 className={styles.title}>Khóa học tiếng Nhật</h2>
      <p className={styles.subtitle}>
        Từ cơ bản đến nâng cao, phù hợp với mọi trình độ
      </p>
      <div className={styles.grid}>
        {courses.map((course, idx) => (
          <div key={idx} className={styles.card}>
            <div className={styles.level}>{course.level.toUpperCase()}</div>
            <div className={styles.tag}>{course.tag}</div>
            <h3 className={styles.courseTitle}>{course.title}</h3>
            <p className={styles.desc}>{course.desc}</p>
            <p className={styles.price}>{course.price}</p>
            <button
              className={styles.registerBtn}
              onClick={() => navigate(`/course/${course.level}`)}
            >
              Đăng ký
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Courses;
