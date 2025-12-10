// src/pages/LessonPlayer/LessonPlayer.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation, Outlet } from "react-router-dom";
import api from "../../configs/axios";
import styles from "./LessonPlayer.module.scss";

import Sidebar from "./components/Sidebar";
import VideoPanel from "./components/VideoPanel";
import LessonActions from "./components/LessonActions";
import ActionBar from "./components/ActionBar";
import LessonContent from "./components/LessonContent";
import { buildFileUrl } from "../../utils/fileUrl";

// Helper check đuôi file
const isVideoFile = (path) => path?.match(/\.(mp4|mov|webm|ogg)$/i);
const isImageFile = (path) => path?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);

const LessonPlayer = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [lessonData, setLessonData] = useState(null);
  const [courseTree, setCourseTree] = useState(null);
  const [isLoadingTree, setIsLoadingTree] = useState(true);
  
  // State quản lý content đang được chọn
  const [activeMedia, setActiveMedia] = useState(null);
  const [activeTextContent, setActiveTextContent] = useState(null);

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

        // --- Xử lý Target Content từ Sidebar (location.state) ---
        const targetId = location.state?.targetContentId;
        
        // Tìm media mặc định (Video hoặc Ảnh chính)
        const defaultMedia = data.sections
            ?.flatMap(sec => sec.contents)
            ?.find(c => c.primaryContent && c.contentFormat === "ASSET");

        if (targetId) {
            // Tìm content tương ứng với ID được click
            const targetContent = data.sections
                ?.flatMap(sec => sec.contents)
                ?.find(c => c.id === targetId || c.contentId === targetId);

            if (targetContent) {
                // CASE 1: Click vào ASSET (Video/Ảnh)
                if (targetContent.contentFormat === 'ASSET') {
                    if (isVideoFile(targetContent.filePath) || isImageFile(targetContent.filePath)) {
                        setActiveMedia(targetContent);
                        setActiveTextContent(null); // Ẩn text khi xem media này
                    }
                } 
                // CASE 2: Click vào TEXT
                else if (targetContent.contentFormat === 'RICH_TEXT') {
                    setActiveMedia(null); // Ẩn media
                    setActiveTextContent(targetContent); // Chỉ hiện Text này
                }
            }
        } else {
            // CASE 3: Mặc định (Vừa vào bài học hoặc bấm nút Reset)
            setActiveMedia(defaultMedia);
            setActiveTextContent(null); // Null nghĩa là hiện tất cả (default view)
        }

      } catch (err) {
        console.error("Lỗi tải bài học:", err);
      }
    };
    fetchLessonDetail();
  }, [lessonId, location.state]); 

  // URL Media active
  const mediaUrl = activeMedia ? buildFileUrl(activeMedia.filePath) : null;
  const isVideo = isVideoFile(activeMedia?.filePath);
  const isImage = isImageFile(activeMedia?.filePath);

  // --- HÀM RESET VỀ TỔNG QUAN ---
  const handleBackToOverview = () => {
    // Navigate về chính trang này nhưng clear state targetContentId
    navigate(`/course/${courseId}/lesson/${lessonId}`, { replace: true, state: {} });
  };

  // Check xem có đang ở chế độ xem chi tiết không
  // (Nếu activeTextContent có giá trị, HOẶC activeMedia khác default thì coi là xem chi tiết)
  // Tuy nhiên đơn giản nhất: Nếu có location.state.targetContentId thì hiện nút Back
  const isViewingDetail = !!location.state?.targetContentId;

  const handlePrev = () => { /* ... */ };
  const handleNext = () => { /* ... */ };
  const handleCompleteLesson = async () => { /* ... */ };

  return (
    <main className={styles.main}>
      <section className={styles.contentColumn}>
        
        {/* Nút Quay lại tổng quan (Chỉ hiện khi đang xem content lẻ) */}
        {isViewingDetail && (
            <div style={{ padding: '16px 24px 0' }}>
                <button 
                    onClick={handleBackToOverview}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#6b7280', fontSize: '14px', fontWeight: '600'
                    }}
                >
                    ← Quay lại tổng quan bài học
                </button>
            </div>
        )}

        {/* --- KHU VỰC MEDIA --- */}
        {mediaUrl && (
          <div className={styles.mediaContainer}>
            {isVideo && (
                <VideoPanel
                  videoUrl={mediaUrl}
                  title={activeMedia?.title || lessonData?.title}
                  duration={lessonData?.totalDurationSec}
                  content={activeMedia}
                />
            )}
            {isImage && (
                <div className={styles.imageViewer}>
                    <img src={mediaUrl} alt="Lesson Asset" />
                </div>
            )}
          </div>
        )}

        <div className={styles.bodyContainer}>
            <div className={styles.lessonMeta}>
                <h1 className={styles.lessonTitle}>
                    {activeTextContent ? activeTextContent.title || "Nội dung chi tiết" : lessonData?.title}
                </h1>
                {/* Chỉ hiện mô tả khi ở chế độ tổng quan */}
                {!activeTextContent && lessonData?.description && (
                   <p className={styles.lessonDesc}>{lessonData.description}</p>
                )}
            </div>

            {/* LOGIC HIỂN THỊ NỘI DUNG */}
            {activeTextContent ? (
                // A. Xem 1 content duy nhất
                <LessonContent data={[{
                    sectionId: 'single-view',
                    title: '', 
                    contents: [activeTextContent]
                }]} />
            ) : (
                // B. Xem toàn bộ (Mặc định)
                <LessonContent data={lessonData?.sections} />
            )}

            {/* Chỉ hiện Quiz khi ở chế độ tổng quan */}
            {!isViewingDetail && (
                <LessonActions 
                    courseId={courseId} 
                    lessonId={lessonId}
                    quizId={lessonData?.quizId} 
                />
            )}

            <div className={styles.footerActions}>
                {/* <ActionBar 
                    onPrev={handlePrev} 
                    onNext={handleNext} 
                    onComplete={handleCompleteLesson} 
                /> */}
            </div>
            
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