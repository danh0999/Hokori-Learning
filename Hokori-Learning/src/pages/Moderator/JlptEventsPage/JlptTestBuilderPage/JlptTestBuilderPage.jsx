// src/pages/Moderator/JlptTestBuilderPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTestsByEventThunk,
  createJlptTestForEventThunk,
  fetchJlptTestQuestionsThunk,
  createJlptQuestionThunk,
  createJlptOptionThunk,
  updateJlptQuestionThunk,
  deleteJlptQuestionThunk,
} from "../../../../redux/features/jlptModeratorSlice.js";
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  List,
  Row,
  Select,
  Space,
  Tabs,
  Tag,
  Typography,
  message,
  Popconfirm,
} from "antd";
import { ArrowLeftOutlined, PlusOutlined } from "@ant-design/icons";
import { buildFileUrl } from "../../../../utils/fileUrl.js";

// chỉnh path cho đúng vị trí BulkImportModal trong project của bạn
import BulkImportModal from "../../../Teacher/ManageDocument/Quiz/BulkImportModal/BulkImportModal.jsx";

const { Text, Title } = Typography;

const normalizeAudioPath = (p) => (p ? p.replace(/\s*\/\s*/g, "/").trim() : "");
const resolveAudioSrc = (audioPath) => {
  if (!audioPath) return null;
  const p = normalizeAudioPath(audioPath);

  // Nếu là URL đầy đủ (https://...) thì dùng luôn
  if (/^https?:\/\//i.test(p)) return p;

  // Nếu đã bắt đầu bằng "/public" thì bỏ "/public"
  if (p.startsWith("/public/")) return p.replace(/^\/?public\//, "/");
  if (p.startsWith("public/")) return `/${p.replace(/^public\//, "")}`;

  // Nếu bắt đầu bằng "/" thì dùng luôn (public)
  if (p.startsWith("/")) return p;

  // Nếu là đường dẫn kiểu "jlpt-demo/..." hay "jlpt-n4/..."
  // → cũng trỏ vào public
  if (p.startsWith("jlpt-") || p.startsWith("audio-")) {
    return `/${p}`;
  }

  // Ngược lại, coi như file trong thư mục "jlpt-demo" cho dễ test
  return `/jlpt-demo/${p}`;
};

const QUESTION_TYPES = ["VOCAB", "GRAMMAR", "READING", "LISTENING"];

const QUESTION_TYPE_LABEL = {
  VOCAB: "Từ vựng",
  GRAMMAR: "Ngữ pháp",
  READING: "Đọc hiểu",
  LISTENING: "Nghe hiểu",
};

const QUESTION_TYPE_COLOR = {
  VOCAB: "cyan",
  GRAMMAR: "purple",
  READING: "orange",
  LISTENING: "geekblue",
};

const cardStyle = {
  borderRadius: 12,
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
};

export default function JlptTestBuilderPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const eventFromState = location.state?.event || null;
  const eventLevel = eventFromState?.level || "N5";

  const {
    testsByEvent,
    questionsByTest,
    loadingTests,
    loadingQuestions,
    creatingTest,
    creatingQuestion,
    creatingOption,
    updatingQuestion,
    deletingQuestion,
  } = useSelector((state) => state.jlptModerator);

  const [selectedTestId, setSelectedTestId] = useState(null);
  const [addingOptionFor, setAddingOptionFor] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [showCreateTest, setShowCreateTest] = useState(false);

  // tab đang active (để quyết định bulk import vào loại nào)
  const [activeTab, setActiveTab] = useState("VOCAB");

  // question đang edit inline
  const [editingQuestion, setEditingQuestion] = useState(null);

  const tests = testsByEvent[eventId] || [];
  const questions = selectedTestId ? questionsByTest[selectedTestId] || [] : [];

  // level hiển thị (ưu tiên test.level, nếu chưa có test thì lấy từ event)
  const currentTest =
    tests.find((t) => t.id === selectedTestId) || tests[0] || null;

  const displayLevel = currentTest?.level || eventLevel;

  /* ------------------ effects ------------------ */

  // lấy list test của event khi load trang
  useEffect(() => {
    if (!eventId) return;
    dispatch(fetchTestsByEventThunk(eventId)).then((res) => {
      if (
        res.meta.requestStatus === "fulfilled" &&
        res.payload &&
        res.payload.length > 0
      ) {
        const firstTestId = res.payload[0].id;
        setSelectedTestId(firstTestId);
        dispatch(fetchJlptTestQuestionsThunk(firstTestId));
      }
    });
  }, [dispatch, eventId]);

  // khi đổi selectedTestId → load câu hỏi của test đó
  useEffect(() => {
    if (selectedTestId) {
      dispatch(fetchJlptTestQuestionsThunk(selectedTestId));
    }
  }, [dispatch, selectedTestId]);

  /* ------------------ handlers ------------------ */

  const handleCreateTest = (values) => {
    // luôn ưu tiên level từ event nếu có
    const payload = {
      ...values,
      level: eventFromState?.level || values.level || "N5",
    };

    dispatch(
      createJlptTestForEventThunk({
        eventId,
        data: payload,
      })
    ).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        const newTestId = res.payload.test.id;
        setSelectedTestId(newTestId);
        dispatch(fetchJlptTestQuestionsThunk(newTestId));
      }
    });
  };

  const handleCreateQuestion = (values) => {
    if (!selectedTestId) return;

    // Tự động tính orderIndex: max hiện tại + 1 (hoặc 0 nếu chưa có gì)
    const nextOrderIndex =
      questions.length === 0
        ? 0
        : Math.max(...questions.map((q) => q.orderIndex || 0)) + 1;

    const payload = {
      ...values,
      orderIndex: nextOrderIndex,
      questionType: values.questionType || "VOCAB",
    };

    dispatch(
      createJlptQuestionThunk({
        testId: selectedTestId,
        data: payload,
      })
    ).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        message.success("Đã tạo câu hỏi mới");
        dispatch(fetchJlptTestQuestionsThunk(selectedTestId));
      }
    });
  };

  const handleUpdateQuestion = (questionId, values) => {
    if (!selectedTestId || !questionId) return;
    dispatch(
      updateJlptQuestionThunk({
        testId: selectedTestId,
        questionId,
        data: values,
      })
    ).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        message.success("Cập nhật câu hỏi thành công");
        setEditingQuestion(null);
        dispatch(fetchJlptTestQuestionsThunk(selectedTestId));
      }
    });
  };

  const handleDeleteQuestion = (questionId) => {
    if (!selectedTestId || !questionId) return;
    dispatch(
      deleteJlptQuestionThunk({
        testId: selectedTestId,
        questionId,
      })
    ).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        message.success("Đã xóa câu hỏi");
        dispatch(fetchJlptTestQuestionsThunk(selectedTestId));
      }
    });
  };

  const handleCreateOption = (questionId, values) => {
    if (!selectedTestId || !questionId) return;
    const payload = {
      ...values,
      orderIndex: typeof values.orderIndex === "number" ? values.orderIndex : 0,
    };

    dispatch(
      createJlptOptionThunk({
        testId: selectedTestId,
        questionId,
        data: payload,
      })
    ).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        message.success("Đã thêm đáp án");
        setAddingOptionFor(null);
        dispatch(fetchJlptTestQuestionsThunk(selectedTestId));
      }
    });
  };

  const handleBulkDone = async (bulkQuestions, bulkQuestionType) => {
    if (!selectedTestId) {
      message.error("Hãy chọn test trước khi bulk import");
      return;
    }

    try {
      const baseIndex =
        questions.length === 0
          ? 0
          : Math.max(...questions.map((q) => q.orderIndex || 0)) + 1;

      for (let i = 0; i < bulkQuestions.length; i++) {
        const q = bulkQuestions[i];
        const orderIndex = baseIndex + i;

        const questionRes = await dispatch(
          createJlptQuestionThunk({
            testId: selectedTestId,
            data: {
              questionType: bulkQuestionType,
              content: q.question,
              explanation: q.explanation || "",
              audioPath: q.audioPath || "",
              imagePath: q.imagePath || "",
              imageAltText: q.imageAltText || "",
              orderIndex,
            },
          })
        );

        if (questionRes.meta.requestStatus !== "fulfilled") continue;

        const createdQuestion = questionRes.payload.question;
        if (!createdQuestion) continue;

        const qId = createdQuestion.id;

        if (Array.isArray(q.options)) {
          for (let oi = 0; oi < q.options.length; oi++) {
            const opt = q.options[oi];
            await dispatch(
              createJlptOptionThunk({
                testId: selectedTestId,
                questionId: qId,
                data: {
                  content: opt.content,
                  correct: !!opt.correct,
                  orderIndex: oi,
                  imagePath: opt.imagePath || "",
                  imageAltText: opt.imageAltText || "",
                },
              })
            );
          }
        }
      }

      message.success(
        `Đã import ${bulkQuestions.length} câu hỏi vào nhóm ${QUESTION_TYPE_LABEL[bulkQuestionType]}`
      );
      setBulkOpen(false);
      dispatch(fetchJlptTestQuestionsThunk(selectedTestId));
    } catch (e) {
      console.error(e);
      message.error("Bulk import JLPT test thất bại");
    }
  };

  /* ------------------ derived data ------------------ */

  const totalQuestions = questions.length;
  const byType = QUESTION_TYPES.reduce((acc, type) => {
    acc[type] = questions.filter((q) => q.questionType === type);
    return acc;
  }, {});

  const tabItems = QUESTION_TYPES.map((type) => ({
    key: type,
    label: (
      <Space>
        <Tag color={QUESTION_TYPE_COLOR[type]}>{QUESTION_TYPE_LABEL[type]}</Tag>
        <Tag>{byType[type].length}</Tag>
      </Space>
    ),
    children: (
      <List
        dataSource={byType[type]}
        loading={loadingQuestions}
        rowKey={(q) => q.id}
        renderItem={(q) => {
          const audioSrc = resolveAudioSrc(q.audioPath);
          return (
            <List.Item
              style={{
                alignItems: "flex-start",
                padding: "12px 0",
              }}
            >
              <div style={{ width: "100%" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 8,
                  }}
                >
                  <Space align="start">
                    <Tag>{q.orderIndex}</Tag>
                    <div>
                      <Text strong>{q.content}</Text>
                      {q.explanation && (
                        <div>
                          <Text type="secondary">
                            Giải thích: {q.explanation}
                          </Text>
                        </div>
                      )}
                      {audioSrc && (
                        <div style={{ marginTop: 4 }}>
                          <audio
                            controls
                            src={audioSrc}
                            style={{ maxWidth: 280 }}
                          />
                        </div>
                      )}
                      {q.imagePath && (
                        <div style={{ marginTop: 4 }}>
                          <img
                            src={buildFileUrl(q.imagePath)}
                            alt={q.imageAltText || "question-img"}
                            style={{
                              maxWidth: 320,
                              maxHeight: 200,
                              objectFit: "contain",
                              borderRadius: 8,
                              border: "1px solid #f0f0f0",
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </Space>

                  <Space>
                    <Button
                      size="small"
                      type="link"
                      onClick={() => setEditingQuestion(q)}
                    >
                      Sửa
                    </Button>
                    <Popconfirm
                      title="Xóa câu hỏi này?"
                      okText="Xóa"
                      cancelText="Hủy"
                      okButtonProps={{
                        danger: true,
                        loading: deletingQuestion,
                      }}
                      onConfirm={() => handleDeleteQuestion(q.id)}
                    >
                      <Button size="small" type="link" danger>
                        Xóa
                      </Button>
                    </Popconfirm>
                  </Space>
                </div>

                {/* options */}
                <div style={{ marginTop: 8, marginLeft: 40 }}>
                  <Text type="secondary">Đáp án:</Text>
                  <div style={{ marginTop: 4 }}>
                    {q.options?.map((op) => (
                      <div
                        key={op.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "2px 0",
                        }}
                      >
                        <Tag
                          color={op.correct ? "green" : "default"}
                          style={{ minWidth: 32, textAlign: "center" }}
                        >
                          {op.orderIndex + 1}
                          {op.correct ? " ✔" : ""}
                        </Tag>
                        <span>{op.content}</span>
                      </div>
                    ))}
                  </div>

                  {/* inline add option */}
                  <div style={{ marginTop: 8 }}>
                    {addingOptionFor === q.id ? (
                      <Form
                        layout="inline"
                        size="small"
                        onFinish={(values) =>
                          handleCreateOption(q.id, {
                            ...values,
                            orderIndex:
                              typeof values.orderIndex === "number"
                                ? values.orderIndex
                                : q.options
                                ? q.options.length
                                : 0,
                          })
                        }
                      >
                        <Form.Item
                          name="content"
                          rules={[
                            { required: true, message: "Option content" },
                          ]}
                        >
                          <Input placeholder="Nội dung đáp án" />
                        </Form.Item>
                        <Form.Item name="correct" valuePropName="checked">
                          <label>
                            <input type="checkbox" /> Đúng
                          </label>
                        </Form.Item>
                        <Form.Item>
                          <Button
                            type="primary"
                            htmlType="submit"
                            loading={creatingOption}
                            size="small"
                          >
                            Lưu
                          </Button>
                        </Form.Item>
                        <Form.Item>
                          <Button
                            size="small"
                            onClick={() => setAddingOptionFor(null)}
                          >
                            Hủy
                          </Button>
                        </Form.Item>
                      </Form>
                    ) : (
                      <Button
                        type="dashed"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => setAddingOptionFor(q.id)}
                      >
                        Thêm đáp án
                      </Button>
                    )}
                  </div>
                </div>

                <Divider style={{ margin: "10px 0" }} />
              </div>
            </List.Item>
          );
        }}
      />
    ),
  }));

  /* ------------------ render ------------------ */

  if (loadingTests && !tests.length) {
    return (
      <div style={{ padding: 32 }}>
        <Text>Đang tải JLPT Test cho event #{eventId}...</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 48px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Space align="center">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/moderator/jlptevents")}
          >
            Back
          </Button>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              JLPT Test Builder – Event #{eventId}
            </Title>
            <Space size="small" style={{ marginTop: 4 }}>
              <Tag color="blue">Level {eventLevel}</Tag>
              {currentTest && (
                <>
                  <Tag color="purple">
                    Duration {currentTest.durationMin} min
                  </Tag>
                  <Tag color="green">Total Score {currentTest.totalScore}</Tag>
                </>
              )}
            </Space>
          </div>
        </Space>

        <Space>
          <Button
            type="default"
            onClick={() => setBulkOpen(true)}
            disabled={!selectedTestId}
          >
            Bulk Import câu hỏi
          </Button>
        </Space>
      </div>

      <Row gutter={24} align="stretch">
        {/* LEFT COLUMN */}
        <Col xs={24} md={10} lg={8}>
          {tests.length === 0 ? (
            <Card
              title="Tạo JLPT Test cho Event"
              bordered={false}
              style={cardStyle}
            >
              <Form
                layout="vertical"
                onFinish={handleCreateTest}
                initialValues={{
                  level: eventLevel,
                  durationMin: 60,
                  totalScore: 60,
                  resultNote: "",
                }}
              >
                <Form.Item
                  name="level"
                  label="Level"
                  rules={[{ required: true }]}
                >
                  <Select
                    options={["N5", "N4", "N3", "N2", "N1"].map((lv) => ({
                      label: lv,
                      value: lv,
                    }))}
                    disabled={!!eventFromState} // nếu event đã có level thì không cho đổi
                  />
                </Form.Item>
                <Form.Item
                  name="durationMin"
                  label="Thời lượng (phút)"
                  rules={[{ required: true }]}
                >
                  <InputNumber min={1} style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item
                  name="totalScore"
                  label="Tổng điểm"
                  rules={[{ required: true }]}
                >
                  <InputNumber min={1} style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item name="resultNote" label="Ghi chú kết quả">
                  <Input.TextArea rows={2} />
                </Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={creatingTest}
                  block
                >
                  Create Test
                </Button>
              </Form>
            </Card>
          ) : (
            <>
              {/* Danh sách JLPT Test của Event */}
              <Card
                title={`Danh sách JLPT Test của Event #${eventId}`}
                bordered={false}
                style={{ ...cardStyle, marginBottom: 16 }}
              >
                <List
                  dataSource={tests}
                  itemLayout="horizontal"
                  renderItem={(t) => {
                    const isActive = t.id === selectedTestId;
                    return (
                      <List.Item
                        style={{
                          cursor: "pointer",
                          background: isActive ? "#e6f7ff" : "transparent",
                          borderRadius: 6,
                          paddingInline: 12,
                        }}
                        onClick={() => {
                          setSelectedTestId(t.id);
                          setEditingQuestion(null);
                        }}
                      >
                        <List.Item.Meta
                          title={
                            <Space>
                              <b>Test #{t.id}</b>
                              <Tag color="blue">{t.level}</Tag>
                              <Tag>
                                {t.durationMin || 60} phút ·{" "}
                                {t.totalScore || 60} điểm
                              </Tag>
                            </Space>
                          }
                          description={
                            t.resultNote ||
                            "Không có ghi chú kết quả cho test này"
                          }
                        />
                      </List.Item>
                    );
                  }}
                />
                <div style={{ marginTop: 12, textAlign: "right" }}>
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => setShowCreateTest(true)}
                  >
                    + Tạo test mới
                  </Button>
                </div>
              </Card>

              {/* Form tạo JLPT Test mới (khi đã có test khác) */}
              {showCreateTest && (
                <Card
                  title="Tạo JLPT Test mới"
                  bordered={false}
                  style={{ ...cardStyle, marginBottom: 16 }}
                >
                  <Form
                    layout="vertical"
                    onFinish={(values) => {
                      handleCreateTest(values);
                      setShowCreateTest(false);
                    }}
                    initialValues={{
                      level: eventLevel,
                      durationMin: 60,
                      totalScore: 60,
                      resultNote: "",
                    }}
                  >
                    <Form.Item
                      name="level"
                      label="Level"
                      rules={[{ required: true }]}
                    >
                      <Select
                        options={["N5", "N4", "N3", "N2", "N1"].map((lv) => ({
                          label: lv,
                          value: lv,
                        }))}
                        disabled={!!eventFromState}
                      />
                    </Form.Item>
                    <Form.Item
                      name="durationMin"
                      label="Thời lượng (phút)"
                      rules={[{ required: true }]}
                    >
                      <InputNumber min={1} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item
                      name="totalScore"
                      label="Tổng điểm"
                      rules={[{ required: true }]}
                    >
                      <InputNumber min={1} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="resultNote" label="Ghi chú kết quả">
                      <Input.TextArea rows={2} />
                    </Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={creatingTest}
                      block
                    >
                      Create Test
                    </Button>
                  </Form>
                </Card>
              )}

              {/* form tạo câu hỏi */}
              <Card title="Thêm câu hỏi mới" bordered={false} style={cardStyle}>
                <Form
                  layout="vertical"
                  onFinish={handleCreateQuestion}
                  initialValues={{
                    questionType: "VOCAB",
                  }}
                >
                  <Form.Item
                    name="questionType"
                    label="Kỹ năng / loại câu hỏi"
                    rules={[{ required: true }]}
                  >
                    <Select
                      options={QUESTION_TYPES.map((qt) => ({
                        label: QUESTION_TYPE_LABEL[qt],
                        value: qt,
                      }))}
                    />
                  </Form.Item>

                  <Form.Item
                    name="content"
                    label="Nội dung câu hỏi"
                    rules={[{ required: true }]}
                  >
                    <Input.TextArea rows={3} />
                  </Form.Item>

                  <Form.Item name="explanation" label="Giải thích (optional)">
                    <Input.TextArea rows={2} />
                  </Form.Item>

                  {/* Audio / Image path để BE xử lý file sau này */}
                  <Form.Item
                    name="audioPath"
                    label="Audio path (cho LISTENING)"
                  >
                    <Input placeholder="vd: jlpt-n4/listening/part1_01.mp3" />
                  </Form.Item>
                  <Form.Item name="imagePath" label="Image path (optional)">
                    <Input />
                  </Form.Item>
                  <Form.Item name="imageAltText" label="Image alt text">
                    <Input />
                  </Form.Item>

                  <Button type="primary" htmlType="submit" block>
                    Thêm câu hỏi
                  </Button>
                </Form>
              </Card>
            </>
          )}
        </Col>

        {/* RIGHT COLUMN */}
        <Col xs={24} md={14} lg={16}>
          <Card
            title="Danh sách câu hỏi & đáp án"
            bordered={false}
            bodyStyle={{ padding: 16 }}
            style={cardStyle}
          >
            {totalQuestions === 0 ? (
              <Text type="secondary">
                Chưa có câu hỏi nào. Hãy tạo test (nếu chưa có) và thêm câu hỏi
                ở panel bên trái.
              </Text>
            ) : (
              <Tabs
                activeKey={activeTab}
                onChange={(key) => {
                  setActiveTab(key);
                  setEditingQuestion(null);
                }}
                items={tabItems}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Bulk Import Modal */}
      {selectedTestId && (
        <BulkImportModal
          open={bulkOpen}
          onCancel={() => setBulkOpen(false)}
          onDone={handleBulkDone}
        />
      )}
    </div>
  );
}
