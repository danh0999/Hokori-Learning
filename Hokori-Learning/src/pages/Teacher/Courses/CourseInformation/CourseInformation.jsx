// src/pages/Teacher/Courses/CourseInformation/CourseInformation.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Tabs, Button, Tag, Space, message } from "antd";
import { useDispatch, useSelector } from "react-redux";

import CourseOverview from "../Create-Course/components/CourseOverview/CourseOverview.jsx";
import PricingStep from "../Create-Course/components/PricingStep/PricingStep.jsx";
import CourseCurriculumView from "../CourseCurriculumView/CourseCurriculumView.jsx";
import LessonEditorDrawer from "../Create-Course/components/Curriculum Builder/LessonEditorDrawer/LessonEditorDrawer.jsx";
import CourseFeedbackTab from "./CourseFeedbackTab/CourseFeedbackTab.jsx";
import CourseProgressTab from "./CourseProgressTab/CourseProgressTab.jsx";

import {
  fetchCourseTree,
  updateCourseThunk,
  submitforapprovalCourseThunk,
  unpublishCourseThunk,
  clearTeacherCourseState,
  // 🔽 thêm 2 hàm mới
  fetchFlagReasonThunk,
  resubmitFlaggedCourseThunk,
} from "../../../../redux/features/teacherCourseSlice.js";

import styles from "./styles.module.scss";
import { toast } from "react-toastify";

const statusColor = {
  DRAFT: "default",
  PENDING_APPROVAL: "gold",
  PUBLISHED: "success",
  REJECTED: "error",
  FLAGGED: "warning",
  ARCHIVED: "default",
  // fallback cho tên cũ nếu BE/DB còn dùng
  REVIEW: "gold",
};

const statusLabel = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending approval",
  PUBLISHED: "Published",
  REJECTED: "Rejected",
  FLAGGED: "Flagged",
  ARCHIVED: "Archived",
  REVIEW: "Pending approval",
};

function formatDateTime(isoString) {
  if (!isoString) return "";
  try {
    return new Date(isoString).toLocaleString();
  } catch {
    return isoString;
  }
}

export default function CourseInformation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const courseId = id ? Number(id) : null;

  const dispatch = useDispatch();
  const {
    currentCourseMeta,
    currentCourseTree,
    loadingMeta,
    loadingTree,
    saving,
    // 🔽 lấy thêm 2 state mới
    flagInfo,
    loadingFlagInfo,
  } = useSelector((state) => state.teacherCourse);

  const [activeKey, setActiveKey] = useState("basic");
  // ====== LOCAL STATE: lesson editor drawer ======
  const [lessonDrawerOpen, setLessonDrawerOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);

  const handleEditLesson = (lesson) => {
    setSelectedLesson(lesson);
    setLessonDrawerOpen(true);
  };

  const handleCloseLessonDrawer = async () => {
    setLessonDrawerOpen(false);

    if (courseId) {
      try {
        await dispatch(fetchCourseTree(courseId)).unwrap();
      } catch (e) {
        console.error("Reload course tree on close failed", e);
      }
    }
  };

  const handleLessonSaved = async () => {
    if (!courseId) return;
    try {
      await dispatch(fetchCourseTree(courseId)).unwrap();
    } catch (e) {
      console.error("Reload course tree on save failed", e);
    }
  };

  useEffect(() => {
    // reset trước khi load course mới
    dispatch(clearTeacherCourseState());

    if (courseId) {
      dispatch(fetchCourseTree(courseId));
    }
  }, [courseId, dispatch]);

  // ====== LOAD COURSE DATA ======
  useEffect(() => {
    if (!courseId) return;
    dispatch(fetchCourseTree(courseId)); // /detail: vừa meta vừa tree
  }, [courseId, dispatch]);

  const status = currentCourseMeta?.status || "DRAFT";
  const isRejected = status === "REJECTED";
  const isFlagged = status === "FLAGGED";

  // ====== FETCH FLAG REASON KHI STATUS = FLAGGED ======
  useEffect(() => {
    if (!courseId) return;
    if (isFlagged) {
      dispatch(fetchFlagReasonThunk(courseId));
    }
  }, [courseId, isFlagged, dispatch]);

  // ====== ACTIONS ======
  const handleSaveDraft = async () => {
    if (!courseId || !currentCourseMeta) return;

    const payload = {
      ...currentCourseMeta,
    };

    const action = await dispatch(
      updateCourseThunk({ courseId, data: payload })
    );

    if (updateCourseThunk.fulfilled.match(action)) {
      toast.success("Đã lưu");
      dispatch(fetchCourseTree(courseId));
    } else {
      toast.error("Lưu thất bại, vui lòng thử lại");
    }
  };

  const handleSubmitForReview = async () => {
    if (!courseId) return;

    const previousStatus = status;

    const action = await dispatch(submitforapprovalCourseThunk(courseId));

    if (submitforapprovalCourseThunk.fulfilled.match(action)) {
      if (previousStatus === "REJECTED") {
        toast.success("Khóa học đã được nộp lại để duyệt");
      } else {
        toast.success("Đã nộp để duyệt");
      }
      dispatch(fetchCourseTree(courseId));
    } else {
      toast.error("Nộp duyệt thất bại, vui lòng thử lại");
    }
  };

  const handleUnpublish = async () => {
    if (!courseId) return;

    const action = await dispatch(unpublishCourseThunk(courseId));
    if (unpublishCourseThunk.fulfilled.match(action)) {
      toast.success("Đã hủy xuất bản");
      dispatch(fetchCourseTree(courseId));
    } else {
      toast.error("Hủy xuất bản thất bại, vui lòng thử lại");
    }
  };

  const handleResubmitFlagged = async () => {
    if (!courseId) return;

    const action = await dispatch(resubmitFlaggedCourseThunk(courseId));

    if (resubmitFlaggedCourseThunk.fulfilled.match(action)) {
      toast.success("Đã nộp lại khóa học để duyệt");
      dispatch(fetchCourseTree(courseId));
    } else {
      toast.error(action.payload || "Nộp lại thất bại, vui lòng thử lại");
    }
  };

  // ====== VALIDATION ĐỂ ENABLE SUBMIT ======
  const canSubmit = useMemo(() => {
    const isRejectedLocal = currentCourseMeta?.status === "REJECTED";
    const isFlaggedLocal = currentCourseMeta?.status === "FLAGGED";

    // Khi bị REJECTED hoặc FLAGGED → cho resubmit, không check cứng description nữa
    if (isRejectedLocal || isFlaggedLocal) return true;

    // Rule bình thường cho submit lần đầu
    const basicsDone =
      !!currentCourseMeta?.title &&
      !!currentCourseMeta?.description &&
      !!currentCourseMeta?.level;

    const hasLessons =
      currentCourseTree?.chapters?.some(
        (ch) => Array.isArray(ch.lessons) && ch.lessons.length > 0
      ) || false;

    const pricingDone =
      currentCourseMeta?.priceCents === 0 ||
      (currentCourseMeta?.priceCents || 0) > 2000;

    return basicsDone && hasLessons && pricingDone;
  }, [currentCourseMeta, currentCourseTree]);

  const submitButtonLabel =
    status === "PENDING_APPROVAL"
      ? "Đang chờ duyệt"
      : status === "REJECTED"
      ? "Nộp lại để duyệt"
      : "Nộp để duyệt";

  const disableSubmitButton =
    !canSubmit || saving || status === "PENDING_APPROVAL";

  if (!courseId) {
    return (
      <div className={styles.wrap}>
        <p>No course id in URL.</p>
        <Button onClick={() => navigate("/teacher/manage-courses")}>
          ← Quay lại
        </Button>
      </div>
    );
  }

  const hasRejectionInfo = !!currentCourseMeta?.rejectionReason;

  return (
    <div className={styles.wrap}>
      {/* HEADER */}
      <div className={styles.header}>
        <Button onClick={() => navigate("/teacher/manage-courses")}>
          ← Quay lại
        </Button>

        <div>
          <h1 className={styles.title}>
            {currentCourseMeta?.title || `Course #${courseId}`}
          </h1>
          <p className={styles.subtitle}>
            Quản lý thông tin khóa học và theo dõi trạng thái duyệt khóa học
          </p>
        </div>

        <Space wrap>
          <Tag color={statusColor[status] || "default"}>
            {statusLabel[status] || status}
          </Tag>

          <Button onClick={handleSaveDraft} loading={saving || loadingMeta}>
            {status === "PUBLISHED" ? "Lưu thay đổi" : "Lưu "}
          </Button>

          {isFlagged ? (
            // Khi bị FLAGGED → hiển thị nút nộp lại
            <Button
              type="primary"
              disabled={disableSubmitButton}
              onClick={handleResubmitFlagged}
              loading={saving}
            >
              Nộp lại sau khi sửa
            </Button>
          ) : status === "PUBLISHED" ? (
            // Khi đã PUBLISHED → KHÔNG cho teacher làm gì (ẩn nút)
            <></>
          ) : (
            // Các trạng thái khác → Submit for review
            <Button
              type="primary"
              disabled={disableSubmitButton}
              onClick={handleSubmitForReview}
              loading={saving && status !== "PENDING_APPROVAL"}
            >
              {submitButtonLabel}
            </Button>
          )}
        </Space>
      </div>

      {/* REJECTION INFO BLOCK */}
      {isRejected && hasRejectionInfo && (
        <Card className={styles.rejectedCard}>
          <div className={styles.rejectedHeader}>
            <Tag color="error">Rejected</Tag>
            <span className={styles.rejectedTitle}>
              Khóa học này đã bị từ chối duyệt
            </span>
          </div>

          <div className={styles.rejectedBody}>
            <div className={styles.rejectedReasonLabel}>Lý do:</div>
            <div className={styles.rejectedReasonText}>
              {currentCourseMeta.rejectionReason}
            </div>

            <div className={styles.rejectedMeta}>
              {currentCourseMeta.rejectedByUserName && (
                <span>
                  Người duyệt:{" "}
                  <strong>{currentCourseMeta.rejectedByUserName}</strong>
                </span>
              )}
              {currentCourseMeta.rejectedAt && (
                <span>
                  Từ chối lúc:{" "}
                  <strong>
                    {formatDateTime(currentCourseMeta.rejectedAt)}
                  </strong>
                </span>
              )}
            </div>
          </div>

          <div className={styles.rejectedActions}>
            <Space>
              <Button
                type="primary"
                onClick={handleSubmitForReview}
                disabled={disableSubmitButton}
                loading={saving && status !== "PENDING_APPROVAL"}
              >
                Nộp lại để duyệt
              </Button>
            </Space>
          </div>
        </Card>
      )}

      {/* FLAGGED INFO BLOCK */}
      {isFlagged && (
        <Card className={styles.flaggedCard}>
          <div className={styles.flaggedHeader}>
            <Tag color="warning">Flagged</Tag>
            <span className={styles.flaggedTitle}>
              Khóa học này đã bị báo cáo bởi người dùng
            </span>
          </div>

          <div className={styles.flaggedBody}>
            <div className={styles.flaggedReasonLabel}>Tóm tắt báo cáo:</div>
            <div className={styles.flaggedReasonText}>
              {loadingFlagInfo
                ? "Loading flag details..."
                : flagInfo?.flaggedReason || "No detailed reason."}
            </div>

            <div className={styles.flaggedMeta}>
              {flagInfo?.flagCount > 0 && (
                <span>
                  Tổng số báo cáo: <strong>{flagInfo.flagCount}</strong>
                </span>
              )}
              {flagInfo?.latestFlagAt && (
                <span>
                  Báo cáo lần cuối:{" "}
                  <strong>{formatDateTime(flagInfo.latestFlagAt)}</strong>
                </span>
              )}
            </div>
          </div>

          <div className={styles.flaggedActions}>
            <Space>
              <Button onClick={() => setActiveKey("curriculum")}>
                Quản lý nội dung
              </Button>
              <Button
                type="primary"
                onClick={handleResubmitFlagged}
                disabled={disableSubmitButton}
                loading={saving}
              >
                Nộp lại để duyệt
              </Button>
            </Space>
          </div>
        </Card>
      )}

      {/* BODY TABS */}
      <Card>
        <Tabs
          activeKey={activeKey}
          onChange={(key) => setActiveKey(key)}
          items={[
            {
              key: "basic",
              label: "Tổng quan",
              children: (
                <CourseOverview
                  key={courseId}
                  courseId={courseId}
                  loading={loadingMeta}
                />
              ),
            },
            {
              key: "curriculum",
              label: "Nội dung",
              children: (
                <CourseCurriculumView
                  courseMeta={currentCourseMeta}
                  courseTree={currentCourseTree}
                  loading={loadingTree}
                  onEditLesson={handleEditLesson}
                />
              ),
            },
            {
              key: "progress",
              label: "Tiến độ học viên",
              children: (
                <CourseProgressTab
                  courseId={courseId}
                  isActive={activeKey === "progress"}
                />
              ),
            },
            {
              key: "feedback",
              label: "Feedback",
              children: (
                <CourseFeedbackTab
                  courseId={courseId}
                  isActive={activeKey === "feedback"}
                />
              ),
            },
            {
              key: "settings",
              label: "Giá",
              children: (
                <PricingStep
                  courseId={courseId}
                  courseMeta={currentCourseMeta}
                />
              ),
            },
          ]}
        />
      </Card>
      <LessonEditorDrawer
        open={lessonDrawerOpen}
        lesson={selectedLesson}
        onClose={handleCloseLessonDrawer}
        onSave={handleLessonSaved}
      />
    </div>
  );
}
