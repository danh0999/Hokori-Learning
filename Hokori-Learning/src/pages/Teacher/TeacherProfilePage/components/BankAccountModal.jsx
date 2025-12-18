// src/pages/Teacher/TeacherProfile/components/BankAccountModal.jsx
import React, { useEffect, useMemo } from "react";
import { Modal, Form, Input, Row, Col, Alert } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import {
  updateTeacherBankAccount,
  fetchTeacherProfile,
  selectTeacherProfile,
  selectUpdatingBank,
  selectTeacherApproved,
} from "../../../../redux/features/teacherprofileSlice.js";

export default function BankAccountModal({ open, onClose }) {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const profile = useSelector(selectTeacherProfile);
  const updatingBank = useSelector(selectUpdatingBank);
  const isApproved = useSelector(selectTeacherApproved);

  const teacher = useMemo(() => profile?.teacher || {}, [profile]);

  useEffect(() => {
    if (!open) return;

    form.setFieldsValue({
      bankAccountNumber: teacher.bankAccountNumber || "",
      bankAccountName: teacher.bankAccountName || "",
      bankName: teacher.bankName || "",
      bankBranchName: teacher.bankBranchName || "",
    });
  }, [open, form, teacher]);

  const handleOk = async () => {
    if (!isApproved) {
      toast.warning(
        "Chỉ giáo viên đã được APPROVED mới có thể cập nhật ngân hàng."
      );
      return;
    }

    const values = form.getFieldsValue(true);

    const pickIfFilled = (v) => {
      const s = typeof v === "string" ? v.trim() : v;
      return s === "" || s === undefined ? undefined : s;
    };

    const payload = Object.fromEntries(
      Object.entries({
        bankAccountNumber: pickIfFilled(values.bankAccountNumber),
        bankAccountName: pickIfFilled(values.bankAccountName),
        bankName: pickIfFilled(values.bankName),
        bankBranchName: pickIfFilled(values.bankBranchName),
      }).filter(([, v]) => v !== undefined)
    );

    if (Object.keys(payload).length === 0) {
      toast.info("Bạn chưa nhập gì để cập nhật.");
      return;
    }

    const res = await dispatch(updateTeacherBankAccount(payload));
    if (res.meta.requestStatus === "fulfilled") {
      await dispatch(fetchTeacherProfile());
      toast.success("Cập nhật tài khoản ngân hàng thành công!");
      onClose?.();
    } else {
      toast.error(res?.payload?.message || "Cập nhật ngân hàng thất bại");
    }
  };

  return (
    <Modal
      title="Cập nhật tài khoản ngân hàng"
      open={open}
      onCancel={() => {
        form.resetFields();
        onClose?.();
      }}
      onOk={handleOk}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={updatingBank}
      width={760}
      destroyOnClose
    >
      {!isApproved && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message="Chưa thể cập nhật ngân hàng"
          description="Theo BE, chỉ giáo viên đã được APPROVED mới có thể cập nhật thông tin ngân hàng."
        />
      )}

      <Form layout="vertical" form={form}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Số tài khoản" name="bankAccountNumber">
              <Input placeholder="VD: 0123456789" disabled={!isApproved} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Tên chủ tài khoản" name="bankAccountName">
              <Input placeholder="VD: NGUYEN VAN A" disabled={!isApproved} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Ngân hàng" name="bankName">
              <Input placeholder="VD: ACB" disabled={!isApproved} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Chi nhánh" name="bankBranchName">
              <Input placeholder="VD: TP.HCM" disabled={!isApproved} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
