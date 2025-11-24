// src/pages/Moderator/CourseReviewPage.jsx
import React, { useEffect, useState } from "react";
import {
  Descriptions,
  Button,
  Tag,
  Space,
  Typography,
  Spin,
  Alert,
  message,
} from "antd";
import { ArrowLeftOutlined, RobotOutlined } from "@ant-design/icons";
import { useNavigate, useParams, useLocation } from "react-router-dom";

import styles from "./CourseReviewPage.module.scss";

// ⚠️ chỉnh path cho đúng
import api from "../../../../configs/axios.js";
// ⚠️ chỉnh path cho đúng tới CourseCurriculumView
import CourseCurriculumView from "../../../Teacher/Courses/CourseCurriculumView/CourseCurriculumView.jsx";

const { Text, Title, Paragraph } = Typography;

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

export default function CourseReviewPage() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const location = useLocation();

  const initialCourse = location.state?.course || null;

  const [course, setCourse] = useState(initialCourse);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const [aiReview, setAiReview] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  useEffect(() => {
    if (!courseId) return;

    let isMounted = true;

    const fetchDetail = async () => {
      setLoadingDetail(true);
      setDetailError(null);
      try {
        const res = await api.get(`/moderator/courses/${courseId}/detail`);
        const payload = res.data;
        const detailData = payload?.data ?? payload;

        if (!isMounted) return;

        setDetail(detailData);
        if (!course) setCourse(detailData);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const status = course?.status || "PENDING_APPROVAL";
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

  const handleApprove = async () => {
    try {
      await api.put(`/moderator/courses/${courseId}/approve`);
      message.success("Đã approve & publish khóa học.");
      navigate(-1);
    } catch (err) {
      console.error(err);
      message.error(
        err?.response?.data?.message || "Approve khóa học thất bại."
      );
    }
  };

  const handleReject = async () => {
    try {
      await api.put(`/moderator/courses/${courseId}/reject`);
      message.success("Đã reject khóa học.");
      navigate(-1);
    } catch (err) {
      console.error(err);
      message.error(
        err?.response?.data?.message || "Reject khóa học thất bại."
      );
    }
  };

  const handleRequestRevision = () => {
    message.info("TODO: mở form yêu cầu chỉnh sửa nội dung.");
  };

  const handleAiReview = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      // TODO: chỉnh endpoint khi BE làm xong
      const res = await api.post(`/moderator/courses/${courseId}/ai-review`);
      const payload = res.data;
      const reviewData = payload?.data ?? payload;
      setAiReview(reviewData);
    } catch (err) {
      console.error("AI review error:", err);
      setAiError(
        err?.response?.data?.message ||
          "Không gọi được AI review. Kiểm tra endpoint / cấu hình."
      );
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className={styles.reviewPageWrapper}>
      {/* TOP BAR */}
      <div className={styles.reviewHeaderBar}>
        <Space size={12}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            type="text"
          />
          <div>
            <Title level={4} className={styles.headerTitle}>
              Review course #{courseId}
            </Title>
            <Text type="secondary" className={styles.headerSubtitle}>
              {course?.title || "—"}
              {course && (
                <>
                  {" · "}
                  Teacher: {course.teacherName || `User #${course.userId}`}
                </>
              )}
            </Text>
          </div>
        </Space>

        <Space>
          <Button
            icon={<RobotOutlined />}
            onClick={handleAiReview}
            loading={aiLoading}
          >
            AI review nội dung khóa học
          </Button>
          <Button onClick={handleRequestRevision}>Request revision</Button>
          <Button type="primary" onClick={handleApprove}>
            Approve &amp; publish
          </Button>
          <Button danger onClick={handleReject}>
            Reject
          </Button>
        </Space>
      </div>

      {/* BODY 2 CỘT */}
      <div className={styles.reviewPageContent}>
        {/* LEFT: FULL CURRICULUM */}
        <div className={styles.reviewMainColumn}>
          <Descriptions
            bordered
            column={2}
            size="small"
            labelStyle={{ width: 160, fontWeight: 500 }}
            className={styles.metaBlock}
          >
            <Descriptions.Item label="Mã khoá học">
              #{course?.id || courseId}
            </Descriptions.Item>
            <Descriptions.Item label="Giáo viên">
              {course?.teacherName || `User #${course?.userId}` || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Tiêu đề" span={2}>
              <Text strong>{course?.title || "—"}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Tình trạng">
              <Tag color={statusColor}>{statusLabel}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Level">
              {course?.level || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Giá (VND)">
              {priceLabel}
            </Descriptions.Item>
          </Descriptions>

          {detailError && (
            <Alert
              type="error"
              message="Không tải được curriculum chi tiết"
              description={detailError}
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <div className={styles.curriculumBlock}>
            <div className={styles.blockHeader}>
              <h3>Course curriculum preview</h3>
              <Paragraph type="secondary">
                Preview đầy đủ như màn Curriculum của Teacher (chapter, lesson,
                content, video, quiz, flashcard…).
              </Paragraph>
            </div>

            {/* Dùng lại component Curriculum của teacher */}
            <CourseCurriculumView
              courseMeta={course || detail}
              courseTree={detail}
              loading={loadingDetail}
            />
          </div>
        </div>

        {/* RIGHT: AI REVIEW */}
        <div className={styles.reviewSideColumn}>
          <div className={styles.detailBox}>
            <h3 className={styles.sideTitle}>
              <RobotOutlined style={{ marginRight: 6 }} />
              AI review
            </h3>

            {aiLoading && (
              <div className={styles.aiLoading}>
                <Spin />
              </div>
            )}

            {aiError && (
              <Alert
                type="error"
                message="AI review error"
                description={aiError}
                showIcon
              />
            )}

            {!aiLoading && !aiError && !aiReview && (
              <Text type="secondary">
                Bấm nút “AI review nội dung khóa học” ở trên để nhận nhận xét về
                nội dung, cấu trúc, độ phù hợp với học viên…
              </Text>
            )}

            {!aiLoading && aiReview && (
              <div className={styles.aiReviewBox}>
                {typeof aiReview === "string" ? (
                  <Paragraph>{aiReview}</Paragraph>
                ) : (
                  <pre className={styles.aiReviewPre}>
                    {JSON.stringify(aiReview, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
