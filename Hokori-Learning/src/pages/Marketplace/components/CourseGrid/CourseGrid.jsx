import React from "react";
import styles from "./CourseGrid.module.scss";
import CourseCard from "../CourseCard/CourseCard";

export default function CourseGrid({ courses }) {
  return (
    <div className={styles.grid}>
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
