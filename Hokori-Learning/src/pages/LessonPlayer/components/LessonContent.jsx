// src/pages/LessonPlayer/components/LessonContent.jsx
import React from "react";
import styles from "./LessonContent.module.scss";

const LessonContent = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className={styles.placeholder}>Nội dung đang được cập nhật...</div>;
  }

  return (
    <div className={styles.content}>
      {data.map((section) => {
        // --- 1. Lọc danh sách content hợp lệ ---
        const validContents = section.contents?.filter(c => {
            if (!c) return false;
            // Video: Bỏ qua vì đã hiện ở Player chính (tránh trùng lặp)
            if (c.contentFormat === 'ASSET' && c.filePath?.match(/\.(mp4|mov|webm)$/i)) return false;
            
            // Ảnh: Phải có filePath thực sự
            if (c.contentFormat === 'ASSET') return Boolean(c.filePath);
            
            // Text: Phải có nội dung chữ
            if (c.contentFormat === 'RICH_TEXT') return Boolean(c.richText);
            
            return false;
        }) || [];

        // --- 2. Kiểm tra xem có content nào để hiển thị không ---
        const hasContent = validContents.length > 0;

        return (
          <div key={section.sectionId || section.id} className={styles.section}>
            <h4 className={styles.title}>{section.title}</h4>

            {hasContent ? (
              // CASE A: Có nội dung -> Render từng khối
              validContents.map((c) => {
                const contentIdStr = `content-${c.id || c.contentId}`; 

                // Render Ảnh
                if (c.contentFormat === "ASSET") {
                  return (
                    <div key={c.id || c.contentId} className={styles.block}>
                        <img
                          id={contentIdStr}
                          src={`${import.meta.env.VITE_ASSET_BASE_URL}/${c.filePath}`}
                          className={styles.image}
                          alt="Lesson asset"
                          // Thêm xử lý lỗi ảnh chết để ẩn đi nếu link 404
                          onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.style.display = 'none'; // Ẩn luôn cả block cha
                          }}
                        />
                    </div>
                  );
                }

                // Render Text
                if (c.contentFormat === "RICH_TEXT") {
                  return (
                    <div key={c.id || c.contentId} id={contentIdStr} className={`${styles.block} ${styles.text}`}>
                      <div dangerouslySetInnerHTML={{ __html: c.richText }} />
                    </div>
                  );
                }
                
                return null;
              })
            ) : (
              // CASE B: Không có nội dung -> Hiện Empty State như Trial
              <div className={styles.emptyState}>
                 Phần này chưa có nội dung bổ sung.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default LessonContent;