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
import { useDispatch } from "react-redux";

import QuestionCard from "../../Quiz/components/QuestionCard/QuestionCard.jsx";
import { newQuestion } from "../../Quiz/components/quizUtils/quizUtils.js";
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

/* ---------- build base quiz từ initial ---------- */
const buildBaseFromInitial = (initial) => {
  if (!initial) {
    return {
      id: null,
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
    id: initial.id || null,
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
  onSaved, // ({ timeLimitMinutes }) => void
}) {
  const dispatch = useDispatch();
  const [metaForm] = Form.useForm();

  const [quizId, setQuizId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [hasQuizCreated, setHasQuizCreated] = useState(false);
  const [creatingQuiz, setCreatingQuiz] = useState(false);
  const [savingAll, setSavingAll] = useState(false);

  const isNew = !initial?.id;

  // watch để hiện title ở header mà không cần set state
  const watchedTitle = Form.useWatch("title", metaForm);

  // Khi open/initial thay đổi → build lại state
  useEffect(() => {
    if (!open) return;

    const base = buildBaseFromInitial(initial || null);
    setQuizId(base.id);
    setHasQuizCreated(!!base.id);
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

    // Edit quiz: nếu chưa có questions trong initial thì fetch từ BE
    if (!lessonId || !base.id) return;
    if (base.questions && base.questions.length > 0) return;

    (async () => {
      try {
        const action = await dispatch(
          fetchQuizQuestionsThunk({ lessonId, quizId: base.id })
        );
        if (!fetchQuizQuestionsThunk.fulfilled.match(action)) return;

        const list = action.payload || [];

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
  }, [open, initial, lessonId, metaForm, dispatch]);

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

  const deleteQuestionLocal = useCallback((id) => {
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

  /* ===== STEP 1 – TẠO QUIZ META ===== */

  const handleCreateQuiz = async () => {
    try {
      const meta = await metaForm.validateFields();
      if (!lessonId) {
        message.error("Thiếu lessonId.");
        return;
      }

      setCreatingQuiz(true);

      const minutes = Number(meta.timeLimit ?? 0);
      const metaPayload = {
        title: meta.title,
        description: meta.description,
        timeLimit: minutes,
        passingScore: Number(meta.passingScore ?? 60),
      };

      const action = await dispatch(
        createLessonQuizThunk({ lessonId, meta: metaPayload })
      );

      if (!createLessonQuizThunk.fulfilled.match(action)) {
        message.error(action.payload || "Tạo quiz thất bại.");
        return;
      }

      const quiz = action.payload;
      setQuizId(quiz.id);
      setHasQuizCreated(true);
      message.success("Đã tạo quiz, giờ bạn có thể thêm câu hỏi.");
    } catch (err) {
      if (err?.errorFields) return; // lỗi validate form
      console.error(err);
      message.error("Tạo quiz thất bại.");
    } finally {
      setCreatingQuiz(false);
    }
  };

  /* ===== STEP 2 – SAVE META + QUESTIONS ===== */

  const handleSaveAll = async () => {
    try {
      const meta = await metaForm.validateFields();

      if (!questions || questions.length === 0) {
        message.error("Quiz cần ít nhất 1 câu hỏi.");
        return;
      }

      if (!lessonId) {
        message.error("Thiếu lessonId.");
        return;
      }

      let id = quizId;

      // Nếu chưa tạo quiz (new) thì tạo luôn trước khi save
      if (!id) {
        setCreatingQuiz(true);
        const minutes0 = Number(meta.timeLimit ?? 0);
        const metaPayload0 = {
          title: meta.title,
          description: meta.description,
          timeLimit: minutes0,
          passingScore: Number(meta.passingScore ?? 60),
        };

        const createAction = await dispatch(
          createLessonQuizThunk({ lessonId, meta: metaPayload0 })
        );
        setCreatingQuiz(false);

        if (!createLessonQuizThunk.fulfilled.match(createAction)) {
          message.error(createAction.payload || "Tạo quiz thất bại.");
          return;
        }
        const quiz = createAction.payload;
        id = quiz.id;
        setQuizId(id);
        setHasQuizCreated(true);
      }

      setSavingAll(true);

      const minutes = Number(meta.timeLimit ?? 0);
      const metaPayload = {
        title: meta.title,
        description: meta.description,
        timeLimit: minutes,
        passingScore: Number(meta.passingScore ?? 60),
      };

      // 1. Update meta quiz
      const updateAction = await dispatch(
        updateLessonQuizThunk({ lessonId, quizId: id, meta: metaPayload })
      );
      if (!updateLessonQuizThunk.fulfilled.match(updateAction)) {
        message.error(
          updateAction.payload || "Cập nhật thông tin quiz thất bại."
        );
        setSavingAll(false);
        return;
      }

      // 2. Lấy toàn bộ câu hỏi cũ rồi xoá hết
      const fetchOldAction = await dispatch(
        fetchQuizQuestionsThunk({ lessonId, quizId: id })
      );

      if (fetchQuizQuestionsThunk.fulfilled.match(fetchOldAction)) {
        const oldList = fetchOldAction.payload || [];
        for (const q of oldList) {
          await dispatch(
            deleteQuizQuestionThunk({ lessonId, questionId: q.id })
          );
        }
      }

      // 3. Tạo lại tất cả câu hỏi + options
      for (let index = 0; index < questions.length; index++) {
        const q = questions[index];

        const qPayload = {
          content: q.text || "",
          explanation: q.explanation || "",
          questionType: "SINGLE_CHOICE",
          orderIndex: index,
          points: q.points || 1,
        };

        const createQAction = await dispatch(
          createQuizQuestionThunk({ lessonId, quizId: id, question: qPayload })
        );

        if (!createQuizQuestionThunk.fulfilled.match(createQAction)) {
          message.error(
            createQAction.payload ||
              "Tạo câu hỏi thất bại, dừng tại câu " + (index + 1)
          );
          setSavingAll(false);
          return;
        }

        const newQuestion = createQAction.payload;
        const rawOptions = q.options || [];

        if (!rawOptions.length) continue;

        // đảm bảo có đúng 1 đáp án đúng
        let correctIdxs = [];
        rawOptions.forEach((op, i) => {
          if (op.isCorrect) correctIdxs.push(i);
        });
        if (correctIdxs.length === 0) {
          correctIdxs = [0];
        } else if (correctIdxs.length > 1) {
          correctIdxs = [correctIdxs[0]];
        }
        const correctSet = new Set(correctIdxs);

        const optsPayload = rawOptions.map((op, i) => ({
          content: op.text || "",
          isCorrect: correctSet.has(i),
          orderIndex: i,
        }));

        await dispatch(
          createQuestionOptionsThunk({
            lessonId,
            questionId: newQuestion.id,
            options: optsPayload,
          })
        );
      }

      setSavingAll(false);
      message.success("Đã lưu quiz.");

      // báo cho parent để reload quiz + set duration
      await onSaved?.({ timeLimitMinutes: minutes || 30 });
    } catch (err) {
      if (err?.errorFields) return; // lỗi validateForm
      console.error(err);
      setSavingAll(false);
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
          <Button
            icon={<PlusOutlined />}
            type="primary"
            onClick={addQuestion}
            disabled={!hasQuizCreated}
          >
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
            onClick={handleSaveAll}
            loading={savingAll}
            disabled={!hasQuizCreated && !isNew && !quizId}
          >
            Lưu
          </Button>
        </Space>
      </div>

      <Divider style={{ margin: "8px 0 12px" }} />

      {/* ===== Meta form ===== */}
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

        {/* Nút tạo quiz (chỉ hiển thị khi là quiz mới & chưa tạo) */}
        {isNew && !hasQuizCreated && (
          <Row>
            <Col span={24}>
              <Space style={{ marginTop: 8 }}>
                <Button onClick={onCancel}>Huỷ</Button>
                <Button
                  type="primary"
                  onClick={handleCreateQuiz}
                  loading={creatingQuiz}
                >
                  Tạo quiz
                </Button>
              </Space>
            </Col>
          </Row>
        )}
      </Form>

      <Divider style={{ margin: "12px 0" }} />

      {/* ===== Question list ===== */}
      <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
        Câu hỏi (Chỉ chọn một đáp án)
      </Text>

      {!hasQuizCreated ? (
        <Empty description="Hãy tạo quiz trước, sau đó bạn có thể thêm câu hỏi." />
      ) : questions.length === 0 ? (
        <Empty description="Chưa có câu hỏi. Bấm 'Thêm câu hỏi' để thêm." />
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
              onDelete={() => deleteQuestionLocal(q.id)}
              onMove={(dir) => moveQuestion(idx, dir)}
              styles={styles}
            />
          ))}
        </Space>
      )}
    </Modal>
  );
}
