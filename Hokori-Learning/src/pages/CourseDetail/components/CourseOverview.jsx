// src/pages/CourseDetail/components/CourseOverview.jsx
import React from "react";

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return "Đang cập nhật";

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (hrs > 0 && mins > 0) return `${hrs} giờ ${mins} phút`;
  if (hrs > 0) return `${hrs} giờ`;
  if (mins > 0) return `${mins} phút`;
  return `${seconds} giây`;
}

const CourseOverview = ({ course }) => {
  // Tree trả chapters: [{ id, title, orderIndex, summary, lessons: [ ... ] }]
  const chaptersFromApi = Array.isArray(course?.chapters)
    ? course.chapters
    : [];

  // Nếu sau này BE gửi thêm overview/features thì map tương tự
  const overview = course?.overview || {};
  const introList = Array.isArray(overview.intro) ? overview.intro : [];
  const featureList = Array.isArray(overview.features) ? overview.features : [];

  const hasOverview = introList.length > 0;
  const hasFeatures = featureList.length > 0;
  const hasChapters = chaptersFromApi.length > 0;

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
              chaptersFromApi.map((ch, i) => {
                // lessons từ BE là array object
                const lessonCount = Array.isArray(ch.lessons)
                  ? ch.lessons.length
                  : Number(ch.lessons) || 0;

                // tổng thời lượng chapter
                const totalDurationSec =
                  ch.totalDurationSec ??
                  (Array.isArray(ch.lessons)
                    ? ch.lessons.reduce(
                        (sum, l) => sum + (l.totalDurationSec || 0),
                        0
                      )
                    : 0);

                const durationText = formatDuration(totalDurationSec);

                return (
                  <div key={ch.id ?? i} className="chapter">
                    <h3>{`Chương ${i + 1}: ${ch.title}`}</h3>
                    <p>
                      {lessonCount} bài học • {durationText}
                    </p>
                    {ch.summary && (
                      <p className="chapter-summary">{ch.summary}</p>
                    )}
                  </div>
                );
              })
            ) : (
              <p>Nội dung chi tiết khóa học đang được cập nhật.</p>
            )}
          </div>

          {/* Thông tin khóa học sơ bộ */}
          <div className="info">
            <h3>Thông tin khóa học</h3>
            <ul>
              <li>
                <span>Cấp độ:</span>
                <span>{course?.level ?? "Đang cập nhật"}</span>
              </li>
              <li>
                <span>Số chương:</span>
                <span>{chaptersFromApi.length}</span>
              </li>
              <li>
                <span>Tổng thời lượng:</span>
                <span>
                  {formatDuration(
                    chaptersFromApi.reduce((sum, ch) => {
                      const chapterDuration =
                        ch.totalDurationSec ??
                        (Array.isArray(ch.lessons)
                          ? ch.lessons.reduce(
                              (s, l) => s + (l.totalDurationSec || 0),
                              0
                            )
                          : 0);
                      return sum + chapterDuration;
                    }, 0)
                  )}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Giảng viên (placeholder, vì /tree chưa có dữ liệu) */}
        <div className="instructor">
          <h2>Giảng viên</h2>
          <p>Thông tin giảng viên đang được cập nhật.</p>
        </div>
      </div>
    </section>
  );
};

export default CourseOverview;
