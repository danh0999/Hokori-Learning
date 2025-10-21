import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import AITools from "./components/AITools";
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
    const mockLessons = {
      1: {
        title: "Ngữ pháp cơ bản – Thể ます",
        description: "Bài học cơ bản về chia động từ sang thể ます trong tiếng Nhật.",
        sections: [
          {
            title: "Cách chia thể ます",
            examples: [
              { jp: "食べます", vi: "Ăn" },
              { jp: "飲みます", vi: "Uống" },
            ],
          },
        ],
      },
      2: {
        title: "Kanji Thực Hành N3 – Bài 5",
        description: "Luyện đọc và viết các chữ Hán thường gặp trong JLPT N3.",
        sections: [
          {
            title: "Kanji thường gặp",
            examples: [
              { jp: "勉強（べんきょう）", vi: "Học tập" },
              { jp: "試験（しけん）", vi: "Kỳ thi" },
            ],
          },
        ],
      },
    };

    // 📌 Khi có API: thay bằng fetch(`api/lessons/${id}`)
    setLessonData(mockLessons[id]);
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

          <ActionBar />
          <LessonContent data={lessonData?.sections} />
          <QuickActions />
        </div>
      </section>

      <aside className={styles.ai}>
        <AITools />
      </aside>
    </main>
  );
};

export default LessonPlayer;
