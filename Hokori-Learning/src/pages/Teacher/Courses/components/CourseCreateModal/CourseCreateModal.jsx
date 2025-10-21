import React, { useState } from "react";
import { Modal, Steps, Button, Form, Input, Select } from "antd";
import styles from "./styles.module.scss";
import CurriculumBuilder from "../Curriculum Builder/CurriculumBuilder";
import QuizList from "../Quiz/QuizList";
import FlashcardPanel from "../Flashcard/FlashcardPanel";
import LessonMediaPicker from "../LessonMediaPicker/LessonMediaPicker";

const { TextArea } = Input;

const steps = [
  { key: "basic", title: "Basic" },
  { key: "curriculum", title: "Curriculum" },
  { key: "assess", title: "Assessments" },
  { key: "flashcards", title: "Flashcards" },
  { key: "publish", title: "Publish" },
];

export default function CourseCreateModal({ open, onClose, onCreated }) {
  const [current, setCurrent] = useState(0);
  const [form] = Form.useForm();

  // Local staging state
  const [curriculum, setCurriculum] = useState([]); // [{lessonId,title,items:[{type:'video'|'file'|'quiz'|'flashcard', …}]}]
  const [assessments, setAssessments] = useState([]); // quizzes
  const [flashcards, setFlashcards] = useState([]); // [{term, meaning, example}]
  const [mediaLibrary, setMediaLibrary] = useState({ videos: [], files: [] });
  const next = async () => {
    if (steps[current].key === "basic") {
      try {
        await form.validateFields();
      } catch {
        return;
      }
    }
    setCurrent((c) => Math.min(c + 1, steps.length - 1));
  };

  const prev = () => setCurrent((c) => Math.max(0, c - 1));
  // Mock uploader: thay bằng API upload thật, trả về [{id,name,url}]
  const handleUploadToLibrary = async (fileList, type) => {
    // TODO: call BE; ở đây tạo demo
    const uploaded = fileList.map((f, idx) => ({
      id: Date.now() + idx,
      name: f.name,
      url: URL.createObjectURL(f),
    }));
    setMediaLibrary((prev) => ({
      ...prev,
      [type === "video" ? "videos" : "files"]: [
        ...prev[type === "video" ? "videos" : "files"],
        ...uploaded,
      ],
    }));
    return uploaded;
  };

  const submit = async () => {
    const basic = await form.validateFields();
    const newCourse = {
      id: Date.now(),
      title: basic.title,
      code: basic.code,
      status: "Draft",
      updatedAt: new Date().toISOString().slice(0, 10),
      students: 0,
      rating: null,
      payload: { basic, curriculum, assessments, flashcards },
    };
    onCreated?.(newCourse);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={960}
      title="Create Course"
      footer={
        <div className={styles.footer}>
          {current > 0 && <Button onClick={prev}>Back</Button>}
          {current < steps.length - 1 ? (
            <Button type="primary" onClick={next}>
              Next
            </Button>
          ) : (
            <Button type="primary" onClick={submit}>
              Create Draft
            </Button>
          )}
        </div>
      }
      destroyOnHidden
      className={styles.modalRoot}
    >
      <Steps
        size="small"
        current={current}
        items={steps.map((s) => ({ title: s.title }))}
        className={styles.steps}
      />

      <div className={styles.content}>
        {steps[current].key === "basic" && (
          <Form form={form} layout="vertical" initialValues={{ level: "N5" }}>
            <Form.Item
              label="Course title"
              name="title"
              rules={[{ required: true, message: "Please enter title" }]}
            >
              <Input placeholder="e.g., JLPT N5 Grammar Basics" />
            </Form.Item>
            <Form.Item
              label="Course code"
              name="code"
              rules={[{ required: true, message: "Please enter code" }]}
            >
              <Input placeholder="e.g., N5-GR-101" />
            </Form.Item>
            <Form.Item label="Level" name="level">
              <Select
                options={["N5", "N4", "N3", "N2", "N1"].map((v) => ({
                  label: v,
                  value: v,
                }))}
              />
            </Form.Item>
            <Form.Item label="Short description" name="desc">
              <TextArea rows={4} placeholder="What students will learn…" />
            </Form.Item>
          </Form>
        )}

        {steps[current].key === "curriculum" && (
          <CurriculumBuilder
            value={curriculum}
            onChange={setCurriculum}
            library={mediaLibrary} // 👈 truyền thư viện
            onUploadMedia={handleUploadToLibrary} // 👈 upload ngay trong lesson
          />
        )}

        {steps[current].key === "assess" && (
          <QuizList value={assessments} onChange={setAssessments} />
        )}

        {steps[current].key === "flashcards" && (
          <FlashcardPanel value={flashcards} onChange={setFlashcards} />
        )}

        {steps[current].key === "publish" && (
          <div className={styles.publishWrap}>
            <h3>Ready to publish?</h3>
            <p>
              When your draft is complete, you can submit it for moderation
              review. You may still edit while in “Draft”.
            </p>
            <ul className={styles.checklist}>
              <li>✅ Basic info filled</li>
              <li>✅ At least 1 lesson in curriculum</li>
              <li>✅ Intro video uploaded (optional)</li>
              <li>✅ At least 1 assessment or flashcard set (optional)</li>
            </ul>
            <p className={styles.note}>
              Click <b>Create Draft</b> to save the course; you can submit for
              review from the table actions.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
