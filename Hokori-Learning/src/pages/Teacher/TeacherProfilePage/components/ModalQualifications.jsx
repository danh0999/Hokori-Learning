import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Button,
  Space,
  message,
  List,
  Popconfirm,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTeacherCertificates,
  upsertTeacherCertificate,
  deleteTeacherCertificate,
  selectTeacherCertificates,
  selectSavingCertificate,
  selectDeletingCertificate,
} from "../../../../redux/features/teacherprofileSlice.js";

export default function ModalCertificates({ open, onClose }) {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const certificates = useSelector(selectTeacherCertificates);
  const saving = useSelector(selectSavingCertificate);
  const deleting = useSelector(selectDeletingCertificate);

  useEffect(() => {
    if (open) dispatch(fetchTeacherCertificates());
  }, [dispatch, open]);

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      const res = await dispatch(upsertTeacherCertificate(values));
      if (res.meta.requestStatus === "fulfilled") {
        message.success("Đã lưu chứng chỉ");
        form.resetFields();
        dispatch(fetchTeacherCertificates());
      } else {
        message.error(res?.payload?.message || "Thêm chứng chỉ thất bại");
      }
    } catch (e) {
      console.log(e);
    }
  };

  const onDelete = async (id) => {
    const res = await dispatch(deleteTeacherCertificate(id));
    if (res.meta.requestStatus === "fulfilled") {
      message.success("Đã xoá chứng chỉ");
    } else {
      message.error(res?.payload?.message || "Xoá thất bại");
    }
  };

  return (
    <Modal
      title="Quản lý chứng chỉ"
      open={open}
      onCancel={() => onClose?.()}
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          name="title"
          label="Tên chứng chỉ"
          rules={[{ required: true, message: "Vui lòng nhập tên chứng chỉ" }]}
        >
          <Input placeholder="VD: TESOL / JLPT N1 / TOEFL 100" />
        </Form.Item>
        <Form.Item name="issuer" label="Tổ chức cấp">
          <Input placeholder="VD: Cambridge, JF Foundation..." />
        </Form.Item>
        <Form.Item name="year" label="Năm cấp">
          <InputNumber min={1900} max={2100} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="url" label="Link chứng chỉ (nếu có)">
          <Input placeholder="https://..." />
        </Form.Item>
        <Space>
          <Button onClick={() => form.resetFields()}>Reset</Button>
          <Button type="primary" htmlType="submit" loading={saving}>
            Lưu
          </Button>
        </Space>
      </Form>

      <div style={{ marginTop: 24 }}>
        <h3>Danh sách chứng chỉ</h3>
        <List
          dataSource={certificates}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Popconfirm
                  title="Xoá chứng chỉ này?"
                  onConfirm={() => onDelete(item.id)}
                  okText="Xoá"
                  cancelText="Huỷ"
                >
                  <Button type="link" danger loading={deleting}>
                    Xoá
                  </Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={item.title}
                description={`${item.issuer || ""} - ${item.year || ""}`}
              />
            </List.Item>
          )}
        />
      </div>
    </Modal>
  );
}
