import React from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../configs/axios"; // axios có token
import { toast } from "react-hot-toast";

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
    // 1) Enroll nếu chưa enroll
    try {
      await api.post(`/learner/courses/${course.id}/enroll`);
    } catch (err) {
      const status = err?.response?.status;

      // 409 = đã enroll → bỏ qua
      if (status === 409) {
        console.log("⚠ Khóa học đã enroll trước đó – bỏ qua 409.");
      }
      // 403 = không được phép học thử
      else if (status === 403) {
        toast.error("Khóa học này không hỗ trợ học thử.");
        return; // ⛔ dừng tại đây, không điều hướng
      }
      // Lỗi khác → ném ra ngoài
      else {
        throw err;
      }
    }

    // 2) Lấy danh sách chapters để xác định chương học thử
    const chaptersRes = await api.get(`/learner/courses/${course.id}/chapters`);
    const chapters = chaptersRes.data ?? [];
    const trialChapter = chapters.find((c) => c.orderIndex === 0);

    if (!trialChapter) {
      return toast.error("Khóa học chưa hỗ trợ học thử.");
    }

    // 3) Lấy danh sách lessons
    const lessonsRes = await api.get(`/learner/courses/${course.id}/lessons`);
    const lessons = lessonsRes.data ?? [];

    // 4) Lấy bài đầu tiên của khóa học làm bài trial
    const firstTrialLesson = lessons.sort((a, b) => a.orderIndex - b.orderIndex)[0];

    if (!firstTrialLesson) {
      return toast.error("Khóa học chưa có bài học thử.");
    }

    const lessonId = firstTrialLesson.lessonId ?? firstTrialLesson.id;

    // 5) Navigate
    navigate(`/course/${course.id}/lesson/${lessonId}`, {
      state: { trialMode: true }, // flag cho LessonPlayer khóa bài không miễn phí
    });

  } catch (err) {
    console.error(err);
    toast.error("Không thể kích hoạt học thử!");
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
