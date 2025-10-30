import React, { useState } from "react";
import { Modal, Input } from "antd";

export default function RequestRevisionModal({
  open,
  onCancel,
  onSubmit,
  courseTitle,
}) {
  const [feedback, setFeedback] = useState("");
  const [sending, setSending] = useState(false);

  const handleOk = async () => {
    if (!feedback.trim()) return;
    setSending(true);
    await onSubmit?.(feedback.trim());
    setSending(false);
    setFeedback("");
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText="Send to teacher"
      cancelText="Cancel"
      okButtonProps={{
        disabled: !feedback.trim(),
        loading: sending,
      }}
      width={480}
      title={
        <div style={{ fontWeight: 600 }}>Request revision: {courseTitle}</div>
      }
      destroyOnClose
    >
      <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.5 }}>
        Nêu rõ lý do vì sao khóa học chưa đạt yêu cầu và cần chỉnh sửa. Thông
        báo này sẽ được gửi cho giáo viên.
      </p>

      <Input.TextArea
        rows={5}
        placeholder="Ví dụ: Phần Chương 2 còn thiếu nội dung giải thích, thumbnail bài học có watermark, cần chỉnh lại tiêu đề cho rõ ràng..."
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
      />
    </Modal>
  );
}
