import React from "react";
import styles from "../about.module.scss";
import { Button } from "../../../components/Button/Button";

const CTASection = () => (
  <section className={styles.cta}>
    <h2>Bắt đầu hành trình học tiếng Nhật cùng Hokori</h2>
    <p>
      Khám phá phương pháp học tiếng Nhật hiện đại và hiệu quả với sự hỗ trợ của công nghệ AI
    </p>
    <Button to="/course" content="Khám phá ngay" />
  </section>
);

export default CTASection;
