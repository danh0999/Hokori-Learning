import React from "react";

const CourseFeedback = ({ course }) => {
  // ✅ Đảm bảo luôn là mảng, kể cả khi backend / mock không trả về
  const reviews = Array.isArray(course?.reviews) ? course.reviews : [];
  const relatedCourses = Array.isArray(course?.relatedCourses)
    ? course.relatedCourses
    : [];

  return (
    <section className="feedback-section">
      <div className="container">
        {/* ====== Đánh giá ====== */}
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

        {/* ====== Khóa học tương tự ====== */}
        <div className="related">
          <h2>Khóa học tương tự</h2>
          <div className="grid">
            {relatedCourses.length === 0 ? (
              <p>Đang cập nhật...</p>
            ) : (
              relatedCourses.map((c, i) => (
                <div key={i} className="card">
                  <div className="thumb">
                    {c.thumbnail ? (
                      <img src={c.thumbnail} alt={c.title} />
                    ) : (
                      "Thumbnail"
                    )}
                  </div>
                  <h3>{c.title}</h3>
                  <p>{c.teacher}</p>
                  <div className="bottom">
                    <span>
                      {c.price
                        ? c.price.toLocaleString("vi-VN") + " VNĐ"
                        : "Miễn phí"}
                    </span>
                    <div className="rating">
                      <i className="fa-solid fa-star"></i> {c.rating ?? "—"}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CourseFeedback;
