// ProfileEditModal.jsx
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
  Alert,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  updateUserProfile,
  updateTeacherSection,
  updateTeacherBankAccount,
  selectTeacherProfile,
  selectUpdatingUser,
  selectUpdatingTeacher,
  selectUpdatingBank,
  fetchTeacherProfile,
} from "../../../redux/features/teacherprofileSlice.js";
import { toast } from "react-toastify";

export default function ProfileEditModal({ open, onClose }) {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const profile = useSelector(selectTeacherProfile);

  const updatingUser = useSelector(selectUpdatingUser);
  const updatingTeacher = useSelector(selectUpdatingTeacher);
  const updatingBank = useSelector(selectUpdatingBank);

  const user = profile?.user || {};
  const teacher = profile?.teacher || {};
  const isApproved = (teacher?.approvalStatus || "") === "APPROVED";

  useEffect(() => {
    if (!open) return;

    form.setFieldsValue({
      // USER
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      phoneNumber: user.phoneNumber,
      country: user.country,

      // TEACHER (non-bank)
      bio: teacher.bio,
      yearsOfExperience: teacher.yearsOfExperience,
      websiteUrl: teacher.websiteUrl,
      linkedin: teacher.linkedin,

      // BANK
      bankAccountNumber: teacher.bankAccountNumber,
      bankAccountName: teacher.bankAccountName,
      bankName: teacher.bankName,
      bankBranchName: teacher.bankBranchName,
    });
  }, [open, user, teacher, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      // 1) /profile/me
      const userPayload = {
        displayName: values.displayName?.trim(),
        phoneNumber: values.phoneNumber?.trim() || null,
        country: values.country || null,
      };

      // 2) /profile/me/teacher (bio/exp/link/web)
      const teacherPayload = {
        bio: values.bio?.trim() || null,
        yearsOfExperience:
          values.yearsOfExperience !== undefined &&
          values.yearsOfExperience !== null
            ? Number(values.yearsOfExperience)
            : null,
        websiteUrl: values.websiteUrl?.trim() || null,
        linkedin: values.linkedin?.trim() || null,
      };

      // 3) /teacher/revenue/bank-account (bank only)
      const bankPayload = {
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

      if (!okUser || !okTeacher) {
        toast.error(
          resUser?.payload?.message ||
            resTeacher?.payload?.message ||
            "Cập nhật thất bại"
        );
        return;
      }

      // Bank: chỉ gọi khi teacher APPROVED (BE yêu cầu)
      if (isApproved) {
        const resBank = await dispatch(updateTeacherBankAccount(bankPayload));
        const okBank = resBank.meta.requestStatus === "fulfilled";
        if (!okBank) {
          toast.error(
            resBank?.payload?.message || "Cập nhật ngân hàng thất bại"
          );
          return;
        }
      }

      await dispatch(fetchTeacherProfile());
      toast.success("Cập nhật hồ sơ thành công!");
      onClose?.();
    } catch (err) {
      // validate error -> ignore
    }
  };

  const loading = updatingUser || updatingTeacher || updatingBank;

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
      {!isApproved && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message="Chưa thể cập nhật thông tin ngân hàng"
          description="Theo quy định, chỉ giáo viên đã được APPROVED mới có thể cập nhật tài khoản ngân hàng. Bạn vẫn có thể cập nhật bio/kinh nghiệm/website/LinkedIn."
        />
      )}

      <Form form={form} layout="vertical">
        <Row gutter={[24, 16]}>
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

              <Form.Item label="Country" name="country">
                <Input />
              </Form.Item>
            </Card>
          </Col>

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

              <Row gutter={[16, 8]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Số tài khoản"
                    name="bankAccountNumber"
                    rules={[
                      { required: true, message: "Vui lòng nhập số tài khoản" },
                    ]}
                  >
                    <Input disabled={!isApproved} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Tên chủ tài khoản"
                    name="bankAccountName"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập tên chủ tài khoản",
                      },
                    ]}
                  >
                    <Input disabled={!isApproved} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Ngân hàng"
                    name="bankName"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập tên ngân hàng",
                      },
                    ]}
                  >
                    <Input disabled={!isApproved} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Chi nhánh"
                    name="bankBranchName"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập tên chi nhánh",
                      },
                    ]}
                  >
                    <Input disabled={!isApproved} />
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
