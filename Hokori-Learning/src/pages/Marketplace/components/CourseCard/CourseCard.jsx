import React from "react";
import styles from "./CourseCard.module.scss";
import { Button } from "../../../../components/Button/Button";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../../../../redux/features/cartSlice";
import { FaShoppingCart } from "react-icons/fa";
import { buildFileUrl } from "../../../../utils/fileUrl";


const FALLBACK_THUMB = "https://placehold.co/600x400?text=Course+Image";

export default function CourseCard({ course }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // ===============================
  //  FIELD TRẢ VỀ TỪ BACKEND
  // ===============================
  const {
    id,
    title,
    subtitle,
    description,
    priceCents,
    coverImagePath,
    userId,        // ID giáo viên — dùng để fetch tên giáo viên sau này
    teacherName,   // Nếu sau này BE / FE map tên giáo viên vào course object
  } = course;

  // ===============================
  //  UI FALLBACKS
  // ===============================

  // Thumbnail có thể cần BASE_URL từ env
  const displayThumbnail = coverImagePath
  ? buildFileUrl(coverImagePath)
  : FALLBACK_THUMB;


  // Mô tả ưu tiên subtitle > description
  const displayDescription =
    subtitle || description || "Nội dung đang được cập nhật";

  // Giá
  const displayPrice = (priceCents ?? 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });

  // Giáo viên
  const displayTeacher = teacherName || "Giáo viên đang cập nhật";

  // ===============================
  //  HANDLERS
  // ===============================
  const handleNavigate = () => navigate(`/course/${id}`);

  const handleAddToCart = () => dispatch(addToCart(course));

  return (
    <div className={styles.card}>
      {/* Thumbnail */}
      <div className={styles.thumb} onClick={handleNavigate}>
        <img
          src={displayThumbnail}
          alt={title}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      <div className={styles.body}>
        {/* Title */}
        <h3 className={styles.title} onClick={handleNavigate}>
          {title}
        </h3>

        {/* Description */}
        <p className={styles.subtitle}>{displayDescription}</p>

        {/* Giá */}
        <p className={styles.price}>{displayPrice}</p>

        {/* Giáo viên */}
        <div className={styles.teacher}>
          <span className={styles.name}>{displayTeacher}</span>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <Button
            content="Thông tin"
            onClick={handleNavigate}
            containerClassName={styles.actionItem}
            className={styles.actionButton}
          />

          <Button
            content={
              <>
                <FaShoppingCart /> Thêm vào giỏ
              </>
            }
            onClick={handleAddToCart}
            containerClassName={styles.actionItem}
            className={`${styles.actionButton} ${styles.cartButton}`}
          />
        </div>
      </div>
    </div>
  );
}
