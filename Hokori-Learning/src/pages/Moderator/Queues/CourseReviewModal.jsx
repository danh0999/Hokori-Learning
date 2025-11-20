// src/pages/Moderator/Queues/CourseReviewModal.jsx
import React from "react";
import {
  Modal,
  Descriptions,
  Button,
  Tag,
  Space,
  Typography,
  Tooltip,
} from "antd";
import styles from "./styles.module.scss";

const { Text, Paragraph } = Typography;

// format price từ priceCents / discountedPriceCents + currency
function formatPriceFromCourse(course) {
  if (!course) return "—";

  const { discountedPriceCents, priceCents, currency } = course || {};

  let cents = null;
  if (typeof discountedPriceCents === "number" && discountedPriceCents > 0) {
    cents = discountedPriceCents;
  } else if (typeof priceCents === "number") {
    cents = priceCents;
  }

  if (typeof cents !== "number") return "—";

  const amount = cents / 100;

  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currency || "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (e) {
    console.log(e);

    // phòng trường hợp currency không hợp lệ
    return `${amount.toLocaleString("vi-VN")} ${currency || ""}`.trim();
  }
}

export default function CourseReviewModal({
  open,
  course, // <- object detail trả về: id, title, level, priceCents, discountedPriceCents, currency, subtitle, description, slug, status, userId, ...
  currentModerator,
  onClose,
  onApprove,
  onReject,
  onRequestRevisionClick,
}) {
  if (!course) return null;

  const isMine = !course.assignee || course.assignee === currentModerator;

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

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={800}
      footer={null}
      destroyOnClose
      title={<div style={{ fontWeight: 600 }}>Review course</div>}
    >
      <Descriptions
        bordered
        column={2}
        size="small"
        labelStyle={{ width: 160, fontWeight: 500 }}
      >
        <Descriptions.Item label="Course ID">#{course.id}</Descriptions.Item>
        <Descriptions.Item label="Teacher">
          {course.teacherName || `User #${course.userId}` || "—"}
        </Descriptions.Item>

        <Descriptions.Item label="Title" span={2}>
          <Text strong>{course.title}</Text>
        </Descriptions.Item>

        <Descriptions.Item label="Status">
          <Tag color={statusColor}>{statusLabel}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Submitted at">
          {course.submittedAt || "—"}
        </Descriptions.Item>

        <Descriptions.Item label="Level">
          {course.level || "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Currency">
          {course.currency || "VND"}
        </Descriptions.Item>

        <Descriptions.Item label="Price">{priceLabel}</Descriptions.Item>
        <Descriptions.Item label="Original price (cents)">
          {course.priceCents ?? "—"}
        </Descriptions.Item>

        <Descriptions.Item label="Discounted (cents)">
          {course.discountedPriceCents ?? "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Slug">{course.slug || "—"}</Descriptions.Item>

        <Descriptions.Item label="Assignee" span={2}>
          {course.assignee ? (
            course.assignee === currentModerator ? (
              <Tag color="blue">You</Tag>
            ) : (
              <Tag>{course.assignee}</Tag>
            )
          ) : (
            <Tag color="default">Unassigned</Tag>
          )}
        </Descriptions.Item>
      </Descriptions>

      <div className={styles.detailBox}>
        <h3>Course overview</h3>

        <Paragraph type="secondary" style={{ marginBottom: 4 }}>
          Mô tả ngắn:
        </Paragraph>
        <Paragraph>{course.subtitle || course.description || "—"}</Paragraph>
      </div>

      {/* nếu không phải assignee -> cảnh báo */}
      {!isMine && (
        <div
          style={{
            background: "#fff7ed",
            border: "1px solid #fdba74",
            color: "#9a3412",
            borderRadius: 8,
            padding: "10px 12px",
            fontSize: 13,
            marginTop: 16,
            marginBottom: 8,
          }}
        >
          Bạn không phải người được giao xử lý khoá học này. Chỉ người được
          assign mới được approve / reject.
        </div>
      )}

      <div className={styles.detailBox}>
        <h3>Notes for moderator</h3>
        <ul className={styles.moderatorChecklist}>
          <li>✔ Kiểm tra nội dung có vi phạm chính sách / bản quyền không.</li>
          <li>✔ Xem sơ bộ cấu trúc chương – bài học, quiz, media (nếu có).</li>
          <li>✔ Kiểm tra tiêu đề, thumbnail, mô tả có rõ ràng & phù hợp.</li>
        </ul>
      </div>

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
          {/* Request revision */}
          <Tooltip
            title={
              isMine
                ? "Gửi yêu cầu chỉnh sửa cho giáo viên"
                : "Bạn không phải người xử lý khóa học này"
            }
          >
            <Button
              onClick={() => {
                if (isMine) onRequestRevisionClick?.(course);
              }}
              disabled={!isMine}
            >
              Request revision
            </Button>
          </Tooltip>

          {/* Approve */}
          <Tooltip
            title={
              isMine
                ? "Duyệt và publish khóa học này"
                : "Bạn không phải người xử lý khóa học này"
            }
          >
            <Button
              type="primary"
              onClick={() => {
                if (isMine) onApprove?.(course.id);
              }}
              disabled={!isMine}
            >
              Approve & publish
            </Button>
          </Tooltip>

          {/* Reject */}
          <Tooltip
            title={
              isMine
                ? "Từ chối khóa học này"
                : "Bạn không phải người xử lý khóa học này"
            }
          >
            <Button
              danger
              onClick={() => {
                if (isMine) onReject?.(course.id);
              }}
              disabled={!isMine}
            >
              Reject
            </Button>
          </Tooltip>
        </Space>
      </div>
    </Modal>
  );
}
