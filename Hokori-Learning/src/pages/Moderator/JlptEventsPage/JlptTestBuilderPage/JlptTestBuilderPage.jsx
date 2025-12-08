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
  updateJlptTestThunk,
  deleteJlptQuestionThunk,
  deleteJlptTestThunk,
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
  Modal,
  Radio,
  Upload,
  Result,
} from "antd";
import { ArrowLeftOutlined, PlusOutlined } from "@ant-design/icons";
import { buildFileUrl } from "../../../../utils/fileUrl.js";
import BulkImportModal from "../../../Teacher/ManageDocument/Quiz/BulkImportModal/BulkImportModal.jsx";
import api from "../../../../configs/axios.js";
import styles from "./JlptTestBuilderPage.module.scss";

const { Text, Title } = Typography;

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

const normalizeAudioPath = (p) => (p ? p.replace(/\s*\/\s*/g, "/").trim() : "");

// audioPath: filePath trong storage (jlpt/tests/12/xxx.m4a)
// audioUrl: BE trả /files/jlpt/tests/12/xxx.m4a
const resolveAudioSrc = (audioPath, audioUrl) => {
  if (audioUrl) {
    // nếu BE trả full URL
    if (/^https?:\/\//i.test(audioUrl)) return audioUrl;
    // nếu là /files/...
    return buildFileUrl(audioUrl.replace(/^\/?files\//, ""));
  }
  if (!audioPath) return null;
  return buildFileUrl(normalizeAudioPath(audioPath));
};

export default function JlptTestBuilderPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const eventFromState = location.state?.event || null;
  const eventLevel = eventFromState?.level || "N5";

  const isTeacherRoute = location.pathname.startsWith("/teacher");
  const basePath = isTeacherRoute ? "/teacher" : "/moderator";

  const {
    testsByEvent = {},
    questionsByTest = {},
    loadingTests,
    loadingQuestions,
    creatingTest,
    creatingQuestion,
    creatingOption,
    updatingQuestion,
    deletingQuestion,
    audioByTest = {},
  } = useSelector((state) => state.jlptModerator || {});

  const [selectedTestId, setSelectedTestId] = useState(null);
  const [addingOptionFor, setAddingOptionFor] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [showCreateTest, setShowCreateTest] = useState(false);
  const [activeTab, setActiveTab] = useState("VOCAB");
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editingTest, setEditingTest] = useState(null);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  const [teacherApprovalStatus, setTeacherApprovalStatus] = useState(null);
  const [checkingTeacher, setCheckingTeacher] = useState(isTeacherRoute);
  const [editQuestionForm] = Form.useForm();
  const [createQuestionForm] = Form.useForm();

  const tests = testsByEvent[eventId] || [];

  const questions = selectedTestId ? questionsByTest[selectedTestId] || [] : [];

  const currentTest =
    tests.find((t) => t.id === selectedTestId) || tests[0] || null;
  const displayLevel = currentTest?.level || eventLevel;
  const isTeacherNotApproved =
    isTeacherRoute &&
    teacherApprovalStatus &&
    teacherApprovalStatus !== "APPROVED";

  // ===== EFFECTS =====
  useEffect(() => {
    if (!eventId) return;

    // Moderator: fetch thẳng
    if (!isTeacherRoute) {
      dispatch(fetchTestsByEventThunk(eventId));
      return;
    }

    // Teacher: check approval trước
    const checkAndFetch = async () => {
      try {
        setCheckingTeacher(true);
        const res = await api.get("/auth/me");
        const user = res.data?.data || res.data;
        const approval = user?.teacher?.approvalStatus || null;

        setTeacherApprovalStatus(approval);

        if (approval === "APPROVED") {
          dispatch(fetchTestsByEventThunk(eventId));
        } else {
          message.warning(
            "Hồ sơ giáo viên của bạn chưa được phê duyệt nên không thể tạo / chỉnh sửa đề JLPT."
          );
        }
      } catch (err) {
        console.error("Check teacher approval failed", err);
        message.error("Không kiểm tra được trạng thái giáo viên hiện tại");
      } finally {
        setCheckingTeacher(false);
      }
    };

    checkAndFetch();
  }, [dispatch, eventId, isTeacherRoute]);

  useEffect(() => {
    if (tests.length > 0 && !selectedTestId) {
      setSelectedTestId(tests[0].id);
    }
    if (tests.length === 0) {
      setSelectedTestId(null);
    }
  }, [tests, selectedTestId]);

  useEffect(() => {
    if (selectedTestId) {
      dispatch(fetchJlptTestQuestionsThunk(selectedTestId));
    }
  }, [dispatch, selectedTestId]);

  useEffect(() => {
    if (editingQuestion) {
      editQuestionForm.setFieldsValue({
        content: editingQuestion.content,
        explanation: editingQuestion.explanation,
        audioPath: editingQuestion.audioPath || editingQuestion.audioUrl || "",
        imagePath: editingQuestion.imagePath || "",
        imageAltText: editingQuestion.imageAltText || "",
        orderIndex: editingQuestion.orderIndex,
      });
    } else {
      editQuestionForm.resetFields();
    }
  }, [editingQuestion, editQuestionForm]);

  // ===== HANDLERS TEST =====

  const handleCreateTest = (values) => {
    if (isTeacherNotApproved) {
      message.error(
        "Hồ sơ giáo viên của bạn chưa được phê duyệt nên không thể tạo JLPT Test."
      );
      return;
    }
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

  const handleUpdateTest = (values) => {
    if (!currentTest) return;

    const payload = {
      ...currentTest,
      ...values,
    };

    dispatch(
      updateJlptTestThunk({
        testId: currentTest.id,
        data: payload,
      })
    ).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        message.success("Cập nhật JLPT Test thành công");
        setEditingTest(null);
        dispatch(fetchTestsByEventThunk(eventId));
      }
    });
  };

  const handleDeleteTest = (testId) => {
    dispatch(deleteJlptTestThunk(testId)).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        message.success("Đã xoá JLPT Test");
        setEditingTest(null);
        if (selectedTestId === testId) {
          setSelectedTestId(null);
        }
        // Gọi lại API để chắc chắn sync với BE
        dispatch(fetchTestsByEventThunk(eventId));
      }
    });
  };

  // ===== HANDLERS QUESTION =====
  const handleCreateQuestion = (values) => {
    if (!selectedTestId) return;

    const nextOrderIndex =
      questions.length === 0
        ? 0
        : Math.max(
            ...questions.map((q) =>
              typeof q.orderIndex === "number" ? q.orderIndex : 0
            )
          ) + 1;

    const questionType = activeTab;
    const uploadedFilePath =
      (currentAudio &&
        currentAudio.testId === selectedTestId &&
        currentAudio.filePath) ||
      audioByTest?.[selectedTestId]?.filePath ||
      "";

    const payloadQuestion = {
      questionType,
      content: values.content,
      explanation: values.explanation,
      orderIndex: nextOrderIndex,
      audioPath:
        questionType === "LISTENING"
          ? normalizeAudioPath(values.audioPath || uploadedFilePath || "")
          : normalizeAudioPath(values.audioPath || ""),
      imagePath: values.imagePath || "",
      imageAltText: values.imageAltText || "",
    };

    const options = values.options || [];
    const correctIndex =
      typeof values.correctOptionIndex === "number"
        ? values.correctOptionIndex
        : 0;

    dispatch(
      createJlptQuestionThunk({
        testId: selectedTestId,
        data: payloadQuestion,
      })
    ).then(async (res) => {
      if (res.meta.requestStatus !== "fulfilled") return;
      const createdQuestionId =
        res.payload?.question?.id || res.payload?.id || res.payload?.questionId;

      if (!createdQuestionId) {
        message.warning(
          "Tạo câu hỏi thành công nhưng không xác định được ID để tạo đáp án"
        );
        dispatch(fetchJlptTestQuestionsThunk(selectedTestId));
        return;
      }

      for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        if (!opt || !opt.content || !opt.content.trim()) continue;

        await dispatch(
          createJlptOptionThunk({
            questionId: createdQuestionId,
            data: {
              content: opt.content.trim(),
              correct: i === correctIndex,
              orderIndex: i,
              imagePath: "",
              imageAltText: "",
            },
          })
        );
      }

      message.success("Đã tạo câu hỏi và đáp án");
      dispatch(fetchJlptTestQuestionsThunk(selectedTestId));
      createQuestionForm.resetFields();
      createQuestionForm.setFieldsValue({
        questionType,
        correctOptionIndex: 0,
        options: [{}, {}, {}, {}],
      });
    });
  };

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

  const handleCreateOption = (questionId, values, currentOptions = []) => {
    if (!questionId) return;
    const payload = {
      ...values,
      orderIndex:
        typeof values.orderIndex === "number"
          ? values.orderIndex
          : currentOptions.length,
    };

    dispatch(
      createJlptOptionThunk({
        questionId,
        data: payload,
      })
    ).then((res) => {
      if (res.meta.requestStatus === "fulfilled" && selectedTestId) {
        message.success("Đã thêm đáp án");
        setAddingOptionFor(null);
        dispatch(fetchJlptTestQuestionsThunk(selectedTestId));
      }
    });
  };

  // ===== BULK IMPORT =====
  const handleBulkDone = async (
    bulkQuestions = [],
    bulkQuestionType,
    testAudioForBulk
  ) => {
    if (!selectedTestId) {
      message.error("Hãy chọn test trước khi bulk import");
      return;
    }
    if (!bulkQuestions.length) {
      message.warning("Không có câu hỏi nào được import");
      return;
    }

    const isListeningGroup = bulkQuestionType === "LISTENING";

    const defaultType = QUESTION_TYPES.includes(bulkQuestionType)
      ? bulkQuestionType
      : QUESTION_TYPES.includes(activeTab)
      ? activeTab
      : "VOCAB";

    const uploadedFilePath =
      (testAudioForBulk && testAudioForBulk.filePath) ||
      audioByTest?.[selectedTestId]?.filePath ||
      (currentAudio &&
        currentAudio.testId === selectedTestId &&
        currentAudio.filePath) ||
      "";

    if (isListeningGroup && !uploadedFilePath) {
      message.error(
        "Hãy upload audio Listening cho JLPT Test này trước khi bulk import Nghe hiểu."
      );
      return;
    }

    try {
      const baseIndex =
        questions.length === 0
          ? 0
          : Math.max(
              ...questions.map((q) =>
                typeof q.orderIndex === "number" ? q.orderIndex : 0
              )
            ) + 1;

      for (let i = 0; i < bulkQuestions.length; i++) {
        const q = bulkQuestions[i];
        const orderIndex = baseIndex + i;

        const txtAudioPath =
          q.audioPath && typeof q.audioPath === "string"
            ? q.audioPath.trim()
            : "";

        const questionType = isListeningGroup ? "LISTENING" : defaultType;

        const finalAudioPath = isListeningGroup
          ? uploadedFilePath
          : normalizeAudioPath(txtAudioPath || "");

        const questionRes = await dispatch(
          createJlptQuestionThunk({
            testId: selectedTestId,
            data: {
              questionType,
              content: q.text || q.question || q.content || "",
              explanation: q.explanation || "",
              audioPath: finalAudioPath,
              imagePath: q.imagePath || "",
              imageAltText: q.imageAltText || "",
              orderIndex,
            },
          })
        );

        if (questionRes.meta.requestStatus !== "fulfilled") continue;

        const createdQuestionId =
          questionRes.payload?.question?.id ||
          questionRes.payload?.id ||
          questionRes.payload?.questionId;

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
        `Đã import ${bulkQuestions.length} câu hỏi vào nhóm ${
          QUESTION_TYPE_LABEL[isListeningGroup ? "LISTENING" : defaultType]
        }`
      );
      setBulkOpen(false);
      dispatch(fetchJlptTestQuestionsThunk(selectedTestId));
    } catch (e) {
      console.error(e);
      message.error("Bulk import JLPT test thất bại");
    }
  };

  // ===== UPLOAD AUDIO (dùng axios trực tiếp) =====
  const handleUploadAudio = async (file) => {
    if (!selectedTestId) {
      message.error("Hãy chọn JLPT Test trước khi upload audio");
      return false;
    }

    try {
      setUploadingAudio(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post(
        `/jlpt/tests/${selectedTestId}/files`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const { filePath, url } = res.data || {};
      console.log("Upload listening audio OK >>>", { filePath, url });

      if (filePath) {
        const normalized = normalizeAudioPath(filePath);

        setCurrentAudio({
          testId: selectedTestId,
          filePath: normalized,
          url,
        });

        createQuestionForm.setFieldsValue({
          audioPath: normalized,
        });

        setActiveTab("LISTENING");
      }

      dispatch(fetchJlptTestQuestionsThunk(selectedTestId));
      dispatch(fetchTestsByEventThunk(eventId));

      message.success("Upload audio Listening thành công");
    } catch (err) {
      console.error("Upload listening audio FAILED >>>", err);
      message.error("Upload audio Listening thất bại");
    } finally {
      setUploadingAudio(false);
    }

    return false;
  };

  // ===== DERIVED =====
  const totalQuestions = questions.length;

  const byType = QUESTION_TYPES.reduce((acc, type) => {
    acc[type] = questions.filter((q) => q.questionType === type);
    return acc;
  }, {});

  const listeningQuestions = byType["LISTENING"] || [];

  const testAudio =
    (currentAudio && currentAudio.testId === selectedTestId && currentAudio) ||
    audioByTest[selectedTestId];

  const listeningAudioSrc = (() => {
    if (testAudio) {
      return resolveAudioSrc(testAudio.filePath, testAudio.url);
    }

    if (listeningQuestions.length > 0) {
      const q0 = listeningQuestions[0];
      return resolveAudioSrc(q0.audioPath, q0.audioUrl);
    }

    return null;
  })();

  useEffect(() => {
    // Chỉ xử lý khi đang ở tab Listening
    if (activeTab === "LISTENING" && testAudio?.filePath) {
      createQuestionForm.setFieldsValue({
        audioPath: testAudio.filePath,
      });
    }
  }, [activeTab, testAudio?.filePath, createQuestionForm, selectedTestId]);

  // NEW: Validate đủ câu hỏi cho các tab & hoàn tất
  const handleFinishBuildTest = () => {
    if (!selectedTestId) {
      message.warning("Hãy chọn một JLPT Test trước khi hoàn tất.");
      return;
    }

    const missingTypes = QUESTION_TYPES.filter(
      (type) => (byType[type] || []).length === 0
    );

    if (missingTypes.length > 0) {
      const labels = missingTypes.map((t) => QUESTION_TYPE_LABEL[t]).join(", ");
      message.error(
        `Đề JLPT hiện còn thiếu câu hỏi cho các phần: ${labels}. Vui lòng bổ sung trước khi hoàn tất.`
      );
      return;
    }

    message.success("Đề JLPT đã đầy đủ câu hỏi cho 4 kỹ năng.");
    navigate(`${basePath}/jlptevents`);
  };

  // ===== TABS =====
  const tabItems = QUESTION_TYPES.map((type) => {
    const data = byType[type] || [];

    if (type !== "LISTENING") {
      return {
        key: type,
        label: (
          <Space>
            <Tag color={QUESTION_TYPE_COLOR[type]}>
              {QUESTION_TYPE_LABEL[type]}
            </Tag>
            <Tag>{data.length}</Tag>
          </Space>
        ),
        children: (
          <List
            dataSource={data}
            loading={loadingQuestions}
            rowKey={(q) => q.id}
            locale={{
              emptyText: "Chưa có câu hỏi nào cho kỹ năng này",
            }}
            renderItem={(q) => {
              const audioSrc = resolveAudioSrc(q.audioPath, q.audioUrl);
              return (
                <List.Item>
                  <div className={styles.questionItem}>
                    <div className={styles.questionRow}>
                      <Space align="start" className={styles.questionMain}>
                        <Tag>
                          {(typeof q.orderIndex === "number"
                            ? q.orderIndex
                            : 0) + 1}
                        </Tag>
                        <div className={styles.questionContent}>
                          <Text strong>{q.content}</Text>
                          {q.explanation && (
                            <Text type="secondary">
                              Giải thích: {q.explanation}
                            </Text>
                          )}
                          {audioSrc && (
                            <audio
                              className={styles.audio}
                              controls
                              src={audioSrc}
                            />
                          )}
                          {q.imagePath && (
                            <img
                              className={styles.image}
                              src={buildFileUrl(q.imagePath)}
                              alt={q.imageAltText || "question-img"}
                            />
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

                    <div className={styles.questionOptions}>
                      <Text type="secondary">Đáp án:</Text>
                      <div style={{ marginTop: 4 }}>
                        {q.options?.map((op) => (
                          <div key={op.id} className={styles.optionRow}>
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

                      <div className={styles.inlineAddOption}>
                        {addingOptionFor === q.id ? (
                          <Form
                            layout="inline"
                            size="small"
                            onFinish={(values) =>
                              handleCreateOption(q.id, values, q.options || [])
                            }
                          >
                            <Form.Item
                              name="content"
                              rules={[
                                {
                                  required: true,
                                  message: "Option content",
                                },
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
      };
    }

    // LISTENING tab
    return {
      key: type,
      label: (
        <Space>
          <Tag color={QUESTION_TYPE_COLOR[type]}>
            {QUESTION_TYPE_LABEL[type]}
          </Tag>
          <Tag>{data.length}</Tag>
        </Space>
      ),
      children: (
        <>
          {listeningAudioSrc && (
            <div style={{ marginBottom: 16 }}>
              <Text strong>Audio Listening (dùng cho tất cả câu bên dưới)</Text>
              <div>
                <audio
                  className={styles.audio}
                  controls
                  src={listeningAudioSrc}
                />
              </div>
            </div>
          )}

          <List
            dataSource={data}
            loading={loadingQuestions}
            rowKey={(q) => q.id}
            locale={{
              emptyText: "Chưa có câu hỏi nào cho phần Nghe hiểu",
            }}
            renderItem={(q) => (
              <List.Item>
                <div className={styles.questionItem}>
                  <div className={styles.questionRow}>
                    <Space align="start" className={styles.questionMain}>
                      <Tag>
                        {(typeof q.orderIndex === "number" ? q.orderIndex : 0) +
                          1}
                      </Tag>
                      <div className={styles.questionContent}>
                        <Text strong>{q.content}</Text>
                        {q.explanation && (
                          <Text type="secondary">
                            Giải thích: {q.explanation}
                          </Text>
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

                  <div className={styles.questionOptions}>
                    <Text type="secondary">Đáp án:</Text>
                    <div style={{ marginTop: 4 }}>
                      {q.options?.map((op) => (
                        <div key={op.id} className={styles.optionRow}>
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

                    <div className={styles.inlineAddOption}>
                      {addingOptionFor === q.id ? (
                        <Form
                          layout="inline"
                          size="small"
                          onFinish={(values) =>
                            handleCreateOption(q.id, values, q.options || [])
                          }
                        >
                          <Form.Item
                            name="content"
                            rules={[
                              {
                                required: true,
                                message: "Option content",
                              },
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
            )}
          />
        </>
      ),
    };
  });

  // ===== RENDER =====
  if (isTeacherRoute && checkingTeacher) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Space align="center" className={styles.headerLeft}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(`${basePath}/jlptevents`)}
            >
              Back
            </Button>
            <div>
              <Title level={3} style={{ margin: 0 }}>
                JLPT Test Builder – Event #{eventId}
              </Title>
            </div>
          </Space>
        </div>

        <Card className={styles.card}>Đang kiểm tra hồ sơ giáo viên...</Card>
      </div>
    );
  }

  // TEACHER: chưa được approve → cấm vào builder
  if (isTeacherNotApproved) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Space align="center" className={styles.headerLeft}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(`${basePath}/jlptevents`)}
            >
              Back
            </Button>
            <div>
              <Title level={3} style={{ margin: 0 }}>
                JLPT Test Builder – Event #{eventId}
              </Title>
            </div>
          </Space>
        </div>

        <Card className={styles.card}>
          <Result
            status="warning"
            title="Hồ sơ giáo viên chưa được phê duyệt"
            subTitle="Bạn cần được phê duyệt hồ sơ trước khi tạo hoặc chỉnh sửa đề JLPT."
            extra={
              <Button
                type="primary"
                onClick={() => navigate("/teacher/profile")}
              >
                Đi đến hồ sơ giáo viên
              </Button>
            }
          />
        </Card>
      </div>
    );
  }
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <Space align="center" className={styles.headerLeft}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(`${basePath}/jlptevents`)}
          >
            Back
          </Button>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              JLPT Test Builder – Event #{eventId}
            </Title>
            <Space size="small" style={{ marginTop: 4 }}>
              <Tag color="blue">Level {displayLevel}</Tag>
              {currentTest && (
                <>
                  <Tag color="purple">
                    Duration {currentTest.durationMin} min
                  </Tag>
                </>
              )}
            </Space>
          </div>
        </Space>

        <Space>
          <Button
            type="default"
            onClick={() => {
              setBulkOpen(true);
            }}
            disabled={!selectedTestId}
          >
            Bulk Import câu hỏi
          </Button>
          {/* NEW: nút Hoàn tất */}
          <Button
            type="primary"
            onClick={handleFinishBuildTest}
            disabled={!selectedTestId || loadingQuestions}
          >
            Hoàn tất
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
              className={styles.card}
            >
              <Form
                layout="vertical"
                onFinish={handleCreateTest}
                initialValues={{
                  level: displayLevel,
                  durationMin: 60,
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
              <Card
                title={`Danh sách JLPT Test của Event #${eventId}`}
                bordered={false}
                className={styles.card}
                style={{ marginBottom: 16 }}
              >
                <List
                  dataSource={tests}
                  itemLayout="horizontal"
                  loading={loadingTests}
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
                          setEditingTest(null);
                        }}
                        actions={[
                          <Button
                            key="edit"
                            size="small"
                            type="link"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTestId(t.id);
                              setEditingTest(t);
                            }}
                          >
                            Sửa
                          </Button>,
                          <Popconfirm
                            key="delete"
                            title="Xoá JLPT Test này? (xoá luôn tất cả câu hỏi)"
                            okText="Xoá"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                            onConfirm={(e) => {
                              e.stopPropagation();
                              handleDeleteTest(t.id);
                            }}
                          >
                            <Button size="small" type="link" danger>
                              Xoá
                            </Button>
                          </Popconfirm>,
                        ]}
                      >
                        <List.Item.Meta
                          title={
                            <Space>
                              <b>Test #{t.id}</b>
                              <Tag color="blue">{t.level}</Tag>
                              <Tag>{t.durationMin || 60} phút</Tag>
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

              {editingTest && (
                <Card
                  title={`Chỉnh sửa JLPT Test #${editingTest.id}`}
                  bordered={false}
                  className={styles.card}
                  style={{ marginBottom: 16 }}
                >
                  <Form
                    key={editingTest.id}
                    layout="vertical"
                    onFinish={handleUpdateTest}
                    initialValues={{
                      level: editingTest.level,
                      durationMin: editingTest.durationMin,
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

                    <Space
                      style={{ width: "100%", justifyContent: "flex-end" }}
                    >
                      <Button onClick={() => setEditingTest(null)}>Hủy</Button>
                      <Button type="primary" htmlType="submit">
                        Lưu thay đổi
                      </Button>
                    </Space>
                  </Form>
                </Card>
              )}

              {/* Upload audio Listening cho Test - luôn hiện khi đã chọn test */}
              {selectedTestId && activeTab === "LISTENING" && (
                <Card
                  title="Audio Listening cho JLPT Test"
                  bordered={false}
                  className={styles.card}
                  style={{ marginBottom: 16 }}
                >
                  <p style={{ marginBottom: 8 }}>
                    1 audio dùng cho toàn bộ câu hỏi Nghe hiểu của test này.
                  </p>

                  <Upload
                    showUploadList={false}
                    beforeUpload={handleUploadAudio}
                    accept=".mp3,.wav,.m4a,.aac,.ogg,.flac,.webm,.opus"
                  >
                    <Button loading={uploadingAudio}>
                      Upload audio Listening
                    </Button>
                  </Upload>

                  {testAudio && (
                    <div style={{ marginTop: 12 }}>
                      <Text type="secondary">Đã upload file:</Text>
                      <div style={{ marginTop: 4 }}>
                        <code style={{ fontSize: 12 }}>
                          {testAudio.filePath}
                        </code>
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <audio
                          controls
                          src={resolveAudioSrc(
                            testAudio.filePath,
                            testAudio.url
                          )}
                          className={styles.audio}
                        />
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {showCreateTest && (
                <Card
                  title="Tạo JLPT Test mới"
                  bordered={false}
                  className={styles.card}
                  style={{ marginBottom: 16 }}
                >
                  <Form
                    layout="vertical"
                    onFinish={(values) => {
                      handleCreateTest(values);
                      setShowCreateTest(false);
                    }}
                    initialValues={{
                      level: displayLevel,
                      durationMin: 60,
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

              <Card
                title={
                  <>
                    Thêm câu hỏi mới{" "}
                    <Tag color={QUESTION_TYPE_COLOR[activeTab]}>
                      {QUESTION_TYPE_LABEL[activeTab]}
                    </Tag>
                  </>
                }
                bordered={false}
                className={styles.card}
              >
                <Form
                  form={createQuestionForm}
                  layout="vertical"
                  onFinish={handleCreateQuestion}
                  initialValues={{
                    options: [{}, {}, {}, {}],
                    correctOptionIndex: 0,
                  }}
                >
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

                  <div className={styles.answersBlock}>
                    <Text strong>Đáp án (4 lựa chọn)</Text>

                    <Form.Item
                      name={["options", 0, "content"]}
                      label="Đáp án A"
                      rules={[{ required: true, message: "Nhập đáp án A" }]}
                    >
                      <Input />
                    </Form.Item>
                    <Form.Item
                      name={["options", 1, "content"]}
                      label="Đáp án B"
                      rules={[{ required: true, message: "Nhập đáp án B" }]}
                    >
                      <Input />
                    </Form.Item>
                    <Form.Item
                      name={["options", 2, "content"]}
                      label="Đáp án C"
                      rules={[{ required: true, message: "Nhập đáp án C" }]}
                    >
                      <Input />
                    </Form.Item>
                    <Form.Item
                      name={["options", 3, "content"]}
                      label="Đáp án D"
                      rules={[{ required: true, message: "Nhập đáp án D" }]}
                    >
                      <Input />
                    </Form.Item>

                    <Form.Item
                      name="correctOptionIndex"
                      label="Đáp án đúng"
                      rules={[{ required: true, message: "Chọn đáp án đúng" }]}
                    >
                      <Radio.Group>
                        <Radio value={0}>A</Radio>
                        <Radio value={1}>B</Radio>
                        <Radio value={2}>C</Radio>
                        <Radio value={3}>D</Radio>
                      </Radio.Group>
                    </Form.Item>
                  </div>

                  {activeTab === "LISTENING" && (
                    <Form.Item
                      name="audioPath"
                      label="Audio path (chỉ dùng cho LISTENING)"
                    >
                      <Input placeholder="(trống = dùng audio đã upload cho test)" />
                    </Form.Item>
                  )}

                  <Form.Item name="imagePath" label="Image path (optional)">
                    <Input />
                  </Form.Item>
                  <Form.Item name="imageAltText" label="Image alt text">
                    <Input />
                  </Form.Item>

                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    loading={creatingQuestion}
                  >
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
            className={styles.card}
          >
            <Tabs
              activeKey={activeTab}
              onChange={(key) => {
                setActiveTab(key);
                setEditingQuestion(null);
              }}
              items={tabItems}
            />
            {totalQuestions === 0 && (
              <Text type="secondary">
                Chưa có câu hỏi nào. Hãy chọn kỹ năng ở tab phía trên, sau đó
                thêm câu hỏi ở panel bên trái hoặc dùng Bulk Import.
              </Text>
            )}
          </Card>
        </Col>
      </Row>

      {/* Modal edit question */}
      <Modal
        open={!!editingQuestion}
        title={
          editingQuestion
            ? `Chỉnh sửa câu hỏi #${editingQuestion.id}`
            : "Chỉnh sửa câu hỏi"
        }
        onCancel={() => setEditingQuestion(null)}
        onOk={() => editQuestionForm.submit()}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form
          form={editQuestionForm}
          layout="vertical"
          onFinish={(values) => {
            if (editingQuestion) {
              handleUpdateQuestion(editingQuestion, values);
            }
          }}
        >
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
          <Form.Item name="orderIndex" label="Thứ tự (orderIndex)">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="audioPath" label="Audio path">
            <Input />
          </Form.Item>
          <Form.Item name="imagePath" label="Image path">
            <Input />
          </Form.Item>
          <Form.Item name="imageAltText" label="Image alt text">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      {selectedTestId && (
        <BulkImportModal
          open={bulkOpen}
          onCancel={() => setBulkOpen(false)}
          onDone={(parsedQuestions) =>
            handleBulkDone(parsedQuestions, activeTab, testAudio)
          }
        />
      )}
    </div>
  );
}
