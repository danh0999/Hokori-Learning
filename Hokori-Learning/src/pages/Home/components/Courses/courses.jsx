import React from "react";
import styles from "./styles.module.scss";
import { useNavigate } from "react-router-dom";

const courses = [
  {
    level: "N5",
    title: "Tiếng Nhật N5",
    desc: "Học hiragana, katakana và 800 từ vựng cơ bản nhất",
    price: "1.200.000đ",
    tag: "Cơ bản",
    link: "/courses/n5",
  },
  {
    level: "N4",
    title: "Tiếng Nhật N4",
    desc: "Mở rộng từ vựng và học ngữ pháp giao tiếp hàng ngày",
    price: "1.500.000đ",
    tag: "Sơ cấp",
    link: "/courses/n4",
  },
  {
    level: "N3",
    title: "Tiếng Nhật N3",
    desc: "Hiểu và sử dụng tiếng Nhật trong môi trường công việc",
    price: "1.800.000đ",
    tag: "Trung cấp",
    link: "/courses/n3",
  },
  {
    level: "N2",
    title: "Tiếng Nhật N2",
    desc: "Đọc hiểu báo chí và giao tiếp thành thạo",
    price: "2.200.000đ",
    tag: "Trung cao",
    link: "/courses/n2",
  },
  {
    level: "N1",
    title: "Tiếng Nhật N1",
    desc: "Thành thạo tiếng Nhật ở mức độ gần như người bản xứ",
    price: "2.800.000đ",
    tag: "Cao cấp",
    link: "/courses/n1",
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
          <div
            key={idx}
            className={styles.card}
            onClick={() => navigate(course.link)}
          >
            <div className={styles.level}>{course.level}</div>
            <div className={styles.tag}>{course.tag}</div>
            <h3 className={styles.courseTitle}>{course.title}</h3>
            <p className={styles.desc}>{course.desc}</p>
            <p className={styles.price}>{course.price}</p>
            <button className={styles.registerBtn}>Đăng ký</button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Courses;
