import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Button,
  Space,
  message,
  List,
  Popconfirm,
  Alert,
} from "antd";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTeacherCertificates,
  upsertTeacherCertificate,
  deleteTeacherCertificate,
  selectTeacherCertificates,
  selectSavingCertificate,
  selectDeletingCertificate,
} from "../../../../redux/features/teacherprofileSlice.js";

export default function ModalCertificates({ open, onClose, locked = false }) {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const certificates = useSelector(selectTeacherCertificates);
  const saving = useSelector(selectSavingCertificate);
  const deleting = useSelector(selectDeletingCertificate);

  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (open) {
      dispatch(fetchTeacherCertificates());
      setEditingId(null);
      form.resetFields();
    }
  }, [dispatch, open, form]);

  const normalizePayload = (values) => {
    return {
      id: editingId || undefined,
      title: values.title,
      credentialId: values.credentialId,
      issueDate: values.issueDate
        ? values.issueDate.format("YYYY-MM-DD")
        : null,
      expiryDate: values.expiryDate
        ? values.expiryDate.format("YYYY-MM-DD")
        : null,
      note: values.note || null,
    };
  };

  const onSubmit = async () => {
    if (locked) {
      message.warning(
        "Hồ sơ đang ở trạng thái PENDING, bạn không thể chỉnh sửa chứng chỉ."
      );
      return;
    }

    try {
      const values = await form.validateFields();
      const payload = normalizePayload(values);
      const res = await dispatch(upsertTeacherCertificate(payload));
      if (res.meta.requestStatus === "fulfilled") {
        message.success(
          editingId ? "Đã cập nhật chứng chỉ" : "Đã thêm chứng chỉ"
        );
        setEditingId(null);
        form.resetFields();
        dispatch(fetchTeacherCertificates());
      } else {
        message.error(res?.payload?.message || "Lưu chứng chỉ thất bại");
      }
    } catch (e) {
      console.log(e);
    }
  };

  const onDelete = async (id) => {
    if (locked) {
      message.warning(
        "Hồ sơ đang ở trạng thái PENDING, bạn không thể xoá chứng chỉ."
      );
      return;
    }

    const res = await dispatch(deleteTeacherCertificate(id));
    if (res.meta.requestStatus === "fulfilled") {
      message.success("Đã xoá chứng chỉ");
    } else {
      message.error(res?.payload?.message || "Xoá thất bại");
    }
  };

  const onEdit = (item) => {
    if (locked) {
      message.warning(
        "Hồ sơ đang ở trạng thái PENDING, bạn không thể sửa chứng chỉ."
      );
      return;
    }

    setEditingId(item.id);
    form.setFieldsValue({
      title: item.title,
      credentialId: item.credentialId,
      issueDate: item.issueDate ? dayjs(item.issueDate) : null,
      expiryDate: item.expiryDate ? dayjs(item.expiryDate) : null,
      note: item.note,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    form.resetFields();
    onClose?.();
  };

  return (
    <Modal
      title="Quản lý chứng chỉ"
      open={open}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
    >
      {locked && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Hồ sơ đang chờ duyệt (PENDING)"
          description="Trong thời gian chờ admin duyệt, bạn không thể thêm/sửa/xoá chứng chỉ. Bạn chỉ có thể xem danh sách chứng chỉ hiện tại."
        />
      )}

      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          name="title"
          label="Tên chứng chỉ"
          rules={[{ required: true, message: "Vui lòng nhập tên chứng chỉ" }]}
        >
          <Input
            placeholder="VD: TESOL / JLPT N1 / TOEFL 100"
            disabled={locked}
          />
        </Form.Item>
        <Form.Item name="credentialId" label="Mã chứng chỉ / Credential ID">
          <Input placeholder="VD: TESOL-2021-XYZ" disabled={locked} />
        </Form.Item>
        <Form.Item name="issueDate" label="Ngày cấp">
          <DatePicker
            style={{ width: "100%" }}
            format="YYYY-MM-DD"
            disabled={locked}
          />
        </Form.Item>
        <Form.Item name="expiryDate" label="Ngày hết hạn">
          <DatePicker
            style={{ width: "100%" }}
            format="YYYY-MM-DD"
            disabled={locked}
          />
        </Form.Item>
        <Form.Item name="note" label="Ghi chú">
          <Input.TextArea rows={3} disabled={locked} />
        </Form.Item>
        <Space>
          <Button
            onClick={() => {
              setEditingId(null);
              form.resetFields();
            }}
            disabled={locked}
          >
            Reset
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={saving}
            disabled={locked}
          >
            {editingId ? "Cập nhật" : "Lưu"}
          </Button>
        </Space>
      </Form>

      <div style={{ marginTop: 24 }}>
        <h3>Danh sách chứng chỉ</h3>
        <List
          dataSource={certificates}
          locale={{ emptyText: "Chưa có chứng chỉ nào" }}
          renderItem={(item) => (
            <List.Item
              actions={
                locked
                  ? [] // không cho sửa/xoá khi PENDING
                  : [
                      <Button
                        type="link"
                        onClick={() => onEdit(item)}
                        key="edit"
                      >
                        Sửa
                      </Button>,
                      <Popconfirm
                        title="Xoá chứng chỉ này?"
                        onConfirm={() => onDelete(item.id)}
                        okText="Xoá"
                        cancelText="Huỷ"
                        key="delete"
                      >
                        <Button type="link" danger loading={deleting}>
                          Xoá
                        </Button>
                      </Popconfirm>,
                    ]
              }
            >
              <List.Item.Meta
                title={item.title}
                description={
                  <>
                    {item.credentialId && <div>Mã: {item.credentialId}</div>}
                    {item.issueDate && <div>Ngày cấp: {item.issueDate}</div>}
                    {item.expiryDate && <div>Hết hạn: {item.expiryDate}</div>}
                  </>
                }
              />
            </List.Item>
          )}
        />
      </div>
    </Modal>
  );
}
