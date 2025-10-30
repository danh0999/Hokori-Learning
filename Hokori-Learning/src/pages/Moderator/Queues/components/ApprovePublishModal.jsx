import React from "react";
import { Modal, Descriptions } from "antd";

/**
 * Props:
 *  - open
 *  - onCancel()
 *  - onConfirm()
 *  - courseSummary: {
 *      title,
 *      price,
 *      visibility, // e.g. "Public", "Unlisted", "Private"
 *    }
 */
export default function ApprovePublishModal({
  open,
  onCancel,
  onConfirm,
  courseSummary,
}) {
  if (!courseSummary) return null;

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      onOk={onConfirm}
      okText="Approve & Publish"
      cancelText="Cancel"
      width={520}
      title={<div style={{ fontWeight: 600 }}>Approve & Publish</div>}
      destroyOnClose
    >
      <p
        style={{
          fontSize: 14,
          color: "#4b5563",
          lineHeight: 1.5,
          marginBottom: 16,
        }}
      >
        Are you sure you want to make this course publicly available?
      </p>

      <Descriptions bordered size="small" column={1}>
        <Descriptions.Item label="Course Title">
          {courseSummary.title}
        </Descriptions.Item>
        <Descriptions.Item label="Price">
          {courseSummary.price ?? "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Visibility">
          {courseSummary.visibility || "Public"}
        </Descriptions.Item>
      </Descriptions>

      <div
        style={{
          background: "#fffbeb",
          border: "1px solid #facc15",
          borderRadius: 8,
          color: "#78350f",
          padding: "10px 12px",
          fontSize: 13,
          lineHeight: 1.4,
          marginTop: 16,
        }}
      >
        After approval, this course will be visible in the marketplace and
        available to learners. This action will be logged.
      </div>
    </Modal>
  );
}
