import React, { useState } from "react";
import {
  Drawer,
  Tabs,
  Input,
  Form,
  Button,
  Upload,
  Space,
  message,
  List,
  Typography,
} from "antd";
import { InboxOutlined } from "@ant-design/icons";
import LessonMediaPicker from "../../../components/LessonMediaPicker/LessonMediaPicker.jsx";
import QuizList from "../../../../ManageDocument/Quiz/QuizList/QuizList.jsx";
import QuizBuilderModal from "../../../../ManageDocument/Quiz/QuizBuilderModal/QuizBuilderModal.jsx";
import ImportQuizModal from "../../../../ManageDocument/Quiz/QuizBuilderModal/ImportQuizModal.jsx";
import FlashcardPanel from "../../../../ManageDocument/Flashcard/FlashcardPanel.jsx";
import styles from "./styles.module.scss";
import BulkImportModal from "../../../../ManageDocument/Quiz/BulkImportModal/BulkImportModal.jsx";

const { TextArea } = Input;
const { Dragger } = Upload;
const { Text } = Typography;

export default function LessonEditorDrawer({ open, lesson, onClose, onSave }) {
  const [local, setLocal] = useState(lesson || {});
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  // Quản lý quiz
  const [openCreateQuiz, setOpenCreateQuiz] = useState(false);
  const [openImportQuiz, setOpenImportQuiz] = useState(false);
  const [quizLibrary, setQuizLibrary] = useState([]); // thư viện quiz tạm trong quá trình tạo course
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [openBulk, setOpenBulk] = useState(false);

  // Helper immutable update theo id
  const upsertById = (arr, item) => {
    const i = arr.findIndex((x) => x.id === item.id);
    if (i === -1) return [item, ...arr];
    const clone = [...arr];
    clone[i] = item;
    return clone;
  };
  const removeById = (arr, id) => arr.filter((x) => x.id !== id);
  const handleChange = (field, value) => {
    setLocal({ ...local, [field]: value });
  };

  const handleSave = () => {
    onSave?.(local);
    message.success("Lesson updated");
  };

  const addAttachment = (fileList) => {
    const newFiles = fileList.map((f) => ({
      id: Date.now() + Math.random(),
      name: f.name,
      url: URL.createObjectURL(f),
      type: f.type,
    }));
    setLocal({
      ...local,
      attachments: [...(local.attachments || []), ...newFiles],
    });
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={720}
      title={` ${local.title || "Lesson"}`}
      extra={
        <Button type="primary" onClick={handleSave}>
          Save changes
        </Button>
      }
    >
      <Tabs
        defaultActiveKey="1"
        items={[
          {
            key: "1",
            label: "Video & Description",
            children: (
              <Form layout="vertical">
                <Form.Item label="Lesson Title">
                  <Input
                    value={local.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                  />
                </Form.Item>

                <Form.Item label="Video">
                  {local.video ? (
                    <div className={styles.videoBox}>
                      <Text strong>{local.video.title}</Text>
                      <br />
                      <a
                        href={local.video.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {local.video.url}
                      </a>
                      <Button
                        size="small"
                        style={{ marginTop: 8 }}
                        onClick={() => setMediaPickerOpen(true)}
                      >
                        Change video
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setMediaPickerOpen(true)}
                      type="dashed"
                    >
                      Select or Upload Video
                    </Button>
                  )}
                </Form.Item>

                <Form.Item label="Lesson Description">
                  <TextArea
                    rows={4}
                    value={local.description}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                    placeholder="Describe this lesson content…"
                  />
                </Form.Item>

                <Form.Item label="Key Points (bullet lines)">
                  <TextArea
                    rows={3}
                    value={(local.keypoints || []).join("\n")}
                    onChange={(e) =>
                      handleChange("keypoints", e.target.value.split("\n"))
                    }
                    placeholder="Each line = one point"
                  />
                </Form.Item>
              </Form>
            ),
          },
          {
            key: "2",
            label: "Attachments",
            children: (
              <div>
                <Dragger
                  multiple
                  beforeUpload={() => false}
                  onChange={(e) =>
                    addAttachment(e.fileList.map((f) => f.originFileObj))
                  }
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">
                    Click or drag files here to attach
                  </p>
                </Dragger>

                <List
                  style={{ marginTop: 16 }}
                  header={<b>Attached files</b>}
                  dataSource={local.attachments || []}
                  renderItem={(f) => (
                    <List.Item>
                      <a href={f.url} target="_blank" rel="noreferrer">
                        {f.name}
                      </a>
                    </List.Item>
                  )}
                />
              </div>
            ),
          },
          {
            key: "3",
            label: "Quick Quiz",
            children: (
              <>
                <Space style={{ marginBottom: 12 }}>
                  <Button onClick={() => setOpenBulk(true)}>Bulk import</Button>
                  <Button
                    type="dashed"
                    onClick={() => {
                      setEditingQuiz(null); // tạo quiz mới
                      setOpenCreateQuiz(true); // mở QuizBuilderModal
                    }}
                  >
                    New quiz
                  </Button>

                  <Button onClick={() => setOpenImportQuiz(true)}>
                    Import
                  </Button>
                </Space>

                <QuizList
                  value={local.quizQuick || []}
                  onChange={(v) => handleChange("quizQuick", v)}
                  onCreateNew={() => {
                    setEditingQuiz(null);
                    setOpenCreateQuiz(true);
                  }}
                  onImport={() => setOpenImportQuiz(true)}
                  onEdit={(q) => {
                    setEditingQuiz(q);
                    setOpenCreateQuiz(true);
                  }}
                  onRemove={(id) => {
                    handleChange(
                      "quizQuick",
                      removeById(local.quizQuick || [], id)
                    );
                    message.success("Removed quiz from lesson");
                  }}
                />

                <BulkImportModal
                  open={openBulk}
                  onCancel={() => setOpenBulk(false)}
                  onDone={(questions) => {
                    const newQuiz = {
                      id: crypto.randomUUID(),
                      title: `Imported Quiz ${new Date().toLocaleString()}`,
                      description: "Imported from text/image",
                      timeLimit: 30,
                      passingScore: 60,
                      shuffleOptions: true,
                      shuffleQuestions: false,
                      questions,
                      points: questions.reduce(
                        (s, q) => s + (q.points || 1),
                        0
                      ),
                    };
                    setQuizLibrary((lib) => [newQuiz, ...lib]);
                    handleChange("quizQuick", [
                      ...(local.quizQuick || []),
                      newQuiz,
                    ]);
                    setOpenBulk(false);
                    message.success(`Đã import ${questions.length} câu hỏi`);
                  }}
                />

                {/* Create / Edit modal */}
                <QuizBuilderModal
                  open={openCreateQuiz}
                  initial={editingQuiz} // <-- Pass vào để Edit
                  onCancel={() => {
                    setOpenCreateQuiz(false);
                    setEditingQuiz(null);
                  }}
                  onSave={(saved) => {
                    // 1) cập nhật lesson quizzes
                    const nextLesson = upsertById(local.quizQuick || [], saved);
                    handleChange("quizQuick", nextLesson);
                    // 2) cập nhật library tạm
                    setQuizLibrary((lib) => upsertById(lib, saved));
                    setOpenCreateQuiz(false);
                    setEditingQuiz(null);
                    message.success(
                      editingQuiz ? "Quiz updated" : "Quiz added"
                    );
                  }}
                />

                {/* Import modal */}
                <ImportQuizModal
                  open={openImportQuiz}
                  onCancel={() => setOpenImportQuiz(false)}
                  library={quizLibrary}
                  onPick={(picked) => {
                    handleChange(
                      "quizQuick",
                      upsertById(local.quizQuick || [], picked)
                    );
                    setOpenImportQuiz(false);
                    message.success("Imported quiz into lesson");
                  }}
                />
              </>
            ),
          },
          {
            key: "4",
            label: "Flashcards",
            children: (
              <FlashcardPanel
                value={local.flashcards || []}
                onChange={(v) => handleChange("flashcards", v)}
              />
            ),
          },
        ]}
      />

      {mediaPickerOpen && (
        <LessonMediaPicker
          open
          onClose={() => setMediaPickerOpen(false)}
          library={{ videos: [] }}
          onSelect={(items) => {
            if (items.length > 0)
              handleChange("video", {
                id: items[0].id,
                title: items[0].name,
                url: items[0].url,
              });
            setMediaPickerOpen(false);
          }}
        />
      )}
    </Drawer>
  );
}
