// src/pages/Moderator/Queues/CourseReviewModal.jsx
import React, { useEffect, useState } from "react";
import {
  Modal,
  Descriptions,
  Button,
  Tag,
  Space,
  Typography,
  Spin,
  Collapse,
  Alert,
} from "antd";
import styles from "./styles.module.scss";

import api from "../../../configs/axios.js";

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

// format price chỉ từ priceCents, currency = VND
function formatPriceFromCourse(course) {
  if (!course) return "—";

  const { priceCents } = course || {};
  if (typeof priceCents !== "number") return "—";

  const amount = priceCents;

  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (e) {
    console.log(e);
    return `${amount.toLocaleString("vi-VN")} ₫`;
  }
}

// helper: lấy list section cho từng lesson trong 1 chapter
function getLessonSections(chapter, lesson) {
  const sections = chapter.sections || [];

  // case 1: BE có field lessonId / lesson_id
  let list = sections.filter(
    (s) =>
      s.lessonId === lesson.id ||
      s.lesson_id === lesson.id ||
      s.lessonID === lesson.id
  );
  if (list.length > 0) return list;

  // case 2: chapter chỉ có 1 lesson → gán hết sections cho lesson đó
  if ((chapter.lessons || []).length === 1) return sections;

  // default
  return [];
}

export default function CourseReviewModal({
  open,
  course,

  onClose,
  onApprove,
  onReject,
  onRequestRevisionClick,
}) {
  if (!course) return null;

  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState(null);

  // gọi GET /api/moderator/courses/{id}/detail khi mở modal
  useEffect(() => {
    if (!open || !course?.id) {
      setDetail(null);
      setDetailError(null);
      return;
    }

    let isMounted = true;

    const fetchDetail = async () => {
      setLoadingDetail(true);
      setDetailError(null);
      try {
        const res = await api.get(`/moderator/courses/${course.id}/detail`);
        // swagger: { success, message, data: {...} }
        const payload = res.data;
        const detailData = payload?.data ?? payload;
        if (!isMounted) return;
        setDetail(detailData);
      } catch (err) {
        console.error("Failed to load moderator course detail:", err);
        if (!isMounted) return;
        setDetailError(
          err?.response?.data?.message ||
            "Không tải được nội dung chi tiết khoá học."
        );
      } finally {
        if (isMounted) setLoadingDetail(false);
      }
    };

    fetchDetail();

    return () => {
      isMounted = false;
    };
  }, [open, course?.id]);

  const status = course.status || "PENDING_APPROVAL";
  const statusColor =
    status === "PENDING_APPROVAL"
      ? "gold"
      : status === "PUBLISHED"
      ? "green"
      : status === "DRAFT"
      ? "default"
      : "default";

  const statusLabel =
    status === "PENDING_APPROVAL"
      ? "Pending approval"
      : status === "PUBLISHED"
      ? "Published"
      : status === "DRAFT"
      ? "Draft"
      : status;

  const priceLabel = formatPriceFromCourse(course);

  const chapters = detail?.chapters || [];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={900}
      footer={null}
      destroyOnClose
      title={<div style={{ fontWeight: 600 }}>Review course</div>}
    >
      {/* Thông tin tổng quan */}
      <Descriptions
        bordered
        column={2}
        size="small"
        labelStyle={{ width: 160, fontWeight: 500 }}
      >
        <Descriptions.Item label="Mã khoá học">#{course.id}</Descriptions.Item>

        <Descriptions.Item label="Giáo viên">
          {course.teacherName || `User #${course.userId}` || "—"}
        </Descriptions.Item>

        <Descriptions.Item label="Tiêu đề" span={2}>
          <Text strong>{course.title}</Text>
        </Descriptions.Item>

        <Descriptions.Item label="Tình trạng">
          <Tag color={statusColor}>{statusLabel}</Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Level">
          {course.level || "—"}
        </Descriptions.Item>

        <Descriptions.Item label="Giá (VND)">{priceLabel}</Descriptions.Item>
      </Descriptions>

      {/* Mô tả ngắn */}
      <div className={styles.detailBox}>
        <h3>Course overview</h3>

        <Paragraph type="secondary" style={{ marginBottom: 4 }}>
          Mô tả ngắn:
        </Paragraph>
        <Paragraph>{course.description || "—"}</Paragraph>
      </div>

      {/* FULL TREE: Chapter -> Lesson -> Section (Content) + Quiz thuộc Lesson */}
      <div className={styles.detailBox}>
        <h3>Course content (full tree)</h3>

        {loadingDetail && (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <Spin />
          </div>
        )}

        {!loadingDetail && detailError && (
          <Alert
            type="error"
            message="Không tải được cấu trúc khoá học"
            description={detailError}
            showIcon
          />
        )}

        {!loadingDetail && !detailError && (
          <>
            {chapters.length === 0 ? (
              <Text type="secondary">
                Khoá học chưa có chương / bài học nào.
              </Text>
            ) : (
              <Collapse accordion>
                {chapters.map((chapter, cIdx) => {
                  const lessons = chapter.lessons || [];

                  return (
                    <Panel
                      key={chapter.id || cIdx}
                      header={
                        <div className={styles.sectionHeader}>
                          <Text strong>
                            Chương {chapter.orderIndex ?? cIdx}:{" "}
                            {chapter.title || "Untitled chapter"}
                          </Text>
                        </div>
                      }
                    >
                      {chapter.summary && (
                        <Paragraph
                          className={styles.lessonTextPreview}
                          style={{ marginBottom: 8 }}
                        >
                          {chapter.summary}
                        </Paragraph>
                      )}

                      {lessons.length === 0 ? (
                        <Text type="secondary">
                          Chương này chưa có lesson nào.
                        </Text>
                      ) : (
                        <div className={styles.lessonList}>
                          {lessons.map((lesson, lIdx) => {
                            const lessonSections = getLessonSections(
                              chapter,
                              lesson
                            );

                            const hasQuiz =
                              !!lesson.quiz ||
                              !!lesson.quizId ||
                              (Array.isArray(lesson.quizzes) &&
                                lesson.quizzes.length > 0);

                            const textPreview =
                              lesson.summary || lesson.description || "";

                            return (
                              <div
                                key={lesson.id || lIdx}
                                className={styles.lessonItem}
                              >
                                {/* ===== Lesson header + quiz ===== */}
                                <div className={styles.lessonMain}>
                                  <Text strong>
                                    {lIdx + 1}.{" "}
                                    {lesson.title || "Untitled lesson"}
                                  </Text>

                                  <Space size={6}>
                                    {hasQuiz && (
                                      <Tag
                                        color="purple"
                                        style={{ marginLeft: 8 }}
                                      >
                                        Quiz attached
                                      </Tag>
                                    )}
                                  </Space>
                                </div>

                                {/* Preview text của lesson nếu có */}
                                {textPreview && (
                                  <Paragraph
                                    className={styles.lessonTextPreview}
                                  >
                                    {textPreview}
                                  </Paragraph>
                                )}

                                {/* ===== Sections / Content của lesson ===== */}
                                {lessonSections.length > 0 ? (
                                  <div className={styles.chapterSectionList}>
                                    {lessonSections.map((section, sIdx) => (
                                      <div
                                        key={section.id || sIdx}
                                        className={styles.chapterSectionItem}
                                      >
                                        <div
                                          className={
                                            styles.chapterSectionHeader
                                          }
                                        >
                                          <Text>
                                            ▸{" "}
                                            {section.title ||
                                              "Untitled content"}
                                          </Text>
                                          {section.contentType && (
                                            <Tag
                                              size="small"
                                              color="blue"
                                              style={{ marginLeft: 8 }}
                                            >
                                              {section.contentType}
                                            </Tag>
                                          )}
                                        </div>

                                        {section.summary && (
                                          <Paragraph
                                            className={styles.lessonTextPreview}
                                          >
                                            {section.summary}
                                          </Paragraph>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <Text
                                    type="secondary"
                                    style={{ fontSize: 12 }}
                                  >
                                    Lesson này chưa có content/section nào.
                                  </Text>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Panel>
                  );
                })}
              </Collapse>
            )}
          </>
        )}
      </div>

      {/* Checklist cho moderator */}
      <div className={styles.detailBox}>
        <h3>Notes for moderator</h3>
        <ul className={styles.moderatorChecklist}>
          <li>Kiểm tra nội dung có vi phạm chính sách / bản quyền không.</li>
          <li>Xem sơ bộ cấu trúc chương → lesson → content.</li>
          <li>Kiểm tra tiêu đề, thumbnail, mô tả có rõ ràng &amp; phù hợp.</li>
        </ul>
      </div>

      {/* Footer nút hành động */}
      <div
        style={{
          marginTop: 16,
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <Button onClick={onClose}>Close</Button>

        <Space wrap>
          <Button onClick={() => onRequestRevisionClick?.(course)}>
            Request revision
          </Button>

          <Button type="primary" onClick={() => onApprove?.(course.id)}>
            Approve &amp; publish
          </Button>

          <Button danger onClick={() => onReject?.(course.id)}>
            Reject
          </Button>
        </Space>
      </div>
    </Modal>
  );
}
