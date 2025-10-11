import React from "react";

const CourseOverview = ({ course }) => {
  const { overview, chapters, info, instructor } = course;

  return (
    <section className="overview-section">
      <div className="container">
        {/* Giới thiệu */}
        <div className="intro">
          <h2>Giới thiệu khóa học</h2>
          {overview.intro.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <div className="features">
            {overview.features.map((f, i) => (
              <div key={i}>
                <i className={`fa-solid ${f.icon}`}></i>
                <div>
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nội dung */}
        <div className="content-grid">
          <div className="lessons">
            <h2>Nội dung khóa học</h2>
            {chapters.map((ch, i) => (
              <div key={i} className="chapter">
                <h3>{`Chương ${i + 1}: ${ch.title}`}</h3>
                <p>
                  {ch.lessons} bài học • {ch.time}
                </p>
              </div>
            ))}
          </div>

          <div className="info">
            <h3>Thông tin khóa học</h3>
            <ul>
              <li>
                <span>Tổng số video:</span>
                <span>{info.totalVideos}</span>
              </li>
              <li>
                <span>Thời lượng:</span>
                <span>{info.duration}</span>
              </li>
              <li>
                <span>Cấp độ:</span>
                <span>{info.level}</span>
              </li>
              <li>
                <span>Chứng chỉ:</span>
                <span>{info.certificate ? "Có" : "Không"}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Giảng viên */}
        <div className="instructor">
          <h2>Giảng viên</h2>
          <div className="card">
            <img
              src="https://thumbs.dreamstime.com/b/teacher-icon-vector-male-person-profile-avatar-book-teaching-school-college-university-education-glyph-113755262.jpg"
              alt={instructor.name}
            />
            <div>
              <h3>{instructor.name}</h3>
              <p>{instructor.bio}</p>
              <div className="stats">
                <div>
                  <strong>{instructor.stats.students.toLocaleString()}+</strong>
                  <p>Học viên</p>
                </div>
                <div>
                  <strong>{instructor.stats.rating}</strong>
                  <p>Đánh giá</p>
                </div>
                <div>
                  <strong>{instructor.stats.courses}</strong>
                  <p>Khóa học</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CourseOverview;
