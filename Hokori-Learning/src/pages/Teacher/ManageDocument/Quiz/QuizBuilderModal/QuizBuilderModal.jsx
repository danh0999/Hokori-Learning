// QuizBuilderModal.jsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
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

/* ---------- build base quiz từ initial ---------- */
const buildBaseFromInitial = (initial) => {
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

// BE -> FE question type: luôn single
const mapQuestionTypeFromBE = () => "single";

export default function QuizBuilderModal({
  open,
  lessonId,
  initial,
  onCancel,
  onSave,
  saving = false,
}) {
  const [metaForm] = Form.useForm();
  const [quizId, setQuizId] = useState(null);
  const [questions, setQuestions] = useState([]);

  const isNew = !initial?.id;

  // watch để hiện title ở header mà không cần set state
  const watchedTitle = Form.useWatch("title", metaForm);

  // Khi open/initial thay đổi → build lại state
  useEffect(() => {
    if (!open) return;

    const base = buildBaseFromInitial(initial || null);
    setQuizId(base.id);
    setQuestions(base.questions || []);

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

    // nếu initial đã có questions sẵn thì không fetch nữa
    if (initial?.questions && initial.questions.length > 0) return;
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
          type: mapQuestionTypeFromBE(q.questionType), // luôn 'single'
          orderIndex: typeof q.orderIndex === "number" ? q.orderIndex : idx,
          points: typeof q.points === "number" ? q.points : 1,
          options: (q.options || []).map((op, i) => ({
            id: op.id,
            text: op.content || "",
            isCorrect: !!op.isCorrect,
            orderIndex: typeof op.orderIndex === "number" ? op.orderIndex : i,
          })),
        }));

        setQuestions(mapped);
      } catch (err) {
        console.error("Failed to load quiz questions", err);
      }
    })();
  }, [open, initial, lessonId, metaForm]);

  const totalPoints = useMemo(
    () => (questions || []).reduce((s, q) => s + (q.points || 0), 0),
    [questions]
  );

  /* ===== thao tác với câu hỏi (single choice) ===== */

  const addQuestion = useCallback(() => {
    setQuestions((prev) => [...prev, newQuestion("single")]);
  }, []);

  const updateQuestion = useCallback((id, next) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...next, type: "single" } : q))
    );
  }, []);

  const duplicateQuestion = useCallback((idx) => {
    setQuestions((prev) => {
      const clone = structuredClone(prev[idx]);
      clone.id = crypto.randomUUID();
      clone.type = "single";
      return [...prev.slice(0, idx + 1), clone, ...prev.slice(idx + 1)];
    });
  }, []);

  const deleteQuestion = useCallback((id) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }, []);

  const moveQuestion = useCallback((idx, dir) => {
    setQuestions((prev) => {
      const arr = [...prev];
      const j = dir === "up" ? idx - 1 : idx + 1;
      if (j < 0 || j >= arr.length) return prev;
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      return arr;
    });
  }, []);

  /* ===== SAVE ===== */
  const handleClickSave = async () => {
    try {
      const meta = await metaForm.validateFields();

      if (!questions || questions.length === 0) {
        message.error("Quiz cần ít nhất 1 câu hỏi.");
        return;
      }
      const minutes = Number(meta.timeLimit ?? 0);
      const payload = {
        id: quizId,
        title: meta.title,
        description: meta.description,
        timeLimitSec: minutes > 0 ? minutes * 60 : 0,
        passScorePercent: Number(meta.passingScore ?? 60),
        shuffleQuestions: !!meta.shuffleQuestions,
        shuffleOptions: meta.shuffleOptions !== false,
        showExplanation:
          typeof meta.showExplanation === "boolean"
            ? meta.showExplanation
            : true,
        isRequired: !!meta.isRequired,
        tags: initial?.tags || [],
        // đảm bảo mọi câu hỏi đều single
        questions: (questions || []).map((q) => ({
          ...q,
          type: "single",
        })),
      };

      await onSave?.(payload);
    } catch (err) {
      if (err?.errorFields) return; // lỗi validate của Form
      console.error(err);
      message.error("Lưu quiz thất bại.");
    }
  };

  const quizTitleForHeader =
    (watchedTitle || initial?.title || "").trim() || "Quiz";

  return (
    <Modal
      open={open}
      title={`${isNew ? "New" : "Edit"} Quiz – ${quizTitleForHeader}`}
      onCancel={onCancel}
      width={980}
      destroyOnClose
      footer={null}
    >
      {/* ===== Top bar ===== */}
      <div className={styles.topBar}>
        <Space wrap>
          <Button icon={<PlusOutlined />} type="primary" onClick={addQuestion}>
            Thêm câu hỏi
          </Button>
          <Text type="secondary">
            Quiz này chỉ hỗ trợ dạng <b>Single choice</b>. Mỗi câu phải có 1 đáp
            án đúng.
          </Text>
        </Space>

        <Space>
          <span className={styles.topBarStats}>
            {questions.length} câu · {totalPoints} điểm
          </span>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleClickSave}
            loading={saving}
          >
            Lưu
          </Button>
        </Space>
      </div>

      <Divider style={{ margin: "8px 0 12px" }} />

      {/* ===== Meta form (không còn onValuesChange set state nữa) ===== */}
      <Form form={metaForm} layout="vertical" className={styles.metaForm}>
        <Row gutter={16}>
          <Col span={16}>
            <Form.Item
              name="title"
              label="Tiêu đề quiz"
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
              label="Thời gian (phút)"
              tooltip="Để 0 hoặc bỏ trống = không giới hạn"
            >
              <InputNumber min={0} style={{ width: "100%" }} placeholder="30" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={16}>
            <Form.Item name="description" label="Mô tả">
              <Input.TextArea rows={2} placeholder="Mô tả ngắn về quiz này" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="passingScore"
              label="Điểm tối thiểu để qua (%)"
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
              label="Xáo trộn câu hỏi"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="shuffleOptions"
              label="Xáo trộn đáp án"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="showExplanation"
              label="Hiển thị giải thích"
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
        Câu hỏi (Chỉ chọn một đáp án)
      </Text>

      {questions.length === 0 ? (
        <Empty description="Chưa có câu hỏi. Bấm 'Add question' để thêm." />
      ) : (
        <Space
          direction="vertical"
          className={styles.block}
          size="large"
          style={{ width: "100%" }}
        >
          {questions.map((q, idx) => (
            <QuestionCard
              key={q.id}
              q={{ ...q, type: "single" }}
              idx={idx}
              total={questions.length}
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
