import React, { useEffect } from "react";
import { Modal, Form, Input, InputNumber, Button, Space, message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  updateUserProfile,
  updateTeacherSection,
  selectTeacherProfile,
  selectUpdatingUser,
  selectUpdatingTeacher,
} from "../../../../redux/features/teacherprofileSlice.js";

export default function ProfileEditModal({ open, onClose }) {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const profile = useSelector(selectTeacherProfile);
  const updatingUser = useSelector(selectUpdatingUser);
  const updatingTeacher = useSelector(selectUpdatingTeacher);

  const user = profile?.user || {};
  const teacher = profile?.teacher || {};

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      // user
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      phoneNumber: user.phoneNumber,
      country: user.country,
      // teacher
      headline: teacher.headline,
      bio: teacher.bio,
      yearsOfExperience: teacher.yearsOfExperience,
      websiteUrl: teacher.websiteUrl,
      linkedin: teacher.linkedin,
      bankAccountNumber: teacher.bankAccountNumber,
      bankAccountName: teacher.bankAccountName,
      bankName: teacher.bankName,
      bankBranchName: teacher.bankBranchName,
    });
  }, [open, user, teacher, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      const userPayload = {
        displayName: values.displayName?.trim(),
        phoneNumber: values.phoneNumber?.trim() || null,
        country: values.country || null,
      };

      const teacherPayload = {
        headline: values.headline?.trim() || null,
        bio: values.bio?.trim() || null,
        yearsOfExperience:
          values.yearsOfExperience !== undefined
            ? Number(values.yearsOfExperience)
            : null,
        websiteUrl: values.websiteUrl?.trim() || null,
        linkedin: values.linkedin?.trim() || null,
        bankAccountNumber: values.bankAccountNumber?.trim() || null,
        bankAccountName: values.bankAccountName?.trim() || null,
        bankName: values.bankName?.trim() || null,
        bankBranchName: values.bankBranchName?.trim() || null,
      };

      const [resUser, resTeacher] = await Promise.all([
        dispatch(updateUserProfile(userPayload)),
        dispatch(updateTeacherSection(teacherPayload)),
      ]);

      const okUser = resUser.meta.requestStatus === "fulfilled";
      const okTeacher = resTeacher.meta.requestStatus === "fulfilled";

      if (okUser && okTeacher) {
        message.success("Cập nhật hồ sơ thành công");
        onClose?.();
      } else {
        message.error(
          resUser?.payload?.message ||
            resTeacher?.payload?.message ||
            "Cập nhật thất bại"
        );
      }
    } catch (err) {
      console.log(err);

      // validate lỗi -> không làm gì
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose?.();
  };

  const loading = updatingUser || updatingTeacher;

  return (
    <Modal
      title="Cập nhật thông tin hồ sơ"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={loading}
      width={720}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        {/* -------- Thông tin tài khoản (user) -------- */}
        <h3>Thông tin tài khoản (profile/me)</h3>
        <Form.Item label="Email" name="email">
          <Input disabled />
        </Form.Item>
        <Form.Item label="Username" name="username">
          <Input disabled />
        </Form.Item>
        <Form.Item
          label="Display name"
          name="displayName"
          rules={[{ required: true, message: "Vui lòng nhập display name" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item label="Số điện thoại" name="phoneNumber">
          <Input />
        </Form.Item>
        <Form.Item label="Quốc gia" name="country">
          <Input />
        </Form.Item>

        <div style={{ marginTop: 16, marginBottom: 8 }}>
          <h3>Thông tin giảng viên (profile/me/teacher)</h3>
        </div>

        {/* -------- Thông tin giảng viên (teacher) -------- */}
        <Form.Item
          label="Headline"
          name="headline"
          rules={[{ required: true, message: "Vui lòng nhập headline" }]}
        >
          <Input placeholder="VD: Japanese teacher with 5 years of experience" />
        </Form.Item>
        <Form.Item
          label="Giới thiệu (bio)"
          name="bio"
          rules={[
            { required: true, message: "Vui lòng nhập bio" },
            { min: 50, message: "Bio nên từ 50 ký tự trở lên" },
          ]}
        >
          <Input.TextArea rows={4} />
        </Form.Item>
        <Form.Item label="Số năm kinh nghiệm" name="yearsOfExperience">
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="Website" name="websiteUrl">
          <Input />
        </Form.Item>
        <Form.Item label="LinkedIn" name="linkedin">
          <Input />
        </Form.Item>
        <Form.Item label="Số tài khoản ngân hàng" name="bankAccountNumber">
          <Input />
        </Form.Item>
        <Form.Item label="Tên chủ tài khoản" name="bankAccountName">
          <Input />
        </Form.Item>
        <Form.Item label="Ngân hàng" name="bankName">
          <Input />
        </Form.Item>
        <Form.Item label="Chi nhánh" name="bankBranchName">
          <Input />
        </Form.Item>

        <Space style={{ marginTop: 8 }}>
          <Button onClick={() => form.resetFields()}>Reset</Button>
        </Space>
      </Form>
    </Modal>
  );
}
