// src/pages/CourseDetail/components/CourseOverview.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const chaptersFromApi = Array.isArray(course?.chapters)
    ? course.chapters
    : [];

  return (
    <section className="overview-section">
      <div className="container">
        {/* Giới thiệu */}
        <div className="intro">
          <h2>GIỚI THIỆU KHÓA HỌC</h2>
          <p>Thông tin giới thiệu khóa học đang được cập nhật.</p>
        </div>

        {/* Nội dung */}
        <div className="content-grid">
          <div className="lessons">
            <h2>NỘI DUNG KHÓA HỌC</h2>

            {chaptersFromApi.map((ch, i) => {
              const lessonCount = Array.isArray(ch.lessons)
                ? ch.lessons.length
                : Number(ch.lessons) || 0;

              const totalDurationSec =
                ch.totalDurationSec ??
                (Array.isArray(ch.lessons)
                  ? ch.lessons.reduce(
                      (sum, l) => sum + (l.totalDurationSec || 0),
                      0
                    )
                  : 0);

              return (
                <div key={ch.id ?? i} className="chapter chapter--with-trial">
                  <h3>{`Chương ${i + 1}: ${ch.title}`}</h3>

                  {/* 🔥 Nút Học Thử – chỉ ở chương 1 */}
                  {i === 0 && (
                    <button
                      className="trial-btn"
                      onClick={() =>
                        navigate(`/course/${course.id}/preview/first`)
                      }
                    >
                      Học thử
                    </button>
                  )}

                  <p>
                    {lessonCount} bài học • {formatDuration(totalDurationSec)}
                  </p>

                  {ch.summary && (
                    <p className="chapter-summary">{ch.summary}</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Info */}
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
                <span>Đang cập nhật</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CourseOverview;
