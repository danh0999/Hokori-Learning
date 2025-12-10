import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation, Outlet } from "react-router-dom";
import api from "../../configs/axios";
import styles from "./LessonPlayer.module.scss";

import Sidebar from "./components/Sidebar";
import VideoPanel from "./components/VideoPanel";
import LessonActions from "./components/LessonActions";
import ActionBar from "./components/ActionBar";
import { buildFileUrl } from "../../utils/fileUrl";
import LessonContent from "./components/LessonContent";

const LessonPlayer = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // Hook lấy state từ Sidebar

  const [lessonData, setLessonData] = useState(null);
  const [courseTree, setCourseTree] = useState(null);
  const [isLoadingTree, setIsLoadingTree] = useState(true);
  
  // State quản lý video đang phát (mặc định hoặc video được chọn từ sidebar)
  const [activeVideo, setActiveVideo] = useState(null);

  // 1. Fetch Tree
  useEffect(() => {
    const fetchLearningTree = async () => {
      try {
        setIsLoadingTree(true);
        const res = await api.get(`/learner/courses/${courseId}/learning-tree`);
        setCourseTree(res.data);
      } catch (err) {
        console.error("Lỗi tải learning tree:", err);
      } finally {
        setIsLoadingTree(false);
      }
    };
    fetchLearningTree();
  }, [courseId]);

  // 2. Fetch Lesson Detail & Xử lý click từ Sidebar
  useEffect(() => {
    if (!lessonId || lessonId === "trial") return;
    
    const fetchLessonDetail = async () => {
      try {
        const res = await api.get(`/learner/lessons/${lessonId}/detail`);
        const data = res.data;
        setLessonData(data);

        // --- LOGIC MỚI: Xử lý Target Content ---
        const targetId = location.state?.targetContentId;

        // Tìm video mặc định (primary)
        const defaultVideo = data.sections
            ?.flatMap(sec => sec.contents)
            ?.find(c => c.primaryContent && c.contentFormat === "ASSET");

        if (targetId) {
            const targetContent = data.sections
                ?.flatMap(sec => sec.contents)
                ?.find(c => c.id === targetId || c.contentId === targetId);

            if (targetContent) {
                if (targetContent.contentFormat === 'ASSET' && targetContent.filePath?.match(/\.(mp4|mov|webm)$/i)) {
                    // Nếu click vào Video -> Đổi video active
                    setActiveVideo(targetContent);
                } else {
                    // Nếu click Text/Ảnh -> Giữ video mặc định, scroll xuống
                    setActiveVideo(defaultVideo);
                    setTimeout(() => {
                        const element = document.getElementById(`content-${targetId}`);
                        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 500);
                }
            }
        } else {
            // Không có target -> Load video mặc định
            setActiveVideo(defaultVideo);
        }

      } catch (err) {
        console.error("Lỗi tải bài học:", err);
      }
    };
    fetchLessonDetail();
  }, [lessonId, location.state]); 

  // URL Video active
  const videoUrl = activeVideo ? buildFileUrl(activeVideo.filePath) : null;
  
  const flashcardContent = lessonData?.sections
    ?.flatMap((sec) => sec.contents)
    ?.find((c) => c.contentFormat === "FLASHCARD_SET");
  const flashcardContentId = flashcardContent?.id;

  const handlePrev = () => { console.log("Prev logic update needed"); };
  const handleNext = () => { console.log("Next logic update needed"); };
  const handleCompleteLesson = async () => { console.log("Complete logic update needed"); };

return (
    <main className={styles.main}>
      <section className={styles.contentColumn}>
        
        {/* --- SỬA ĐỔI TẠI ĐÂY --- */}
        {/* Chỉ render VideoPanel nếu có videoUrl hợp lệ */}
        {videoUrl && (
          <div className={styles.videoContainer}>
            <VideoPanel
              videoUrl={videoUrl}
              title={activeVideo?.title || lessonData?.title}
              duration={lessonData?.totalDurationSec}
              content={activeVideo}
            />
          </div>
        )}
        {/* ----------------------- */}

        <div className={styles.bodyContainer}>
            {/* 2. Tiêu đề & Mô tả bài học */}
            {/* Khi Video ẩn đi, phần này sẽ tự động nhảy lên đầu trang, rất đẹp */}
            <div className={styles.lessonMeta}>
                <h1 className={styles.lessonTitle}>{lessonData?.title}</h1>
                {lessonData?.description && (
                   <p className={styles.lessonDesc}>{lessonData.description}</p>
                )}
            </div>

            {/* ... (Các phần Content và Actions giữ nguyên) */}
             <LessonContent data={lessonData?.sections} />
             
             <LessonActions 
                quizId={lessonData?.quizId} 
                lessonId={lessonId}
            />

            {/* <div className={styles.footerActions}>
                <ActionBar 
                    onPrev={handlePrev} 
                    onNext={handleNext} 
                    onComplete={handleCompleteLesson} 
                />
            </div>
             */}
            <Outlet />
        </div>
      </section>

      <aside className={styles.sidebarColumn}>
        <Sidebar
          courseTree={courseTree}
          isLoading={isLoadingTree}
          currentLessonId={Number(lessonId)}
          courseId={courseId}
        />
      </aside>
    </main>
  );
};

export default LessonPlayer;