import React from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addItem } from "../../../redux/features/cartSlice";
import { message } from "antd";

const CourseHero = ({ course }) => {
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  if (!course) return <div>Loading...</div>;

  const {
    title,
    shortDesc,
    rating,
    students,
    tags,
    price,
    oldPrice,
    discount,
  } = course;

  const handleBuyNow = () => {
    dispatch(addItem(course));
    navigate("/cart");
  };

  const handleAddToCart = () => {
    dispatch(addItem(course));
    message.success("Đã thêm khóa học vào giỏ hàng!");
  };

  return (
    <section className="hero-section">
      <div className="container">
        {/* Video preview */}
        <div className="video-preview">
          {course.videoUrl ? (
            <iframe
              className="video-frame"
              src={course.videoUrl}
              title={course.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
            ></iframe>
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
            {tags?.map((tag, idx) => (
              <span key={idx}>{tag}</span>
            ))}
          </div>

          <h1>{title}</h1>
          <p className="desc">{shortDesc}</p>

          <div className="rating">
            <div className="stars">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <i key={i} className="fa-solid fa-star"></i>
                ))}
            </div>
            <span>
              {rating} ({students} học viên)
            </span>
          </div>

          <div className="teacher">
            <img
              src={
                course.teacherAvatar ||
                "https://cdn-icons-png.flaticon.com/512/4140/4140048.png"
              }
              alt={course.teacher || "Giảng viên"}
              onError={(e) =>
                (e.target.src =
                  "https://cdn-icons-png.flaticon.com/512/4140/4140048.png")
              }
            />
            <div>
              <p>{course.teacher}</p>
              <span>Giảng viên</span>
            </div>
          </div>

          {/* SAFE PRICE */}
          <div className="price">
            <span className="current">
              {(Number(price) || 0).toLocaleString()} VNĐ
            </span>

            {oldPrice && (
              <>
                <span className="old">
                  {(Number(oldPrice) || 0).toLocaleString()} VNĐ
                </span>
                <span className="discount">-{discount || 0}%</span>
              </>
            )}
          </div>

          <div className="buttons">
            <button className="btn-primary" onClick={handleBuyNow}>
              Mua khóa học ngay
            </button>
            <button className="btn-secondary" onClick={handleAddToCart}>
              <i className="fa-solid fa-cart-shopping"></i> Thêm vào giỏ hàng
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CourseHero;
