import React from "react";
import styles from "./ProgressBar.module.scss";

const ProgressBar = ({ value = 0, height = 8 }) => (
  <div className={styles.track} style={{ height }}>
    <div className={styles.bar} style={{ width: `${value}%` }}></div>
  </div>
);

export default ProgressBar;
