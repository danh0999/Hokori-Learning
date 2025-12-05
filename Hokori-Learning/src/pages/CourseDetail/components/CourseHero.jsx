// src/pages/CourseDetail/components/CourseHero.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addItem } from "../../../redux/features/cartSlice";
import { message } from "antd";
import { buildFileUrl } from "../../../utils/fileUrl";
import api from "../../../configs/axios"; // axios có token
import { toast } from "react-toastify";

const formatMoney = (value) => (Number(value) || 0).toLocaleString("vi-VN");

const CourseHero = ({ course }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  if (!course) return <div>Loading...</div>;

  // ====== MAP TỪ TREE SANG CÁC FIELD DÙNG CHO UI ======
  const {
    title,
    subtitle,
    description,
    level,
    priceInCents,
    discountedPriceCents,
    currency,
  } = course;

  // Giá hiện tại & giá gốc
  const currentPrice = (discountedPriceCents ?? priceInCents ?? 0) / 100;
  const originalPrice =
    discountedPriceCents != null ? (priceInCents ?? 0) / 100 : null;

  const discountPercent =
    discountedPriceCents != null && priceInCents
      ? Math.round((1 - discountedPriceCents / priceInCents) * 100)
      : null;

  // Mock dữ liệu rating / students nếu BE chưa có
  const rating = Number(course.rating) || 4.8;
  const students = Number(course.studentCount) || 1200;

  // Tags: nếu có tags từ BE thì dùng, không thì để mảng rỗng
  const tags = Array.isArray(course.tags) ? course.tags : [];

  // Video preview: tạm dùng coverImagePath / null
  // const videoUrl = course.previewVideoUrl || null;

  // Thông tin giảng viên: BE /tree chưa có nên dùng placeholder
  const teacherName = course.teacherName || "Giảng viên Hokori";
  const teacherAvatar =
    course.teacherAvatar ||
    "https://cdn-icons-png.flaticon.com/512/4140/4140048.png";

  // Object sẽ đưa vào cart (tạm thời)
  const courseForCart = {
    id: course.id,
    title: course.title,
    shortDesc: subtitle || description || "",
    price: currentPrice,
    oldPrice: originalPrice,
    discount: discountPercent,
    teacher: teacherName,
    teacherAvatar,
    level,
  };

  const handleBuyNow = () => {
    dispatch(addItem(courseForCart));
    navigate("/cart");
  };

  const handleAddToCart = () => {
    dispatch(addItem(courseForCart));
    message.success("Đã thêm khóa học vào giỏ hàng!");
  };

  const handleEnroll = async () => {
  try {
    // 1. Nếu giá > 0 → redirect checkout (sau này)
    if (currentPrice > 0) {
      // TODO: redirect checkout page
      dispatch(addItem(courseForCart));
      navigate("/cart");
      return;
    }

    // 2. FREE COURSE → kiểm tra enrollment trước
    try {
      await api.get(`/learner/courses/${course.id}/enrollment`);
      // Nếu trả về 200 → đã enroll
      return redirectToFirstLesson();
    } catch (err) {
      if (err?.response?.status !== 403) throw err;
      // 403 = chưa enroll → tiếp tục
    }

    // 3. Gọi enroll
    await api.post(`/learner/courses/${course.id}/enroll`);
    toast.success("Enroll thành công!");

    // 4. Redirect đến bài học đầu tiên
    return redirectToFirstLesson();
  } catch (err) {
    console.error(err);
    toast.error("Không thể enroll khóa học.");
  }
};

const redirectToFirstLesson = async () => {
  try {
    const lessonsRes = await api.get(`/learner/courses/${course.id}/lessons`);
    const lessons = lessonsRes.data ?? [];

    if (!lessons.length) {
      toast.error("Khóa học chưa có bài học.");
      return;
    }

    // Sắp xếp bài học theo orderIndex
    const firstLesson = lessons.sort((a, b) => a.orderIndex - b.orderIndex)[0];
    const lessonId = firstLesson.lessonId ?? firstLesson.id;

    // Navigate vào bài học đầu tiên
    navigate(`/course/${course.id}/lesson/${lessonId}`);
  } catch (err) {
    console.error(err);
    toast.error("Không thể điều hướng vào bài học đầu tiên.");
  }
};



  return (
    <section className="hero-section">
      <div className="container">
        {/* Video preview */}
        <div className="video-preview">
          {course.videoUrl ? (
            <iframe /* ... */ />
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

          <div className="buttons">
    <button className="btn-primary" onClick={handleEnroll}>
        {currentPrice === 0 ? "Enroll" : "Mua khóa học ngay"}
    </button>

    {/* Nếu free thì KHÔNG hiển thị giỏ hàng */}
    {currentPrice > 0 && (
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
