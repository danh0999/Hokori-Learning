import React from "react";
import styles from "./styles.module.scss";
import { SearchBar } from "../../components/SearchBar/SearchBar";
import { LessonSection } from "./components/LessonSection";

export const LessonsPage = () => {
  const { container, header, title, subtitle, sections } = styles;

  return (
    <main className={container}>
      <div className={header}>
        <h1 className={title}>Bài học tiếng Nhật</h1>
        <p className={subtitle}>
          Học tiếng Nhật từ cơ bản đến nâng cao với hệ thống bài học chất lượng
        </p>
      </div>

      <SearchBar placeholder="Nhập từ khóa và tìm kiếm" />

      <div className={sections}>
        <LessonSection level="N5" label="Cơ bản" />
        <LessonSection level="N4" label="Sơ cấp" />
        <LessonSection level="N3" label="Trung cấp" />
        <LessonSection level="N2" label="Khá" />
        <LessonSection level="N1" label="Cao cấp" />
      </div>
    </main>
  );
};
