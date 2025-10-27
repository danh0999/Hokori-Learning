import React, { useEffect } from "react";
import { Modal, Form, Input, InputNumber, Button, Space, message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  updateTeacherQualifications,
  fetchTeacherProfile,
  selectTeacherProfileUpdating,
} from "../../../../redux/features/teacherprofileSlice.js";

export default function ModalQualifications({ open, onClose, initial }) {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const updating = useSelector(selectTeacherProfileUpdating);

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        highestDegree: initial?.highestDegree || "",
        major: initial?.major || "",
        yearsOfExperience: initial?.yearsOfExperience ?? null,
        certifications: initial?.certifications || "",
        evidenceUrls: initial?.evidenceUrls || "",
      });
    }
  }, [open, initial, form]);

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      const res = await dispatch(updateTeacherQualifications(values));
      if (res.meta.requestStatus === "fulfilled") {
        message.success("Cập nhật thành công");
        // đồng bộ lại dữ liệu (phòng trường hợp BE không trả full)
        dispatch(fetchTeacherProfile());
        onClose?.();
      } else {
        const msg = res?.payload?.message || "Cập nhật thất bại";
        message.error(msg);
      }
    } catch {
      // ignore
    }
  };

  return (
    <Modal
      title="Cập nhật bằng cấp & chứng chỉ"
      open={open}
      onCancel={() => onClose?.()}
      footer={
        <Space>
          <Button onClick={() => onClose?.()}>Hủy</Button>
          <Button type="primary" loading={updating} onClick={onSubmit}>
            Lưu
          </Button>
        </Space>
      }
      destroyOnClose
      maskClosable={!updating}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="highestDegree" label="Bằng cấp cao nhất">
          <Input placeholder="VD: Bachelor / Master / PhD ..." />
        </Form.Item>

        <Form.Item name="major" label="Chuyên ngành">
          <Input placeholder="VD: Computer Science, Linguistics..." />
        </Form.Item>

        <Form.Item
          name="yearsOfExperience"
          label="Kinh nghiệm (năm)"
          rules={[
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (value == null || (Number.isFinite(value) && value >= 0))
                  return Promise.resolve();
                return Promise.reject(new Error("Vui lòng nhập số >= 0"));
              },
            }),
          ]}
        >
          <InputNumber
            min={0}
            precision={0}
            style={{ width: "100%" }}
            placeholder="VD: 3"
          />
        </Form.Item>

        <Form.Item name="certifications" label="Chứng chỉ">
          <Input.TextArea rows={3} placeholder="Liệt kê chứng chỉ tiêu biểu" />
        </Form.Item>

        <Form.Item
          name="evidenceUrls"
          label="Evidence URLs"
          tooltip="Tạm thời nhập nhiều URL ngăn cách bằng dấu phẩy"
        >
          <Input.TextArea rows={3} placeholder="https://..., https://..." />
        </Form.Item>
      </Form>
    </Modal>
  );
}
