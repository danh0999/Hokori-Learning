// src/pages/Teacher/Courses/Create-Course/components/Curriculum Builder/CurriculumBuilder.jsx
import React, { useState, useMemo } from "react";
import { Card, Button, Input, Tooltip, Spin, Empty } from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";

import LessonEditorDrawer from "./LessonEditorDrawer/LessonEditorDrawer.jsx";

import {
  createChapterThunk,
  deleteChapterThunk,
  createLessonThunk,
  deleteLessonThunk,
  updateLessonThunk,
  fetchCourseTree,
} from "../../../../../../redux/features/teacherCourseSlice.js";

import styles from "./styles.module.scss";

/**
 * Props:
 *  - courseId
 *  - loadingTree
 *  - onNext?: () => void
 *  - onBack?: () => void
 */
export default function CurriculumBuilder({
  courseId,
  loadingTree,
  onNext,
  onBack,
}) {
  const dispatch = useDispatch();
  const { currentCourseTree } = useSelector((state) => state.teacherCourse);

  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [openLesson, setOpenLesson] = useState(null); // {chapterId, lesson}
  const [lessonTitleDrafts, setLessonTitleDrafts] = useState({}); // { lessonId: "tên đang gõ" }

  const chapters = useMemo(
    () => currentCourseTree?.chapters || [],
    [currentCourseTree]
  );

  // =======================
  // Chapter actions
  // =======================
  const handleAddChapter = async () => {
    if (!courseId || !newChapterTitle.trim()) return;

    await dispatch(
      createChapterThunk({
        courseId,
        data: {
          title: newChapterTitle.trim(),
          orderIndex: chapters.length,
          summary: "",
          isTrial: false,
        },
      })
    ).unwrap();

    setNewChapterTitle("");
    await dispatch(fetchCourseTree(courseId));
  };

  const handleDeleteChapter = async (chapterId) => {
    await dispatch(deleteChapterThunk(chapterId)).unwrap();
    await dispatch(fetchCourseTree(courseId));
  };

  // =======================
  // Lesson actions
  // =======================
  const handleAddLesson = async (chapterId) => {
    await dispatch(
      createLessonThunk({
        chapterId,
        data: { title: "New lesson", orderIndex: 0, totalDurationSec: 0 },
      })
    ).unwrap();
    await dispatch(fetchCourseTree(courseId));
  };

  const handleDeleteLesson = async (chapterId, lessonId) => {
    await dispatch(deleteLessonThunk({ chapterId, lessonId })).unwrap();
    await dispatch(fetchCourseTree(courseId));
  };

  const handleChangeLessonTitle = (lessonId, value) => {
    setLessonTitleDrafts((prev) => ({
      ...prev,
      [lessonId]: value,
    }));
  };

  const handleBlurLessonTitle = async (lessonId, originalTitle) => {
    const draft = lessonTitleDrafts[lessonId];
    const trimmed = (draft ?? "").trim();
    if (!trimmed || trimmed === originalTitle) return;

    try {
      await dispatch(
        updateLessonThunk({
          lessonId,
          data: { title: trimmed },
        })
      ).unwrap();

      setLessonTitleDrafts((prev) => {
        const next = { ...prev };
        delete next[lessonId];
        return next;
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleLessonSaved = async () => {
    if (courseId) {
      await dispatch(fetchCourseTree(courseId));
    }
  };

  const renderLessonMeta = (lesson) => {
    const sectionCount = lesson.sections?.length || 0;
    const contentCount = (lesson.sections || []).reduce(
      (sum, s) => sum + (s.contents?.length || 0),
      0
    );
    return `${sectionCount} section(s) · ${contentCount} content item(s)`;
  };

  if (loadingTree && !chapters.length) {
    return (
      <div className={styles.curriculumWrap}>
        <Spin />
      </div>
    );
  }

  const canGoNext = chapters.length > 0; // có ít nhất 1 chapter mới cho Next

  return (
    <div className={styles.curriculumWrap}>
      {/* input tạo chapter mới */}
      <div className={styles.newChapterRow}>
        <Input
          placeholder="Thêm tiêu đề chương mới"
          value={newChapterTitle}
          onChange={(e) => setNewChapterTitle(e.target.value)}
          onPressEnter={handleAddChapter}
          style={{ maxWidth: 320 }}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddChapter}
        >
          Thêm chương mới
        </Button>
      </div>

      {/* danh sách chapter */}
      {chapters.length === 0 ? (
        <div className={styles.emptyBox}>
          <Empty description="Chưa có chapter nào" />
        </div>
      ) : (
        chapters.map((ch) => (
          <Card
            key={ch.id}
            className={styles.sectionBlock}
            title={
              <div className={styles.chapterTitleRow}>
                <span>{ch.title}</span>
              </div>
            }
            extra={
              <Tooltip title="Delete chapter">
                <Button
                  icon={<DeleteOutlined />}
                  type="text"
                  danger
                  onClick={() => handleDeleteChapter(ch.id)}
                />
              </Tooltip>
            }
          >
            <div className={styles.lessonList}>
              {(ch.lessons || []).length === 0 ? (
                <div className={styles.lessonEmpty}>Chưa có bài học nào</div>
              ) : (
                (ch.lessons || []).map((les) => (
                  <div key={les.id} className={styles.lessonItem}>
                    <div className={styles.lessonMain}>
                      <Input
                        value={
                          lessonTitleDrafts[les.id] !== undefined
                            ? lessonTitleDrafts[les.id]
                            : les.title
                        }
                        onChange={(e) =>
                          handleChangeLessonTitle(les.id, e.target.value)
                        }
                        onBlur={() => handleBlurLessonTitle(les.id, les.title)}
                        className={styles.lessonTitleInput}
                      />
                      <div className={styles.lessonMeta}>
                        {renderLessonMeta(les)}
                      </div>
                    </div>
                    <div className={styles.lessonActions}>
                      <Button
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() =>
                          setOpenLesson({ chapterId: ch.id, lesson: les })
                        }
                      />
                      <Button
                        icon={<DeleteOutlined />}
                        size="small"
                        danger
                        onClick={() => handleDeleteLesson(ch.id, les.id)}
                      />
                    </div>
                  </div>
                ))
              )}

              <Button
                type="dashed"
                icon={<PlusOutlined />}
                className={styles.addLessonBtn}
                onClick={() => handleAddLesson(ch.id)}
              >
                Thêm bài học mới
              </Button>
            </div>
          </Card>
        ))
      )}

      {/* Footer: Back / Next */}
      <div className={styles.footerRow}>
        {typeof onBack === "function" && (
          <Button onClick={onBack}>Quay lại</Button>
        )}
        {typeof onNext === "function" && (
          <Button type="primary" onClick={onNext} disabled={!canGoNext}>
            Tiếp theo: Giá khoá học
          </Button>
        )}
      </div>

      {/* Drawer edit lesson */}
      {openLesson && (
        <LessonEditorDrawer
          open
          lesson={openLesson.lesson}
          onClose={() => setOpenLesson(null)}
          onSave={handleLessonSaved}
        />
      )}
    </div>
  );
}
