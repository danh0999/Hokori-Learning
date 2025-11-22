import React, { useEffect, useState } from "react";
import { useParams, Outlet } from "react-router-dom"; 
import Sidebar from "./components/Sidebar";
import VideoPanel from "./components/VideoPanel";
import LessonContent from "./components/LessonContent";
import QuickActions from "./components/QuickActions";
import ActionBar from "./components/ActionBar";
import styles from "./LessonPlayer.module.scss";

const LessonPlayer = () => {
const { lessonId } = useParams();
const isTrialMode = lessonId === "trial";


  const [lessonData, setLessonData] = useState(null);

  useEffect(() => {
  const isTrialMode = lessonId === "trial";

  // 🔥 Nếu là bài học thử (Học thử)
  if (isTrialMode) {
    setLessonData({
      title: "Bài học thử miễn phí",
      description:
        "Bạn đang trải nghiệm bài học thử thuộc Chương 1. Nội dung bên dưới sẽ giúp bạn đánh giá khóa học trước khi mua.",
      sections: [
        {
          title: "Nội dung demo",
          content:
            "Đây là nội dung demo của bài học chương 1. Khi bạn mua khóa học, toàn bộ bài học sẽ được mở khóa đầy đủ.",
        },
        {
          title: "Lợi ích khi tham gia khóa học",
          content:
            "・Nội dung ngữ pháp đầy đủ\n・Bài tập có đáp án chi tiết\n・Video và PDF tải về\n・Theo dõi tiến độ học tập",
        },
      ],
    });
    return; // ❗ Dừng ở đây — không load bài học thật
  }

  // ⚙️ MOCK LESSON DATA – demo cho bài học thật (giữ nguyên code cũ)
  const mockData = {
    title: "Ngữ pháp cơ bản – Thể ます",
    description:
      "Giới thiệu tổng quan về thể ます, cách chia động từ và ứng dụng trong giao tiếp tiếng Nhật.",
    sections: [
      {
        title: "Tổng quan bài học",
        content:
          "Trong video, giảng viên hướng dẫn cách chia động từ sang thể ます và cách sử dụng trong các câu ví dụ thực tế.",
      },
      {
        title: "Các điểm chính",
        content:
          "・Phân biệt nhóm động từ (I, II, III)\n・Mẫu khẳng định / phủ định / quá khứ\n・Lưu ý khi giao tiếp bằng thể ます",
      },
    ],
  };

  setLessonData(mockData);
}, [lessonId]);


  return (
    <main className={styles.main}>
      <aside className={styles.sidebar}>
        <Sidebar />
      </aside>

      <section className={styles.lesson}>
        <div className={styles.container}>
          {/* === Nội dung bài học === */}
          <VideoPanel title={lessonData?.title} />
          <div className={styles.header}>
            <h1>{lessonData?.title || "Tiêu đề bài học"}</h1>
            <p className={styles.desc}>{lessonData?.description}</p>
          </div>

          <QuickActions />
          <LessonContent data={lessonData?.sections} />
          <ActionBar />

          {/* === Hiển thị Quiz khi URL là /lesson/:id/quiz/:quizId === */}
          <Outlet />
        </div>
      </section>

      <aside className={styles.ai}></aside>
    </main>
  );
};

export default LessonPlayer;
