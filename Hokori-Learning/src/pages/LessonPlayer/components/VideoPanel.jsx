import React, { useEffect, useState } from "react";
import styles from "./VideoPanel.module.scss";

const VideoPanel = ({ title }) => {
  const [videoUrl, setVideoUrl] = useState("");

  useEffect(() => {
    // ⚙️ [MOCK DATA - sẽ xóa khi call API thật]
    // Giả lập dữ liệu video trả về từ API
    const mockVideo = {
      // 👉 sau này backend sẽ trả link video thật (YouTube, Vimeo, hoặc storage link)
      youtubeUrl:
        "https://www.youtube.com/embed/BtHPRX-3DaA?si=ECctCUM3U0tQhc4d",
      duration: "15:32",
    };
    setVideoUrl(mockVideo.youtubeUrl);
    // ❌ [END MOCK] — khi có API, xoá đoạn trên và thay bằng call API: fetch(`/api/lesson/${lessonId}`)
  }, []);

  return (
    <div className={styles.videoBox}>
      <div className={styles.videoWrapper}>
        {videoUrl ? (
          <iframe
            src={videoUrl}
            title={title || "Bài học demo"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className={styles.videoFrame}
          ></iframe>
        ) : (
          <div className={styles.videoPlaceholder}>
            <p>Đang tải video...</p>
          </div>
        )}
      </div>

      <div className={styles.videoInfo}>
        <p className={styles.videoTitle}>{title || "Trình phát video"}</p>
        <span className={styles.videoDuration}>Thời lượng: 15:32</span>
      </div>
    </div>
  );
};

export default VideoPanel;
