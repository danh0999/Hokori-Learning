import React from "react";

const CourseFeedback = ({ course }) => {
  const { reviews, relatedCourses } = course;

  return (
    <section className="feedback-section">
      <div className="container">
        <h2>Đánh giá từ học viên</h2>
        <div className="reviews">
          {reviews?.length === 0 ? (
            <p>Chưa có đánh giá nào</p>
          ) : (
            reviews.map((r, i) => (
              <div key={i} className="review">
                <img src={r.user.avatar} alt={r.user.name} />
                <div>
                  <p>{r.user.name}</p>
                  <p>{r.comment}</p>
                  <span>{r.timeAgo}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="related">
          <h2>Khóa học tương tự</h2>
          <div className="grid">
            {relatedCourses?.length === 0 ? (
              <p>Đang cập nhật...</p>
            ) : (
              relatedCourses.map((c, i) => (
                <div key={i} className="card">
                  <div className="thumb">{c.thumbnail || "Thumbnail"}</div>
                  <h3>{c.title}</h3>
                  <p>{c.teacher}</p>
                  <div className="bottom">
                    <span>{c.price.toLocaleString()} VNĐ</span>
                    <div className="rating">
                      <i className="fa-solid fa-star"></i> {c.rating}
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
