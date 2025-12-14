// components/ProfileEditModal.jsx
import React, { useEffect, useMemo } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Row,
  Col,
  Divider,
  Alert,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  updateUserProfile,
  updateTeacherSection,
  updateTeacherBankAccount,
  fetchTeacherProfile,
  selectTeacherProfile,
  selectUpdatingUser,
  selectUpdatingTeacher,
  selectUpdatingBank,
} from "../../../../redux/features/teacherprofileSlice.js";

export default function ProfileEditModal({ open, onClose }) {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const profile = useSelector(selectTeacherProfile);
  const updatingUser = useSelector(selectUpdatingUser);
  const updatingTeacher = useSelector(selectUpdatingTeacher);
  const updatingBank = useSelector(selectUpdatingBank);

  const user = useMemo(() => profile?.user || {}, [profile]);
  const teacher = useMemo(() => profile?.teacher || {}, [profile]);

  const approvalStatus = teacher?.approvalStatus || "DRAFT";
  const isApproved = approvalStatus === "APPROVED";

  useEffect(() => {
    if (!open) return;

    form.setFieldsValue({
      // /profile/me
      displayName: user.displayName || "",
      phoneNumber: user.phoneNumber || "",
      country: user.country || "",

      // /profile/me/teacher
      bio: teacher.bio || "",
      yearsOfExperience:
        teacher.yearsOfExperience === null ||
        teacher.yearsOfExperience === undefined
          ? null
          : Number(teacher.yearsOfExperience),
      websiteUrl: teacher.websiteUrl || "",
      linkedin: teacher.linkedin || "",

      // bank
      bankAccountNumber: teacher.bankAccountNumber || "",
      bankAccountName: teacher.bankAccountName || "",
      bankName: teacher.bankName || "",
      bankBranchName: teacher.bankBranchName || "",
    });
  }, [open, form, user, teacher]);

  const handleOk = async () => {
    try {
      const values = form.getFieldsValue(true);

      const pickIfFilled = (v) => {
        const s = typeof v === "string" ? v.trim() : v;
        return s === "" || s === undefined ? undefined : s;
      };

      const clean = (obj) =>
        Object.fromEntries(
          Object.entries(obj).filter(([, v]) => v !== undefined)
        );

      const userPayload = clean({
        displayName: pickIfFilled(values.displayName),
        phoneNumber: pickIfFilled(values.phoneNumber),
        country: pickIfFilled(values.country),
      });

      const teacherPayload = clean({
        bio: pickIfFilled(values.bio),
        yearsOfExperience:
          values.yearsOfExperience === "" ||
          values.yearsOfExperience === undefined ||
          values.yearsOfExperience === null
            ? undefined
            : Number(values.yearsOfExperience),
        websiteUrl: pickIfFilled(values.websiteUrl),
        linkedin: pickIfFilled(values.linkedin),
      });

      const bankPayload = clean({
        bankAccountNumber: pickIfFilled(values.bankAccountNumber),
        bankAccountName: pickIfFilled(values.bankAccountName),
        bankName: pickIfFilled(values.bankName),
        bankBranchName: pickIfFilled(values.bankBranchName),
      });

      const tasks = [];

      if (Object.keys(userPayload).length) {
        tasks.push(dispatch(updateUserProfile(userPayload)));
      }

      if (Object.keys(teacherPayload).length) {
        tasks.push(dispatch(updateTeacherSection(teacherPayload)));
      }

      // ✅ bank chỉ gọi khi APPROVED (đúng theo BE)
      if (isApproved && Object.keys(bankPayload).length) {
        tasks.push(dispatch(updateTeacherBankAccount(bankPayload)));
      }

      if (tasks.length === 0) {
        toast.info("Bạn chưa nhập gì để cập nhật.");
        return;
      }

      const results = await Promise.all(tasks);
      const failed = results.find((r) => r.meta.requestStatus !== "fulfilled");

      if (failed) {
        toast.error(failed?.payload?.message || "Cập nhật thất bại");
        return;
      }

      await dispatch(fetchTeacherProfile());
      toast.success("Cập nhật hồ sơ thành công!");
      onClose?.();
    } catch {
      // ignore
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
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message="Tài khoản ngân hàng"
          description="Hiện tại chỉ giáo viên đã được APPROVED mới có thể cập nhật thông tin ngân hàng."
        />
      )}

      <Form layout="vertical" form={form}>
        <Row gutter={16}>
          <Col span={12}>
            <h3 style={{ marginBottom: 8 }}>Thông tin tài khoản</h3>

            <Form.Item label="Tên hiển thị" name="displayName">
              <Input placeholder="VD: Ikeda Sensei" />
            </Form.Item>

            <Form.Item label="Số điện thoại" name="phoneNumber">
              <Input placeholder="VD: 09xxxxxxx" />
            </Form.Item>

            <Form.Item label="Quốc gia" name="country">
              <Input placeholder="VD: Vietnam" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <h3 style={{ marginBottom: 8 }}>Thông tin giảng viên</h3>

            <Form.Item label="Giới thiệu (Bio)" name="bio">
              <Input.TextArea rows={4} placeholder="(Không bắt buộc)" />
            </Form.Item>

            <Form.Item label="Số năm kinh nghiệm" name="yearsOfExperience">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item label="Website" name="websiteUrl">
              <Input placeholder="https://..." />
            </Form.Item>

            <Form.Item label="LinkedIn" name="linkedin">
              <Input placeholder="https://linkedin.com/in/..." />
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        <h3 style={{ marginBottom: 8 }}>Tài khoản ngân hàng</h3>
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
