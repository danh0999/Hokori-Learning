import React from "react";
import styles from "./styles.module.scss";
import { SearchBar } from "../../components/SearchBar/SearchBar";
import { CourseSection } from "./components/CourseSection";

export const CoursePage = () => {
  const { container, header, title, subtitle, sections } = styles;

  return (
    <main className={container}>
      <div className={header}>
        <h1 className={title}>Tổng hợp trình độ tiếng Nhật</h1>
        <p className={subtitle}>
          Học tiếng Nhật từ cơ bản đến nâng cao với hệ thống bài học chất lượng
        </p>
      </div>

      <SearchBar placeholder="Nhập từ khóa và tìm kiếm" />

      <div className={sections}>
        <CourseSection level="N5" label="Cơ bản" />
        <CourseSection level="N4" label="Sơ cấp" />
        <CourseSection level="N3" label="Trung cấp" />
        <CourseSection level="N2" label="Khá" />
        <CourseSection level="N1" label="Cao cấp" />
      </div>
    </main>
  );
};
