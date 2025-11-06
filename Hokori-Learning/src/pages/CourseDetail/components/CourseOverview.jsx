import React from "react";

const CourseOverview = ({ course }) => {
  // ✅ luôn có course, nhưng nhiều field có thể thiếu khi lấy từ Redux mock
  const {
    overview = {},
    chapters = [],
    info = {},
    instructor = {},
  } = course || {};

  const introList = overview.intro || [];
  const featureList = overview.features || [];

  const hasOverview =
    Array.isArray(introList) && introList.length > 0;
  const hasFeatures =
    Array.isArray(featureList) && featureList.length > 0;
  const hasChapters = Array.isArray(chapters) && chapters.length > 0;

  return (
    <section className="overview-section">
      <div className="container">
        {/* Giới thiệu */}
        <div className="intro">
          <h2>Giới thiệu khóa học</h2>

          {hasOverview ? (
            introList.map((p, i) => <p key={i}>{p}</p>)
          ) : (
            <p>Thông tin giới thiệu khóa học đang được cập nhật.</p>
          )}

          <div className="features">
            {hasFeatures ? (
              featureList.map((f, i) => (
                <div key={i}>
                  <i className={`fa-solid ${f.icon || ""}`}></i>
                  <div>
                    <h4>{f.title}</h4>
                    <p>{f.desc}</p>
                  </div>
                </div>
              ))
            ) : (
              <p>Các điểm nổi bật sẽ được cập nhật sau.</p>
            )}
          </div>
        </div>

        {/* Nội dung */}
        <div className="content-grid">
          <div className="lessons">
            <h2>Nội dung khóa học</h2>
            {hasChapters ? (
              chapters.map((ch, i) => (
                <div key={i} className="chapter">
                  <h3>{`Chương ${i + 1}: ${ch.title}`}</h3>
                  <p>
                    {ch.lessons} bài học • {ch.time}
                  </p>
                </div>
              ))
            ) : (
              <p>Nội dung chi tiết khóa học đang được cập nhật.</p>
            )}
          </div>

          {/* Thông tin khóa học */}
          <div className="info">
            <h3>Thông tin khóa học</h3>
            <ul>
              <li>
                <span>Tổng số video:</span>
                <span>{info.totalVideos ?? "Đang cập nhật"}</span>
              </li>
              <li>
                <span>Thời lượng:</span>
                <span>{info.duration ?? "Đang cập nhật"}</span>
              </li>
              <li>
                <span>Cấp độ:</span>
                <span>{info.level ?? "Đang cập nhật"}</span>
              </li>
              <li>
                <span>Chứng chỉ:</span>
                <span>
                  {info.certificate === true
                    ? "Có"
                    : info.certificate === false
                    ? "Không"
                    : "Đang cập nhật"}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Giảng viên */}
        <div className="instructor">
          <h2>Giảng viên</h2>
          {instructor && instructor.name ? (
            <div className="card">
              <img
                src={
                  instructor.avatar ||
                  "https://thumbs.dreamstime.com/b/teacher-icon-vector-male-person-profile-avatar-book-teaching-school-college-university-education-glyph-113755262.jpg"
                }
                alt={instructor.name}
              />
              <div>
                <h3>{instructor.name}</h3>
                <p>{instructor.bio || "Thông tin giảng viên đang cập nhật."}</p>
                <div className="stats">
                  <div>
                    <strong>
                      {instructor.stats?.students?.toLocaleString?.() ||
                        "—"}
                    </strong>
                    <p>Học viên</p>
                  </div>
                  <div>
                    <strong>{instructor.stats?.rating ?? "—"}</strong>
                    <p>Đánh giá</p>
                  </div>
                  <div>
                    <strong>{instructor.stats?.courses ?? "—"}</strong>
                    <p>Khóa học</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p>Thông tin giảng viên đang được cập nhật.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default CourseOverview;
