import React from "react";
import styles from "./FooterProgress.module.scss";

const FooterProgress = ({ pct }) => (
  <footer className={styles.footer}>
    <div className={styles.top}>
      <span>Tiến độ hoàn thành</span>
      <span>{pct}%</span>
    </div>
    <div className={styles.track}>
      <div className={styles.bar} style={{ width: `${pct}%` }} />
    </div>
  </footer>
);

export default FooterProgress;
