// src/pages/Teacher/Courses/CourseInformation/CourseInformation.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Tabs, Button, Tag, Space } from "antd";
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
function getLatestFlagReason(flagInfo) {
  if (!flagInfo?.flags || flagInfo.flags.length === 0) return null;

  // Giả định BE đã sort newest → oldest
  return flagInfo.flags[0]?.reason || null;
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
    flagInfo,
    loadingFlagInfo,
  } = useSelector((state) => state.teacherCourse);

  const [activeKey, setActiveKey] = useState("basic");

  // drawer
  const [lessonDrawerOpen, setLessonDrawerOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);

  // ====== LOAD COURSE DATA ======
  useEffect(() => {
    dispatch(clearTeacherCourseState());
    if (courseId) dispatch(fetchCourseTree(courseId));
  }, [courseId, dispatch]);

  // ====== STATUS FLAGS ======
  const status = currentCourseMeta?.status || "DRAFT";
  const isPendingApproval = status === "PENDING_APPROVAL";
  const isPublished = status === "PUBLISHED";
  const isRejected = status === "REJECTED";
  const isFlagged = status === "FLAGGED";

  /**
   * Rule:
   * - pending_approval, published: khóa toàn bộ
   * - flagged: chỉ cho sửa curriculum (drawer), khóa meta + giá
   * - rejected, draft: sửa toàn bộ
   */
  const lockAll = isPendingApproval || isPublished; // khóa toàn bộ UI edit
  const lockMeta = lockAll || isFlagged; // khóa overview + pricing + header save (vì save header là meta)
  const lockCurriculum = lockAll; // khóa curriculum chỉ khi pending/published; FLAGGED vẫn được sửa curriculum

  // ====== FETCH FLAG REASON ======
  useEffect(() => {
    if (!courseId) return;
    if (isFlagged) dispatch(fetchFlagReasonThunk(courseId));
  }, [courseId, isFlagged, dispatch]);

  // ====== DRAWER HANDLERS ======
  const handleEditLesson = (lesson) => {
    if (lockCurriculum) {
      toast.warning(
        "Khóa học đang Published hoặc Pending approval, không thể chỉnh sửa nội dung."
      );
      return;
    }
    setSelectedLesson(lesson);
    setLessonDrawerOpen(true);
  };

  const handleCloseLessonDrawer = async () => {
    setLessonDrawerOpen(false);
    if (!courseId) return;
    try {
      await dispatch(fetchCourseTree(courseId)).unwrap();
    } catch (e) {
      console.error("Reload course tree on close failed", e);
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

  // ====== HEADER ACTIONS ======
  /**
   * Header "Lưu" = save lại meta đang có trong store (để chắc chắn sync BE).
   * - FLAGGED: không cho dùng vì teacher chỉ được sửa nội dung (curriculum).
   * - PUBLISHED/PENDING: khóa.
   */
  const handleSaveDraft = async () => {
    if (lockMeta) {
      toast.warning(
        isFlagged
          ? "Khóa học đang FLAGGED: chỉ được chỉnh sửa nội dung (Curriculum), không được lưu thay đổi thông tin khóa học."
          : "Khóa học đang Published hoặc Pending approval, không thể lưu."
      );
      return;
    }
    if (!courseId || !currentCourseMeta) return;

    const payload = { ...currentCourseMeta };

    const action = await dispatch(
      updateCourseThunk({ courseId, data: payload })
    );
    if (updateCourseThunk.fulfilled.match(action)) {
      toast.success("Đã lưu.");
      dispatch(fetchCourseTree(courseId));
    } else {
      toast.error("Lưu thất bại, vui lòng thử lại.");
    }
  };

  const handleSubmitForReview = async () => {
    // pending/published: khóa; flagged: dùng nút riêng resubmit
    if (lockAll || isFlagged) {
      toast.warning(
        isFlagged
          ? "Khóa học đang FLAGGED: hãy sửa nội dung và bấm “Nộp lại sau khi sửa”."
          : "Khóa học đang Published hoặc Pending approval, không thể nộp duyệt."
      );
      return;
    }
    if (!courseId) return;

    const previousStatus = status;
    const action = await dispatch(submitforapprovalCourseThunk(courseId));

    if (submitforapprovalCourseThunk.fulfilled.match(action)) {
      toast.success(
        previousStatus === "REJECTED"
          ? "Khóa học đã được nộp lại để duyệt."
          : "Đã nộp để duyệt."
      );
      dispatch(fetchCourseTree(courseId));
    } else {
      toast.error("Nộp duyệt thất bại, vui lòng thử lại.");
    }
  };

  const handleUnpublish = async () => {
    // bạn đang dùng disableEditing check, giữ logic: pending thì không cho
    if (isPendingApproval) {
      toast.warning("Khóa học đang Pending approval, không thể thao tác.");
      return;
    }
    if (!courseId) return;

    const action = await dispatch(unpublishCourseThunk(courseId));
    if (unpublishCourseThunk.fulfilled.match(action)) {
      toast.success("Đã hủy xuất bản.");
      dispatch(fetchCourseTree(courseId));
    } else {
      toast.error("Hủy xuất bản thất bại, vui lòng thử lại.");
    }
  };

  const handleResubmitFlagged = async () => {
    if (!courseId) return;

    const action = await dispatch(resubmitFlaggedCourseThunk(courseId));
    if (resubmitFlaggedCourseThunk.fulfilled.match(action)) {
      toast.success("Đã nộp lại khóa học để duyệt.");
      dispatch(fetchCourseTree(courseId));
    } else {
      toast.error(action.payload || "Nộp lại thất bại, vui lòng thử lại.");
    }
  };

  // ====== VALIDATION: ENABLE SUBMIT ======
  const canSubmit = useMemo(() => {
    const st = currentCourseMeta?.status;

    // REJECTED: cho nộp lại, không check cứng
    if (st === "REJECTED") return true;

    // FLAGGED: dùng nút nộp lại riêng
    if (st === "FLAGGED") return true;

    // pending/published: không submit
    if (st === "PENDING_APPROVAL" || st === "PUBLISHED") return false;

    // rule bình thường
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
    !canSubmit || saving || status === "PENDING_APPROVAL" || lockAll;

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

          {/* Header save: chỉ dùng cho DRAFT/REJECTED (meta editable) */}
          <Button
            onClick={handleSaveDraft}
            loading={saving || loadingMeta}
            disabled={lockMeta}
            title={
              isFlagged
                ? "FLAGGED: chỉ được sửa nội dung, không được lưu thay đổi thông tin khóa học."
                : undefined
            }
          >
            Lưu
          </Button>

          {/* FLAGGED: nút nộp lại riêng */}
          {isFlagged ? (
            <Button
              type="primary"
              disabled={saving}
              onClick={handleResubmitFlagged}
              loading={saving}
            >
              Nộp lại sau khi sửa
            </Button>
          ) : status === "PUBLISHED" ? (
            <></>
          ) : status === "PENDING_APPROVAL" ? null : (
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
                : getLatestFlagReason(flagInfo) || "No detailed reason."}
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
                disabled={saving}
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
                  disableEditing={lockMeta}
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
                  disableEditing={lockCurriculum}
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
                  disableEditing={lockMeta}
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
