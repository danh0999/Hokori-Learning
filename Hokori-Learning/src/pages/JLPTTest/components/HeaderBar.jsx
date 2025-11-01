import React, { useMemo } from "react";
import styles from "./HeaderBar.module.scss";

const HeaderBar = ({ title, remainingSeconds, onSubmit }) => {
  const formattedTime = useMemo(() => {
    const mm = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
    const ss = String(remainingSeconds % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }, [remainingSeconds]);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <h1>{title}</h1>
        <div className={styles.right}>
          <div className={styles.timer}>
            <i className="fa-regular fa-clock" />
            <span>{formattedTime}</span>
          </div>
          <button onClick={onSubmit}>Nộp bài</button>
        </div>
      </div>
    </header>
  );
};

export default HeaderBar;
