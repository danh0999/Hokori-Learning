import React from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../../../redux/features/cartSlice";
import { message } from "antd";

const CourseHero = ({ course }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleAddToCart = async () => {
    try {
      await dispatch(addToCart(course.id)).unwrap();
      message.success(" Đã thêm khóa học vào giỏ hàng!");
    } catch (err) {
      message.error("Không thể thêm vào giỏ hàng!");
    }
  };

  const handleBuyNow = async () => {
    try {
      await dispatch(addToCart(course.id)).unwrap();
      navigate("/cart");
    } catch (err) {
      message.error("Không thể mua khóa học!");
    }
  };

  return (
    <section className="hero-section">
      <div className="container">
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

        <div className="info">
          <h1>{course.title}</h1>
          <p className="desc">{course.shortDesc}</p>

          <div className="teacher">
            <img
              src={
                course.teacherAvatar ||
                "https://cdn-icons-png.flaticon.com/512/4140/4140048.png"
              }
              alt={course.teacher}
            />
            <div>
              <p>{course.teacher}</p>
              <span>Giảng viên</span>
            </div>
          </div>

          <div className="price">
            <span className="current">{course.price.toLocaleString()} VNĐ</span>
          </div>

          <div className="buttons">
            <button className="btn-primary" onClick={handleBuyNow}>
              Mua ngay
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
