// src/pages/Moderator/Queues/components/ApprovePublishModal.jsx
import React from "react";
import { Modal, Descriptions } from "antd";

// format giá từ priceCents (VND)
function formatPriceFromSummary(courseSummary) {
  if (!courseSummary) return "—";

  // Nếu FE đã truyền sẵn price (string) thì ưu tiên
  if (courseSummary.price != null && courseSummary.price !== "") {
    return courseSummary.price;
  }

  const { priceCents } = courseSummary;

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

/**
 * Props:
 *  - open
 *  - onCancel()
 *  - onConfirm()
 *  - confirmLoading (optional)
 *  - courseSummary: object detail / summary của course
 */
export default function ApprovePublishModal({
  open,
  onCancel,
  onConfirm,
  confirmLoading,
  courseSummary,
}) {
  if (!courseSummary) return null;

  const priceLabel = formatPriceFromSummary(courseSummary);
  const visibilityLabel = courseSummary.visibility || "Public";

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      onOk={onConfirm}
      okText="Duyệt"
      cancelText="Hủy"
      confirmLoading={confirmLoading}
      width={520}
      title={<div style={{ fontWeight: 600 }}>Duyệt & Xuất bản</div>}
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
        Xác nhận duyệt và xuất bản khoá học dưới các thông tin sau:
      </p>

      <Descriptions bordered size="small" column={1}>
        <Descriptions.Item label="Tiêu đề khóa học">
          {courseSummary.title}
        </Descriptions.Item>
        <Descriptions.Item label="Giá (VND)">{priceLabel}</Descriptions.Item>
        <Descriptions.Item label="Hiển thị">
          {visibilityLabel}
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
        Sau khi duyệt, khoá học sẽ được hiển thị công khai trên nền tảng
      </div>
    </Modal>
  );
}
