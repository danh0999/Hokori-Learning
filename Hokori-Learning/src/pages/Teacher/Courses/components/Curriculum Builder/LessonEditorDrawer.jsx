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
import LessonMediaPicker from "../../components/LessonMediaPicker/LessonMediaPicker.jsx";
import QuizList from "../../components/Quiz/QuizList.jsx";
import FlashcardPanel from "../../components/Flashcard/FlashcardPanel.jsx";
import styles from "./styles.module.scss";

const { TextArea } = Input;
const { Dragger } = Upload;
const { Text } = Typography;

export default function LessonEditorDrawer({ open, lesson, onClose, onSave }) {
  const [local, setLocal] = useState(lesson || {});
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

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
      title={`Edit: ${local.title || "Lesson"}`}
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
              <QuizList
                value={local.quizQuick || []}
                onChange={(v) => handleChange("quizQuick", v)}
              />
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
