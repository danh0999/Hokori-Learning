// src/pages/Teacher/ManageDocument/Quiz/QuizBuilderModal/QuizBuilderModal.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  Modal,
  Button,
  Space,
  Empty,
  Form,
  Input,
  InputNumber,
  Row,
  Col,
  Switch,
  Divider,
  Typography,
  message,
} from "antd";
import { PlusOutlined, SaveOutlined } from "@ant-design/icons";
import QuestionCard from "../../Quiz/components/QuestionCard/QuestionCard.jsx";
import { newQuestion } from "../../Quiz/components/quizUtils/quizUtils.js";
import styles from "./styles.module.scss";

const { Text } = Typography;

const buildQuizFromInitial = (initial) => ({
  id: initial?.id || crypto.randomUUID(),
  title: initial?.title || "",
  description: initial?.description || "",
  timeLimit: initial?.timeLimit ?? 30,
  passingScore: initial?.passingScore ?? 60,
  shuffleQuestions: !!initial?.shuffleQuestions,
  shuffleOptions: initial?.shuffleOptions !== false,
  showExplanation: initial?.showExplanation ?? true,
  isRequired: !!initial?.isRequired,
  tags: initial?.tags || [],
  questions: initial?.questions ? structuredClone(initial.questions) : [],
});

export default function QuizBuilderModal({ open, initial, onCancel, onSave }) {
  const [quiz, setQuiz] = useState(() => buildQuizFromInitial(initial));
  const [metaForm] = Form.useForm();

  useEffect(() => {
    if (!open) return;
    const base = buildQuizFromInitial(initial || null);
    setQuiz(base);
    metaForm.setFieldsValue({
      title: base.title,
      description: base.description,
      timeLimit: base.timeLimit,
      passingScore: base.passingScore,
      shuffleQuestions: base.shuffleQuestions,
      shuffleOptions: base.shuffleOptions,
      showExplanation: base.showExplanation,
      isRequired: base.isRequired,
    });
  }, [initial, open, metaForm]);

  const totalPoints = useMemo(
    () => (quiz.questions || []).reduce((s, q) => s + (q.points || 0), 0),
    [quiz.questions]
  );

  const isNew = !initial;

  const addQuestion = (type = "single") =>
    setQuiz((q) => ({
      ...q,
      questions: [...(q.questions || []), newQuestion(type)],
    }));

  const updateQuestion = (id, next) =>
    setQuiz((q) => ({
      ...q,
      questions: q.questions.map((x) => (x.id === id ? next : x)),
    }));

  const duplicateQuestion = (idx) =>
    setQuiz((q) => {
      const clone = structuredClone(q.questions[idx]);
      clone.id = crypto.randomUUID();
      return {
        ...q,
        questions: [
          ...q.questions.slice(0, idx + 1),
          clone,
          ...q.questions.slice(idx + 1),
        ],
      };
    });

  const deleteQuestion = (id) =>
    setQuiz((q) => ({
      ...q,
      questions: q.questions.filter((x) => x.id !== id),
    }));

  const moveQuestion = (idx, dir) =>
    setQuiz((q) => {
      const arr = [...q.questions];
      const j = dir === "up" ? idx - 1 : idx + 1;
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      return { ...q, questions: arr };
    });

  const handleSave = async () => {
    try {
      const meta = await metaForm.validateFields();
      const payload = { ...quiz, ...meta };
      onSave?.(payload);
    } catch (e) {
      // form sẽ highlight lỗi
      console.log(e);
    }
  };

  return (
    <Modal
      open={open}
      title={`${isNew ? "New" : "Edit"} Quiz${
        quiz.title ? ` – ${quiz.title}` : ""
      }`}
      onCancel={onCancel}
      width={980}
      destroyOnClose
      footer={null} // 🔥 bỏ footer, dùng toolbar phía trên
    >
      {/* TOP TOOLBAR */}
      <div className={styles.topBar}>
        <Space wrap>
          <Button
            icon={<PlusOutlined />}
            type="primary"
            onClick={() => addQuestion("single")}
          >
            Add Single
          </Button>
          <Button onClick={() => addQuestion("multiple")}>Add Multiple</Button>
          <Button onClick={() => addQuestion("truefalse")}>Add T/F</Button>
          <Button onClick={() => addQuestion("fill")}>Add Fill-in</Button>
        </Space>

        <Space>
          <span className={styles.topBarStats}>
            {quiz.questions.length} câu · {totalPoints} điểm
          </span>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
            Save changes
          </Button>
        </Space>
      </div>

      <Divider style={{ margin: "8px 0 12px" }} />

      {/* META FORM 2 CỘT */}
      <Form
        form={metaForm}
        layout="vertical"
        className={styles.metaForm}
        onValuesChange={(_, all) => setQuiz((q) => ({ ...q, ...all }))}
      >
        <Row gutter={16}>
          {/* Cột trái */}
          <Col span={16}>
            <Form.Item
              name="title"
              label="Title"
              rules={[{ required: true, message: "Nhập tiêu đề quiz" }]}
            >
              <Input placeholder="VD: Quick Grammar Check" />
            </Form.Item>

            <Form.Item name="description" label="Description">
              <Input placeholder="Mô tả ngắn…" />
            </Form.Item>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  name="timeLimit"
                  label="Time limit (minutes)"
                  rules={[
                    { required: true, message: "Nhập thời gian làm bài" },
                  ]}
                >
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="passingScore"
                  label="Passing score (%)"
                  rules={[{ required: true, message: "Nhập điểm qua bài (%)" }]}
                >
                  <InputNumber min={0} max={100} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>
          </Col>

          {/* Cột phải */}
          <Col span={8}>
            <Row>
              <Col span={24}>
                <Form.Item
                  name="isRequired"
                  label="Bắt buộc hoàn thành"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="shuffleQuestions"
                  label="Shuffle questions"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="shuffleOptions"
                  label="Shuffle options"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="showExplanation"
                  label="Show explanation after submit"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
            </Row>

            <div className={styles.metaStats}>
              <Text type="secondary">Quick stats</Text>
              <div className={styles.metaTags}>
                <span>{quiz.questions.length} câu</span>
                <span>· {totalPoints} điểm</span>
                <span>· {quiz.timeLimit} phút</span>
              </div>
            </div>
          </Col>
        </Row>
      </Form>

      <Divider style={{ margin: "12px 0" }} />
      <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
        Questions
      </Text>

      {/* QUESTION LIST */}
      {quiz.questions.length === 0 ? (
        <Empty description="Chưa có câu hỏi. Bấm Add để thêm." />
      ) : (
        <Space direction="vertical" className={styles.block} size="large">
          {quiz.questions.map((q, idx) => (
            <QuestionCard
              key={q.id}
              q={q}
              idx={idx}
              total={quiz.questions.length}
              onChange={(next) => updateQuestion(q.id, next)}
              onDuplicate={() => duplicateQuestion(idx)}
              onDelete={() => deleteQuestion(q.id)}
              onMove={(dir) => moveQuestion(idx, dir)}
              styles={styles}
            />
          ))}
        </Space>
      )}
    </Modal>
  );
}
