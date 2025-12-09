// src/pages/Teacher/Courses/Create-Course/components/PublishStep/PublishStep.jsx
import React from "react";
import { Card, Button } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  submitforapprovalCourseThunk,
  unpublishCourseThunk,
} from "../../../../../../redux/features/teacherCourseSlice.js";

import styles from "./styles.module.scss";
import { toast } from "react-toastify";

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
    : "Gửi kiểm duyệt";

  const canSubmit = readyToPublish && !isPending;

  const handleSubmitForReview = async () => {
    if (!courseId) return;

    // -------------------------------
    // 🔥 Validate giá ở bước Publish
    // -------------------------------
    const price = currentCourseMeta?.priceCents ?? 0;

    if (!(price === 0 || price > 2000)) {
      toast.error(
        "Giá khóa học phải bằng 0 (miễn phí) hoặc lớn hơn 2.000 VND."
      );
      if (typeof onBack === "function") onBack(); // Điều hướng quay lại PricingStep
      return;
    }

    try {
      const action = await dispatch(submitforapprovalCourseThunk(courseId));

      if (submitforapprovalCourseThunk.fulfilled.match(action)) {
        // 🔥 CLEAR DRAFT LOCALSTORAGE NGAY Ở ĐÂY
        try {
          const raw = localStorage.getItem("teacher-draft-courses");
          let list = raw ? JSON.parse(raw) : [];
          if (!Array.isArray(list)) list = [];

          // bỏ cái course vừa gửi duyệt ra khỏi list draft
          list = list.filter((c) => c.id !== courseId);
          localStorage.setItem("teacher-draft-courses", JSON.stringify(list));

          // xoá luôn step cache
          localStorage.removeItem(`course-wizard-step-${courseId}`);
        } catch (e) {
          console.warn("Cannot clear draft after submit", e);
        }

        toast.success("Khoá học đã được gửi cho admin xét duyệt.");
        navigate("/teacher/manage-courses");
      } else {
        toast.error(
          action.payload || "Gửi xét duyệt thất bại, vui lòng thử lại."
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi khi gửi xét duyệt.");
    }
  };

  const handleUnpublish = async () => {
    if (!courseId) return;
    try {
      const action = await dispatch(unpublishCourseThunk(courseId));
      if (unpublishCourseThunk.fulfilled.match(action)) {
        toast.success("Khoá học đã được unpublish.");
      } else {
        toast.error(action.payload || "Unpublish thất bại, vui lòng thử lại.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi khi unpublish khoá học.");
    }
  };

  return (
    <Card className={styles.cardBig}>
      {/* Header */}
      <div className={styles.stepHeader}>
        <div className={styles.stepTitle}>Tổng kết</div>
        <div className={styles.stepDesc}>
          Kiểm tra lại thông tin khoá học trước khi gửi cho admin xét duyệt.
        </div>
      </div>

      {/* Summary status */}
      <div className={styles.reviewBox}>
        <div className={styles.row}>
          <span className={styles.label}>Tiêu đề & mô tả</span>
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
          <span className={styles.label}>Nội dung khoá học</span>
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
          <span className={styles.label}>Giá</span>
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
          <span className={styles.label}>Trạng thái</span>
          <span className={styles.value}>
            {currentCourseMeta?.status || "DRAFT"}
          </span>
        </div>
      </div>

      {/* Curriculum preview */}
      <div className={styles.curriculumPreviewBox}>
        <div className={styles.curriculumHeader}>
          Xem trước nội dung khoá học
        </div>

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
                    Chương {chIndex + 1}
                  </span>
                  <span className={styles.chapterTitle}>
                    {ch.title || "Untitled chapter"}
                  </span>
                </div>

                <ul className={styles.lessonList}>
                  {(ch.lessons || []).length === 0 ? (
                    <li className={styles.lessonEmpty}>
                      Chưa có bài học nào trong chương này.
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
            Quay lại
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
              Huỷ xuất bản
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
