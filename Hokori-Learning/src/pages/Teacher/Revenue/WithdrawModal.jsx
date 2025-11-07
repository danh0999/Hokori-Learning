import React, { useState } from "react";
import { Modal, InputNumber, message } from "antd";

export default function WithdrawModal({ open, onCancel, onSubmit }) {
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    if (!amount || amount <= 0) {
      message.warning("Vui lòng nhập số tiền hợp lệ");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500)); // fake delay
    onSubmit?.(amount);
    setLoading(false);
    setAmount(0);
  };

  return (
    <Modal
      open={open}
      title="Yêu cầu rút tiền"
      onCancel={onCancel}
      onOk={handleOk}
      okText="Gửi yêu cầu"
      okButtonProps={{ loading }}
      destroyOnClose
    >
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
