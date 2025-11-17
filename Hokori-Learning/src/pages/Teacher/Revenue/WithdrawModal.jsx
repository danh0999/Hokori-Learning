import React, { useState } from "react";
import { Modal, InputNumber, message } from "antd";

export default function WithdrawModal({ open, onCancel, onSubmit, maxAmount }) {
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    if (!amount || amount <= 0) {
      message.warning("Vui lòng nhập số tiền hợp lệ");
      return;
    }
    if (maxAmount != null && amount > maxAmount) {
      message.warning("Số tiền rút vượt quá số dư hiện tại");
      return;
    }

    setLoading(true);
    try {
      await onSubmit?.(amount);
      setAmount(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Yêu cầu rút tiền"
      onCancel={() => {
        setAmount(0);
        onCancel?.();
      }}
      onOk={handleOk}
      okText="Gửi yêu cầu"
      confirmLoading={loading}
      destroyOnClose
    >
      {maxAmount != null && (
        <p style={{ marginBottom: 4 }}>
          Số dư khả dụng: <b>{maxAmount.toLocaleString("vi-VN")} VNĐ</b>
        </p>
      )}
      <p style={{ marginBottom: 8 }}>Nhập số tiền muốn rút (VNĐ):</p>
      <InputNumber
        value={amount}
        onChange={setAmount}
        min={0}
        step={10000}
        style={{ width: "100%" }}
        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
        parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
      />
    </Modal>
  );
}
