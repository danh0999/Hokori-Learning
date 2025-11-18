// src/pages/Moderator/JlptTestBuilderPage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTestsByEventThunk,
  createJlptTestForEventThunk,
  fetchJlptTestQuestionsThunk,
  createJlptQuestionThunk,
  createJlptOptionThunk,
} from "../../redux/features/jlptModeratorSlice";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  List,
  Typography,
  Tag,
} from "antd";

const { Text } = Typography;
const QUESTION_TYPES = ["VOCAB", "GRAMMAR", "READING", "LISTENING"];

export default function JlptTestBuilderPage() {
  const { eventId } = useParams();
  const dispatch = useDispatch();
  const { testsByEvent, questionsByTest, creatingTest } = useSelector(
    (state) => state.jlptModerator
  );

  const [selectedTestId, setSelectedTestId] = useState(null);

  const tests = testsByEvent[eventId] || [];
  const questions = selectedTestId ? questionsByTest[selectedTestId] || [] : [];

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

  const handleCreateTest = (values) => {
    dispatch(
      createJlptTestForEventThunk({
        eventId,
        payload: values,
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
    dispatch(
      createJlptQuestionThunk({
        testId: selectedTestId,
        payload: values,
      })
    );
  };

  const handleCreateOption = (questionId, values) => {
    dispatch(
      createJlptOptionThunk({
        questionId,
        payload: values,
      })
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>JLPT Test Builder – Event #{eventId}</h2>

      {/* ------ Nếu chưa có test: form tạo test ------ */}
      {tests.length === 0 && (
        <Card
          title="Create JLPT Test for this Event"
          style={{ marginBottom: 24 }}
        >
          <Form
            layout="vertical"
            onFinish={handleCreateTest}
            initialValues={{
              level: "N5",
              durationMin: 60,
              totalScore: 60,
              resultNote: "",
            }}
          >
            <Form.Item name="level" label="Level" rules={[{ required: true }]}>
              <Select
                options={["N5", "N4", "N3", "N2", "N1"].map((lv) => ({
                  label: lv,
                  value: lv,
                }))}
              />
            </Form.Item>
            <Form.Item
              name="durationMin"
              label="Duration (minutes)"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} />
            </Form.Item>
            <Form.Item
              name="totalScore"
              label="Total score"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} />
            </Form.Item>
            <Form.Item name="resultNote" label="Result note">
              <Input.TextArea rows={2} />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={creatingTest}>
              Create Test
            </Button>
          </Form>
        </Card>
      )}

      {/* ------ Nếu đã có test: chọn test & build question ------ */}
      {tests.length > 0 && (
        <>
          <Card title="Select Test" size="small" style={{ marginBottom: 16 }}>
            <Space wrap>
              {tests.map((t) => (
                <Button
                  key={t.id}
                  type={t.id === selectedTestId ? "primary" : "default"}
                  onClick={() => setSelectedTestId(t.id)}
                >
                  Test #{t.id} – Level {t.level}
                </Button>
              ))}
            </Space>
          </Card>

          {/* Form tạo question */}
          <Card title="Create Question" style={{ marginBottom: 24 }}>
            <Form layout="vertical" onFinish={handleCreateQuestion}>
              <Form.Item
                name="content"
                label="Question content"
                rules={[{ required: true }]}
              >
                <Input.TextArea rows={2} />
              </Form.Item>

              <Form.Item
                name="questionType"
                label="Question type"
                rules={[{ required: true }]}
              >
                <Select
                  options={QUESTION_TYPES.map((qt) => ({
                    label: qt,
                    value: qt,
                  }))}
                />
              </Form.Item>

              <Form.Item name="explanation" label="Explanation">
                <Input.TextArea rows={2} />
              </Form.Item>

              <Form.Item
                name="orderIndex"
                label="Order index"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} />
              </Form.Item>

              {/* Nếu là LISTENING hoặc có hình, moderator tự nhập path (sau này có upload UI riêng) */}
              <Form.Item name="audioPath" label="Audio path (for LISTENING)">
                <Input />
              </Form.Item>
              <Form.Item name="imagePath" label="Image path (optional)">
                <Input />
              </Form.Item>
              <Form.Item name="imageAltText" label="Image alt text">
                <Input />
              </Form.Item>

              <Button type="primary" htmlType="submit">
                Add Question
              </Button>
            </Form>
          </Card>

          {/* List câu hỏi + form thêm option cho từng câu */}
          <Card title="Questions Preview">
            <List
              dataSource={questions}
              rowKey={(q) => q.id}
              renderItem={(q) => (
                <List.Item>
                  <div style={{ width: "100%" }}>
                    <Text strong>
                      Q{q.orderIndex + 1}. [{q.questionType}] {q.content}
                    </Text>
                    <div>
                      {q.audioPath && (
                        <div>
                          <audio controls src={q.audioPath} />
                        </div>
                      )}
                      {q.imagePath && (
                        <img
                          src={q.imagePath}
                          alt={q.imageAltText}
                          style={{
                            maxWidth: 200,
                            display: "block",
                            marginTop: 8,
                          }}
                        />
                      )}
                    </div>

                    <div style={{ marginTop: 8, marginBottom: 8 }}>
                      {(q.options || []).map((op) => (
                        <div key={op.id}>
                          <Tag color={op.correct ? "green" : "default"}>
                            {op.orderIndex + 1}
                          </Tag>{" "}
                          {op.content}
                        </div>
                      ))}
                    </div>

                    <Form
                      layout="inline"
                      onFinish={(values) => handleCreateOption(q.id, values)}
                    >
                      <Form.Item
                        name="content"
                        rules={[{ required: true, message: "Option content" }]}
                      >
                        <Input placeholder="New option" />
                      </Form.Item>
                      <Form.Item name="correct" initialValue={false}>
                        <Select
                          style={{ width: 90 }}
                          options={[
                            { label: "False", value: false },
                            { label: "True", value: true },
                          ]}
                        />
                      </Form.Item>
                      <Form.Item
                        name="orderIndex"
                        initialValue={(q.options || []).length}
                      >
                        <InputNumber min={0} />
                      </Form.Item>
                      <Form.Item name="imagePath">
                        <Input placeholder="Img path (optional)" />
                      </Form.Item>
                      <Button type="dashed" htmlType="submit">
                        Add option
                      </Button>
                    </Form>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </>
      )}
    </div>
  );
}
