// src/pages/Marketplace/components/CourseGrid/CourseCard.jsx
import React from "react";
import styles from "./CourseCard.module.scss";
import { Button } from "../../../../components/Button/Button";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../../../../redux/features/cartSlice";
import { FaShoppingCart } from "react-icons/fa";
import { buildFileUrl } from "../../../../utils/fileUrl";
import api from "../../../../configs/axios";

const FALLBACK_THUMB = "https://placehold.co/600x400?text=Course+Image";
const slugify = (str = "") =>
  str
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "") || "khoa-hoc";

export default function CourseCard({ course }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const user = useSelector((state) => state.user);
  const isLoggedIn = !!user;

  // Lấy items từ cart trong Redux
  const cartItems = useSelector((state) => state.cart?.items || []);

  const {
    id,
    title,
    subtitle,
    description,
    level,
    priceCents,
    discountedPriceCents,
    coverImagePath,
    teacherName,
    enrollCount,
    isEnrolled, // BE trả
  } = course;

  // Kiểm tra course này đã nằm trong giỏ chưa
  const isInCart = cartItems.some(
    (item) => item.courseId === id || item.id === id
  );
  if (!course) return null;
  // ===============================
  //  PRICE & THUMBNAIL
  // ===============================
  const thumbnail = coverImagePath
    ? buildFileUrl(coverImagePath)
    : FALLBACK_THUMB;

  const desc = subtitle || description || "Nội dung đang được cập nhật";

  // BE trả priceCents là tiền VND → không chia 100
  const effectivePrice =
    discountedPriceCents && discountedPriceCents > 0
      ? discountedPriceCents
      : priceCents || 0;

  const isFree = effectivePrice === 0;

  const displayPrice = isFree
    ? "Miễn phí"
    : Number(effectivePrice).toLocaleString("vi-VN") + " VND";

  const teacher = teacherName || "Giáo viên đang cập nhật";

  // ===============================
  //  LEARN ACCESS LOGIC
  // ===============================
  const canLearn = isEnrolled || (isFree && isLoggedIn);

  const handleNavigateCourse = () => navigate(`/course/${id}`);
  const openLearnEntry = async (courseId, courseTitle) => {
    const slug = slugify(courseTitle);

    const treeRes = await api.get(`/learner/courses/${courseId}/learning-tree`);
    const tree = treeRes.data;

    const chapters = tree?.chapters ?? [];
    if (!chapters.length) {
      alert("Khóa học chưa có nội dung.");
      return;
    }

    const trialChapter = chapters.find((c) => Number(c.orderIndex) === 0);
    const nonTrial = chapters
      .filter((c) => Number(c.orderIndex) > 0)
      .sort((a, b) => Number(a.orderIndex) - Number(b.orderIndex));

    // ✅ chỉ có trial -> qua TrialPage, KHÔNG vào LearningTree
    if (nonTrial.length === 0) {
      if (trialChapter?.chapterId) {
        navigate(`/course/${courseId}/trial-lesson/${trialChapter.chapterId}`);
        return;
      }
      alert("Khóa học chưa có chương để học.");
      return;
    }

    // ✅ có chapter học thật -> vào LearningTreePage đúng chapterIndex (không hardcode 1)
    const firstNonTrial = nonTrial[0];
    navigate(
      `/learn/${courseId}/${slug}/home/chapter/${firstNonTrial.orderIndex}`
    );
  };

  const handleLearn = async () => {
    try {
      // Nếu đã enroll → vào học luôn (đi đúng entry)
      if (isEnrolled) {
        await openLearnEntry(id, course.title);
        return;
      }

      // FREE + logged in → enroll rồi vào học
      if (isFree && isLoggedIn) {
        await api.post(`/learner/courses/${id}/enroll`);
        await openLearnEntry(id, course.title);
        return;
      }

      // FREE nhưng guest → login
      if (isFree && !isLoggedIn) {
        navigate("/login");
        return;
      }
    } catch (error) {
      console.error("Enroll/learn failed:", error);
      alert("Không thể vào học. Vui lòng thử lại.");
    }
  };

  const handleLoginForFree = () => navigate("/login");

  const handleAddToCart = () => {
    // Đã sở hữu, miễn phí, hoặc đã nằm trong giỏ → không thêm nữa
    if (canLearn || isFree || isInCart) return;
    dispatch(addToCart(course));
  };

  // ===============================
  //  UI
  // ===============================
  return (
    <div className={styles.card}>
      <div className={styles.thumb} onClick={handleNavigateCourse}>
        <img src={thumbnail} alt={title} />

        {isEnrolled && <div className={styles.badgeOwned}>ĐÃ SỞ HỮU</div>}
        {isFree && !isEnrolled && <div className={styles.badgeFree}>FREE</div>}
      </div>

      <div className={styles.body}>
        <h3 className={styles.title} onClick={handleNavigateCourse}>
          {title}
        </h3>

        <p className={styles.subtitle}>{desc}</p>

        <div className={styles.meta}>
          {level && <span className={styles.chip}>Trình độ {level}</span>}
          {typeof enrollCount === "number" && (
            <span className={styles.chip}>{enrollCount} học viên</span>
          )}
        </div>

        <div className={styles.priceRow}>
          <span
            className={`${styles.priceCurrent} ${
              isFree ? styles.priceFree : ""
            }`}
          >
            {displayPrice}
          </span>
        </div>

        <div className={styles.teacher}>
          <span className={styles.teacherName}>{teacher}</span>
        </div>

        <div className={styles.actions}>
          {/* nút xem thông tin course */}
          <Button
            content="Thông tin"
            onClick={handleNavigateCourse}
            className={styles.actionButton}
          />

          {/* FREE + logged in → học luôn */}
          {canLearn ? (
            <Button
              content="Vào học"
              onClick={handleLearn}
              className={`${styles.actionButton} ${styles.learnButton}`}
            />
          ) : isFree && !isLoggedIn ? (
            // FREE nhưng guest → yêu cầu login
            <Button
              content="Đăng nhập để học miễn phí"
              onClick={handleLoginForFree}
              className={`${styles.actionButton} ${styles.loginButton}`}
            />
          ) : (
            // Course trả phí → add to cart
            <Button
              content={
                isInCart ? (
                  "Đã thêm vào giỏ"
                ) : (
                  <>
                    <FaShoppingCart /> Thêm vào giỏ
                  </>
                )
              }
              onClick={handleAddToCart}
              disabled={isInCart}
              className={`${styles.actionButton} ${styles.cartButton} ${
                isInCart ? styles.cartButtonDisabled : ""
              }`}
            />
          )}
        </div>
      </div>
    </div>
  );
}
