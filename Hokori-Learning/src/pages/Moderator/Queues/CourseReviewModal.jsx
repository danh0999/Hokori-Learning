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

const { Text } = Typography;

export default function CourseReviewModal({
  open,
  course,
  currentModerator,
  onClose,
  onApprove,
  onReject,
  onRequestRevisionClick, // <- mới
}) {
  if (!course) return null;

  const isMine = !course.assignee || course.assignee === currentModerator;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={800}
      footer={null}
      destroyOnClose
      title={<div style={{ fontWeight: 600 }}>Review: {course.title}</div>}
    >
      <Descriptions
        bordered
        column={1}
        size="small"
        labelStyle={{ width: 160, fontWeight: 500 }}
      >
        <Descriptions.Item label="Code">{course.code}</Descriptions.Item>
        <Descriptions.Item label="Teacher">{course.teacher}</Descriptions.Item>
        <Descriptions.Item label="Submitted on">
          {course.submittedAt}
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color="gold">Review</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Assignee">
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
        <h3>Course Overview</h3>
        <p>
          Đây là mô tả tổng quan khóa học (demo). Sau này bạn có thể fetch chi
          tiết từ API /teacher/course/:id để hiển thị toàn bộ chương, bài học,
          quiz, media…
        </p>
      </div>

      {/* nếu không phải assignee -> cảnh báo */}
      {!isMine && (
        <div
          style={{
            background: "#fff7ed",
            border: "1px solid #fdba74",
            color: "#9a3412",
            borderRadius: 8,
            fontSize: 13,
            padding: "12px 14px",
            lineHeight: 1.4,
            marginTop: 16,
            marginBottom: 16,
          }}
        >
          <b>Khóa học này đang do {course.assignee} xử lý.</b>
          <div>
            Bạn chỉ có thể xem nội dung, không thể gửi yêu cầu chỉnh sửa hoặc
            phê duyệt.
          </div>
        </div>
      )}

      <div style={{ textAlign: "right", marginTop: 16 }}>
        <Space wrap>
          {/* Request Revision */}
          <Tooltip
            title={
              isMine
                ? "Yêu cầu giáo viên chỉnh sửa nội dung"
                : "Bạn không phải người xử lý khóa học này"
            }
          >
            <Button
              onClick={() => {
                if (isMine) onRequestRevisionClick?.(course);
              }}
              disabled={!isMine}
            >
              Request Revision
            </Button>
          </Tooltip>

          {/* Approve */}
          <Tooltip
            title={
              isMine
                ? "Phê duyệt và đăng khóa học"
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
              Approve
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
