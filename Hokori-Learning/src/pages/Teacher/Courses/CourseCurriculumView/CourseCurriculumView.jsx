import React, { useState } from "react";
import {
  Card,
  Collapse,
  List,
  Space,
  Tag,
  Typography,
  Spin,
  Empty,
  Button,
} from "antd";
import {
  PlayCircleOutlined,
  FileImageOutlined,
  FileOutlined,
  ReadOutlined,
  QuestionCircleOutlined,
  BookOutlined,
  EditOutlined,
} from "@ant-design/icons";

import styles from "./CourseCurriculumView.module.scss";
import api from "../../../../configs/axios";

const { Panel } = Collapse;
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

export default function CourseCurriculumView({
  courseMeta,
  courseTree,
  loading,
  onEditLesson,
}) {
  const [selectedContent, setSelectedContent] = useState(null);

  const chapters = courseTree?.chapters || [];

  const thumbUrl =
    courseMeta?.thumbnailUrl ||
    courseMeta?.coverImageUrl ||
    courseMeta?.imageUrl ||
    null;

  const renderContentIcon = (c) => {
    switch (c.contentFormat) {
      case "ASSET": {
        const url = buildFileUrl(c.filePath);
        const isVideo = url && /\.(mp4|mov|webm|mkv)$/i.test(url);
        const isImage = url && /\.(jpe?g|png|gif|webp)$/i.test(url);
        if (isVideo) return <PlayCircleOutlined />;
        if (isImage) return <FileImageOutlined />;
        return <FileOutlined />;
      }
      case "RICH_TEXT":
        return <ReadOutlined />;
      case "QUIZ_REF":
        return <QuestionCircleOutlined />;
      case "FLASHCARD_SET":
        return <BookOutlined />;
      default:
        return <FileOutlined />;
    }
  };

  const renderPreview = () => {
    const c = selectedContent;
    if (!c) {
      return (
        <div className={styles.previewEmpty}>
          <Text type="secondary">
            Chọn 1 content ở bên trái để xem preview.
          </Text>
        </div>
      );
    }

    const url = buildFileUrl(c.filePath || c.assetPath);

    if (c.contentFormat === "ASSET" && url) {
      const isVideo = /\.(mp4|mov|webm|mkv)$/i.test(url);
      const isImage = /\.(jpe?g|png|gif|webp)$/i.test(url);

      return (
        <div className={styles.previewBody}>
          <Text strong className={styles.previewTitle}>
            Asset preview
          </Text>
          {isVideo ? (
            <video src={url} controls className={styles.previewVideo} />
          ) : isImage ? (
            <img src={url} alt="Asset" className={styles.previewImage} />
          ) : (
            <a href={url} target="_blank" rel="noreferrer">
              <FileOutlined /> Open file
            </a>
          )}
        </div>
      );
    }

    if (c.contentFormat === "RICH_TEXT") {
      return (
        <div className={styles.previewBody}>
          <Text strong className={styles.previewTitle}>
            Description
          </Text>
          <div className={styles.previewRich}>
            {c.richText || <Text type="secondary">(Empty)</Text>}
          </div>
        </div>
      );
    }

    if (c.contentFormat === "QUIZ_REF") {
      return (
        <div className={styles.previewBody}>
          <Text strong className={styles.previewTitle}>
            Quiz reference
          </Text>
          <p>
            Quiz ID: <code>{c.quizId}</code>
          </p>
          {typeof c.quizTotalQuestions === "number" && (
            <p>{c.quizTotalQuestions} questions</p>
          )}
          <Text type="secondary">
            Muốn xem chi tiết quiz, bấm Edit lesson &gt; tab Quiz & Flashcards.
          </Text>
        </div>
      );
    }

    if (c.contentFormat === "FLASHCARD_SET") {
      return (
        <div className={styles.previewBody}>
          <Text strong className={styles.previewTitle}>
            Flashcard set
          </Text>
          <p>
            Flashcard set ID: <code>{c.flashcardSetId}</code>
          </p>
        </div>
      );
    }

    return (
      <div className={styles.previewBody}>
        <Text type="secondary">Không có preview cho content này.</Text>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.center}>
        <Spin />
      </div>
    );
  }

  if (!chapters.length) {
    return (
      <Empty
        description="Course này chưa có curriculum."
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <div className={styles.layout}>
      {/* LEFT: tree + summary */}
      <div className={styles.treeCol}>
        <Card className={styles.courseSummary} size="small">
          <Space align="start">
            {thumbUrl && (
              <div className={styles.thumbBox}>
                <img
                  src={thumbUrl}
                  alt="Thumbnail"
                  className={styles.thumbImage}
                />
              </div>
            )}
            <div>
              <Text strong>{courseMeta?.title}</Text>
              <br />
              <Text type="secondary">
                {chapters.length} chapter(s) ·{" "}
                {chapters.reduce(
                  (sum, ch) => sum + (ch.lessons?.length || 0),
                  0
                )}{" "}
                lesson(s)
              </Text>
            </div>
          </Space>
        </Card>

        <Collapse accordion className={styles.chapterCollapse}>
          {chapters.map((ch) => (
            <Panel
              header={
                <Space>
                  <Text strong>{ch.title}</Text>
                  <Tag>{(ch.lessons || []).length} lessons</Tag>
                </Space>
              }
              key={ch.id}
            >
              <List
                dataSource={ch.lessons || []}
                renderItem={(lesson) => (
                  <List.Item
                    key={lesson.id}
                    className={styles.lessonItem}
                    actions={[
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => onEditLesson?.(lesson)}
                      >
                        Edit
                      </Button>,
                    ]}
                  >
                    <div className={styles.lessonMain}>
                      <div className={styles.lessonTitle}>{lesson.title}</div>
                      <div className={styles.lessonMeta}>
                        {(lesson.sections || []).length} section(s)
                      </div>

                      {(lesson.sections || []).map((sec) => (
                        <div key={sec.id} className={styles.sectionBlock}>
                          <div className={styles.sectionHeader}>
                            <span>{sec.title}</span>
                            <Tag size="small">{sec.studyType}</Tag>
                          </div>

                          <List
                            size="small"
                            dataSource={sec.contents || []}
                            renderItem={(c) => (
                              <List.Item
                                key={c.id}
                                className={
                                  selectedContent?.id === c.id
                                    ? styles.contentItemActive
                                    : styles.contentItem
                                }
                                onClick={() => setSelectedContent(c)}
                              >
                                <Space>
                                  {renderContentIcon(c)}
                                  <span>
                                    {c.contentFormat}
                                    {c.primaryContent ? " (primary)" : ""}
                                  </span>
                                </Space>
                              </List.Item>
                            )}
                          />
                        </div>
                      ))}
                    </div>
                  </List.Item>
                )}
              />
            </Panel>
          ))}
        </Collapse>
      </div>

      {/* RIGHT: preview */}
      <div className={styles.previewCol}>
        <Card title="Content preview" size="small">
          {renderPreview()}
        </Card>
      </div>
    </div>
  );
}
