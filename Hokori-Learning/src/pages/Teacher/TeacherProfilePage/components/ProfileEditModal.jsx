import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Button,
  Space,
  Row,
  Col,
  Divider,
  Card,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  updateUserProfile,
  updateTeacherSection,
  selectTeacherProfile,
  selectUpdatingUser,
  selectUpdatingTeacher,
} from "../../../../redux/features/teacherprofileSlice.js";
import { toast } from "react-toastify";

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
      // USER
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      phoneNumber: user.phoneNumber,
      country: user.country,
      // TEACHER
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
        toast.success("Cập nhật hồ sơ thành công!");
        onClose?.();
      } else {
        toast.error(
          resUser?.payload?.message ||
            resTeacher?.payload?.message ||
            "Cập nhật thất bại"
        );
      }
    } catch (err) {
      console.log(err);

      // lỗi validate thì k làm gì
    }
  };

  const loading = updatingUser || updatingTeacher;

  return (
    <Modal
      title="Cập nhật hồ sơ"
      open={open}
      onCancel={() => {
        form.resetFields();
        onClose?.();
      }}
      onOk={handleOk}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={loading}
      width={900}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Row gutter={[24, 16]}>
          {/* ====================== CỘT TRÁI — USER PROFILE ====================== */}
          <Col xs={24} md={12}>
            <Card
              title="Thông tin tài khoản"
              bordered
              style={{ borderRadius: 10 }}
            >
              <Form.Item label="Email" name="email">
                <Input disabled />
              </Form.Item>

              <Form.Item label="Username" name="username">
                <Input disabled />
              </Form.Item>

              <Form.Item
                label="Display Name"
                name="displayName"
                rules={[
                  { required: true, message: "Vui lòng nhập tên hiển thị" },
                ]}
              >
                <Input />
              </Form.Item>

              <Form.Item label="Số điện thoại" name="phoneNumber">
                <Input />
              </Form.Item>
            </Card>
          </Col>

          {/* ====================== CỘT PHẢI — TEACHER PROFILE ====================== */}
          <Col xs={24} md={12}>
            <Card
              title="Thông tin giảng viên"
              bordered
              style={{ borderRadius: 10 }}
            >
              <Form.Item
                label="Bio"
                name="bio"
                rules={[
                  { required: true, message: "Vui lòng nhập bio" },
                  { min: 50, message: "Bio phải từ 50 ký tự" },
                ]}
              >
                <Input.TextArea rows={4} />
              </Form.Item>

              <Form.Item label="Số năm kinh nghiệm" name="yearsOfExperience">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item label="Website" name="websiteUrl">
                <Input placeholder="https://..." />
              </Form.Item>

              <Form.Item label="LinkedIn" name="linkedin">
                <Input placeholder="https://www.linkedin.com/..." />
              </Form.Item>

              <Divider />

              {/* BANK INFO: chia 2 cột trong cùng Teacher card */}
              <Row gutter={[16, 8]}>
                <Col xs={24} md={12}>
                  <Form.Item label="Số tài khoản" name="bankAccountNumber">
                    <Input />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Tên chủ tài khoản" name="bankAccountName">
                    <Input />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Ngân hàng" name="bankName">
                    <Input />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Chi nhánh" name="bankBranchName">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        <Space style={{ marginTop: 10 }}>
          <Button onClick={() => form.resetFields()}>Reset</Button>
        </Space>
      </Form>
    </Modal>
  );
}
