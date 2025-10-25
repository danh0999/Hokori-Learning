import React from "react";
import styles from "./CreateDeckModal.module.scss";

const DeckPreview = ({ data }) => {
  const { name, level, type } = data;
  return (
    <div className={styles.preview}>

      <div className={styles.previewCard}>
        <div className={styles.previewHeader}>
          <div className={styles.previewIcon}>
            <i className="fa-solid fa-layer-group" />
          </div>
          <div>
            <div className={styles.previewName}>
              {name || "Bộ thẻ mới"}
            </div>
            <div className={styles.previewDesc}>
              {name ? "Đang tạo..." : "Chưa có tên"}
            </div>
          </div>
        </div>

        <div className={styles.previewDetails}>
          <div><span>Số thẻ hiện tại:</span> <span>0</span></div>
          <div><span>Tạo mới lúc:</span> <span>Hôm nay</span></div>
          <div><span>Cấp độ:</span> <span>{level || "Chưa chọn"}</span></div>
          <div><span>Loại thẻ:</span> <span>{type || "Chưa chọn"}</span></div>
        </div>
      </div>

      <div className={styles.tipBox}>
        <i className="fa-solid fa-lightbulb" />
        <p>
          Sau khi tạo bộ thẻ, bạn có thể thêm các flashcard mới và bắt đầu ôn tập ngay.
        </p>
      </div>
    </div>
  );
};

export default DeckPreview;
