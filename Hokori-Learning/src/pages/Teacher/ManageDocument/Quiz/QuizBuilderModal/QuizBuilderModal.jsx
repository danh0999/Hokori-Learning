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
} from "antd";
import { PlusOutlined, SaveOutlined } from "@ant-design/icons";
import QuestionCard from "../../Quiz/components/QuestionCard/QuestionCard.jsx";
import { newQuestion } from "../../Quiz/components/quizUtils/quizUtils.js";
import api from "../../../../../configs/axios"; // 👈 nhớ path này đúng với dự án
import styles from "./styles.module.scss";

const { Text } = Typography;

const buildQuizFromInitial = (initial) => {
  if (!initial) {
    return {
      id: crypto.randomUUID(),
      title: "",
      description: "",
      timeLimit: 30,
      passingScore: 60,
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
      : initial.timeLimitSec
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
  return "single";
};

export default function QuizBuilderModal({
  open,
  lessonId, // 👈 thêm vào props
  initial,
  onCancel,
  onSave,
  saving,
}) {
  const [quiz, setQuiz] = useState(() => buildQuizFromInitial(initial));
  const [metaForm] = Form.useForm();
  const isNew = !initial?.id;

  useEffect(() => {
    if (!open) return;

    // 1. Base meta
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

    // 2. Nếu initial đã có sẵn questions (từ CreateQuizPage / library) thì khỏi fetch
    if (initial?.questions && initial.questions.length > 0) return;

    // 3. Nếu đang edit quiz đã lưu trên BE => fetch questions
    if (!lessonId || !initial?.id) return;

    (async () => {
      try {
        const res = await api.get(
          `teacher/lessons/${lessonId}/quizzes/${initial.id}/questions`
        );
        const list = res.data || [];

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
      footer={null}
    >
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
            onClick={handleSave}
            loading={saving}
          >
            Save changes
          </Button>
        </Space>
      </div>

      <Divider style={{ margin: "8px 0 12px" }} />

      {/* Meta form & question list giữ nguyên như bạn đang có */}
      {/* ... (phần còn lại y chang file bạn gửi, không đổi) */}
      {/* (Để ngắn gọn mình bỏ bớt, nhưng bạn có thể giữ nguyên từ chỗ Form trở xuống) */}
      {/* ------------- FORM + QUESTIONS (giống file của bạn) ------------- */}
      <Form
        form={metaForm}
        layout="vertical"
        className={styles.metaForm}
        onValuesChange={(_, all) => setQuiz((q) => ({ ...q, ...all }))}
      >
        {/* ... phần meta form của bạn ... */}
      </Form>

      <Divider style={{ margin: "12px 0" }} />
      <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
        Questions
      </Text>

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
