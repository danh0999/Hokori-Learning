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

const QUESTION_TYPES = ["VOCAB", "GRAMMAR", "READING", "LISTENING"];

const QUESTION_TYPE_LABEL = {
  VOCAB: "Từ Vựng",
  GRAMMAR: "Ngữ Pháp",
  READING: "Đọc hiểu",
  LISTENING: "Nghe hiểu",
};

// style dùng lại cho các card chính
const cardStyle = {
  border: "1px solid #d9d9d9",
  borderRadius: 8,
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
};

export default function JlptTestBuilderPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  // event mà Admin tạo, truyền từ JlptEventsPage
  const eventFromState = location.state?.event || null;

  const { testsByEvent, questionsByTest, creatingTest } = useSelector(
    (state) => state.jlptModerator
  );

  const [selectedTestId, setSelectedTestId] = useState(null);
  const [addingOptionFor, setAddingOptionFor] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  // tab đang active (để quyết định bulk import vào loại nào)
  const [activeTab, setActiveTab] = useState("VOCAB");

  // question đang edit inline
  const [editingQuestion, setEditingQuestion] = useState(null);

  const tests = testsByEvent[eventId] || [];
  const questions = selectedTestId ? questionsByTest[selectedTestId] || [] : [];

  // level hiển thị (ưu tiên test.level, nếu chưa có test thì lấy từ event)
  const currentTest =
    tests.find((t) => t.id === selectedTestId) || tests[0] || null;
  const eventLevel = currentTest?.level || eventFromState?.level || "N5";

  /* ------------------ load tests & questions ------------------ */

  useEffect(() => {
    dispatch(fetchTestsByEventThunk(eventId));
  }, [dispatch, eventId]);

  useEffect(() => {
    if (tests.length > 0 && !selectedTestId) {
      setSelectedTestId(tests[0].id);
    }
  }, [tests, selectedTestId]);

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
        : Math.max(
            ...questions.map((q) =>
              typeof q.orderIndex === "number" ? q.orderIndex : 0
            )
          ) + 1;

    const payload = {
      ...values,
      orderIndex: nextOrderIndex,
    };

    dispatch(
      createJlptQuestionThunk({
        testId: selectedTestId,
        data: payload,
      })
    ).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        dispatch(fetchJlptTestQuestionsThunk(selectedTestId));
      }
    });
  };

  const handleCreateOption = (questionId, values) => {
    dispatch(
      createJlptOptionThunk({
        questionId,
        data: values,
      })
    ).then((res) => {
      if (res.meta.requestStatus === "fulfilled" && selectedTestId) {
        setAddingOptionFor(null);
        dispatch(fetchJlptTestQuestionsThunk(selectedTestId));
      }
    });
  };

  // UPDATE question
  const handleUpdateQuestion = (q, values) => {
    if (!selectedTestId) return;

    const payload = {
      content: values.content,
      explanation: values.explanation,
      questionType: q.questionType,
      orderIndex:
        typeof values.orderIndex === "number"
          ? values.orderIndex
          : q.orderIndex,
      audioPath: normalizeAudioPath(values.audioPath || ""),
      imagePath: values.imagePath || "",
      imageAltText: values.imageAltText || "",
    };

    dispatch(
      updateJlptQuestionThunk({
        testId: selectedTestId,
        questionId: q.id,
        data: payload,
      })
    ).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        message.success("Cập nhật câu hỏi thành công");
        setEditingQuestion(null);
        dispatch(fetchJlptTestQuestionsThunk(selectedTestId));
      }
    });
  };

  // DELETE question
  const handleDeleteQuestion = (q) => {
    if (!selectedTestId) return;

    dispatch(
      deleteJlptQuestionThunk({
        testId: selectedTestId,
        questionId: q.id,
      })
    ).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        message.success("Đã xóa câu hỏi");
      }
    });
  };

  // Bulk import: nhận list câu hỏi từ BulkImportModal (parseQuizFromText)
  const handleBulkDone = async (bulkQuestions = []) => {
    if (!selectedTestId) {
      message.error("Hãy tạo JLPT test trước rồi mới import câu hỏi");
      return;
    }
    if (!bulkQuestions.length) {
      message.warning("Không có câu hỏi nào được import");
      return;
    }

    // dùng tab hiện tại để quyết định questionType
    const bulkQuestionType = QUESTION_TYPES.includes(activeTab)
      ? activeTab
      : "VOCAB";

    try {
      // Lấy orderIndex bắt đầu từ max hiện tại
      let baseOrder =
        questions.length === 0
          ? 0
          : Math.max(
              ...questions.map((q) =>
                typeof q.orderIndex === "number" ? q.orderIndex : 0
              )
            ) + 1;

      for (const [idx, q] of bulkQuestions.entries()) {
        const createQRes = await dispatch(
          createJlptQuestionThunk({
            testId: selectedTestId,
            data: {
              content: q.text || q.content || "",
              questionType: bulkQuestionType, // 👈 tất cả câu import sẽ mang type = tab hiện tại
              explanation: q.explanation || "",
              orderIndex: baseOrder + idx,
              audioPath: q.audioPath || "",
              imagePath: q.imagePath || "",
              imageAltText: q.imageAltText || "",
            },
          })
        );

        if (createQRes.meta.requestStatus !== "fulfilled") continue;

        const createdQuestionId =
          createQRes.payload?.question?.id ||
          createQRes.payload?.id ||
          createQRes.payload?.questionId;

        if (!createdQuestionId) continue;

        const opts = q.options || [];
        for (let oi = 0; oi < opts.length; oi++) {
          const opt = opts[oi];
          await dispatch(
            createJlptOptionThunk({
              questionId: createdQuestionId,
              data: {
                content: opt.text || opt.content || "",
                correct: !!opt.correct,
                orderIndex: oi,
                imagePath: opt.imagePath || "",
                imageAltText: opt.imageAltText || "",
              },
            })
          );
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
      <span>
        {QUESTION_TYPE_LABEL[type]} <Tag>{byType[type]?.length || 0}</Tag>
      </span>
    ),
    children: (
      <List
        size="small"
        dataSource={byType[type] || []}
        rowKey={(q) => q.id ?? `${type}-${q.orderIndex}`}
        renderItem={(q, idx) => {
          const isEditing = editingQuestion && editingQuestion.id === q.id;

          return (
            <List.Item style={{ paddingLeft: 0, paddingRight: 0 }}>
              <div style={{ width: "100%" }}>
                {isEditing ? (
                  <>
                    <Text strong>
                      {idx + 1}. [{type}] (Đang chỉnh sửa)
                    </Text>
                    <Form
                      layout="vertical"
                      size="small"
                      style={{ marginTop: 8 }}
                      initialValues={{
                        content: q.content,
                        explanation: q.explanation,
                        audioPath: q.audioPath,
                        imagePath: q.imagePath,
                        imageAltText: q.imageAltText,
                        orderIndex:
                          typeof q.orderIndex === "number" ? q.orderIndex : idx,
                      }}
                      onFinish={(values) => handleUpdateQuestion(q, values)}
                    >
                      <Form.Item
                        name="content"
                        label="Nội dung câu hỏi"
                        rules={[{ required: true, message: "Nhập nội dung" }]}
                      >
                        <Input.TextArea rows={3} />
                      </Form.Item>

                      <Form.Item name="explanation" label="Giải thích">
                        <Input.TextArea rows={2} />
                      </Form.Item>

                      {type === "LISTENING" && (
                        <Form.Item
                          name="audioPath"
                          label="Audio path (LISTENING)"
                        >
                          <Input placeholder="vd: jlpt-n4/listening/part1_01.mp3" />
                        </Form.Item>
                      )}

                      <Form.Item name="imagePath" label="Image path">
                        <Input />
                      </Form.Item>

                      <Form.Item name="imageAltText" label="Image alt text">
                        <Input />
                      </Form.Item>

                      <Form.Item name="orderIndex" label="Thứ tự (orderIndex)">
                        <InputNumber min={0} />
                      </Form.Item>

                      <Space>
                        <Button type="primary" htmlType="submit" size="small">
                          Lưu
                        </Button>
                        <Button
                          size="small"
                          onClick={() => setEditingQuestion(null)}
                        >
                          Hủy
                        </Button>
                      </Space>
                    </Form>

                    {/* preview audio + options vẫn giữ để mod dễ nhìn */}
                    {type === "LISTENING" && q.audioPath && (
                      <div style={{ marginTop: 8 }}>
                        <audio
                          controls
                          preload="none"
                          style={{ width: 260 }}
                          src={buildFileUrl(
                            normalizeAudioPath(q.audioPath || "")
                          )}
                        />
                      </div>
                    )}
                    <div style={{ marginTop: 6 }}>
                      {(q.options || []).map((op) => (
                        <div key={op.id} style={{ fontSize: 13 }}>
                          <Tag color={op.correct ? "green" : "default"}>
                            {op.orderIndex + 1}
                            {op.correct ? " ✔" : ""}
                          </Tag>
                          <span>{op.content}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <Text strong>
                      {idx + 1}. [{type}] {q.content}
                    </Text>

                    {/* audio preview cho LISTENING */}
                    {type === "LISTENING" && q.audioPath && (
                      <div style={{ marginTop: 6 }}>
                        <audio
                          controls
                          preload="none"
                          style={{ width: 260 }}
                          src={buildFileUrl(
                            normalizeAudioPath(q.audioPath || "")
                          )}
                        />
                      </div>
                    )}

                    {/* options */}
                    <div style={{ marginTop: 6 }}>
                      {(q.options || []).map((op) => (
                        <div key={op.id} style={{ fontSize: 13 }}>
                          <Tag color={op.correct ? "green" : "default"}>
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
                          <Form.Item name="correct" initialValue={false}>
                            <Select
                              style={{ width: 90 }}
                              options={[
                                { label: "Sai", value: false },
                                { label: "Đúng", value: true },
                              ]}
                            />
                          </Form.Item>
                          <Form.Item name="orderIndex">
                            <InputNumber
                              min={0}
                              placeholder={
                                q.options ? q.options.length.toString() : "0"
                              }
                            />
                          </Form.Item>
                          <Form.Item name="imagePath">
                            <Input placeholder="Image path (optional)" />
                          </Form.Item>
                          <Button type="primary" htmlType="submit">
                            Lưu
                          </Button>
                          <Button
                            type="text"
                            onClick={() => setAddingOptionFor(null)}
                          >
                            Hủy
                          </Button>
                        </Form>
                      ) : (
                        <Button
                          size="small"
                          type="link"
                          icon={<PlusOutlined />}
                          onClick={() => setAddingOptionFor(q.id)}
                        >
                          Thêm đáp án
                        </Button>
                      )}
                    </div>

                    {/* actions: Edit + Delete */}
                    <div
                      style={{
                        marginTop: 4,
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 8,
                      }}
                    >
                      <Button
                        size="small"
                        type="default"
                        onClick={() => setEditingQuestion(q)}
                      >
                        Edit
                      </Button>
                      <Popconfirm
                        title="Xóa câu hỏi này?"
                        okText="Xóa"
                        cancelText="Hủy"
                        onConfirm={() => handleDeleteQuestion(q)}
                      >
                        <Button size="small" danger>
                          Delete
                        </Button>
                      </Popconfirm>
                    </div>
                  </>
                )}

                <Divider style={{ margin: "10px 0" }} />
              </div>
            </List.Item>
          );
        }}
      />
    ),
  }));

  /* ------------------ render ------------------ */

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
                  <Tag color="green">Total score {currentTest.totalScore}</Tag>
                </>
              )}
              <Tag>{totalQuestions} questions</Tag>
            </Space>
          </div>
        </Space>

        {/* Nút Bulk Import + Finish & Save */}
        <Space>
          {selectedTestId && (
            <Button onClick={() => setBulkOpen(true)}>Bulk Import</Button>
          )}
          <Button
            type="primary"
            onClick={() => navigate("/moderator/jlptevents")}
          >
            Finish &amp; Save
          </Button>
        </Space>
      </div>

      <Row gutter={16}>
        {/* LEFT COLUMN */}
        <Col xs={24} md={10} lg={8}>
          {/* Nếu chưa có test → form tạo test */}
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
              {/* chọn test nếu có nhiều */}
              <Card
                size="small"
                title="Chọn test"
                bordered={false}
                style={{ ...cardStyle, marginBottom: 16 }}
              >
                <Space wrap>
                  {tests.map((t) => (
                    <Button
                      key={t.id}
                      size="small"
                      type={t.id === selectedTestId ? "primary" : "default"}
                      onClick={() => {
                        setSelectedTestId(t.id);
                        setEditingQuestion(null);
                      }}
                    >
                      #{t.id} – {t.level}
                    </Button>
                  ))}
                </Space>
              </Card>

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
            bodyStyle={{ paddingTop: 12 }}
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
