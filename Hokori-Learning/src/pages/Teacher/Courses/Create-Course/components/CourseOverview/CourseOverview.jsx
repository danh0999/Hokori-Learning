// src/pages/Teacher/Courses/Create-Course/components/CourseOverview/CourseOverview.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { Card, Form, Input, Select, Upload, Button } from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";

import {
  updateCourseThunk,
  uploadCourseCoverThunk,
  fetchCourseTree,
} from "../../../../../../redux/features/teacherCourseSlice.js";

import styles from "./styles.module.scss";
import api from "../../../../../../configs/axios.js";
import { toast } from "react-toastify";

const { TextArea } = Input;

// build URL từ coverImagePath (BE gợi ý: preview bằng "/files/" + path)
const API_BASE_URL =
  api.defaults.baseURL?.replace(/\/api\/?$/, "") ||
  import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, "") ||
  "";

const buildFileUrl = (filePath) => {
  if (!filePath) return null;
  if (/^https?:\/\//i.test(filePath)) return filePath;
  return `${API_BASE_URL}/files/${filePath}`.replace(/([^:]\/)\/+/g, "$1");
};

const getFileNameFromPath = (p) => {
  if (!p) return "";
  const parts = p.split("/");
  return parts[parts.length - 1];
};

export default function CourseOverview({ courseId, onNext, disableEditing }) {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const { currentCourseMeta, saving } = useSelector((s) => s.teacherCourse);

  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [pendingFileName, setPendingFileName] = useState("");

  const isMetaInitialized = useRef(false);

  // URL ảnh cover hiện tại (lấy từ coverImagePath)
  const thumbUrl = useMemo(
    () => buildFileUrl(currentCourseMeta?.coverImagePath),
    [currentCourseMeta?.coverImagePath]
  );

  // Fill form
  // ❌ bỏ: const isMetaInitialized = useRef(false);

  useEffect(() => {
    if (!currentCourseMeta) {
      // không có meta thì reset form cho sạch
      form.resetFields();
      return;
    }

    form.setFieldsValue({
      title: currentCourseMeta.title || "",
      subtitle: currentCourseMeta.subtitle || "",
      description: currentCourseMeta.description || "",
      level: currentCourseMeta.level || "N5",
    });
  }, [currentCourseMeta?.id, form]); // 👈 chú ý dependency theo id

  // Save basics
  const handleFinish = async (values) => {
    if (!courseId) return;
    const payload = { ...currentCourseMeta, ...values };
    const action = await dispatch(
      updateCourseThunk({ courseId, data: payload })
    );
    if (updateCourseThunk.fulfilled.match(action)) {
      toast.success("Đã lưu thông tin khoá học!");
      dispatch(fetchCourseTree(courseId));

      // 👉 Sau khi lưu thành công thì nhảy sang step tiếp theo (nếu có)
      if (typeof onNext === "function") {
        onNext();
      }
    } else {
      toast.error("Lưu thất bại, vui lòng thử lại!");
    }
  };

  // Upload thumbnail = gọi POST /teacher/courses/{courseId}/cover-image
  const handleThumbnailUpload = async ({ file, onSuccess, onError }) => {
    if (!courseId || !file) {
      onError?.();
      return;
    }
    setPendingFileName(file.name);

    try {
      setUploadingThumb(true);

      const action = await dispatch(uploadCourseCoverThunk({ courseId, file }));

      if (uploadCourseCoverThunk.fulfilled.match(action)) {
        toast.success("Đã cập nhật thumbnail!");
        onSuccess?.("ok");
        dispatch(fetchCourseTree(courseId));
      } else {
        toast.error("Không lưu được thumbnail.");
        onError?.();
      }
    } catch (e) {
      console.error(e);
      toast.error("Upload thumbnail thất bại.");
      onError?.(e);
    } finally {
      setUploadingThumb(false);
      setPendingFileName("");
    }
  };

  const handleRemoveThumb = async () => {
    if (!courseId) return;
    const action = await dispatch(
      updateCourseThunk({
        courseId,
        data: { ...currentCourseMeta, coverImagePath: null },
      })
    );
    if (updateCourseThunk.fulfilled.match(action)) {
      toast.success("Đã xoá thumbnail.");
      dispatch(fetchCourseTree(courseId));
    } else {
      toast.error("Xoá thumbnail thất bại.");
    }
  };

  const hasThumb = !!thumbUrl || !!pendingFileName;

  return (
    <Card className={styles.cardBig}>
      <div className={styles.stepHeader}>
        <div className={styles.stepTitle}>Tổng quan khoá học</div>
        <div className={styles.stepDesc}>
          Đặt tiêu đề, mô tả, cấp độ cho khoá học của bạn.
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        className={styles.formGrid}
        onFinish={handleFinish}
      >
        <Form.Item
          name="title"
          label="Tiêu đề"
          rules={[
            { required: true, message: "Vui lòng nhập tiêu đề." },
            { max: 120 },
          ]}
        >
          <Input
            disabled={disableEditing}
            placeholder="JLPT N5 – Nền tảng tiếng Nhật cho người mới"
          />
        </Form.Item>

        <Form.Item name="subtitle" label="Phụ đề" rules={[{ max: 160 }]}>
          <Input
            disabled={disableEditing}
            placeholder="Khoá học giúp bạn chinh phục JLPT N5 từ con số 0."
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="Mô tả khoá học"
          rules={[{ message: "Vui lòng nhập mô tả." }]}
        >
          <TextArea
            rows={6}
            disabled={disableEditing}
            placeholder="Giới thiệu nội dung, phương pháp giảng dạy, đối tượng phù hợp, v.v."
          />
        </Form.Item>

        <Form.Item name="level" label="Cấp độ" rules={[{ required: true }]}>
          <Select
            disabled={disableEditing}
            options={[
              { label: "JLPT N5", value: "N5" },
              { label: "JLPT N4", value: "N4" },
              { label: "JLPT N3", value: "N3" },
              { label: "JLPT N2", value: "N2" },
              { label: "JLPT N1", value: "N1" },
            ]}
          />
        </Form.Item>

        <Form.Item label="Ảnh đại diện khoá học">
          {!hasThumb ? (
            <Upload.Dragger
              disabled={disableEditing}
              multiple={false}
              showUploadList={false}
              customRequest={handleThumbnailUpload}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">
                Click hoặc kéo thả ảnh thumbnail vào đây
              </p>
            </Upload.Dragger>
          ) : (
            <div className={styles.thumbCard}>
              {thumbUrl ? (
                <img
                  src={thumbUrl}
                  alt="thumbnail"
                  className={styles.thumbImg}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className={styles.thumbPlaceholder}>No preview</div>
              )}

              <div className={styles.thumbMetaRow}>
                <div className={styles.thumbName}>
                  {pendingFileName ||
                    getFileNameFromPath(currentCourseMeta?.coverImagePath)}
                </div>
              </div>

              <div className={styles.thumbActions}>
                <Upload
                  multiple={false}
                  showUploadList={false}
                  customRequest={handleThumbnailUpload}
                >
                  <Button type="default" size="small" disabled={disableEditing}>
                    Thay đổi ảnh đại diện
                  </Button>
                </Upload>
                <Button
                  danger
                  type="text"
                  icon={<DeleteOutlined />}
                  onClick={handleRemoveThumb}
                  size="small"
                  disabled={disableEditing}
                >
                  Gỡ ảnh đại diện
                </Button>
              </div>
            </div>
          )}
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={saving || uploadingThumb}
            disabled={disableEditing}
          >
            {typeof onNext === "function" ? " Lưu & tiếp tục" : "Lưu cơ bản"}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
