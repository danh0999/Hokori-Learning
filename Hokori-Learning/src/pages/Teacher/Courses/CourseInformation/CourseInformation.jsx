// src/pages/Teacher/Courses/CourseInformation/CourseInformation.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Tabs,
  Button,
  Tag,
  Space,
  Divider,
  Collapse,
  Empty,
  Typography,
} from "antd";
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

const { Text } = Typography;

const statusColor = {
  DRAFT: "default",
  PENDING_APPROVAL: "gold",
  PUBLISHED: "success",
  REJECTED: "error",
  FLAGGED: "warning",
};

const statusLabel = {
  DRAFT: "Bản nháp",
  PENDING_APPROVAL: "Chờ duyệt",
  PUBLISHED: "Đã xuất bản",
  REJECTED: "Bị từ chối",
  FLAGGED: "Bị báo cáo",
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

/** =========================
 *  Helpers for rejection detail mapping
 *  ========================= */
function buildIdTitleMaps(courseTree) {
  const chapterMap = new Map(); // chapterId -> title
  const lessonMap = new Map(); // lessonId -> title
  const sectionMap = new Map(); // sectionId -> title

  const chapters = courseTree?.chapters || [];
  for (const ch of chapters) {
    if (ch?.id != null) chapterMap.set(ch.id, ch.title || `Chapter #${ch.id}`);

    for (const ls of ch?.lessons || []) {
      if (ls?.id != null) lessonMap.set(ls.id, ls.title || `Lesson #${ls.id}`);

      for (const sec of ls?.sections || []) {
        if (sec?.id != null) {
          const st = sec.title || sec.studyType || `Section #${sec.id}`;
          sectionMap.set(sec.id, st);
        }
      }
    }
  }

  return { chapterMap, lessonMap, sectionMap };
}

function hasAnyStructuredReason(detail) {
  if (!detail || typeof detail !== "object") return false;

  const top =
    detail.general ||
    detail.title ||
    detail.subtitle ||
    detail.description ||
    detail.coverImage ||
    detail.price;

  const hasArr =
    (Array.isArray(detail.chapters) && detail.chapters.length > 0) ||
    (Array.isArray(detail.lessons) && detail.lessons.length > 0) ||
    (Array.isArray(detail.sections) && detail.sections.length > 0);

  return Boolean(top || hasArr);
}

function renderTopReasonRow(label, value, onJump) {
  if (!value) return null;
  return (
    <div className={styles.rejectedRow}>
      <div className={styles.rejectedRowLabel}>{label}</div>
      <div className={styles.rejectedRowValue}>
        {value}
        {onJump ? (
          <Button type="link" size="small" onClick={onJump}>
            (Xem)
          </Button>
        ) : null}
      </div>
    </div>
  );
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
  const lockMeta = lockAll || isFlagged; // khóa overview + pricing + header save
  const lockCurriculum = lockAll; // FLAGGED vẫn được sửa curriculum

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
  const handleSaveDraft = async () => {
    if (lockMeta) {
      toast.warning(
        isFlagged
          ? "Khóa học đang bị báo cáo: chỉ được chỉnh sửa nội dung, không được lưu thay đổi thông tin khóa học."
          : "Khóa học đang được xuất bản hoặc đang chờ duyệt, không thể lưu."
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
    if (lockAll || isFlagged) {
      toast.warning(
        isFlagged
          ? "Khóa học đang bị báo cáo: hãy sửa nội dung và bấm “Nộp lại sau khi sửa”."
          : "Khóa học đang được xuất bản hoặc đang chờ duyệt, không thể nộp duyệt."
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
      : status === "DRAFT"
      ? "Gửi duyệt"
      : "Nộp để duyệt";

  const disableSubmitButton =
    !canSubmit || saving || status === "PENDING_APPROVAL" || lockAll;

  const { chapterMap, lessonMap, sectionMap } = useMemo(
    () => buildIdTitleMaps(currentCourseTree),
    [currentCourseTree]
  );
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
  const rejectionDetail = currentCourseMeta?.rejectionReasonDetail || null;
  const hasStructured = hasAnyStructuredReason(rejectionDetail);
  const hasRejectionInfo =
    !!currentCourseMeta?.rejectionReason || Boolean(hasStructured);

  // Helper render item reasons list
  const renderItemReasons = (
    title,
    items,
    idToTitleMap,
    onJumpToCurriculum
  ) => {
    if (!Array.isArray(items) || items.length === 0) return null;

    return (
      <div className={styles.rejectedGroup}>
        <div className={styles.rejectedGroupHeader}>
          <div className={styles.rejectedGroupTitle}>{title}</div>
          {onJumpToCurriculum ? (
            <Button type="link" size="small" onClick={onJumpToCurriculum}>
              Xem trong nội dung
            </Button>
          ) : null}
        </div>

        <div className={styles.rejectedGroupBody}>
          {items.map((it, idx) => {
            const name =
              idToTitleMap?.get(it?.id) || (it?.id != null ? `#${it.id}` : "—");
            const reason = it?.reason || "";
            if (!reason) return null;

            return (
              <div key={`${it?.id ?? idx}`} className={styles.rejectedItemRow}>
                <div className={styles.rejectedItemTitle}>
                  <Text strong>{name}</Text>
                  {it?.id != null ? (
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      (ID: {it.id})
                    </Text>
                  ) : null}
                </div>
                <div className={styles.rejectedItemReason}>{reason}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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

          {/* Header save */}
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

      {/* ✅ REJECTION INFO BLOCK (UPDATED: show detail per part) */}
      {isRejected && hasRejectionInfo && (
        <Card className={styles.rejectedCard}>
          <div className={styles.rejectedHeader}>
            <Tag color="error">Bị từ chối</Tag>
            <span className={styles.rejectedTitle}>
              Khóa học này đã bị từ chối duyệt
            </span>
          </div>

          <div className={styles.rejectedBody}>
            {/* Simple reason (backward compatible) */}
            {currentCourseMeta?.rejectionReason && (
              <>
                <div className={styles.rejectedReasonLabel}>Tóm tắt:</div>
                <div className={styles.rejectedReasonText}>
                  {currentCourseMeta.rejectionReason}
                </div>
              </>
            )}

            {/* Structured reasons */}
            <Divider style={{ margin: "12px 0" }} />

            {!hasStructured ? (
              <Empty
                description="Không có lý do chi tiết (structured) từ moderator."
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <Collapse
                defaultActiveKey={["detail"]}
                items={[
                  {
                    key: "detail",
                    label: "Xem lý do chi tiết theo từng phần",
                    children: (
                      <div>
                        {/* TOP-LEVEL reasons */}
                        <div className={styles.rejectedSectionTitle}>
                          Thông tin khóa học
                        </div>

                        {renderTopReasonRow("Chung", rejectionDetail?.general)}
                        {renderTopReasonRow(
                          "Tiêu đề",
                          rejectionDetail?.title,
                          () => setActiveKey("basic")
                        )}
                        {renderTopReasonRow(
                          "Mô tả phụ",
                          rejectionDetail?.subtitle,
                          () => setActiveKey("basic")
                        )}
                        {renderTopReasonRow(
                          "Mô tả chi tiết",
                          rejectionDetail?.description,
                          () => setActiveKey("basic")
                        )}
                        {renderTopReasonRow(
                          "Ảnh bìa",
                          rejectionDetail?.coverImage,
                          () => setActiveKey("basic")
                        )}
                        {renderTopReasonRow("Giá", rejectionDetail?.price, () =>
                          setActiveKey("settings")
                        )}

                        <Divider style={{ margin: "12px 0" }} />

                        <div className={styles.rejectedSectionTitle}>
                          Nội dung khóa học (Curriculum)
                        </div>

                        {renderItemReasons(
                          "Chapters",
                          rejectionDetail?.chapters,
                          chapterMap,
                          () => setActiveKey("curriculum")
                        )}

                        {renderItemReasons(
                          "Lessons",
                          rejectionDetail?.lessons,
                          lessonMap,
                          () => setActiveKey("curriculum")
                        )}

                        {renderItemReasons(
                          "Sections",
                          rejectionDetail?.sections,
                          sectionMap,
                          () => setActiveKey("curriculum")
                        )}

                        {/* If none of arrays have content */}
                        {!(
                          (rejectionDetail?.chapters?.length || 0) +
                          (rejectionDetail?.lessons?.length || 0) +
                          (rejectionDetail?.sections?.length || 0)
                        ) && (
                          <Text type="secondary">
                            Không có lý do chi tiết theo Chapter/Lesson/Section.
                          </Text>
                        )}
                      </div>
                    ),
                  },
                ]}
              />
            )}

            {/* meta */}
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
            <Space wrap>
              <Button onClick={() => setActiveKey("basic")}>
                Xem tổng quan
              </Button>
              <Button onClick={() => setActiveKey("curriculum")}>
                Xem nội dung
              </Button>
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
            <Tag color="warning">Bị báo cáo</Tag>
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
