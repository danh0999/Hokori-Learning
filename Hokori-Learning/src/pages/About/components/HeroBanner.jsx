import React from "react";
import styles from "../about.module.scss";

const HeroBanner = () => (
  <section className={styles.heroBanner}>
    <div className={styles.heroContent}>
      <h1>Về Hokori</h1>
      <p>Nền tảng học tiếng Nhật trực tuyến dành cho người Việt</p>
    </div>
  </section>
);

export default HeroBanner;
