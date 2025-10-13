import React from "react";
import { useNavigate } from "react-router-dom";
const CourseHero = ({ course }) => {
  const {
    title,
    shortDesc,
    rating,
    students,
    tags,
    teacher,
    price,
    oldPrice,
    discount,
  } = course;
  const navigate = useNavigate();
  const handleBuyNow = () => {
    navigate("/payment");
  };
  return (
    <section className="hero-section">
      <div className="container">
        {/* Video preview placeholder */}
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

        {/* Course info */}
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
            <img src={teacher.avatar} alt={teacher.name} />
            <div>
              <p>{teacher.name}</p>
              <span>{teacher.role}</span>
            </div>
          </div>

          <div className="price">
            <span className="current">{price.toLocaleString()} VNĐ</span>
            {oldPrice && (
              <>
                <span className="old">{oldPrice.toLocaleString()} VNĐ</span>
                <span className="discount">-{discount}%</span>
              </>
            )}
          </div>

          <div className="buttons">
            <button className="btn-primary">Mua khóa học ngay</button>
            <button className="btn-secondary">
              <i className="fa-solid fa-cart-shopping"></i> Thêm vào giỏ hàng
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CourseHero;
