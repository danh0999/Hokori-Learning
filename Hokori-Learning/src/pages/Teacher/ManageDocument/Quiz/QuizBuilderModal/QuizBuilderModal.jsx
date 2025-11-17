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
import api from "../../../../../configs/axios";
import styles from "./styles.module.scss";

const { Text } = Typography;

/**
 * Chuyển initial (từ BE hoặc từ library) -> state quiz nội bộ cho builder
 */
const buildQuizFromInitial = (initial) => {
  if (!initial) {
    return {
      id: crypto.randomUUID(),
      title: "",
      description: "",
      timeLimit: 30, // phút
      passingScore: 60, // %
      shuffleQuestions: false,
      shuffleOptions: true,
      showExplanation: true,
      isRequired: false,
      tags: [],
      questions: [],
    };
  }

  const timeLimitMinutes =
    typeof initial.timeLimit === "number"
      ? initial.timeLimit
      : typeof initial.timeLimitSec === "number"
      ? Math.round(initial.timeLimitSec / 60)
      : 30;

  const passingScore =
    typeof initial.passingScore === "number"
      ? initial.passingScore
      : typeof initial.passScorePercent === "number"
      ? initial.passScorePercent
      : 60;

  return {
    id: initial.id || crypto.randomUUID(),
    title: initial.title || "",
    description: initial.description || "",
    timeLimit: timeLimitMinutes,
    passingScore,
    shuffleQuestions: !!initial.shuffleQuestions,
    shuffleOptions: initial.shuffleOptions !== false,
    showExplanation:
      typeof initial.showExplanation === "boolean"
        ? initial.showExplanation
        : true,
    isRequired: !!initial.isRequired,
    tags: initial.tags || [],
    questions: initial.questions ? structuredClone(initial.questions) : [],
  };
};

const mapQuestionTypeFromBE = (questionType) => {
  if (questionType === "MULTIPLE_CHOICE") return "multiple";
  if (questionType === "TRUE_FALSE") return "truefalse";
  if (questionType === "FILL_IN") return "fill";
  return "single";
};

/**
 * Props:
 * - open: boolean
 * - lessonId?: number (cần nếu muốn tự fetch câu hỏi từ BE khi edit)
 * - initial?: quiz meta + questions (từ library hoặc từ BE)
 * - onCancel: () => void
 * - onSave: (quizDraft) => Promise | void
 *      quizDraft có dạng:
 *      {
 *        id?,
 *        title,
 *        description,
 *        timeLimit,      // phút
 *        passingScore,   // %
 *        shuffleQuestions,
 *        shuffleOptions,
 *        showExplanation,
 *        isRequired,
 *        tags,
 *        questions: [...]
 *      }
 * - saving?: boolean (loading cho nút Save)
 */
export default function QuizBuilderModal({
  open,
  lessonId,
  initial,
  onCancel,
  onSave,
  saving = false,
}) {
  const [quiz, setQuiz] = useState(() => buildQuizFromInitial(initial));
  const [metaForm] = Form.useForm();
  const isNew = !initial?.id;

  // Khi open/initial/lessonId thay đổi → setup lại state + meta form
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

    // Nếu đã có questions sẵn (vd: import từ library) → không fetch nữa
    if (initial?.questions && initial.questions.length > 0) return;

    // Nếu đang edit quiz đã có trên BE → fetch danh sách câu hỏi
    if (!lessonId || !initial?.id) return;

    (async () => {
      try {
        const res = await api.get(
          `teacher/lessons/${lessonId}/quizzes/${initial.id}/questions`
        );
        const list = res.data?.data ?? res.data ?? [];

        const mapped = list.map((q, idx) => ({
          id: q.id,
          text: q.content || "",
          explanation: q.explanation || "",
          type: mapQuestionTypeFromBE(q.questionType),
          orderIndex: typeof q.orderIndex === "number" ? q.orderIndex : idx,
          points: typeof q.points === "number" ? q.points : 1,
          options: (q.options || []).map((op, i) => ({
            id: op.id,
            text: op.content || "",
            isCorrect: !!op.isCorrect,
            orderIndex: typeof op.orderIndex === "number" ? op.orderIndex : i,
          })),
        }));

        setQuiz((prev) => ({ ...prev, questions: mapped }));
      } catch (err) {
        console.error("Failed to load quiz questions", err);
      }
    })();
  }, [open, initial, lessonId, metaForm]);

  const totalPoints = useMemo(
    () => (quiz.questions || []).reduce((s, q) => s + (q.points || 0), 0),
    [quiz.questions]
  );

  // ====== thao tác với câu hỏi ======
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

  // ====== SAVE ======
  const handleClickSave = async () => {
    try {
      const meta = await metaForm.validateFields();

      // Validate tối thiểu
      if (!quiz.questions || quiz.questions.length === 0) {
        message.error("Quiz cần ít nhất 1 câu hỏi.");
        return;
      }

      const payload = {
        ...quiz,
        ...meta,
        // đảm bảo timeLimit & passingScore kiểu số
        timeLimit: Number(meta.timeLimit ?? quiz.timeLimit ?? 30),
        passingScore: Number(meta.passingScore ?? quiz.passingScore ?? 60),
      };

      // Trả quizDraft cho cha xử lý (POST/PUT BE)
      if (onSave) {
        await onSave(payload);
      }
    } catch (err) {
      // metaForm.validateFields lỗi
      if (err?.errorFields) return;
      console.error(err);
      message.error("Lưu quiz thất bại.");
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
      footer={null}
    >
      {/* ===== Top bar: toolbar + Save button ===== */}
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
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleClickSave}
            loading={saving}
          >
            Save changes
          </Button>
        </Space>
      </div>

      <Divider style={{ margin: "8px 0 12px" }} />

      {/* ===== Meta form (title, desc, time, passingScore, options) ===== */}
      <Form
        form={metaForm}
        layout="vertical"
        className={styles.metaForm}
        onValuesChange={(_, all) => setQuiz((q) => ({ ...q, ...all }))}
      >
        <Row gutter={16}>
          <Col span={16}>
            <Form.Item
              name="title"
              label="Quiz title"
              rules={[
                { required: true, message: "Vui lòng nhập tiêu đề quiz." },
              ]}
            >
              <Input placeholder="Ví dụ: Quiz sau bài 1" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="timeLimit"
              label="Time limit (minutes)"
              tooltip="Để 0 hoặc bỏ trống = không giới hạn"
            >
              <InputNumber min={0} style={{ width: "100%" }} placeholder="30" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={16}>
            <Form.Item name="description" label="Description">
              <Input.TextArea rows={2} placeholder="Mô tả ngắn về quiz này" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="passingScore"
              label="Passing score (%)"
              tooltip="Điểm tối thiểu để qua (0–100)"
              rules={[
                {
                  type: "number",
                  min: 0,
                  max: 100,
                  message: "0–100",
                },
              ]}
            >
              <InputNumber
                min={0}
                max={100}
                style={{ width: "100%" }}
                placeholder="60"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              name="shuffleQuestions"
              label="Shuffle questions"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="shuffleOptions"
              label="Shuffle options"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="showExplanation"
              label="Show explanation"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="isRequired"
              label="Required"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>

      <Divider style={{ margin: "12px 0" }} />

      {/* ===== Question list ===== */}
      <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
        Questions
      </Text>

      {quiz.questions.length === 0 ? (
        <Empty description="Chưa có câu hỏi. Bấm Add để thêm." />
      ) : (
        <Space
          direction="vertical"
          className={styles.block}
          size="large"
          style={{ width: "100%" }}
        >
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
