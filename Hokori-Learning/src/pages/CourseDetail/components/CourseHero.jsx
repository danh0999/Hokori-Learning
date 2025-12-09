// src/pages/CourseDetail/components/CourseHero.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { message } from "antd";
import { toast } from "react-toastify";

import { addToCart } from "../../../redux/features/cartSlice";
import { buildFileUrl } from "../../../utils/fileUrl";
import api from "../../../configs/axios";

const formatMoney = (value) => (Number(value) || 0).toLocaleString("vi-VN");

const CourseHero = ({ course }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  if (!course) return <div>Loading...</div>;

  // ====== MAP FIELD TỪ COURSE ======
  const {
    id,
    title,
    subtitle,
    description,
    level,
    priceCents,
    discountedPriceCents,
    currency,
    isEnrolled,
  } = course;

  // Giá hiện tại & giá gốc (BE đang dùng VND bình thường)
  const hasDiscount = Number(discountedPriceCents) > 0;
  const currentPrice = hasDiscount
    ? Number(discountedPriceCents)
    : Number(priceCents ?? 0);
  const originalPrice = hasDiscount ? Number(priceCents ?? 0) : null;

  const discountPercent =
    hasDiscount && priceCents
      ? Math.round(
          (1 - Number(discountedPriceCents) / Number(priceCents)) * 100
        )
      : null;

  const isFree = currentPrice === 0;
  const enrolled = !!isEnrolled;

  const rating = Number(course.rating) || 4.8;
  const students = Number(course.studentCount) || 1200;
  const tags = Array.isArray(course.tags) ? course.tags : [];

  const teacherName = course.teacherName || "Giảng viên Hokori";
  const teacherAvatar =
    course.teacherAvatar ||
    "https://cdn-icons-png.flaticon.com/512/4140/4140048.png";

  // Object để gửi cho cart API (FE có thể dùng luôn nếu cần)
  const courseForCart = {
    id,
    title,
    shortDesc: subtitle || description || "",
    price: currentPrice,
    oldPrice: originalPrice,
    discount: discountPercent,
    teacher: teacherName,
    teacherAvatar,
    level,
  };

  // --- LẤY TOKEN ĐỂ CHECK GUEST ---
  const token =
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  const isGuest = !token;

  /* ================= HANDLERS ================ */

  // 1. “Vào học ngay” khi đã sở hữu → giống MyCourses
  const handleGoToLearning = () => {
    if (isGuest) {
      toast.error("Vui lòng đăng nhập để vào học.");
      navigate("/login");
      return;
    }

    // Giống MyCourses: /my-courses/:courseId/learn
    navigate(`/my-courses/${id}/learn`);
  };

  // 2. Đăng ký khóa **miễn phí**
  const handleEnrollFree = async () => {
    if (isGuest) {
      toast.error("Vui lòng đăng nhập để đăng ký khóa học.");
      navigate("/login");
      return;
    }

    try {
      await api.post(`/learner/courses/${id}/enroll`);
      toast.success(
        "Đăng ký thành công! Khóa học đã được thêm vào danh sách Khóa học của tôi."
      );

      // ⬇️ Sau khi đăng ký xong → quay về trang "Khóa học của tôi"
      navigate("/my-courses");
    } catch (err) {
      console.error(err);
      toast.error("Không thể đăng ký khóa học. Vui lòng thử lại.");
    }
  };

  // 3. Thêm vào giỏ hàng
  const handleAddToCart = async () => {
    if (isGuest) {
      toast.error("Vui lòng đăng nhập để thêm khóa học vào giỏ.");
      navigate("/login");
      return;
    }

    try {
      await dispatch(addToCart(courseForCart)).unwrap();
      // toast đã được xử lý trong thunk (nếu bạn có)
    } catch (err) {
      console.error(err);
    }
  };

  // 4. Mua ngay
  const handleBuyNow = async () => {
    if (isGuest) {
      toast.error("Vui lòng đăng nhập để mua khóa học.");
      navigate("/login");
      return;
    }

    try {
      await dispatch(addToCart(courseForCart)).unwrap();
      navigate("/cart");
    } catch (err) {
      console.error(err);
      message.error("Không thể thêm khóa học vào giỏ hàng.");
    }
  };

  /* ============== TÍNH NÚT HIỂN THỊ ============== */

  let primaryLabel = "";
  let primaryAction = () => {};
  let showSecondaryCartBtn = false;

  if (enrolled) {
    primaryLabel = "Vào học ngay";
    primaryAction = handleGoToLearning;
    showSecondaryCartBtn = false;
  } else if (isFree) {
    primaryLabel = "Đăng ký học miễn phí";
    primaryAction = handleEnrollFree;
    showSecondaryCartBtn = false;
  } else {
    primaryLabel = "Mua khóa học ngay";
    primaryAction = handleBuyNow;
    showSecondaryCartBtn = true;
  }

  return (
    <section className="hero-section">
      <div className="container">
        {/* Video / Cover */}
        <div className="video-preview">
          {course.videoUrl ? (
            <iframe
              src={course.videoUrl}
              title={course.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : course.coverImagePath ? (
            <img
              src={buildFileUrl(course.coverImagePath)}
              alt={course.title}
              className="cover-image"
              onError={(e) => {
                e.target.src =
                  "https://cdn-icons-png.flaticon.com/512/4140/4140048.png";
              }}
            />
          ) : (
            <div className="overlay">
              <i className="fa-solid fa-play play-icon"></i>
              <p>Preview video</p>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="info">
          <div className="tags">
            {level && <span>{level}</span>}
            {tags.map((tag, idx) => (
              <span key={idx}>{tag}</span>
            ))}
            {enrolled && <span className="tag-owned">Đã sở hữu</span>}
          </div>

          <h1>{title}</h1>
          <p className="desc">
            {subtitle || description || "Mô tả khóa học đang cập nhật."}
          </p>

          <div className="rating">
            <div className="stars">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <i key={i} className="fa-solid fa-star"></i>
                ))}
            </div>
            <span>
              {rating.toFixed(1)} ({students.toLocaleString("vi-VN")} học viên)
            </span>
          </div>

          <div className="teacher">
            <img
              src={teacherAvatar}
              alt={teacherName}
              onError={(e) => {
                e.target.src =
                  "https://cdn-icons-png.flaticon.com/512/4140/4140048.png";
              }}
            />
            <div>
              <p>{teacherName}</p>
              <span>Giảng viên</span>
            </div>
          </div>

          {/* PRICE */}
          {!isFree && (
            <div className="price">
              <span className="current">
                {formatMoney(currentPrice)} {currency || "VNĐ"}
              </span>

              {originalPrice != null && (
                <>
                  <span className="old">
                    {formatMoney(originalPrice)} {currency || "VNĐ"}
                  </span>
                  {discountPercent != null && (
                    <span className="discount">-{discountPercent}%</span>
                  )}
                </>
              )}
            </div>
          )}
          {isFree && (
            <div className="price price--free">
              <span className="current">Miễn phí</span>
            </div>
          )}

          {/* BUTTONS */}
          <div className="buttons">
            <button className="btn-primary" onClick={primaryAction}>
              {primaryLabel}
            </button>

            {showSecondaryCartBtn && (
              <button className="btn-secondary" onClick={handleAddToCart}>
                <i className="fa-solid fa-cart-shopping"></i> Thêm vào giỏ hàng
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CourseHero;
