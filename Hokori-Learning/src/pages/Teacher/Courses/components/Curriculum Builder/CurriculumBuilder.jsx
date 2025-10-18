// src/pages/Teacher/MyCourses/components/CurriculumBuilder.jsx
import React, { useState } from "react";
import { Button, Card, Input, List, Space, Tag, Tooltip } from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  PaperClipOutlined,
  VideoCameraOutlined,
  FilePdfOutlined,
  EditOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import styles from "./styles.module.scss";
import LessonMediaPicker from "../LessonMediaPicker/LessonMediaPicker";

/**
 * Props:
 *  - value: [{ lessonId, title, items: [{id,type:'video'|'file'|'quiz'|'flashcard', title, mediaId?, url?}] }]
 *  - onChange(next)
 *  - library: { videos: [...], files: [...] }
 *  - onUploadMedia(fileList, type) => Promise<[{id,name,url}]>
 */
export default function CurriculumBuilder({
  value = [],
  onChange,
  library,
  onUploadMedia,
}) {
  const [newTitle, setNewTitle] = useState("");
  const [pickerOpenFor, setPickerOpenFor] = useState(null); // lessonId đang mở picker
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [editingLessonTitle, setEditingLessonTitle] = useState("");

  /** Helpers */
  const uid = () => Date.now() + Math.random();

  const patch = (updater) => {
    const next = typeof updater === "function" ? updater(value) : updater;
    onChange?.(next);
  };

  /** Lesson ops */
  const addLesson = () => {
    if (!newTitle.trim()) return;
    patch([...value, { lessonId: uid(), title: newTitle.trim(), items: [] }]);
    setNewTitle("");
  };

  const updateLessonTitle = (lessonId, title) => {
    patch(value.map((l) => (l.lessonId === lessonId ? { ...l, title } : l)));
  };

  const startEditLesson = (lessonId, currentTitle) => {
    setEditingLessonId(lessonId);
    setEditingLessonTitle(currentTitle);
  };

  const commitEditLesson = (lessonId) => {
    if (editingLessonId !== lessonId) return;
    const t = editingLessonTitle.trim();
    if (t) updateLessonTitle(lessonId, t);
    setEditingLessonId(null);
    setEditingLessonTitle("");
  };

  const cancelEditLesson = () => {
    setEditingLessonId(null);
    setEditingLessonTitle("");
  };

  const removeLesson = (lessonId) => {
    patch(value.filter((l) => l.lessonId !== lessonId));
  };

  /** Item ops */
  const addPlaceholderItem = (lessonId, type) => {
    patch(
      value.map((l) =>
        l.lessonId === lessonId
          ? {
              ...l,
              items: [...l.items, { id: uid(), type, title: `${type} item` }],
            }
          : l
      )
    );
  };

  const removeItem = (lessonId, itemId) => {
    patch(
      value.map((l) =>
        l.lessonId === lessonId
          ? { ...l, items: l.items.filter((it) => it.id !== itemId) }
          : l
      )
    );
  };

  const attachFromPicker = (lessonId, items) => {
    // items: [{id,type,name,url}]
    patch(
      value.map((l) =>
        l.lessonId === lessonId
          ? {
              ...l,
              items: [
                ...l.items,
                ...items.map((it) => ({
                  id: uid(),
                  type: it.type, // 'video' | 'file'
                  title: it.name,
                  mediaId: it.id,
                  url: it.url,
                })),
              ],
            }
          : l
      )
    );
  };

  const openPickerFor = (lessonId) => setPickerOpenFor(lessonId);

  return (
    <div className={styles.wrap}>
      {/* Add new lesson */}
      <div className={styles.header}>
        <Input
          placeholder="Lesson title e.g., Introduction"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className={styles.input}
          onPressEnter={addLesson}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={addLesson}>
          Add lesson
        </Button>
      </div>

      {/* Lesson list */}
      <List
        dataSource={value}
        locale={{ emptyText: "No lessons yet" }}
        renderItem={(l) => (
          <List.Item className={styles.item} key={l.lessonId}>
            <Card
              className={styles.card}
              title={
                <div className={styles.lessonTitle}>
                  {editingLessonId === l.lessonId ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <Input
                        autoFocus
                        value={editingLessonTitle}
                        onChange={(e) => setEditingLessonTitle(e.target.value)}
                        onPressEnter={() => commitEditLesson(l.lessonId)}
                      />
                      <Button
                        type="primary"
                        onClick={() => commitEditLesson(l.lessonId)}
                        size="small"
                      >
                        Save
                      </Button>
                      <Button
                        icon={<CloseOutlined />}
                        onClick={cancelEditLesson}
                        size="small"
                      />
                    </div>
                  ) : (
                    <Space>
                      <span>{l.title}</span>
                      <Tooltip title="Rename lesson">
                        <Button
                          size="small"
                          type="text"
                          icon={<EditOutlined />}
                          onClick={() => startEditLesson(l.lessonId, l.title)}
                        />
                      </Tooltip>
                    </Space>
                  )}
                </div>
              }
              extra={
                <Space>
                  {/* Gắn/Upload trực tiếp vào lesson */}
                  <Tooltip title="Attach or upload media">
                    <Button
                      icon={<PaperClipOutlined />}
                      onClick={() => openPickerFor(l.lessonId)}
                    >
                      Attach media
                    </Button>
                  </Tooltip>

                  <Tooltip title="Delete lesson">
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeLesson(l.lessonId)}
                    />
                  </Tooltip>
                </Space>
              }
            >
              {/* Quick actions */}
              <Space size={[8, 8]} wrap className={styles.itemBar}>
                {/* Mở picker để chọn/upload video/file ngay */}
                <Button
                  icon={<VideoCameraOutlined />}
                  onClick={() => openPickerFor(l.lessonId)}
                >
                  + Video
                </Button>
                <Button
                  icon={<FilePdfOutlined />}
                  onClick={() => openPickerFor(l.lessonId)}
                >
                  + File
                </Button>

                {/* Placeholder cho những loại không cần upload */}
                <Button onClick={() => addPlaceholderItem(l.lessonId, "quiz")}>
                  + Quiz
                </Button>
                <Button
                  onClick={() => addPlaceholderItem(l.lessonId, "flashcard")}
                >
                  + Flashcards
                </Button>
              </Space>

              {/* Items */}
              {l.items.length === 0 ? (
                <div className={styles.empty}>No content yet</div>
              ) : (
                <List
                  size="small"
                  dataSource={l.items}
                  renderItem={(it) => (
                    <List.Item className={styles.subItem} key={it.id}>
                      <div className={styles.itemTitle}>
                        <Space>
                          <Tag
                            color={
                              it.type === "video"
                                ? "processing"
                                : it.type === "file"
                                ? "default"
                                : "blue"
                            }
                          >
                            {it.type}
                          </Tag>
                          {it.url ? (
                            <a href={it.url} target="_blank" rel="noreferrer">
                              {it.title}
                            </a>
                          ) : (
                            <span>{it.title}</span>
                          )}
                        </Space>
                      </div>
                      <div className={styles.itemActions}>
                        <Tooltip title="Remove item">
                          <Button
                            size="small"
                            type="text"
                            icon={<DeleteOutlined />}
                            onClick={() => removeItem(l.lessonId, it.id)}
                          />
                        </Tooltip>
                      </div>
                    </List.Item>
                  )}
                />
              )}

              {/* Picker modal per lesson */}
              {pickerOpenFor === l.lessonId && (
                <LessonMediaPicker
                  open
                  onClose={() => setPickerOpenFor(null)}
                  library={library}
                  onSelect={(items) => attachFromPicker(l.lessonId, items)}
                  onUpload={onUploadMedia}
                />
              )}
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
}
