import React from "react";
import styles from "./LevelTabs.module.scss";

const LEVELS = ["Tất cả", "N5", "N4", "N3", "N2", "N1"];

export default function LevelTabs({ active, onChange }) {
  return (
    <div className={styles.tabs}>
      {LEVELS.map((level) => (
        <button
          key={level}
          type="button"
          className={`${styles.tab} ${active === level ? styles.active : ""}`}
          onClick={() => onChange(level)}
        >
          {level}
        </button>
      ))}
    </div>
  );
}
