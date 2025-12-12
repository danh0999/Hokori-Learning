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
import { PlusOutlined, SaveOutlined, ImportOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";

import QuestionCard from "../../Quiz/components/QuestionCard/QuestionCard.jsx";
import { newQuestion } from "../../Quiz/components/quizUtils/quizUtils.js";
import BulkImportModal from "../BulkImportModal/BulkImportModal.jsx";

import {
  createLessonQuizThunk,
  updateLessonQuizThunk,
  fetchQuizQuestionsThunk,
  deleteQuizQuestionThunk,
  createQuizQuestionThunk,
  createQuestionOptionsThunk,
} from "../../../../../redux/features/quizSlice.js";

import styles from "./styles.module.scss";

const { Text } = Typography;

/* ================= UTIL ================= */

const buildBaseFromInitial = (initial) => ({
  id: initial?.id ?? null,
  title: initial?.title ?? "",
  description: initial?.description ?? "",
  timeLimit:
    typeof initial?.timeLimitSec === "number"
      ? Math.round(initial.timeLimitSec / 60)
      : 30,
  passingScore: initial?.passScorePercent ?? 60,
  shuffleQuestions: !!initial?.shuffleQuestions,
  shuffleOptions: initial?.shuffleOptions !== false,
  showExplanation:
    typeof initial?.showExplanation === "boolean"
      ? initial.showExplanation
      : true,
  isRequired: !!initial?.isRequired,
  questions: [],
});

/* ================= COMPONENT ================= */

export default function QuizBuilderModal({
  open,
  sectionId,
  initial,
  onCancel,
  onSaved,
}) {
  const dispatch = useDispatch();
  const [metaForm] = Form.useForm();

  const [quizId, setQuizId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [hasQuizCreated, setHasQuizCreated] = useState(false);

  const [creatingQuiz, setCreatingQuiz] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [openBulk, setOpenBulk] = useState(false);

  const watchedTitle = Form.useWatch("title", metaForm);

  /* ===== INIT ===== */
  useEffect(() => {
    if (!open) return;

    const base = buildBaseFromInitial(initial);
    setQuizId(base.id);
    setHasQuizCreated(!!base.id);
    setQuestions([]);

    metaForm.setFieldsValue(base);

    if (sectionId && base.id) {
      dispatch(fetchQuizQuestionsThunk({ sectionId, quizId: base.id })).then(
        (res) => {
          if (!fetchQuizQuestionsThunk.fulfilled.match(res)) return;

          const mapped = (res.payload || []).map((q) => ({
            id: q.id,
            text: q.content,
            explanation: q.explanation,
            points: q.points ?? 1,
            options: (q.options || []).map((o) => ({
              id: o.id,
              text: o.content,
              isCorrect: o.isCorrect,
            })),
          }));

          setQuestions(mapped);
        }
      );
    }
  }, [open, initial, sectionId, dispatch, metaForm]);

  /* ===== QUESTION HANDLERS (MEMOIZED → KHÔNG LAG) ===== */

  const addQuestion = useCallback(() => {
    setQuestions((prev) => [...prev, newQuestion("single")]);
  }, []);

  const updateQuestion = useCallback((id, next) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? next : q)));
  }, []);

  const deleteQuestionLocal = useCallback((id) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }, []);

  /* ===== CREATE QUIZ ===== */

  const handleCreateQuiz = async () => {
    try {
      const meta = await metaForm.validateFields();
      setCreatingQuiz(true);

      const action = await dispatch(
        createLessonQuizThunk({
          sectionId,
          meta: {
            title: meta.title,
            description: meta.description,
            timeLimit: meta.timeLimit,
            passingScore: meta.passingScore,
          },
        })
      );

      if (!createLessonQuizThunk.fulfilled.match(action)) {
        message.error("Tạo quiz thất bại");
        return;
      }

      setQuizId(action.payload.id);
      setHasQuizCreated(true);
      message.success("Đã tạo quiz, giờ có thể thêm câu hỏi");
    } finally {
      setCreatingQuiz(false);
    }
  };

  /* ===== BULK IMPORT (SAU KHI CÓ QUIZ) ===== */

  const handleBulkDone = async (importedQuestions) => {
    if (!quizId) return;

    try {
      for (let i = 0; i < importedQuestions.length; i++) {
        const q = importedQuestions[i];

        const qAction = await dispatch(
          createQuizQuestionThunk({
            sectionId,
            quizId,
            question: {
              content: q.content,
              explanation: q.explanation || "",
              questionType: "SINGLE_CHOICE",
              orderIndex: i,
              points: 1,
            },
          })
        );

        const newQ = qAction.payload;

        await dispatch(
          createQuestionOptionsThunk({
            sectionId,
            questionId: newQ.id,
            options: q.options.map((o, idx) => ({
              content: o.content,
              isCorrect: o.isCorrect,
              orderIndex: idx,
            })),
          })
        );
      }

      message.success("Bulk import thành công");
      setOpenBulk(false);

      const reload = await dispatch(
        fetchQuizQuestionsThunk({ sectionId, quizId })
      );
      setQuestions(
        reload.payload.map((q) => ({
          id: q.id,
          text: q.content,
          explanation: q.explanation,
          points: q.points ?? 1,
          options: q.options.map((o) => ({
            id: o.id,
            text: o.content,
            isCorrect: o.isCorrect,
          })),
        }))
      );
    } catch (e) {
      console.error(e);
      message.error("Bulk import thất bại");
    }
  };

  /* ===== SAVE ===== */

  const handleSaveAll = async () => {
    try {
      const meta = await metaForm.validateFields();
      setSavingAll(true);

      await dispatch(
        updateLessonQuizThunk({
          sectionId,
          quizId,
          meta: {
            title: meta.title,
            description: meta.description,
            timeLimit: meta.timeLimit,
            passingScore: meta.passingScore,
          },
        })
      );

      message.success("Đã lưu quiz");
      onSaved?.({ timeLimitMinutes: meta.timeLimit });
      onCancel?.();
    } finally {
      setSavingAll(false);
    }
  };

  /* ===== RENDER ===== */

  return (
    <Modal
      open={open}
      width={980}
      footer={null}
      destroyOnClose
      onCancel={onCancel}
      title={`Quiz – ${watchedTitle || "Untitled"}`}
    >
      {/* TOP BAR */}
      <div className={styles.topBar}>
        <Space>
          <Button
            icon={<PlusOutlined />}
            onClick={addQuestion}
            disabled={!hasQuizCreated}
          >
            Thêm câu hỏi
          </Button>

          <Button
            icon={<ImportOutlined />}
            onClick={() => setOpenBulk(true)}
            disabled={!quizId}
          >
            Bulk import
          </Button>
        </Space>

        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSaveAll}
          loading={savingAll}
          disabled={!hasQuizCreated}
        >
          Lưu
        </Button>
      </div>

      <Divider />

      {/* META FORM */}
      <Form form={metaForm} layout="vertical">
        <Row gutter={16}>
          <Col span={16}>
            <Form.Item
              name="title"
              label="Tiêu đề quiz"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="timeLimit" label="Thời gian (phút)">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        {!hasQuizCreated && (
          <Button
            type="primary"
            onClick={handleCreateQuiz}
            loading={creatingQuiz}
          >
            Tạo quiz
          </Button>
        )}
      </Form>

      <Divider />

      {/* QUESTIONS */}
      {!hasQuizCreated ? (
        <Empty description="Tạo quiz trước để thêm câu hỏi" />
      ) : questions.length === 0 ? (
        <Empty description="Chưa có câu hỏi" />
      ) : (
        questions.map((q) => (
          <QuestionCard
            key={q.id}
            q={q}
            onChange={(next) => updateQuestion(q.id, next)}
            onDelete={() => deleteQuestionLocal(q.id)}
          />
        ))
      )}

      <BulkImportModal
        open={openBulk}
        onCancel={() => setOpenBulk(false)}
        onDone={handleBulkDone}
      />
    </Modal>
  );
}
