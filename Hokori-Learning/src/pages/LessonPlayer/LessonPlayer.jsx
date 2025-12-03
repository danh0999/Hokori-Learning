// src/pages/LessonPlayer/LessonPlayer.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation, Outlet } from "react-router-dom";
import api from "../../configs/axios";
import styles from "./LessonPlayer.module.scss";

import Sidebar from "./components/Sidebar";
import VideoPanel from "./components/VideoPanel";
import QuickActions from "./components/QuickActions";
import LessonContent from "./components/LessonContent";
import ActionBar from "./components/ActionBar";
import { buildFileUrl } from "../../utils/fileUrl";


const LessonPlayer = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const trialMode = location.state?.trialMode || false;

  const [lessons, setLessons] = useState([]);
  const [lessonData, setLessonData] = useState(null);

  /** 📌 1) Fetch danh sách bài học */
  useEffect(() => {
    if (lessonId === "trial") return; // đang ở màn placeholder học thử

    const fetchLessons = async () => {
      try {
        const res = await api.get(`/learner/courses/${courseId}/lessons`);
        const list = res.data ?? [];
        setLessons(list);

        // Nếu learner truy cập /lesson mà thiếu lessonId → điều hướng bài đầu tiên
        if (!lessonId && list.length > 0) {
          navigate(`/course/${courseId}/lesson/${list[0].lessonId}`, {
            replace: true,
          });
        }
      } catch (err) {
        console.error("Lỗi tải danh sách bài học:", err);
      }
    };

    fetchLessons();
  }, [courseId, lessonId, navigate]);


  /** 📌 2) Fetch chi tiết bài học */
  useEffect(() => {
    if (!lessonId || lessonId === "trial") return;

    const fetchLessonDetail = async () => {
      try {
        const res = await api.get(`/learner/lessons/${lessonId}/detail`);
        setLessonData(res.data);
      } catch (err) {
        console.error("Lỗi tải dữ liệu bài học:", err);
      }
    };

    fetchLessonDetail();
  }, [lessonId]);


  /** Nếu lessons chưa load xong */
  const isLoading = lessons.length === 0;
  if (isLoading) {
    return <main className={styles.main}>Đang tải bài học...</main>;
  }

  // === Lấy nội dung video (ASSET & primaryContent) từ lessonData ===
  const primaryContent = lessonData?.sections
    ?.flatMap(sec => sec.contents)
    ?.find(c => c.primaryContent && c.contentFormat === "ASSET");

  const videoUrl = primaryContent
  ? buildFileUrl(primaryContent.filePath)
  : null;

  // === TÌM FLASHCARD ===
const flashcardContent = lessonData?.sections
  ?.flatMap((sec) => sec.contents)
  ?.find((c) => c.contentFormat === "FLASHCARD_SET");

const flashcardContentId = flashcardContent?.id;





  return (
    <main className={styles.main}>
      {/* === SIDEBAR === */}
      <aside className={styles.sidebar}>
        <Sidebar
          lessons={lessons}
          currentLessonId={Number(lessonId)}
          trialMode={trialMode}
          courseId={Number(courseId)}
        />
      </aside>

      {/* === NỘI DUNG BÀI HỌC === */}
      <section className={styles.lesson}>
        <div className={styles.container}>
              <VideoPanel
      videoUrl={videoUrl}
      title={lessonData?.title}
      duration={lessonData?.totalDurationSec}
      />

          <div className={styles.header}>
            <h1>{lessonData?.title || "Tiêu đề bài học"}</h1>
            <p className={styles.desc}>{lessonData?.description}</p>
          </div>

          <QuickActions
            lessonId={lessonId}
            flashcardContentId={flashcardContentId}
          />

          <LessonContent data={lessonData?.sections} />
          <ActionBar />

          {/* === Quiz hiển thị khi vào /lesson/:id/quiz/... === */}
          <Outlet />
        </div>
      </section>

      {/* === KHUNG TRỐNG CHO AI SAU NÀY === */}
      <aside className={styles.ai}></aside>
    </main>
  );
};

export default LessonPlayer;
