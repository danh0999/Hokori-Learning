// components/quiz/QuizBuilderModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Space,
  Button,
  Card,
  Row,
  Col,
  Select,
  Checkbox,
  Radio,
  Typography,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

const { TextArea } = Input;
const { Text } = Typography;

const newOption = () => ({ id: crypto.randomUUID(), text: "", correct: false });
const newQuestion = (type = "single") => ({
  id: crypto.randomUUID(),
  type,
  text: "",
  points: 1,
  options:
    type === "truefalse"
      ? [
          { id: crypto.randomUUID(), text: "True", correct: true },
          { id: crypto.randomUUID(), text: "False", correct: false },
        ]
      : type === "fill"
      ? []
      : [newOption(), newOption()],
  answers: type === "fill" ? [""] : [],
  explanation: "",
});

export default function QuizBuilderModal({ open, onCancel, onSave, initial }) {
  const [meta] = Form.useForm();
  const [settings] = Form.useForm();
  const [questions, setQuestions] = useState([]);

  const totalPoints = useMemo(
    () => questions.reduce((s, q) => s + (q.points || 0), 0),
    [questions]
  );
  useEffect(() => {
    if (!open) return;
    if (initial) {
      // Prefill khi edit
      meta.setFieldsValue({
        title: initial.title || "",
        description: initial.description || "",
      });
      settings.setFieldsValue({
        timeLimit: initial.timeLimit ?? 30,
        passingScore: initial.passingScore ?? 60,
        shuffleQuestions: !!initial.shuffleQuestions,
        shuffleOptions: !!initial.shuffleOptions,
      });
      setQuestions(initial.questions || []);
    } else {
      // New
      meta.resetFields();
      settings.setFieldsValue({
        timeLimit: 30,
        passingScore: 60,
        shuffleOptions: true,
      });
      setQuestions([]);
    }
  }, [open, initial]);

  const addQ = (type) => setQuestions((a) => [...a, newQuestion(type)]);
  const setQ = (id, next) =>
    setQuestions((a) => a.map((q) => (q.id === id ? next : q)));
  const delQ = (id) => setQuestions((a) => a.filter((q) => q.id !== id));

  const save = async () => {
    const m = await meta.validateFields();
    const s = await settings.validateFields();
    const payload = {
      id: initial?.id || crypto.randomUUID(),
      title: m.title,
      description: m.description || "",
      timeLimit: s.timeLimit ?? 30,
      shuffleQuestions: !!s.shuffleQuestions,
      shuffleOptions: !!s.shuffleOptions,
      passingScore: s.passingScore ?? 60,
      questions,
      points: totalPoints,
    };
    onSave?.(payload);
  };

  return (
    <Modal
      open={open}
      title={initial ? "Edit Quiz" : "Create Quiz for this Lesson"}
      width={900}
      okText={initial ? "Save changes" : "Add to lesson"}
      onOk={save}
      onCancel={onCancel}
      destroyOnClose
    >
      <Row gutter={12}>
        <Col span={16}>
          <Card
            size="small"
            title="Questions"
            extra={
              <Space>
                <Button
                  type="primary"
                  size="small"
                  onClick={() => addQ("single")}
                  icon={<PlusOutlined />}
                >
                  Single
                </Button>
                <Button size="small" onClick={() => addQ("multiple")}>
                  Multiple
                </Button>
                <Button size="small" onClick={() => addQ("truefalse")}>
                  T/F
                </Button>
                <Button size="small" onClick={() => addQ("fill")}>
                  Fill
                </Button>
              </Space>
            }
          >
            {questions.length === 0 ? (
              <Text type="secondary">Chưa có câu hỏi.</Text>
            ) : (
              <Space direction="vertical" style={{ width: "100%" }}>
                {questions.map((q) => (
                  <Card
                    key={q.id}
                    size="small"
                    title={
                      <Space>
                        <Text strong>{q.text || "Untitled question"}</Text>
                        <Text type="secondary">
                          · {q.points} pt · {q.type}
                        </Text>
                      </Space>
                    }
                    extra={
                      <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => delQ(q.id)}
                      />
                    }
                  >
                    <Space direction="vertical" style={{ width: "100%" }}>
                      <Row gutter={8}>
                        <Col span={18}>
                          <TextArea
                            value={q.text}
                            placeholder="Nội dung câu hỏi…"
                            onChange={(e) =>
                              setQ(q.id, { ...q, text: e.target.value })
                            }
                          />
                        </Col>
                        <Col span={6}>
                          <Space direction="vertical" style={{ width: "100%" }}>
                            <Select
                              value={q.type}
                              onChange={(t) => setQ(q.id, newQuestion(t))}
                              options={[
                                { value: "single", label: "Single" },
                                { value: "multiple", label: "Multiple" },
                                { value: "truefalse", label: "True/False" },
                                { value: "fill", label: "Fill" },
                              ]}
                            />
                            <InputNumber
                              min={0}
                              value={q.points}
                              onChange={(v) =>
                                setQ(q.id, { ...q, points: v ?? 0 })
                              }
                              addonBefore="Points"
                              style={{ width: "100%" }}
                            />
                          </Space>
                        </Col>
                      </Row>

                      {/* Options / Answers */}
                      {q.type === "fill" ? (
                        <Space direction="vertical" style={{ width: "100%" }}>
                          {(q.answers || []).map((a, idx) => (
                            <Space key={idx}>
                              <Input
                                value={a}
                                placeholder="Đáp án mẫu"
                                onChange={(e) => {
                                  const next = [...q.answers];
                                  next[idx] = e.target.value;
                                  setQ(q.id, { ...q, answers: next });
                                }}
                              />
                              <Button
                                danger
                                onClick={() => {
                                  const next = [...q.answers];
                                  next.splice(idx, 1);
                                  setQ(q.id, { ...q, answers: next });
                                }}
                              >
                                Xoá
                              </Button>
                            </Space>
                          ))}
                          <Button
                            size="small"
                            onClick={() =>
                              setQ(q.id, {
                                ...q,
                                answers: [...(q.answers || []), ""],
                              })
                            }
                          >
                            + Thêm đáp án mẫu
                          </Button>
                        </Space>
                      ) : q.type === "truefalse" ? (
                        <Radio.Group
                          value={q.options.find((o) => o.correct)?.id}
                          onChange={(e) =>
                            setQ(q.id, {
                              ...q,
                              options: q.options.map((o) => ({
                                ...o,
                                correct: o.id === e.target.value,
                              })),
                            })
                          }
                          options={q.options.map((o) => ({
                            label: o.text,
                            value: o.id,
                          }))}
                        />
                      ) : (
                        <Space direction="vertical" style={{ width: "100%" }}>
                          {q.options.map((opt, i) => (
                            <Row key={opt.id} gutter={6} align="middle">
                              <Col flex="24px">
                                {q.type === "single" ? (
                                  <Radio
                                    checked={!!opt.correct}
                                    onChange={() =>
                                      setQ(q.id, {
                                        ...q,
                                        options: q.options.map((o) => ({
                                          ...o,
                                          correct: o.id === opt.id,
                                        })),
                                      })
                                    }
                                  />
                                ) : (
                                  <Checkbox
                                    checked={!!opt.correct}
                                    onChange={(e) => {
                                      const next = [...q.options];
                                      next[i] = {
                                        ...opt,
                                        correct: e.target.checked,
                                      };
                                      setQ(q.id, { ...q, options: next });
                                    }}
                                  />
                                )}
                              </Col>
                              <Col flex="auto">
                                <Input
                                  value={opt.text}
                                  placeholder={`Lựa chọn #${i + 1}`}
                                  onChange={(e) => {
                                    const next = [...q.options];
                                    next[i] = { ...opt, text: e.target.value };
                                    setQ(q.id, { ...q, options: next });
                                  }}
                                />
                              </Col>
                              <Col>
                                <Button
                                  size="small"
                                  danger
                                  onClick={() => {
                                    setQ(q.id, {
                                      ...q,
                                      options: q.options.filter(
                                        (o) => o.id !== opt.id
                                      ),
                                    });
                                  }}
                                >
                                  Xoá
                                </Button>
                              </Col>
                            </Row>
                          ))}
                          <Button
                            size="small"
                            onClick={() =>
                              setQ(q.id, {
                                ...q,
                                options: [...q.options, newOption()],
                              })
                            }
                          >
                            + Thêm lựa chọn
                          </Button>
                        </Space>
                      )}

                      <TextArea
                        placeholder="Giải thích đáp án (tuỳ chọn)"
                        value={q.explanation}
                        onChange={(e) =>
                          setQ(q.id, { ...q, explanation: e.target.value })
                        }
                      />
                    </Space>
                  </Card>
                ))}
              </Space>
            )}
          </Card>
        </Col>

        <Col span={8}>
          <Card size="small" title="Quiz info">
            <Form
              form={meta}
              layout="vertical"
              initialValues={{ title: "", description: "" }}
            >
              <Form.Item
                name="title"
                label="Title"
                rules={[{ required: true, message: "Nhập tiêu đề quiz" }]}
              >
                <Input placeholder="VD: JLPT N3 – Grammar Section" />
              </Form.Item>
              <Form.Item name="description" label="Description">
                <TextArea placeholder="Mô tả ngắn…" />
              </Form.Item>
            </Form>

            <Form
              form={settings}
              layout="vertical"
              initialValues={{
                timeLimit: 30,
                passingScore: 60,
                shuffleOptions: true,
              }}
            >
              <Form.Item label="Time limit (minutes)" name="timeLimit">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item label="Passing score (%)" name="passingScore">
                <InputNumber min={0} max={100} style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item
                name="shuffleQuestions"
                label="Shuffle questions"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <Form.Item
                name="shuffleOptions"
                label="Shuffle options"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Form>

            <Space style={{ marginTop: 8 }}>
              <Text type="secondary">{questions.length} câu</Text>
              <Text type="secondary">· {totalPoints} điểm</Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </Modal>
  );
}
