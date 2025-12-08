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
      message.success("Saved");
      dispatch(fetchCourseTree(courseId));
    } else {
      message.error("Save failed, please try again");
    }
  };

  const handleSubmitForReview = async () => {
    if (!courseId) return;

    const previousStatus = status;

    const action = await dispatch(submitforapprovalCourseThunk(courseId));

    if (submitforapprovalCourseThunk.fulfilled.match(action)) {
      if (previousStatus === "REJECTED") {
        message.success("Course resubmitted for approval.");
      } else {
        message.success("Submitted for review / approval.");
      }
      dispatch(fetchCourseTree(courseId));
    } else {
      message.error("Submit failed, please try again");
    }
  };

  const handleUnpublish = async () => {
    if (!courseId) return;

    const action = await dispatch(unpublishCourseThunk(courseId));
    if (unpublishCourseThunk.fulfilled.match(action)) {
      message.success("Unpublished");
      dispatch(fetchCourseTree(courseId));
    } else {
      message.error("Unpublish failed, please try again");
    }
  };

  const handleResubmitFlagged = async () => {
    if (!courseId) return;

    const action = await dispatch(resubmitFlaggedCourseThunk(courseId));

    if (resubmitFlaggedCourseThunk.fulfilled.match(action)) {
      message.success("Course resubmitted for moderation.");
      dispatch(fetchCourseTree(courseId));
    } else {
      message.error(action.payload || "Resubmit failed, please try again.");
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

    const pricingDone = (currentCourseMeta?.priceCents || 0) > 0;

    return basicsDone && hasLessons && pricingDone;
  }, [currentCourseMeta, currentCourseTree]);

  const submitButtonLabel =
    status === "PENDING_APPROVAL"
      ? "Waiting for approval"
      : status === "REJECTED"
      ? "Resubmit for approval"
      : "Submit for review";

  const disableSubmitButton =
    !canSubmit || saving || status === "PENDING_APPROVAL";

  if (!courseId) {
    return (
      <div className={styles.wrap}>
        <p>No course id in URL.</p>
        <Button onClick={() => navigate("/teacher/manage-courses")}>
          Back to list
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
          ← Back
        </Button>

        <div>
          <h1 className={styles.title}>
            {currentCourseMeta?.title || `Course #${courseId}`}
          </h1>
          <p className={styles.subtitle}>
            Edit content, manage media & assessments
          </p>
        </div>

        <Space wrap>
          <Tag color={statusColor[status] || "default"}>
            {statusLabel[status] || status}
          </Tag>

          <Button onClick={handleSaveDraft} loading={saving || loadingMeta}>
            {status === "PUBLISHED" ? "Save changes" : "Save "}
          </Button>

          {status === "PUBLISHED" ? (
            <Button danger onClick={handleUnpublish} loading={saving}>
              Unpublish
            </Button>
          ) : isFlagged ? (
            <Button
              type="primary"
              disabled={disableSubmitButton}
              onClick={handleResubmitFlagged}
              loading={saving}
            >
              Resubmit after fixing
            </Button>
          ) : (
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
              This course was rejected by the moderator
            </span>
          </div>

          <div className={styles.rejectedBody}>
            <div className={styles.rejectedReasonLabel}>Reason:</div>
            <div className={styles.rejectedReasonText}>
              {currentCourseMeta.rejectionReason}
            </div>

            <div className={styles.rejectedMeta}>
              {currentCourseMeta.rejectedByUserName && (
                <span>
                  Moderator:{" "}
                  <strong>{currentCourseMeta.rejectedByUserName}</strong>
                </span>
              )}
              {currentCourseMeta.rejectedAt && (
                <span>
                  Rejected at:{" "}
                  <strong>
                    {formatDateTime(currentCourseMeta.rejectedAt)}
                  </strong>
                </span>
              )}
            </div>
          </div>

          <div className={styles.rejectedActions}>
            <Space>
              <Button onClick={() => setActiveKey("basic")}>
                Edit basic info
              </Button>
              <Button
                type="primary"
                onClick={handleSubmitForReview}
                disabled={disableSubmitButton}
                loading={saving && status !== "PENDING_APPROVAL"}
              >
                Resubmit for approval
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
              This course was reported by learners and flagged by moderator
            </span>
          </div>

          <div className={styles.flaggedBody}>
            <div className={styles.flaggedReasonLabel}>Flag summary:</div>
            <div className={styles.flaggedReasonText}>
              {loadingFlagInfo
                ? "Loading flag details..."
                : flagInfo?.flaggedReason || "No detailed reason."}
            </div>

            <div className={styles.flaggedMeta}>
              {flagInfo?.flagCount > 0 && (
                <span>
                  Total reports: <strong>{flagInfo.flagCount}</strong>
                </span>
              )}
              {flagInfo?.latestFlagAt && (
                <span>
                  Latest at:{" "}
                  <strong>{formatDateTime(flagInfo.latestFlagAt)}</strong>
                </span>
              )}
            </div>
          </div>

          <div className={styles.flaggedActions}>
            <Space>
              <Button onClick={() => setActiveKey("curriculum")}>
                Edit content
              </Button>
              <Button
                type="primary"
                onClick={handleResubmitFlagged}
                disabled={disableSubmitButton}
                loading={saving}
              >
                Resubmit after fixing
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
              label: "Basic",
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
              label: "Curriculum",
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
              label: "Learners progress",
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
              label: "Pricing",
              children: <PricingStep courseId={courseId} />,
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
