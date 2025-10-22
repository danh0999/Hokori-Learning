import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "./components/Sidebar";

import VideoPanel from "./components/VideoPanel";
import LessonContent from "./components/LessonContent";
import QuickActions from "./components/QuickActions";
import ActionBar from "./components/ActionBar";
import styles from "./LessonPlayer.module.scss";

const LessonPlayer = () => {
  const { id } = useParams();
  const [lessonData, setLessonData] = useState(null);

  useEffect(() => {
    // ⚙️ MOCK LESSON DATA – demo theo courseId
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
  }, [id]);

  return (
    <main className={styles.main}>
      <aside className={styles.sidebar}>
        <Sidebar />
      </aside>

      <section className={styles.lesson}>
        <div className={styles.container}>
          <VideoPanel title={lessonData?.title} />
          <div className={styles.header}>
            <h1>{lessonData?.title || "Tiêu đề bài học"}</h1>
            <p className={styles.desc}>{lessonData?.description}</p>
          </div>
          <QuickActions />

          <LessonContent data={lessonData?.sections} />
          <ActionBar />
        </div>
      </section>

      <aside className={styles.ai}></aside>
    </main>
  );
};

export default LessonPlayer;
