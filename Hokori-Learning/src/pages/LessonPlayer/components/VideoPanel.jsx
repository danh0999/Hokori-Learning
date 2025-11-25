import React from "react";
import styles from "./VideoPanel.module.scss";

const VideoPanel = ({ title, videoUrl, duration }) => {
  return (
    <div className={styles.videoBox}>
      <div className={styles.videoWrapper}>
        {videoUrl ? (
          <video
            src={videoUrl}
            controls
            className={styles.videoFrame}
          />
        ) : (
          <div className={styles.videoPlaceholder}>Đang tải video...</div>
        )}
      </div>

      <div className={styles.videoInfo}>
        <p className={styles.videoTitle}>{title || "Trình phát video"}</p>
        <span className={styles.videoDuration}>
          Thời lượng: {duration ? `${duration} giây` : "Đang cập nhật"}
        </span>
      </div>
    </div>
  );
};

export default VideoPanel;
