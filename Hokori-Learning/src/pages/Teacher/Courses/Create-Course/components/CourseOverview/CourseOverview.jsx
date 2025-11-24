// src/pages/Teacher/Courses/Create-Course/components/CourseOverview/CourseOverview.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { Card, Form, Input, Select, Upload, Button, message } from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";

import {
  updateCourseThunk,
  uploadCourseCoverThunk,
  fetchCourseTree,
} from "../../../../../../redux/features/teacherCourseSlice.js";

import styles from "./styles.module.scss";
import api from "../../../../../../configs/axios.js";

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

export default function CourseOverview({ courseId }) {
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
  useEffect(() => {
    if (!currentCourseMeta) return;

    // Chỉ fill form LẦN ĐẦU khi có currentCourseMeta
    if (!isMetaInitialized.current) {
      form.setFieldsValue({
        title: currentCourseMeta.title,
        subtitle: currentCourseMeta.subtitle,
        description: currentCourseMeta.description,
        level: currentCourseMeta.level || "N5",
      });
      isMetaInitialized.current = true;
    }
  }, [currentCourseMeta, form]);

  // Save basics
  const handleFinish = async (values) => {
    if (!courseId) return;
    const payload = { ...currentCourseMeta, ...values };
    const action = await dispatch(
      updateCourseThunk({ courseId, data: payload })
    );
    if (updateCourseThunk.fulfilled.match(action)) {
      message.success("Đã lưu thông tin khoá học.");
      dispatch(fetchCourseTree(courseId));
    } else {
      message.error("Lưu thất bại, vui lòng thử lại.");
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
        message.success("Đã cập nhật thumbnail.");
        onSuccess?.("ok");
        dispatch(fetchCourseTree(courseId));
      } else {
        message.error("Không lưu được thumbnail.");
        onError?.();
      }
    } catch (e) {
      console.error(e);
      message.error("Upload thumbnail thất bại.");
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
      message.success("Đã xoá thumbnail.");
      dispatch(fetchCourseTree(courseId));
    } else {
      message.error("Xoá thumbnail thất bại.");
    }
  };

  const hasThumb = !!thumbUrl || !!pendingFileName;

  return (
    <Card className={styles.cardBig}>
      <div className={styles.stepHeader}>
        <div className={styles.stepTitle}>Course basics</div>
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
          label="Course title"
          rules={[
            { required: true, message: "Vui lòng nhập tiêu đề." },
            { max: 120 },
          ]}
        >
          <Input placeholder="JLPT N5 – Nền tảng tiếng Nhật cho người mới" />
        </Form.Item>

        <Form.Item name="subtitle" label="Subtitle" rules={[{ max: 160 }]}>
          <Input placeholder="Khoá học giúp bạn chinh phục JLPT N5 từ con số 0." />
        </Form.Item>

        <Form.Item
          name="description"
          label="Course description"
          rules={[{ required: true, message: "Vui lòng nhập mô tả." }]}
        >
          <TextArea
            rows={6}
            placeholder="Giới thiệu nội dung, phương pháp giảng dạy, đối tượng phù hợp, v.v."
          />
        </Form.Item>

        <Form.Item name="level" label="Level" rules={[{ required: true }]}>
          <Select
            options={[
              { label: "JLPT N5", value: "N5" },
              { label: "JLPT N4", value: "N4" },
              { label: "JLPT N3", value: "N3" },
              { label: "JLPT N2", value: "N2" },
              { label: "JLPT N1", value: "N1" },
            ]}
          />
        </Form.Item>

        <Form.Item label="Course thumbnail">
          {!hasThumb ? (
            <Upload.Dragger
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
              <p className={styles.hintText}>
                Khuyến nghị 1280x720, &lt; 2MB. Ảnh sẽ được upload bằng API{" "}
                <code>POST /teacher/courses/{"{courseId}"}/cover-image</code>.
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
                  <Button type="default" size="small">
                    Change thumbnail
                  </Button>
                </Upload>
                <Button
                  danger
                  type="text"
                  icon={<DeleteOutlined />}
                  onClick={handleRemoveThumb}
                  size="small"
                >
                  Remove thumbnail
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
          >
            Save basics
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
