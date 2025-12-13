import React, { useEffect, useState, useCallback } from "react";
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
  updateQuizQuestionThunk,
  updateQuestionOptionThunk,
  deleteQuestionOptionThunk,
} from "../../../../../redux/features/quizSlice.js";

import styles from "./styles.module.scss";

const { Text } = Typography;

function normalizeSingleChoiceOptions(options) {
  const cleaned = (options || []).map((o) => ({
    ...o,
    text: String(o.text || "").trim(),
    isCorrect: !!o.isCorrect,
  }));

  let next = cleaned.filter((o) => o.text.length > 0);

  if (next.length < 2) return next;

  const correctIdxs = next
    .map((o, idx) => (o.isCorrect ? idx : -1))
    .filter((x) => x !== -1);

  if (correctIdxs.length === 0) {
    next = next.map((o, idx) => ({ ...o, isCorrect: idx === 0 }));
  } else if (correctIdxs.length > 1) {
    const keep = correctIdxs[0];
    next = next.map((o, idx) => ({ ...o, isCorrect: idx === keep }));
  }

  return next;
}

function buildBaseFromInitial(initial) {
  const timeLimitMinutes =
    typeof initial?.timeLimit === "number"
      ? initial.timeLimit
      : typeof initial?.timeLimitSec === "number"
      ? Math.round(initial.timeLimitSec / 60)
      : 30;

  const passScore =
    typeof initial?.passingScore === "number"
      ? initial.passingScore
      : typeof initial?.passScorePercent === "number"
      ? initial.passScorePercent
      : 60;
  return {
    id: initial?.id ?? null,
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    timeLimit: timeLimitMinutes,
    passingScore: passScore,
  };
}

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
  const [hasQuizCreated, setHasQuizCreated] = useState(false);

  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const [creatingQuiz, setCreatingQuiz] = useState(false);
  const [savingAll, setSavingAll] = useState(false);

  const [openBulk, setOpenBulk] = useState(false);

  const watchedTitle = Form.useWatch("title", metaForm);

  useEffect(() => {
    if (!open) return;

    const base = buildBaseFromInitial(initial);
    setQuizId(base.id);
    setHasQuizCreated(!!base.id);

    metaForm.setFieldsValue(base);

    if (sectionId && base.id) {
      setLoadingQuestions(true);
      dispatch(fetchQuizQuestionsThunk({ sectionId, quizId: base.id }))
        .then((res) => {
          if (!fetchQuizQuestionsThunk.fulfilled.match(res)) return;

          const mapped = (res.payload || []).map((q) => {
            const opts = (q.options || []).map((o) => ({
              id: String(o.id), // giữ id server
              text: o.content || "",
              isCorrect: !!o.isCorrect,
            }));

            return {
              id: String(q.id),
              serverId: q.id,
              type: "SINGLE_CHOICE",
              text: q.content || "",
              explanation: q.explanation || "",
              points: 1,
              options: normalizeSingleChoiceOptions(opts),
              originalOptionIds: opts.map((o) => o.id), // ✅ thêm dòng này
            };
          });

          setQuestions(mapped);
        })
        .finally(() => setLoadingQuestions(false));
    } else {
      setQuestions([]);
    }
  }, [open, initial, sectionId, dispatch, metaForm]);

  // ===== Add/Update =====
  const addQuestion = useCallback(() => {
    const nq = newQuestion("single"); // bạn giữ util cũ, nhưng FE sẽ ép SINGLE_CHOICE
    setQuestions((prev) => [
      ...prev,
      {
        id: nq.id || crypto.randomUUID(),
        type: "SINGLE_CHOICE",
        text: nq.text || "",
        explanation: nq.explanation || "",
        points: 1,
        options: normalizeSingleChoiceOptions(
          (nq.options || []).map((o) => ({
            id: o.id || crypto.randomUUID(),
            text: o.text || "",
            isCorrect: !!o.correct || !!o.isCorrect,
          }))
        ),
      },
    ]);
  }, []);

  const updateQuestion = useCallback((id, next) => {
    const normalized = {
      ...next,
      type: "SINGLE_CHOICE",
      points: 1,
      options: normalizeSingleChoiceOptions(
        (next.options || []).map((o) => ({
          ...o,
          text: o.text,
          isCorrect: !!o.isCorrect || !!o.correct,
        }))
      ),
    };
    setQuestions((prev) => prev.map((q) => (q.id === id ? normalized : q)));
  }, []);

  const deleteQuestionLocal = useCallback(
    async (id) => {
      const q = questions.find((x) => x.id === id);

      if (q?.serverId && quizId && sectionId) {
        try {
          await dispatch(
            deleteQuizQuestionThunk({
              sectionId,
              quizId,
              questionId: q.serverId,
            })
          ).unwrap();
          setQuestions((prev) => prev.filter((x) => x.id !== id));
          message.success("Đã xoá câu hỏi");
        } catch (e) {
          console.error(e);
          message.error("Xoá câu hỏi thất bại");
        }
      } else {
        setQuestions((prev) => prev.filter((x) => x.id !== id));
      }
    },
    [questions, quizId, sectionId, dispatch]
  );

  // Duplicate + Move (để nút trên UI hoạt động)
  const duplicateQuestion = useCallback((id) => {
    setQuestions((prev) => {
      const idx = prev.findIndex((x) => x.id === id);
      if (idx < 0) return prev;
      const src = prev[idx];
      const copy = {
        ...src,
        serverId: undefined, // duplicate là local mới
        id: crypto.randomUUID(),
        text: src.text ? `${src.text} (copy)` : "",
        options: (src.options || []).map((o) => ({
          ...o,
          id: crypto.randomUUID(),
        })),
      };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  }, []);

  const moveQuestion = useCallback((id, dir) => {
    setQuestions((prev) => {
      const idx = prev.findIndex((x) => x.id === id);
      if (idx < 0) return prev;

      const to = dir === "up" ? idx - 1 : idx + 1;
      if (to < 0 || to >= prev.length) return prev;

      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.splice(to, 0, item);
      return next;
    });
  }, []);

  // ===== Create Quiz meta =====
  const handleCreateQuiz = async () => {
    if (!sectionId) return message.error("Thiếu sectionId");
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
      message.success("Đã tạo quiz");
    } finally {
      setCreatingQuiz(false);
    }
  };

  // ===== Bulk import -> local only =====
  const handleBulkDone = useCallback((importedQuestions) => {
    if (!Array.isArray(importedQuestions) || importedQuestions.length === 0) {
      message.warning("Không có câu hỏi để import.");
      return;
    }

    const mapped = importedQuestions.map((q) => {
      const opts = (q.options || []).map((o) => ({
        id: o.id || crypto.randomUUID(),
        text: o.text || "",
        isCorrect: !!o.isCorrect || !!o.correct, // parseQuizText trả correct
      }));

      return {
        id: q.id || crypto.randomUUID(),
        type: "SINGLE_CHOICE",
        text: String(q.text || "").trim(),
        explanation: String(q.explanation || "").trim(),
        points: 1,
        options: normalizeSingleChoiceOptions(opts), // ✅ auto tick đúng 1 đáp án
      };
    });

    setQuestions((prev) => [...prev, ...mapped]);
    setOpenBulk(false);
    message.success(`Đã import ${mapped.length} câu. Kiểm tra rồi bấm Lưu.`);
  }, []);

  const validateQuestions = (qs) => {
    for (let i = 0; i < qs.length; i++) {
      const q = qs[i];
      if (!String(q.text || "").trim()) {
        throw new Error(`Câu #${i + 1} đang bị trống nội dung.`);
      }

      const opts = normalizeSingleChoiceOptions(q.options || []);
      if (opts.length < 2) {
        throw new Error(`Câu #${i + 1} cần ít nhất 2 đáp án.`);
      }

      const correctCount = opts.filter((o) => o.isCorrect).length;
      if (correctCount !== 1) {
        throw new Error(`Câu #${i + 1} phải có đúng 1 đáp án đúng.`);
      }
    }
  };

  // ===== Save all (create quiz if needed) =====
  const handleSaveAll = async () => {
    if (!sectionId) return message.error("Thiếu sectionId");

    try {
      const meta = await metaForm.validateFields();
      let ensuredQuizId = quizId;

      setSavingAll(true);

      if (!ensuredQuizId) {
        const created = await dispatch(
          createLessonQuizThunk({
            sectionId,
            meta: {
              title: meta.title,
              description: meta.description,
              timeLimit: meta.timeLimit,
              passingScore: meta.passingScore,
            },
          })
        ).unwrap();

        ensuredQuizId = created.id;
        setQuizId(created.id);
        setHasQuizCreated(true);
      } else {
        await dispatch(
          updateLessonQuizThunk({
            sectionId,
            quizId: ensuredQuizId,
            meta: {
              title: meta.title,
              description: meta.description,
              timeLimit: meta.timeLimit,
              passingScore: meta.passingScore,
            },
          })
        ).unwrap();
      }

      validateQuestions(questions);

      const unsaved = questions.filter((q) => !q.serverId);

      for (let k = 0; k < unsaved.length; k++) {
        const q = unsaved[k];

        const createdQ = await dispatch(
          createQuizQuestionThunk({
            sectionId,
            quizId: ensuredQuizId,
            question: {
              content: String(q.text || "").trim(),
              explanation: String(q.explanation || "").trim(),
              questionType: "SINGLE_CHOICE",
              orderIndex: questions.findIndex((x) => x.id === q.id),
            },
          })
        ).unwrap();

        const fixedOptions = normalizeSingleChoiceOptions(q.options || []).map(
          (o, orderIndex) => ({
            content: String(o.text || "").trim(),
            isCorrect: !!o.isCorrect,
            orderIndex,
          })
        );

        await dispatch(
          createQuestionOptionsThunk({
            sectionId,
            questionId: createdQ.id,
            options: fixedOptions,
          })
        ).unwrap();

        setQuestions((prev) =>
          prev.map((x) =>
            x.id === q.id
              ? { ...x, serverId: createdQ.id, id: String(createdQ.id) }
              : x
          )
        );
      }

      const saved = questions.filter((q) => q.serverId);

      for (let k = 0; k < saved.length; k++) {
        const q = saved[k];
        const questionId = q.serverId;

        // 1) Update question (content/explanation/orderIndex)
        await dispatch(
          updateQuizQuestionThunk({
            sectionId,
            questionId,
            question: {
              content: String(q.text || "").trim(),
              explanation: String(q.explanation || "").trim(),
              questionType: "SINGLE_CHOICE",
              orderIndex: questions.findIndex((x) => x.id === q.id),
            },
          })
        ).unwrap();

        // 2) Sync options
        const normalizedOpts = normalizeSingleChoiceOptions(q.options || []);

        // tách option “đã có trên server” vs “mới tạo local”
        const existingOpts = normalizedOpts.filter((o) => {
          const n = Number(o.id);
          return Number.isFinite(n) && String(n) === String(o.id);
        });

        const existingIdSet = new Set(existingOpts.map((o) => String(o.id)));
        const newOpts = normalizedOpts.filter(
          (o) => !existingIdSet.has(String(o.id))
        );

        // 2a) Update option existing (PUT)
        for (let i = 0; i < existingOpts.length; i++) {
          const o = existingOpts[i];
          await dispatch(
            updateQuestionOptionThunk({
              sectionId,
              optionId: Number(o.id),
              option: {
                content: String(o.text || "").trim(),
                isCorrect: !!o.isCorrect,
                orderIndex: i,
              },
            })
          ).unwrap();
        }

        // 2b) Create option mới (POST bulk)
        if (newOpts.length > 0) {
          await dispatch(
            createQuestionOptionsThunk({
              sectionId,
              questionId,
              options: newOpts.map((o, i) => ({
                content: String(o.text || "").trim(),
                isCorrect: !!o.isCorrect,
                orderIndex: existingOpts.length + i,
              })),
            })
          ).unwrap();
        }

        // 2c) Delete option bị remove (DELETE)
        const originalIds = q.originalOptionIds || [];
        const currentExistingIds = existingOpts.map((o) => o.id);
        const removedIds = originalIds.filter(
          (id) => !currentExistingIds.includes(id)
        );

        for (const removedId of removedIds) {
          await dispatch(
            deleteQuestionOptionThunk({
              sectionId,
              optionId: Number(removedId),
            })
          ).unwrap();
        }
      }

      const reloaded = await dispatch(
        fetchQuizQuestionsThunk({ sectionId, quizId: ensuredQuizId })
      ).unwrap();

      const mapped = (reloaded || []).map((q) => ({
        id: String(q.id),
        serverId: q.id,
        type: "SINGLE_CHOICE",
        text: q.content || "",
        explanation: q.explanation || "",
        points: 1,
        options: normalizeSingleChoiceOptions(
          (q.options || []).map((o) => ({
            id: String(o.id),
            text: o.content || "",
            isCorrect: !!o.isCorrect,
          }))
        ),
        originalOptionIds: (q.options || []).map((o) => String(o.id)),
      }));

      setQuestions(mapped);

      message.success("Đã lưu quiz");
      onSaved?.({ timeLimitMinutes: meta.timeLimit });
      onCancel?.();
    } catch (e) {
      console.error(e);
      message.error(e?.message || "Lưu quiz thất bại");
    } finally {
      setSavingAll(false);
    }
  };

  return (
    <Modal
      open={open}
      width={980}
      footer={null}
      destroyOnClose
      onCancel={onCancel}
      title={`Quiz – ${watchedTitle || "Untitled"}`}
    >
      <div className={styles.topBar}>
        <Space>
          <Button icon={<PlusOutlined />} onClick={addQuestion}>
            Thêm câu hỏi
          </Button>
          <Button icon={<ImportOutlined />} onClick={() => setOpenBulk(true)}>
            Bulk import
          </Button>
        </Space>

        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSaveAll}
          loading={savingAll}
        >
          Lưu
        </Button>
      </div>

      <Divider />

      <Form form={metaForm} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="title"
              label="Tiêu đề quiz"
              rules={[{ required: true, message: "Nhập tiêu đề quiz" }]}
            >
              <Input />
            </Form.Item>
          </Col>

          <Col span={6}>
            <Form.Item
              name="passingScore"
              label="Điểm đạt (%)"
              rules={[
                { required: true, message: "Nhập điểm đạt" },
                { type: "number", min: 0, max: 100, message: "0-100" },
              ]}
            >
              <InputNumber min={0} max={100} style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Col span={6}>
            <Form.Item name="timeLimit" label="Thời gian (phút)">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        {!hasQuizCreated && (
          <Space>
            <Button
              type="primary"
              onClick={handleCreateQuiz}
              loading={creatingQuiz}
              disabled={!sectionId}
            >
              Tạo quiz
            </Button>
            <Text type="secondary">
              (Bạn có thể thêm/bulk import câu hỏi trước, rồi bấm Lưu.)
            </Text>
          </Space>
        )}
      </Form>

      <Divider />

      {loadingQuestions ? (
        <Empty description="Đang tải câu hỏi..." />
      ) : questions.length === 0 ? (
        <Empty description="Chưa có câu hỏi (thêm thủ công hoặc bulk import)" />
      ) : (
        questions.map((q, idx) => (
          <QuestionCard
            key={q.id}
            q={q}
            idx={idx} // ✅ FIX QNaN
            total={questions.length} // ✅ FIX QNaN
            onChange={(next) => updateQuestion(q.id, next)}
            onDelete={() => deleteQuestionLocal(q.id)}
            onDuplicate={() => duplicateQuestion(q.id)}
            onMove={(dir) => moveQuestion(q.id, dir)}
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
