import React from "react";
import styles from "./VideoPanel.module.scss";

const VideoPanel = ({ title }) => {
  return (
    <div className={styles.videoBox}>
      <div className={styles.overlay}>
        <i className="fa-solid fa-play"></i>
        <p>{title || "Trình phát video"}</p>
        <span>Thời lượng: 15:32</span>
      </div>
    </div>
  );
};

export default VideoPanel;
