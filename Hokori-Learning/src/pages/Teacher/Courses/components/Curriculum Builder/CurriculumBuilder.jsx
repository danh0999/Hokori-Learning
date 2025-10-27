import React, { useState } from "react";
import { Card, Button, Input, Space, Tooltip } from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import LessonEditorDrawer from "./LessonEditorDrawer";
import styles from "./styles.module.scss";

/**
 * Props:
 *  - sections: [{id, title, lessons:[{id,title,...lessonData}]}]
 *  - setSections(next)
 */
export default function CurriculumBuilder({ sections = [], setSections }) {
  const [newSec, setNewSec] = useState("");
  const [openLesson, setOpenLesson] = useState(null); // {secId, lesId}

  const uid = () => Date.now() + Math.random();

  const addSection = () => {
    if (!newSec.trim()) return;
    setSections([
      ...sections,
      { id: uid(), title: newSec.trim(), lessons: [] },
    ]);
    setNewSec("");
  };

  const addLesson = (secId) => {
    setSections(
      sections.map((s) =>
        s.id === secId
          ? {
              ...s,
              lessons: [
                ...s.lessons,
                {
                  id: uid(),
                  title: "New Lesson",
                  video: null,
                  attachments: [],
                },
              ],
            }
          : s
      )
    );
  };

  const removeSection = (id) => {
    setSections(sections.filter((s) => s.id !== id));
  };

  const removeLesson = (secId, lesId) => {
    setSections(
      sections.map((s) =>
        s.id === secId
          ? { ...s, lessons: s.lessons.filter((l) => l.id !== lesId) }
          : s
      )
    );
  };

  const updateLesson = (secId, lesId, updated) => {
    setSections(
      sections.map((s) =>
        s.id === secId
          ? {
              ...s,
              lessons: s.lessons.map((l) =>
                l.id === lesId ? { ...l, ...updated } : l
              ),
            }
          : s
      )
    );
  };

  return (
    <div className={styles.curriculumWrap}>
      <div style={{ display: "flex", gap: 8 }}>
        <Input
          placeholder="New section title"
          value={newSec}
          onChange={(e) => setNewSec(e.target.value)}
          onPressEnter={addSection}
          style={{ maxWidth: 320 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={addSection}>
          Add Section
        </Button>
      </div>

      {sections.length === 0 ? (
        <div className={styles.emptyBox}>No sections yet</div>
      ) : (
        sections.map((sec) => (
          <Card
            key={sec.id}
            title={sec.title}
            className={styles.sectionBlock}
            extra={
              <Tooltip title="Delete section">
                <Button
                  icon={<DeleteOutlined />}
                  type="text"
                  danger
                  onClick={() => removeSection(sec.id)}
                />
              </Tooltip>
            }
          >
            <div className={styles.lessonList}>
              {sec.lessons.length === 0 ? (
                <div className={styles.lessonEmpty}>
                  No lessons in this section
                </div>
              ) : (
                sec.lessons.map((les) => (
                  <div key={les.id} className={styles.lessonItem}>
                    <div className={styles.lessonMain}>
                      <Input
                        value={les.title}
                        onChange={(e) =>
                          updateLesson(sec.id, les.id, {
                            title: e.target.value,
                          })
                        }
                        className={styles.lessonTitleInput}
                      />
                      <div className={styles.lessonMeta}>
                        {les.video
                          ? `🎥 ${les.video.title || "Video attached"}`
                          : "No video yet"}{" "}
                        · {les.attachments?.length || 0} files ·{" "}
                        {(les.quizQuick?.length || 0) +
                          (les.flashcards?.length || 0)}{" "}
                        activities
                      </div>
                    </div>
                    <div className={styles.lessonActions}>
                      <Button
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() =>
                          setOpenLesson({ secId: sec.id, lesId: les.id })
                        }
                      >
                        Edit lesson
                      </Button>
                      <Button
                        icon={<DeleteOutlined />}
                        size="small"
                        danger
                        onClick={() => removeLesson(sec.id, les.id)}
                      />
                    </div>
                  </div>
                ))
              )}
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                className={styles.addLessonBtn}
                onClick={() => addLesson(sec.id)}
              >
                Add lesson
              </Button>
            </div>
          </Card>
        ))
      )}

      {/* Drawer editor */}
      {openLesson && (
        <LessonEditorDrawer
          open
          lesson={sections
            .find((s) => s.id === openLesson.secId)
            ?.lessons.find((l) => l.id === openLesson.lesId)}
          onClose={() => setOpenLesson(null)}
          onSave={(updated) => {
            updateLesson(openLesson.secId, openLesson.lesId, updated);
            setOpenLesson(null);
          }}
        />
      )}
    </div>
  );
}
