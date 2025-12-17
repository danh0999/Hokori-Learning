import React, { useState } from "react";
import { Modal, Input } from "antd";

/**
 * Props:
 *  - open
 *  - onCancel()
 *  - onSubmit(reasonText)
 *  - courseTitle
 */
export default function RejectModal({ open, onCancel, onSubmit, courseTitle }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    await onSubmit?.(reason.trim());
    setLoading(false);
    setReason("");
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText="Từ chối "
      cancelText="Hủy"
      okButtonProps={{
        disabled: !reason.trim(),
        danger: true,
        loading,
      }}
      width={520}
      destroyOnClose
      title={
        <div style={{ fontWeight: 600, color: "#b91c1c" }}>
          Từ chối "{courseTitle}"
        </div>
      }
    >
      <p
        style={{
          fontSize: 14,
          lineHeight: 1.5,
          color: "#4b5563",
          marginBottom: 12,
        }}
      >
        Giải thích lý do từ chối khoá học để giáo viên có thể cải thiện trong
        lần nộp tiếp theo.
      </p>

      <Input.TextArea
        rows={5}
        placeholder="Ví dụ: Nội dung vi phạm chính sách, sử dụng tài liệu bản quyền không được phép, ngôn từ không phù hợp..."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />

      <div
        style={{
          background: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: 8,
          padding: "10px 12px",
          fontSize: 13,
          lineHeight: 1.4,
          color: "#991b1b",
          marginTop: 12,
        }}
      >
        Lưu ý: Hành động từ chối này sẽ được ghi lại và thông báo cho giáo viên.
      </div>
    </Modal>
  );
}
