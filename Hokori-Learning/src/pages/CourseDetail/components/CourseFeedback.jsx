// src/pages/CourseDetail/components/CourseFeedback.jsx
import React from "react";

const CourseFeedback = ({ course }) => {
  //  Đảm bảo luôn là mảng, kể cả khi backend / mock không trả về
  const reviews = Array.isArray(course?.reviews) ? course.reviews : [];

  return (
    <section className="feedback-section">
      <div className="container">
        <h2>Đánh giá từ học viên</h2>
        <div className="reviews">
          {reviews.length === 0 ? (
            <p>Chưa có đánh giá nào</p>
          ) : (
            reviews.map((r, i) => (
              <div key={i} className="review">
                <img
                  src={
                    r.user?.avatar ||
                    "https://thumbs.dreamstime.com/b/teacher-icon-vector-male-person-profile-avatar-book-teaching-school-college-university-education-glyph-113755262.jpg"
                  }
                  alt={r.user?.name || "Learner"}
                />
                <div>
                  <p>{r.user?.name || "Ẩn danh"}</p>
                  <p>{r.comment}</p>
                  <span>{r.timeAgo}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default CourseFeedback;
