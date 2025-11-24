// src/pages/Teacher/Courses/Create-Course/components/PublishStep/PublishStep.jsx
import React from "react";
import { Card, Button, message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  submitforapprovalCourseThunk,
  unpublishCourseThunk,
} from "../../../../../../redux/features/teacherCourseSlice.js";

import styles from "./styles.module.scss";

/**
 * Props:
 *  - courseId
 *  - statusFlags: { basicsDone, curriculumDone, pricingDone, readyToPublish }
 *  - onBack?: () => void   // để quay lại step Pricing nếu cần
 */
export default function PublishStep({ courseId, statusFlags, onBack }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { currentCourseMeta, currentCourseTree, saving } = useSelector(
    (state) => state.teacherCourse
  );

  const basicsDone = statusFlags?.basicsDone;
  const curriculumDone = statusFlags?.curriculumDone;
  const pricingDone = statusFlags?.pricingDone;
  const readyToPublish = statusFlags?.readyToPublish;

  const chapters = currentCourseTree?.chapters || [];
  const totalChapters = chapters.length;
  const totalLessons =
    chapters.reduce((sum, ch) => sum + (ch.lessons?.length || 0), 0) || 0;

  const isPublished = currentCourseMeta?.status === "PUBLISHED";
  const isPending = currentCourseMeta?.status === "PENDING_APPROVAL";

  const submitBtnText = isPending
    ? "In review"
    : isPublished
    ? "Update course info"
    : "Submit for review";

  const canSubmit = readyToPublish && !isPending;

  const handleSubmitForReview = async () => {
    if (!courseId) return;
    if (!readyToPublish) {
      message.warning("Hãy hoàn thành các bước trước khi gửi xét duyệt.");
      return;
    }

    try {
      const action = await dispatch(submitforapprovalCourseThunk(courseId));

      if (submitforapprovalCourseThunk.fulfilled.match(action)) {
        message.success("Khoá học đã được gửi cho admin xét duyệt.");
        // 👉 Sau khi submit thành công, quay về trang manage courses
        navigate("/teacher/manage-courses");
      } else {
        message.error(
          action.payload || "Gửi xét duyệt thất bại, vui lòng thử lại."
        );
      }
    } catch (err) {
      console.error(err);
      message.error("Có lỗi khi gửi xét duyệt.");
    }
  };

  const handleUnpublish = async () => {
    if (!courseId) return;
    try {
      const action = await dispatch(unpublishCourseThunk(courseId));
      if (unpublishCourseThunk.fulfilled.match(action)) {
        message.success("Khoá học đã được unpublish.");
      } else {
        message.error(
          action.payload || "Unpublish thất bại, vui lòng thử lại."
        );
      }
    } catch (err) {
      console.error(err);
      message.error("Có lỗi khi unpublish khoá học.");
    }
  };

  return (
    <Card className={styles.cardBig}>
      {/* Header */}
      <div className={styles.stepHeader}>
        <div className={styles.stepTitle}>Review & publish</div>
        <div className={styles.stepDesc}>
          Kiểm tra lại thông tin khoá học trước khi gửi cho admin xét duyệt.
        </div>
      </div>

      {/* Summary status */}
      <div className={styles.reviewBox}>
        <div className={styles.row}>
          <span className={styles.label}>Title & description</span>
          <span
            className={`${styles.value} ${
              basicsDone ? styles.valueOk : styles.valuePending
            }`}
          >
            {basicsDone
              ? "Đã thiết lập"
              : "Chưa đủ thông tin tiêu đề hoặc mô tả"}
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
            {pricingDone
              ? `${(currentCourseMeta?.priceCents || 0).toLocaleString(
                  "vi-VN"
                )} VND`
              : "Chưa đặt giá"}
          </span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>Status</span>
          <span className={styles.value}>
            {currentCourseMeta?.status || "DRAFT"}
          </span>
        </div>
      </div>

      {/* Curriculum preview */}
      <div className={styles.curriculumPreviewBox}>
        <div className={styles.curriculumHeader}>Curriculum preview</div>

        {chapters.length === 0 ? (
          <div className={styles.curriculumEmpty}>
            Chưa có chapter / lesson nào trong curriculum.
          </div>
        ) : (
          <div className={styles.curriculumBody}>
            {chapters.map((ch, chIndex) => (
              <div key={ch.id || chIndex} className={styles.curriculumChapter}>
                <div className={styles.chapterLine}>
                  <span className={styles.chapterIndex}>
                    Chapter {chIndex + 1}
                  </span>
                  <span className={styles.chapterTitle}>
                    {ch.title || "Untitled chapter"}
                  </span>
                </div>

                <ul className={styles.lessonList}>
                  {(ch.lessons || []).length === 0 ? (
                    <li className={styles.lessonEmpty}>
                      No lessons in this chapter
                    </li>
                  ) : (
                    (ch.lessons || []).map((les, lIndex) => (
                      <li key={les.id || lIndex} className={styles.lessonItem}>
                        <span className={styles.lessonIndex}>
                          Lesson {lIndex + 1}
                        </span>
                        <span className={styles.lessonTitle}>
                          {les.title || "Untitled lesson"}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className={styles.actionsRow}>
        {typeof onBack === "function" && (
          <Button onClick={onBack} disabled={saving}>
            Back
          </Button>
        )}

        <div className={styles.actionsRight}>
          <Button
            type="primary"
            onClick={handleSubmitForReview}
            disabled={!canSubmit}
            loading={saving}
          >
            {submitBtnText}
          </Button>

          {isPublished && (
            <Button danger onClick={handleUnpublish} loading={saving}>
              Unpublish
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
