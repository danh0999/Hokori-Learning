// LessonEditorDrawer/tabs/GrammarKanjiTab.jsx
import React, { useEffect, useState } from "react";
import { Form, Input, Upload, Button, Typography, Space, message } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";

import api from "../../../../../../../../configs/axios.js";
import {
  uploadSectionFileThunk,
  updateLessonThunk,
  createContentThunk,
  updateContentThunk,
  updateSectionThunk,
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

// thêm 60s cho phần mô tả text nếu có
const DESC_BASE_SEC = 60;

export default function GrammarKanjiTab({
  type,
  lesson,
  sectionsHook,
  onSaved,
  onDurationComputed,
}) {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const { sectionsByType, grammarInfo, kanjiInfo, ensureSection } =
    sectionsHook;
  const info = type === "GRAMMAR" ? grammarInfo : kanjiInfo;
  const sectionForType = sectionsByType?.[type] || null;

  const [videoState, setVideoState] = useState({
    file: null,
    previewUrl: null,
    contentId: null,
    descId: null,
  });
  const [videoDurationSec, setVideoDurationSec] = useState(0);
  const [saving, setSaving] = useState(false);

  // ============================
  // INIT FORM + VIDEO PREVIEW
  // chỉ chạy khi lessonId / type đổi → tránh reset khi tree đổi vì vocab
  // ============================
  useEffect(() => {
    if (!lesson) return;

    const defaultSectionTitle =
      sectionForType?.title ||
      (type === "GRAMMAR" ? "Grammar section" : "Kanji section");

    form.setFieldsValue({
      title: lesson.title,
      sectionTitle: defaultSectionTitle,
      description: info?.descContent?.richText || "",
    });

    setVideoState({
      file: null,
      previewUrl: buildFileUrl(info?.assetContent?.filePath),
      contentId: info?.assetContent?.id || null,
      descId: info?.descContent?.id || null,
    });
    setVideoDurationSec(0);
  }, [lesson?.id, type, form]); // ❗ không phụ thuộc sectionForType / info.*

  // ============================
  // HANDLE chọn video
  // ============================
  const handleSelectVideo = ({ file, onSuccess }) => {
    const url = URL.createObjectURL(file);
    setVideoState((prev) => {
      if (prev.previewUrl && prev.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(prev.previewUrl);
      }
      return { ...prev, file, previewUrl: url };
    });
    onSuccess?.("ok");
  };

  // ============================
  // SAVE
  // ============================
  const handleSave = async () => {
    if (!lesson?.id) return;

    const values = await form.validateFields();
    const lessonTitle = values.title;
    const sectionTitle = values.sectionTitle;
    const description = values.description || "";

    try {
      setSaving(true);

      // 1. Update LESSON title nếu đổi
      if (lessonTitle && lessonTitle !== lesson.title) {
        await dispatch(
          updateLessonThunk({
            lessonId: lesson.id,
            data: { title: lessonTitle },
          })
        ).unwrap();
      }

      // 2. Đảm bảo SECTION + update title section nếu cần
      let section = sectionForType;
      if (!section) {
        section = await ensureSection(type, {
          title: sectionTitle || (type === "GRAMMAR" ? "Grammar" : "Kanji"),
        });
      } else if (sectionTitle && sectionTitle !== section.title) {
        await dispatch(
          updateSectionThunk({
            sectionId: section.id,
            data: { title: sectionTitle },
          })
        ).unwrap();
      }

      if (!section?.id) {
        message.error("Không tìm được section để lưu nội dung.");
        return;
      }

      // 3. Xử lý VIDEO (ASSET content) — chỉ nếu user chọn file mới
      let filePath = info?.assetContent?.filePath || null;

      if (videoState.file) {
        const uploadRes = await dispatch(
          uploadSectionFileThunk({
            sectionId: section.id,
            file: videoState.file,
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

          if (videoState.contentId) {
            await dispatch(
              updateContentThunk({
                contentId: videoState.contentId,
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
            const c = created.content || created;
            setVideoState((prev) => ({ ...prev, contentId: c.id }));
          }
        }
      }

      // 4. DESCRIPTION (RICH_TEXT)
      if (description.trim()) {
        const baseDesc = {
          contentFormat: "RICH_TEXT",
          primaryContent: false,
          filePath: null,
          richText: description,
          quizId: null,
          flashcardSetId: null,
        };

        if (videoState.descId) {
          await dispatch(
            updateContentThunk({
              contentId: videoState.descId,
              data: baseDesc,
            })
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
          setVideoState((prev) => ({ ...prev, descId: c.id }));
        }
      }

      // 5. Báo duration cho parent (LessonEditorDrawer)
      if (typeof onDurationComputed === "function") {
        const descSec = description.trim() ? DESC_BASE_SEC : 0;
        const totalSec = (videoDurationSec || 0) + descSec;
        onDurationComputed(totalSec);
      }

      message.success(
        type === "GRAMMAR" ? "Đã lưu Grammar section." : "Đã lưu Kanji section."
      );
      onSaved?.();
    } catch (err) {
      console.error(err);
      message.error("Lưu section thất bại.");
    } finally {
      setSaving(false);
    }
  };

  // ============================
  // RENDER
  // ============================
  return (
    <div className={styles.tabBody}>
      {/* video ẩn để đọc metadata duration */}
      {videoState.previewUrl && (
        <video
          src={videoState.previewUrl}
          style={{ display: "none" }}
          onLoadedMetadata={(e) => {
            const d = Math.round(e.target.duration || 0);
            setVideoDurationSec(d);
          }}
        />
      )}

      <Form form={form} layout="vertical">
        <Form.Item
          name="title"
          label="Lesson title"
          rules={[
            { required: true, message: "Vui lòng nhập tiêu đề bài học." },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="sectionTitle"
          label={
            type === "GRAMMAR" ? "Grammar section title" : "Kanji section title"
          }
          rules={[
            { required: true, message: "Vui lòng nhập tiêu đề section." },
          ]}
        >
          <Input
            placeholder={
              type === "GRAMMAR"
                ? "Ví dụ: Ngữ pháp – Thì hiện tại tiếp diễn"
                : "Ví dụ: Kanji – Chủ đề Gia đình"
            }
          />
        </Form.Item>

        <Form.Item label={type === "GRAMMAR" ? "Grammar video" : "Kanji video"}>
          {videoState.previewUrl ? (
            <div className={styles.videoBox}>
              <Text strong>Current video</Text>
              <br />
              <a href={videoState.previewUrl} target="_blank" rel="noreferrer">
                {videoState.previewUrl}
              </a>
              <div style={{ marginTop: 8 }}>
                <Space>
                  <Upload
                    multiple={false}
                    showUploadList={false}
                    customRequest={handleSelectVideo}
                  >
                    <Button>Change video</Button>
                  </Upload>
                  <Button
                    danger
                    onClick={() =>
                      setVideoState((prev) => ({
                        ...prev,
                        file: null,
                        previewUrl: null,
                      }))
                    }
                  >
                    Remove
                  </Button>
                </Space>
              </div>
            </div>
          ) : (
            <Upload.Dragger
              multiple={false}
              showUploadList={false}
              customRequest={handleSelectVideo}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                Click hoặc kéo thả file video vào đây
              </p>
            </Upload.Dragger>
          )}
        </Form.Item>

        <Form.Item
          name="description"
          label={
            type === "GRAMMAR" ? "Grammar description" : "Kanji description"
          }
        >
          <TextArea rows={5} placeholder="Mô tả nội dung, ví dụ, ghi chú..." />
        </Form.Item>

        <Form.Item>
          <Button type="default" onClick={handleSave} loading={saving}>
            Save {type === "GRAMMAR" ? "Grammar" : "Kanji"}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
