import React from "react";
import styles from "./LessonContent.module.scss";
import VideoPanel from "./VideoPanel";

const LessonContent = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className={styles.placeholder}>Nội dung đang được cập nhật...</div>;
  }

  return (
    <div className={styles.content}>
      <h3 className={styles.heading}>Nội dung bài học</h3>

      {data.map((section) => (
        <div key={section.id} className={styles.section}>
          <h4 className={styles.title}>{section.title}</h4>

          {section.contents?.map((c) => {
            // 1️⃣ Video
            if (
              c.contentFormat === "ASSET" &&
              c.filePath &&
              c.filePath.match(/\.(mp4|mov|webm)$/i)
            ) {
              return (
                <VideoPanel
                  key={c.id}
                  videoUrl={`${import.meta.env.VITE_ASSET_BASE_URL}/${c.filePath}`}
                />
              );
            }

            // 2️⃣ Hình ảnh
            if (
              c.contentFormat === "ASSET" &&
              c.filePath &&
              c.filePath.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)
            ) {
              return (
                <img
                  key={c.id}
                  src={`${import.meta.env.VITE_ASSET_BASE_URL}/${c.filePath}`}
                  className={styles.image}
                  alt="Lesson asset"
                />
              );
            }

            // 3️⃣ Text
            if (c.contentFormat === "RICH_TEXT" && c.richText) {
              return (
                <p key={c.id} className={styles.text}>
                  {c.richText}
                </p>
              );
            }

            return null;
          })}
        </div>
      ))}
    </div>
  );
};

export default LessonContent;
