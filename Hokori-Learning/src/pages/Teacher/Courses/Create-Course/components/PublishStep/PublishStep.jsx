// src/pages/Teacher/Courses/Create-Course/components/PublishStep/PublishStep.jsx
import React from "react";
import { Card, Button, message } from "antd";
import { useDispatch, useSelector } from "react-redux";

import {
  submitforapprovalCourseThunk,
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

  const status = currentCourseMeta?.status || "DRAFT";
  const isDraft = status === "DRAFT";
  const isPending = status === "PENDING_APPROVAL";
  const isPublished = status === "PUBLISHED";
  const isArchived = status === "ARCHIVED";

  const handleSubmitForReview = async () => {
    if (!courseId) return;
    // tránh gọi thừa khi đang pending/published
    if (isPending) {
      message.info("Khoá học đang chờ moderator duyệt.");
      return;
    }
    if (isPublished) {
      message.info("Khoá học đã được publish.");
      return;
    }

    const action = await dispatch(submitforapprovalCourseThunk(courseId));

    if (submitforapprovalCourseThunk.fulfilled.match(action)) {
      message.success(
        "Khoá học đã được gửi cho moderator duyệt (trạng thái: PENDING_APPROVAL)."
      );
    } else {
      message.error("Không submit được khoá học, vui lòng thử lại.");
    }
  };

  const handleUnpublish = async () => {
    if (!courseId) return;

    const action = await dispatch(unpublishCourseThunk(courseId));

    if (unpublishCourseThunk.fulfilled.match(action)) {
      message.success("Khoá học đã được unpublish / ngừng bán.");
    } else {
      message.error("Không unpublish được, vui lòng thử lại.");
    }
  };

  const priceText = pricingDone
    ? `${currentCourseMeta?.priceCents?.toLocaleString("vi-VN")} VND`
    : "Not set";

  // text cho nút submit
  let submitBtnText = "Submit for review";
  if (isPending) submitBtnText = "Waiting for moderator approval";
  if (isPublished) submitBtnText = "Already published";

  const submitDisabled = !readyToPublish || isPending || isPublished || saving;

  return (
    <Card className={styles.cardBig}>
      {/* Header + status pill */}
      <div className={styles.headerRow}>
        <div className={styles.stepHeader}>
          <div className={styles.stepTitle}>Review & Submit</div>
          <div className={styles.stepDesc}>
            Kiểm tra lại khoá học trước khi gửi cho moderator duyệt. Sau khi
            được approve, khoá học sẽ chuyển sang trạng thái PUBLISHED và
            Learner mới nhìn thấy.
          </div>
        </div>

        <div className={styles.statusPill}>{status}</div>
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

      {isPending && (
        <div className={styles.infoBox}>
          Khoá học đang ở trạng thái <b>PENDING_APPROVAL</b>. Moderator sẽ kiểm
          tra và nếu approve, trạng thái sẽ chuyển sang <b>PUBLISHED</b>.
        </div>
      )}

      {/* Action buttons */}
      <div className={styles.actionRow}>
        <Button
          type="primary"
          disabled={submitDisabled}
          onClick={handleSubmitForReview}
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
    </Card>
  );
}
