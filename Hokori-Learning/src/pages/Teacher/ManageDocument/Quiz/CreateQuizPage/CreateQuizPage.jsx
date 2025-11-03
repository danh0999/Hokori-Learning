import React, { useMemo, useState } from "react";
import {
  Button,
  Card,
  Checkbox,
  Col,
  Collapse,
  Divider,
  Dropdown,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Switch,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
  List,
} from "antd";
import {
  PlusOutlined,
  MoreOutlined,
  ImportOutlined,
  SaveOutlined,
  SendOutlined,
  CopyOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EyeOutlined,
  RollbackOutlined,
} from "@ant-design/icons";
import styles from "./styles.module.scss";

const { Text, Title } = Typography;

/** ----- Helpers ----- */
const newOption = () => ({ id: crypto.randomUUID(), text: "", correct: false });
const newQuestion = (type = "single") => ({
  id: crypto.randomUUID(),
  type, // 'single' | 'multiple' | 'truefalse' | 'fill'
  text: "",
  points: 1,
  options:
    type === "truefalse"
      ? [
          { id: crypto.randomUUID(), text: "True", correct: true },
          { id: crypto.randomUUID(), text: "False", correct: false },
        ]
      : type === "fill"
      ? [] // fill: dùng đáp án mẫu
      : [newOption(), newOption()],
  answers: type === "fill" ? [""] : [],
  explanation: "",
});

/** ----- Option Editor ----- */
function OptionsEditor({ q, onChange }) {
  if (q.type === "fill") {
    return (
      <Form.Item label="Đáp án mẫu (có thể nhiều đáp án)">
        <Space direction="vertical" className={styles.block}>
          {(q.answers || []).map((a, idx) => (
            <Space key={idx} align="baseline" className={styles.fillRow}>
              <Input
                placeholder="Ví dụ: です / でした"
                value={a}
                onChange={(e) => {
                  const clone = [...q.answers];
                  clone[idx] = e.target.value;
                  onChange({ ...q, answers: clone });
                }}
              />
              <Button
                danger
                onClick={() => {
                  const clone = [...q.answers];
                  clone.splice(idx, 1);
                  onChange({ ...q, answers: clone });
                }}
              >
                Xoá
              </Button>
            </Space>
          ))}
          <Button
            icon={<PlusOutlined />}
            onClick={() =>
              onChange({ ...q, answers: [...(q.answers || []), ""] })
            }
          >
            Thêm đáp án mẫu
          </Button>
        </Space>
      </Form.Item>
    );
  }

  const isSingle = q.type === "single";
  const correctIds = useMemo(
    () => new Set(q.options.filter((o) => o.correct).map((o) => o.id)),
    [q.options]
  );

  return (
    <Form.Item label="Phương án">
      <Space direction="vertical" className={styles.block}>
        {q.options.map((opt, idx) => (
          <Row key={opt.id} gutter={8} align="middle" className={styles.optRow}>
            <Col flex="24px" style={{ textAlign: "center" }}>
              {isSingle ? (
                <Radio
                  checked={correctIds.has(opt.id)}
                  onChange={() =>
                    onChange({
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
                    next[idx] = { ...opt, correct: e.target.checked };
                    onChange({ ...q, options: next });
                  }}
                />
              )}
            </Col>
            <Col flex="auto">
              <Input
                placeholder={`Lựa chọn #${idx + 1}`}
                value={opt.text}
                onChange={(e) => {
                  const next = [...q.options];
                  next[idx] = { ...opt, text: e.target.value };
                  onChange({ ...q, options: next });
                }}
              />
            </Col>
            <Col>
              <Button
                danger
                onClick={() => {
                  const next = q.options.filter((o) => o.id !== opt.id);
                  onChange({ ...q, options: next });
                }}
              >
                Xoá
              </Button>
            </Col>
          </Row>
        ))}

        <div className={styles.optActions}>
          <Button
            icon={<PlusOutlined />}
            onClick={() =>
              onChange({ ...q, options: [...q.options, newOption()] })
            }
          >
            Thêm lựa chọn
          </Button>
          <Text type="secondary">
            Đánh dấu đáp án đúng bằng {isSingle ? "radio" : "checkbox"} bên
            trái.
          </Text>
        </div>
      </Space>
    </Form.Item>
  );
}

/** ----- Question Card (inside Collapse) ----- */
function QuestionCard({
  q,
  idx,
  total,
  onChange,
  onDuplicate,
  onDelete,
  onMove,
}) {
  const items = [
    {
      key: q.id,
      label: (
        <Space>
          <Tag color="blue">Q{idx + 1}</Tag>
          <Text strong className={styles.qTitlePreview}>
            {q.text?.trim() || "Câu hỏi chưa có nội dung"}
          </Text>
          <Text type="secondary">· {q.points} pt</Text>
          <Tag>{q.type}</Tag>
        </Space>
      ),
      children: (
        <div className={styles.qBody}>
          <Row gutter={16}>
            <Col span={16}>
              <Form layout="vertical">
                <Form.Item label="Nội dung câu hỏi">
                  <Input.TextArea
                    autoSize={{ minRows: 2, maxRows: 6 }}
                    placeholder="Nhập nội dung câu hỏi…"
                    value={q.text}
                    onChange={(e) => onChange({ ...q, text: e.target.value })}
                  />
                </Form.Item>

                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item label="Loại câu hỏi">
                      <Select
                        value={q.type}
                        onChange={(type) => onChange(newQuestion(type))}
                        options={[
                          { value: "single", label: "Single choice" },
                          { value: "multiple", label: "Multiple choice" },
                          { value: "truefalse", label: "True / False" },
                          { value: "fill", label: "Fill in the blank" },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Điểm">
                      <InputNumber
                        min={0}
                        value={q.points}
                        onChange={(v) => onChange({ ...q, points: v ?? 0 })}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <OptionsEditor q={q} onChange={onChange} />

                <Form.Item label="Giải thích (hiển thị sau khi nộp)">
                  <Input.TextArea
                    placeholder="Giải thích đáp án / mẹo ghi nhớ…"
                    autoSize={{ minRows: 2, maxRows: 6 }}
                    value={q.explanation}
                    onChange={(e) =>
                      onChange({ ...q, explanation: e.target.value })
                    }
                  />
                </Form.Item>
              </Form>
            </Col>

            <Col span={8}>
              <Card size="small" className={styles.sideCard}>
                <Space
                  direction="vertical"
                  className={styles.block}
                  size="middle"
                >
                  <Text strong>Thao tác</Text>
                  <Space wrap>
                    <Button icon={<CopyOutlined />} onClick={onDuplicate}>
                      Duplicate
                    </Button>
                    <Button
                      icon={<ArrowUpOutlined />}
                      disabled={idx === 0}
                      onClick={() => onMove("up")}
                    />
                    <Button
                      icon={<ArrowDownOutlined />}
                      disabled={idx === total - 1}
                      onClick={() => onMove("down")}
                    />
                    <Button danger icon={<DeleteOutlined />} onClick={onDelete}>
                      Delete
                    </Button>
                  </Space>
                </Space>
              </Card>
            </Col>
          </Row>
        </div>
      ),
      extra: (
        <Dropdown
          trigger={["click"]}
          menu={{
            items: [
              {
                key: "dup",
                icon: <CopyOutlined />,
                label: "Duplicate",
                onClick: onDuplicate,
              },
              {
                key: "del",
                icon: <DeleteOutlined />,
                label: "Delete",
                onClick: onDelete,
              },
            ],
          }}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return <Collapse items={items} defaultActiveKey={[q.id]} />;
}

/** ----- Import Modal (pick an existing quiz to import) ----- */
function ImportModal({ open, onClose, library = [], onImport }) {
  const [selected, setSelected] = useState(null);

  return (
    <Modal
      open={open}
      title="Import from Library"
      onCancel={onClose}
      okText="Import"
      onOk={() => {
        if (!selected) return;
        onImport?.(selected);
        onClose();
      }}
      destroyOnClose
      width={720}
    >
      {library?.length ? (
        <List
          dataSource={library}
          renderItem={(qz) => (
            <List.Item
              onClick={() => setSelected(qz)}
              className={`${styles.importItem} ${
                selected?.id === qz.id ? styles.active : ""
              }`}
            >
              <Space direction="vertical" size={2}>
                <Space>
                  <Text strong>{qz.title}</Text>
                  <Tag>
                    {qz.questions?.length || qz.questionsCount || 0} questions
                  </Tag>
                </Space>
                <Text type="secondary">{qz.description || "—"}</Text>
              </Space>
            </List.Item>
          )}
        />
      ) : (
        <Empty description="Chưa có quiz trong thư viện" />
      )}
    </Modal>
  );
}

/** ----- Main Page ----- */
export default function CreateQuizPage({
  withinCourse = false, // hiển thị breadcrumb/nút back khi tạo trong course
  initialQuiz,
  libraryQuizzes = [], // danh sách quiz có sẵn để import
  onBack,
  onSave, // (quiz, { publish: boolean }) => void|Promise
}) {
  const [meta] = Form.useForm();
  const [settings] = Form.useForm();

  const [quiz, setQuiz] = useState(
    initialQuiz || {
      id: crypto.randomUUID(),
      title: "",
      description: "",
      tags: [],
      questions: [],
      timeLimit: 30, // minutes
      shuffleQuestions: false,
      shuffleOptions: true,
      showExplanation: true,
      passingScore: 60,
      difficulty: "N5",
      isRequired: false,
    }
  );

  const [openImport, setOpenImport] = useState(false);
  const totalPoints = quiz.questions.reduce((s, q) => s + (q.points || 0), 0);

  const addQuestion = (type = "single") =>
    setQuiz((q) => ({ ...q, questions: [...q.questions, newQuestion(type)] }));

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

  const importQuiz = (picked) => {
    // merge meta + questions từ quiz thư viện
    setQuiz((q) => ({
      ...q,
      title: q.title || picked.title,
      description: q.description || picked.description || "",
      questions: [...q.questions, ...(picked.questions || [])],
      tags: Array.from(new Set([...(q.tags || []), ...(picked.tags || [])])),
    }));
    message.success("Đã import câu hỏi vào quiz hiện tại");
  };

  const save = async (publish = false) => {
    try {
      const m = await meta.validateFields();
      const s = await settings.validateFields();
      const payload = { ...quiz, ...m, ...s };
      await onSave?.(payload, { publish });
      message.success(publish ? "Published!" : "Saved as draft");
    } catch (e) {
      // AntD tự highlight field
      console.log(e);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.headerBar}>
        <Space size="large" align="center">
          {withinCourse && (
            <Tooltip title="Back to Course Builder">
              <Button icon={<RollbackOutlined />} onClick={onBack}>
                Back
              </Button>
            </Tooltip>
          )}
          <Title level={3} className={styles.pageTitle}>
            Create Quiz
          </Title>
          <Tag color="geekblue">{quiz.questions.length} questions</Tag>
          <Tag>total {totalPoints} pts</Tag>
        </Space>

        <Space>
          <Button icon={<ImportOutlined />} onClick={() => setOpenImport(true)}>
            Import from Library
          </Button>
          <Button icon={<SaveOutlined />} onClick={() => save(false)}>
            Save Draft
          </Button>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={() => save(true)}
          >
            Publish
          </Button>
        </Space>
      </div>

      <Row gutter={16} className={styles.layout}>
        <Col span={17}>
          <Card className={styles.card}>
            <Tabs
              defaultActiveKey="build"
              items={[
                {
                  key: "build",
                  label: "Build",
                  children: (
                    <>
                      <Space className={styles.addBar} wrap>
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => addQuestion("single")}
                        >
                          Add Single Choice
                        </Button>
                        <Button onClick={() => addQuestion("multiple")}>
                          Add Multiple Choice
                        </Button>
                        <Button onClick={() => addQuestion("truefalse")}>
                          Add True/False
                        </Button>
                        <Button onClick={() => addQuestion("fill")}>
                          Add Fill-in
                        </Button>
                      </Space>

                      {quiz.questions.length === 0 ? (
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description="Chưa có câu hỏi. Bấm 'Add' để bắt đầu."
                        />
                      ) : (
                        <Space
                          direction="vertical"
                          className={styles.block}
                          size="large"
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
                            />
                          ))}
                        </Space>
                      )}
                    </>
                  ),
                },
                {
                  key: "settings",
                  label: "Settings",
                  children: (
                    <Form
                      form={settings}
                      layout="vertical"
                      initialValues={{
                        timeLimit: quiz.timeLimit,
                        shuffleQuestions: quiz.shuffleQuestions,
                        shuffleOptions: quiz.shuffleOptions,
                        showExplanation: quiz.showExplanation,
                        passingScore: quiz.passingScore,
                        isRequired: quiz.isRequired,
                      }}
                      onValuesChange={(_, all) =>
                        setQuiz((q) => ({ ...q, ...all }))
                      }
                    >
                      <Row gutter={16}>
                        <Col span={8}>
                          <Form.Item
                            label="Time limit (minutes)"
                            name="timeLimit"
                            rules={[{ required: true }]}
                          >
                            <InputNumber min={0} />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            label="Passing score (%)"
                            name="passingScore"
                            rules={[{ required: true }]}
                          >
                            <InputNumber min={0} max={100} />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            label="Bắt buộc hoàn thành"
                            name="isRequired"
                            valuePropName="checked"
                          >
                            <Switch />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={8}>
                          <Form.Item
                            label="Shuffle questions"
                            name="shuffleQuestions"
                            valuePropName="checked"
                          >
                            <Switch />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            label="Shuffle options"
                            name="shuffleOptions"
                            valuePropName="checked"
                          >
                            <Switch />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            label="Show explanation after submit"
                            name="showExplanation"
                            valuePropName="checked"
                          >
                            <Switch />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Form>
                  ),
                },
                {
                  key: "preview",
                  label: "Preview",
                  children: (
                    <div className={styles.preview}>
                      <Space align="center" style={{ marginBottom: 12 }}>
                        <EyeOutlined />
                        <Text type="secondary">
                          Đây là bản xem trước tương tự màn hình learner (rút
                          gọn).
                        </Text>
                      </Space>
                      <List
                        dataSource={quiz.questions}
                        renderItem={(q, i) => (
                          <List.Item>
                            <div className={styles.prevItem}>
                              <Text strong>
                                {i + 1}. {q.text || <i>(Chưa có nội dung)</i>}
                              </Text>
                              {q.type === "fill" ? (
                                <Input placeholder="Điền đáp án..." />
                              ) : q.type === "truefalse" ? (
                                <Radio.Group
                                  options={[
                                    { label: "True", value: "t" },
                                    { label: "False", value: "f" },
                                  ]}
                                />
                              ) : (
                                <Space
                                  direction="vertical"
                                  style={{ width: "100%", marginTop: 8 }}
                                >
                                  {(q.options || []).map((o) => (
                                    <Checkbox key={o.id} disabled>
                                      {o.text || <i>(trống)</i>}
                                    </Checkbox>
                                  ))}
                                </Space>
                              )}
                            </div>
                          </List.Item>
                        )}
                      />
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </Col>

        <Col span={7}>
          <Card className={styles.card} title="Quiz Info">
            <Form
              form={meta}
              layout="vertical"
              initialValues={{
                title: quiz.title,
                description: quiz.description,
                difficulty: quiz.difficulty,
                tags: quiz.tags,
              }}
              onValuesChange={(_, all) => setQuiz((q) => ({ ...q, ...all }))}
            >
              <Form.Item
                name="title"
                label="Title"
                rules={[{ required: true, message: "Nhập tiêu đề quiz" }]}
              >
                <Input placeholder="VD: JLPT N3 – Grammar Section" />
              </Form.Item>

              <Form.Item name="description" label="Description">
                <Input.TextArea
                  placeholder="Mô tả ngắn…"
                  autoSize={{ minRows: 2, maxRows: 6 }}
                />
              </Form.Item>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="difficulty" label="Level">
                    <Select
                      options={[
                        { value: "N5", label: "N5" },
                        { value: "N4", label: "N4" },
                        { value: "N3", label: "N3" },
                        { value: "N2", label: "N2" },
                        { value: "N1", label: "N1" },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="tags" label="Tags">
                    <Select
                      mode="tags"
                      tokenSeparators={[","]}
                      placeholder="nhập và Enter…"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider style={{ margin: "8px 0 16px" }} />
              <Space direction="vertical" size={6}>
                <Text type="secondary">Quick stats</Text>
                <Space wrap>
                  <Tag color="blue">{quiz.questions.length} câu</Tag>
                  <Tag color="green">{totalPoints} điểm</Tag>
                  <Tag>{quiz.timeLimit} phút</Tag>
                </Space>
              </Space>
            </Form>
          </Card>

          <Card className={styles.card} title="Mẹo thiết kế tốt">
            <ul className={styles.tips}>
              <li>Mỗi câu 1 mục tiêu nhỏ, ngắn gọn.</li>
              <li>Dùng giải thích để giúp người học nhớ lâu.</li>
              <li>Trộn câu hỏi và lựa chọn để chống học vẹt.</li>
            </ul>
          </Card>
        </Col>
      </Row>

      <ImportModal
        open={openImport}
        onClose={() => setOpenImport(false)}
        library={libraryQuizzes}
        onImport={importQuiz}
      />
    </div>
  );
}
