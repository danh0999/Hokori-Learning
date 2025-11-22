import React from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../configs/axios"; // axios có token

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

  const handleTrial = async () => {
    try {
      await api.post(`/learner/courses/${course.id}/enroll`);
      navigate(`/lesson/trial`);
    } catch (err) {
      const status = err?.response?.status;

      // Đã enroll → học thử tiếp
      if (status === 409) {
        navigate(`/lesson/trial`);
        return;
      }

      // Chưa login / không đủ quyền
      if (status === 401 || status === 403) {
        navigate("/login?redirect=" + window.location.pathname);
        return;
      }

      alert("Không thể đăng ký học thử. Vui lòng thử lại sau.");
      console.error(err);
    }
  };

  return (
    <section className="overview-section">
      <div className="container">
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
                <div key={ch.id ?? i} className="chapter">
                  <h3>{`Chương ${i + 1}: ${ch.title}`}</h3>

                  {/* 🔥 Nút Học Thử — CHỈ CHƯƠNG 1 */}
                  {i === 0 && (
                    <button className="trial-btn" onClick={handleTrial}>
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
        </div>
      </div>
    </section>
  );
};

export default CourseOverview;
