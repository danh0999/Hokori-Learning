  import React from "react";
  import styles from "./styles.module.scss";
  import { useNavigate } from "react-router-dom";

  const levels = [
    {
      level: "N5",
      title: "Khóa học tiếng Nhật N5",
      desc: "Bắt đầu học bảng chữ cái, từ vựng và ngữ pháp cơ bản.",
      tag: "Cơ bản",
    },
    {
      level: "N4",
      title: "Khóa học tiếng Nhật N4",
      desc: "Mở rộng vốn từ và ngữ pháp cho giao tiếp hàng ngày.",
      tag: "Sơ cấp",
    },
    {
      level: "N3",
      title: "Khóa học tiếng Nhật N3",
      desc: "Hiểu và sử dụng tiếng Nhật trong môi trường làm việc.",
      tag: "Trung cấp",
    },
    {
      level: "N2",
      title: "Khóa học tiếng Nhật N2",
      desc: "Đọc hiểu chủ đề chuyên ngành và giao tiếp thành thạo.",
      tag: "Trung cao",
    },
    {
      level: "N1",
      title: "Khóa học tiếng Nhật N1",
      desc: "Thành thạo tiếng Nhật ở mức độ gần như người bản xứ.",
      tag: "Cao cấp",
    },
  ];

  const Courses = () => {
    const navigate = useNavigate();

    const handleExplore = (level) => {
      
      navigate(`/marketplace?level=${level}`);
    };

    return (
      <section className={styles.courses}>
        <h2 className={styles.title}>Khám phá các cấp độ học tiếng Nhật</h2>
        <p className={styles.subtitle}>
          Từ cơ bản đến nâng cao, phù hợp với mọi trình độ
        </p>
        <div className={styles.grid}>
          {levels.map((item) => (
            <div key={item.level} className={styles.card}>
              <div className={styles.header}>
                <span className={styles.badge}>{item.level}</span>
                <span className={styles.tag}>{item.tag}</span>
              </div>

              <h3 className={styles.courseTitle}>{item.title}</h3>
              <p className={styles.desc}>{item.desc}</p>

              <button
                className={styles.exploreBtn}
                onClick={() => handleExplore(item.level)}
              >
                Khám phá khóa học
              </button>
            </div>
          ))}
        </div>
      </section>
    );
  };

  export default Courses;
