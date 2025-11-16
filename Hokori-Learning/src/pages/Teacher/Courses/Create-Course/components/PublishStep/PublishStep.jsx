// src/pages/Teacher/Courses/Create-Course/components/PublishStep/PublishStep.jsx
import React from "react";
import { Card, Button, message } from "antd";
import { useDispatch, useSelector } from "react-redux";

import {
  publishCourseThunk,
  unpublishCourseThunk,
} from "../../../../../../redux/features/teacherCourseSlice.js";

import styles from "./styles.module.scss";

export default function PublishStep({ courseId, statusFlags }) {
  const dispatch = useDispatch();
  const { currentCourseMeta, currentCourseTree, saving } = useSelector(
    (state) => state.teacherCourse
  );

  const { basicsDone, curriculumDone, pricingDone, readyToPublish } =
    statusFlags || {};

  const chapters = currentCourseTree?.chapters || [];

  const totalChapters = chapters.length;
  const totalLessons =
    chapters.reduce((acc, ch) => acc + (ch.lessons?.length || 0), 0) || 0;

  const handlePublish = async () => {
    if (!courseId) return;

    const action = await dispatch(publishCourseThunk(courseId));

    if (publishCourseThunk.fulfilled.match(action)) {
      message.success("Khoá học đã được submit / publish.");
    } else {
      message.error("Không publish được, vui lòng thử lại.");
    }
  };

  const handleUnpublish = async () => {
    if (!courseId) return;

    const action = await dispatch(unpublishCourseThunk(courseId));

    if (unpublishCourseThunk.fulfilled.match(action)) {
      message.success("Khoá học đã được unpublish.");
    } else {
      message.error("Không unpublish được, vui lòng thử lại.");
    }
  };

  const priceText = pricingDone
    ? `${currentCourseMeta?.priceCents?.toLocaleString("vi-VN")} VND`
    : "Not set";

  return (
    <Card className={styles.cardBig}>
      {/* Header + status pill */}
      <div className={styles.headerRow}>
        <div className={styles.stepHeader}>
          <div className={styles.stepTitle}>Review & Submit</div>
          <div className={styles.stepDesc}>
            Kiểm tra lại khoá học trước khi gửi lên cho moderator / publish.
          </div>
        </div>

        <div className={styles.statusPill}>
          {currentCourseMeta?.status || "DRAFT"}
        </div>
      </div>

      {/* Khối tóm tắt 3 mục chính */}
      <div className={styles.reviewBlock}>
        <div className={styles.row}>
          <span className={styles.label}>Basics</span>
          <span
            className={`${styles.value} ${
              basicsDone ? styles.valueOk : styles.valuePending
            }`}
          >
            {basicsDone ? "Completed" : "Missing info"}
          </span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>Curriculum</span>
          <span
            className={`${styles.value} ${
              curriculumDone ? styles.valueOk : styles.valuePending
            }`}
          >
            {curriculumDone
              ? `${totalChapters} chapter(s), ${totalLessons} lesson(s)`
              : "No lessons yet"}
          </span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>Pricing</span>
          <span
            className={`${styles.value} ${
              pricingDone ? styles.valueOk : styles.valuePending
            }`}
          >
            {priceText}
          </span>
        </div>
      </div>

      {/* Curriculum overview: Chapter / Lesson */}
      <div className={styles.curriculumPreview}>
        <div className={styles.previewTitle}>Curriculum overview</div>

        {chapters.length === 0 ? (
          <div className={styles.previewEmpty}>
            Chưa có chapter / lesson nào.
          </div>
        ) : (
          <ol className={styles.previewChapterList}>
            {chapters.map((ch, chIndex) => (
              <li key={ch.id || chIndex} className={styles.previewChapterItem}>
                <div className={styles.previewChapterLine}>
                  <strong>Chapter {chIndex + 1}:</strong>{" "}
                  {ch.title || "(Untitled chapter)"}
                </div>

                <ul className={styles.previewLessonList}>
                  {(ch.lessons || []).length === 0 ? (
                    <li className={styles.previewLessonEmpty}>
                      (No lessons in this chapter)
                    </li>
                  ) : (
                    (ch.lessons || []).map((les, lesIndex) => (
                      <li
                        key={les.id || lesIndex}
                        className={styles.previewLessonItem}
                      >
                        Lesson {lesIndex + 1}:{" "}
                        {les.title || "(Untitled lesson)"}
                      </li>
                    ))
                  )}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </div>

      {!readyToPublish && (
        <div className={styles.warningBox}>
          Cần hoàn thành: tiêu đề + mô tả, ít nhất 1 lesson, và giá khoá học
          trước khi submit.
        </div>
      )}

      {/* Action buttons */}
      <div className={styles.actionRow}>
        <Button
          type="primary"
          disabled={!readyToPublish}
          onClick={handlePublish}
          loading={saving}
        >
          Submit for review / Publish
        </Button>

        {currentCourseMeta?.status === "PUBLISHED" && (
          <Button danger onClick={handleUnpublish} loading={saving}>
            Unpublish
          </Button>
        )}
      </div>
    </Card>
  );
}
