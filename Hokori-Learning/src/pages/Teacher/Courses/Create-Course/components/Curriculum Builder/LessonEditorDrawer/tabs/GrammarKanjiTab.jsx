import React, { useEffect, useState } from "react";
import { Form, Input, Upload, Button, Typography, Space } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";

import api from "../../../../../../../../configs/axios.js";
import {
  uploadSectionFileThunk,
  updateLessonThunk,
  createContentThunk,
  updateContentThunk,
  updateSectionThunk,
  deleteContentThunk,
} from "../../../../../../../../redux/features/teacherCourseSlice.js";

import styles from "../styles.module.scss";

const { TextArea } = Input;
const { Text } = Typography;

const API_BASE_URL =
  api.defaults.baseURL?.replace(/\/api\/?$/, "") ||
  import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, "") ||
  "";
const buildFileUrl = (filePath) => {
  if (!filePath) return null;
  if (/^https?:\/\//i.test(filePath)) return filePath;
  return `${API_BASE_URL}/files/${filePath}`.replace(/([^:]\/)\/+/g, "$1");
};

const DESC_BASE_SEC = 60;

export default function GrammarKanjiTab({
  type, // "GRAMMAR" | "KANJI"
  lesson,
  section, // ✅ section đã được tạo từ Drawer
  sectionsHook, // vẫn dùng để extract info
  onSaved,
  onDurationComputed,
}) {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const { extractContentFromSection } = sectionsHook;

  const info = extractContentFromSection(section);

  const [mediaState, setMediaState] = useState({
    file: null,
    previewUrl: null,
    contentId: null, // ASSET
    descId: null, // RICH_TEXT
    removeExisting: false,
  });

  const [mediaDurationSec, setMediaDurationSec] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!lesson || !section?.id) return;

    form.setFieldsValue({
      title: lesson.title,
      sectionTitle: section.title || (type === "GRAMMAR" ? "Grammar" : "Kanji"),
      description: info?.descContent?.richText || "",
    });

    setMediaState({
      file: null,
      previewUrl: buildFileUrl(info?.assetContent?.filePath),
      contentId: info?.assetContent?.id || null,
      descId: info?.descContent?.id || null,
      removeExisting: false,
    });

    setMediaDurationSec(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id, section?.id, type]);

  const handleSelectMedia = ({ file, onSuccess }) => {
    const url = URL.createObjectURL(file);
    setMediaState((prev) => {
      if (prev.previewUrl && prev.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(prev.previewUrl);
      }
      return { ...prev, file, previewUrl: url, removeExisting: false };
    });
    onSuccess?.("ok");
  };

  const handleSave = async () => {
    if (!lesson?.id) return;
    if (!section?.id)
      return toast.error("Chưa có section. Hãy tạo phần từ nút + trước.");

    const values = await form.validateFields();
    const lessonTitle = values.title;
    const sectionTitle = values.sectionTitle;
    const description = values.description || "";

    try {
      setSaving(true);

      // 1) update lesson title nếu đổi
      if (lessonTitle && lessonTitle !== lesson.title) {
        await dispatch(
          updateLessonThunk({
            lessonId: lesson.id,
            data: { title: lessonTitle },
          })
        ).unwrap();
      }

      // 2) update section title nếu đổi
      if (sectionTitle && sectionTitle !== section.title) {
        await dispatch(
          updateSectionThunk({
            sectionId: section.id,
            data: { title: sectionTitle },
          })
        ).unwrap();
      }

      // 3) ASSET
      let currentContentId = mediaState.contentId;
      let filePath = info?.assetContent?.filePath || null;

      // remove existing asset (không upload file mới)
      if (mediaState.removeExisting && currentContentId && !mediaState.file) {
        await dispatch(
          deleteContentThunk({
            sectionId: section.id,
            contentId: currentContentId,
          })
        ).unwrap();
        currentContentId = null;
        filePath = null;
      }

      if (mediaState.file) {
        const uploadRes = await dispatch(
          uploadSectionFileThunk({
            sectionId: section.id,
            file: mediaState.file,
          })
        ).unwrap();

        filePath =
          uploadRes.filePath ||
          uploadRes.path ||
          uploadRes.relativePath ||
          filePath;

        if (filePath) {
          const baseData = {
            contentFormat: "ASSET",
            primaryContent: true,
            filePath,
            richText: null,
            quizId: null,
            flashcardSetId: null,
          };

          if (currentContentId) {
            await dispatch(
              updateContentThunk({
                contentId: currentContentId,
                data: baseData,
              })
            ).unwrap();
          } else {
            const created = await dispatch(
              createContentThunk({
                sectionId: section.id,
                data: {
                  ...baseData,
                  orderIndex: (section.contents?.length || 0) + 1,
                },
              })
            ).unwrap();
            currentContentId = (created.content || created).id;
          }

          setMediaState((prev) => ({
            ...prev,
            contentId: currentContentId,
            removeExisting: false,
          }));
        }
      }

      // 4) RICH_TEXT
      if (description.trim()) {
        const baseDesc = {
          contentFormat: "RICH_TEXT",
          primaryContent: false,
          filePath: null,
          richText: description,
          quizId: null,
          flashcardSetId: null,
        };

        if (mediaState.descId) {
          await dispatch(
            updateContentThunk({ contentId: mediaState.descId, data: baseDesc })
          ).unwrap();
        } else {
          const created = await dispatch(
            createContentThunk({
              sectionId: section.id,
              data: {
                ...baseDesc,
                orderIndex: (section.contents?.length || 0) + 2,
              },
            })
          ).unwrap();
          const c = created.content || created;
          setMediaState((prev) => ({ ...prev, descId: c.id }));
        }
      }

      // 5) duration
      if (typeof onDurationComputed === "function") {
        const descSec = description.trim() ? DESC_BASE_SEC : 0;
        onDurationComputed((mediaDurationSec || 0) + descSec);
      }

      toast.success(
        type === "GRAMMAR" ? "Đã lưu phần Grammar." : "Đã lưu phần Kanji."
      );
      await onSaved?.();
    } catch (e) {
      console.error(e);
      toast.error("Lưu thất bại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.tabBody}>
      {mediaState.previewUrl && (
        <video
          src={mediaState.previewUrl}
          style={{ display: "none" }}
          onLoadedMetadata={(e) =>
            setMediaDurationSec(Math.round(e.target.duration || 0))
          }
        />
      )}

      <Form form={form} layout="vertical">
        <Form.Item
          name="title"
          label="Tiêu đề bài học"
          rules={[
            { required: true, message: "Vui lòng nhập tiêu đề bài học." },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="sectionTitle"
          label={
            type === "GRAMMAR" ? "Tiêu đề phần Grammar" : "Tiêu đề phần Kanji"
          }
          rules={[{ required: true, message: "Vui lòng nhập tiêu đề phần." }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label={
            type === "GRAMMAR" ? "Tài liệu xem Grammar" : "Tài liệu xem Kanji"
          }
        >
          {mediaState.previewUrl ? (
            <div className={styles.videoBox}>
              <Text strong>File hiện tại</Text>
              <br />
              <a href={mediaState.previewUrl} target="_blank" rel="noreferrer">
                {mediaState.previewUrl}
              </a>
              <div style={{ marginTop: 8 }}>
                <Space>
                  <Upload
                    multiple={false}
                    showUploadList={false}
                    customRequest={handleSelectMedia}
                  >
                    <Button>Thay đổi file</Button>
                  </Upload>
                  <Button
                    danger
                    onClick={() =>
                      setMediaState((prev) => ({
                        ...prev,
                        file: null,
                        previewUrl: null,
                        removeExisting: !!prev.contentId,
                      }))
                    }
                  >
                    Xóa file
                  </Button>
                </Space>
              </div>
            </div>
          ) : (
            <Upload.Dragger
              multiple={false}
              showUploadList={false}
              customRequest={handleSelectMedia}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                Click hoặc kéo thả file media (video / ảnh / audio) vào đây
              </p>
            </Upload.Dragger>
          )}
        </Form.Item>

        <Form.Item
          name="description"
          label={
            type === "GRAMMAR" ? "Tài liệu đọc Grammar" : "Tài liệu đọc Kanji"
          }
        >
          <TextArea rows={5} placeholder="Mô tả nội dung, ví dụ, ghi chú..." />
        </Form.Item>

        <Form.Item>
          <Button type="primary" onClick={handleSave} loading={saving}>
            Lưu
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
