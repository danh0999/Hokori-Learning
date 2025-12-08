import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

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

  // ✅ HỌC THỬ: check login trước, rồi mới dùng tree + isTrial
  const handleTrial = () => {
    try {
      // 1️⃣ Check login
      const token =
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken") ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

      if (!token) {
        toast.error("Bạn cần đăng nhập để học thử khóa học này.");
        // optional: redirect luôn sang trang login kèm redirectTo
        navigate("/login", {
          state: {
            redirectTo: window.location.pathname, // đang ở trang course detail
          },
        });
        return;
      }

      // 2️⃣ Đã login → xử lý trial tree như cũ
      if (!course || !Array.isArray(course.chapters)) {
        toast.error("Khóa học chưa có nội dung.");
        return;
      }

      // Ưu tiên chapter có isTrial = true, fallback chapter đầu tiên
      const trialChapter =
        course.chapters.find((ch) => ch.isTrial) || course.chapters[0];

      if (!trialChapter) {
        toast.error("Khóa học chưa có chương học thử.");
        return;
      }

      const firstLesson = Array.isArray(trialChapter.lessons)
        ? trialChapter.lessons[0]
        : null;

      if (!firstLesson) {
        toast.error("Chương học thử chưa có bài học.");
        return;
      }

      const lessonId = firstLesson.id || firstLesson.lessonId;
      if (!lessonId) {
        toast.error("Không tìm thấy bài học thử hợp lệ.");
        return;
      }

      // path: /course/:id/trial-lesson/:lessonId
      navigate(`/course/${course.id}/trial-lesson/${lessonId}`);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải nội dung học thử.");
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

                  {/* ⭐ Chương học thử (theo guide: chapter đầu tiên isTrial) */}
                  {i === 0 && (
                    <button className="trial-btn" onClick={handleTrial}>
                      Học thử miễn phí
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
