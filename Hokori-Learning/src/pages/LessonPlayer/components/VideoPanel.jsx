import React, { useEffect, useRef } from "react";
import styles from "./VideoPanel.module.scss";
import { updateContentProgress } from "../../../services/learningProgressService";

const VideoPanel = ({ title, videoUrl, duration, content }) => {
  const videoRef = useRef(null);
  const lastSentRef = useRef(0);

  // ✅ resume video
  useEffect(() => {
    if (videoRef.current && content?.lastPositionSec > 0) {
      videoRef.current.currentTime = content.lastPositionSec;
    }
  }, [content]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !content?.contentId) return;

    const handleTimeUpdate = () => {
      const current = Math.floor(video.currentTime);
      if (Math.abs(current - lastSentRef.current) < 10) return;

      lastSentRef.current = current;
      updateContentProgress(content.contentId, {
        lastPositionSec: current,
      }).catch(() => {});
    };

    const handleEnded = () => {
      updateContentProgress(content.contentId, {
        isCompleted: true,
        lastPositionSec: Math.floor(video.duration),
      }).catch(() => {});
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
    };
  }, [content]);

  return (
    <div className={styles.videoBox}>
      <div className={styles.videoWrapper}>
        {videoUrl ? (
          <video
            ref={videoRef}
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
