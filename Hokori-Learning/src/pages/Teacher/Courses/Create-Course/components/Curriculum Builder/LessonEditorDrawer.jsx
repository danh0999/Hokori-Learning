// src/pages/Teacher/Courses/Create-Course/components/Curriculum Builder/LessonEditorDrawer.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Drawer,
  Tabs,
  Input,
  Form,
  Button,
  Upload,
  Space,
  message,
  Typography,
  Spin,
} from "antd";
import { InboxOutlined, PlusOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";

import QuizList from "../../../../ManageDocument/Quiz/QuizList/QuizList.jsx";
import QuizBuilderModal from "../../../../ManageDocument/Quiz/QuizBuilderModal/QuizBuilderModal.jsx";
import ImportQuizModal from "../../../../ManageDocument/Quiz/QuizBuilderModal/ImportQuizModal.jsx";
import BulkImportModal from "../../../../ManageDocument/Quiz/BulkImportModal/BulkImportModal.jsx";

import api from "../../../../../../configs/axios";
import {
  createSectionThunk,
  createContentThunk,
  updateContentThunk,
  updateLessonThunk,
  fetchCourseTree,
  uploadSectionFileThunk,
} from "../../../../../../redux/features/teacherCourseSlice.js";

import styles from "./styles.module.scss";

const { TextArea } = Input;
const { Text } = Typography;

const buildFileUrl = (filePath) => {
  if (!filePath) return null;
  if (/^https?:\/\//i.test(filePath)) return filePath;
  return `${window.location.origin}/files/${filePath}`.replace(
    /([^:]\/)\/+/g,
    "$1"
  );
};

// map FE question.type -> BE questionType
const mapQuestionType = (type) => {
  if (type === "multiple") return "MULTIPLE_CHOICE";
  return "SINGLE_CHOICE";
};

/**
 * Props:
 *  - open
 *  - lesson   : lesson object trong currentCourseTree (id, title, sections, ...)
 *  - onClose  : đóng drawer
 *  - onSave?  : callback sau khi save (CurriculumBuilder sẽ dùng để reload tree nếu cần)
 */
export default function LessonEditorDrawer({ open, lesson, onClose, onSave }) {
  const dispatch = useDispatch();

  const { currentCourseTree, currentCourseMeta } = useSelector(
    (state) => state.teacherCourse
  );

  const [form] = Form.useForm();

  const [uploading, setUploading] = useState(false);
  const [videoFile, setVideoFile] = useState(null); // File user vừa chọn
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null); // URL preview (server hoặc objectURL)

  const [videoContentId, setVideoContentId] = useState(null);
  const [descContentId, setDescContentId] = useState(null);

  // ==== QUIZ STATE ====
  const [lessonQuiz, setLessonQuiz] = useState(null); // quiz meta từ BE
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizSaving, setQuizSaving] = useState(false);

  const [openQuizModal, setOpenQuizModal] = useState(false);
  const [openImportModal, setOpenImportModal] = useState(false);
  const [openBulkModal, setOpenBulkModal] = useState(false);
  const [builderInitialQuiz, setBuilderInitialQuiz] = useState(null);

  // Lấy lesson mới nhất từ currentCourseTree (tránh dùng bản stale truyền từ props)
  const lessonFromTree = useMemo(() => {
    if (!lesson?.id || !currentCourseTree?.chapters) return lesson;
    for (const ch of currentCourseTree.chapters) {
      const l = (ch.lessons || []).find((x) => x.id === lesson.id);
      if (l) return l;
    }
    return lesson;
  }, [lesson, currentCourseTree]);

  // Tìm "main section" + 3 content (video ASSET, description RICH_TEXT, quiz QUIZ_REF)
  const mainSectionInfo = useMemo(() => {
    const les = lessonFromTree;
    if (!les) {
      return {
        section: null,
        assetContent: null,
        descContent: null,
        quizContent: null,
      };
    }

    const section = (les.sections && les.sections[0]) || null;
    if (!section) {
      return {
        section: null,
        assetContent: null,
        descContent: null,
        quizContent: null,
      };
    }

    let assetContent = null;
    let descContent = null;
    let quizContent = null;

    (section.contents || []).forEach((c) => {
      if (c.contentFormat === "ASSET" && c.primaryContent) {
        assetContent = c;
      }
      if (c.contentFormat === "RICH_TEXT" && !c.primaryContent) {
        descContent = c;
      }
      if (c.contentFormat === "QUIZ_REF") {
        quizContent = c;
      }
    });

    return { section, assetContent, descContent, quizContent };
  }, [lessonFromTree]);

  // Đổ dữ liệu vào form + set trạng thái video/desc hiện có
  useEffect(() => {
    form.setFieldsValue({
      title: lessonFromTree?.title || "",
      description: mainSectionInfo.descContent?.richText || "",
    });

    // video hiện có từ BE (filePath)
    if (mainSectionInfo.assetContent) {
      setVideoContentId(mainSectionInfo.assetContent.id);
      const path = mainSectionInfo.assetContent.filePath;
      setVideoPreviewUrl(buildFileUrl(path));
      setVideoFile(null); // đây là file từ server, không phải File object
    } else {
      setVideoContentId(null);
      setVideoPreviewUrl(null);
      setVideoFile(null);
    }

    // description content id
    if (mainSectionInfo.descContent?.id) {
      setDescContentId(mainSectionInfo.descContent.id);
    } else {
      setDescContentId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonFromTree, mainSectionInfo.section?.id]); // tránh loop

  // ===== QUIZ: load từ BE khi mở drawer =====
  useEffect(() => {
    if (!open || !lessonFromTree?.id) return;

    const loadQuiz = async () => {
      setQuizLoading(true);
      try {
        const res = await api.get(
          `teacher/lessons/${lessonFromTree.id}/quizzes`
        );
        const data = res.data;
        const q = Array.isArray(data) ? data[0] : data;
        setLessonQuiz(q || null);
      } catch (err) {
        const statusCode = err?.response?.status;
        const msg = err?.response?.data?.message;

        // BE trả "Quiz not found for this lesson" -> coi như chưa có quiz, không báo lỗi
        if (statusCode === 404 || msg === "Quiz not found for this lesson") {
          setLessonQuiz(null);
        } else {
          console.error(err);
          message.error("Không tải được quiz của lesson.");
        }
      } finally {
        setQuizLoading(false);
      }
    };

    loadQuiz();
  }, [open, lessonFromTree?.id]);

  // chọn file video (không upload ngay, chỉ lưu vào state)
  const handleSelectVideoFile = ({ file, onSuccess }) => {
    if (videoPreviewUrl && videoPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
    onSuccess?.("ok");
  };

  // Save lesson: update lesson title + Section + Contents + upload file nếu có
  const handleSaveLesson = async () => {
    if (!lessonFromTree?.id) {
      message.error("Thiếu lessonId.");
      return;
    }

    const values = await form.validateFields();
    const { title, description } = values;

    try {
      setUploading(true);

      // 1. Update title lesson nếu đổi
      if (title && title !== lessonFromTree.title) {
        await dispatch(
          updateLessonThunk({
            lessonId: lessonFromTree.id,
            data: { title },
          })
        ).unwrap();
      }

      // 2. Đảm bảo có "main section"
      let section = mainSectionInfo.section;
      if (!section) {
        const createSecPayload = await dispatch(
          createSectionThunk({
            lessonId: lessonFromTree.id,
            data: {
              title: "Main section",
              orderIndex: 1,
              studyType: "GRAMMAR",
              flashcardSetId: null,
            },
          })
        ).unwrap();
        section = createSecPayload.section || createSecPayload;
      }

      // 3. Xử lý video: nếu user chọn file mới -> upload files API
      let filePath = mainSectionInfo.assetContent?.filePath || null;

      if (videoFile) {
        const uploadRes = await dispatch(
          uploadSectionFileThunk({ sectionId: section.id, file: videoFile })
        ).unwrap();

        // BE doc: { filePath, url }
        filePath =
          uploadRes.filePath ||
          uploadRes.path ||
          uploadRes.relativePath ||
          filePath;
      }

      if (filePath) {
        // có filePath -> tạo / update Content ASSET
        const baseData = {
          orderIndex: mainSectionInfo.assetContent?.orderIndex || 1,
          contentFormat: "ASSET",
          primaryContent: true,
          filePath,
          richText: null,
          quizId: null,
          flashcardSetId: null,
        };

        if (videoContentId) {
          await dispatch(
            updateContentThunk({
              contentId: videoContentId,
              data: baseData,
            })
          ).unwrap();
        } else {
          await dispatch(
            createContentThunk({
              sectionId: section.id,
              data: {
                ...baseData,
                orderIndex: (section.contents?.length || 0) + 1,
              },
            })
          ).unwrap();
        }
      }

      // 4. Content mô tả (RICH_TEXT)
      if (description && description.trim()) {
        const baseDesc = {
          orderIndex: mainSectionInfo.descContent?.orderIndex || 99,
          contentFormat: "RICH_TEXT",
          primaryContent: false,
          filePath: null,
          richText: description,
          quizId: null,
          flashcardSetId: null,
        };

        if (descContentId) {
          await dispatch(
            updateContentThunk({
              contentId: descContentId,
              data: baseDesc,
            })
          ).unwrap();
        } else {
          await dispatch(
            createContentThunk({
              sectionId: section.id,
              data: {
                ...baseDesc,
                orderIndex: (section.contents?.length || 0) + 1,
              },
            })
          ).unwrap();
        }
      }

      // 5. Reload lại course tree từ BE
      if (currentCourseMeta?.id) {
        await dispatch(fetchCourseTree(currentCourseMeta.id));
      }

      message.success("Đã lưu lesson content.");
      onSave?.({ ...lessonFromTree, title });
      onClose?.();
    } catch (err) {
      console.error(err);
      message.error("Lưu lesson content thất bại.");
    } finally {
      setUploading(false);
    }
  };

  // ===== QUIZ HANDLERS =====
  const loadLessonQuiz = async () => {
    if (!lessonFromTree?.id) return;
    try {
      setQuizLoading(true);
      const res = await api.get(`teacher/lessons/${lessonFromTree.id}/quizzes`);
      // BE trả 1 quiz cho 1 lesson, hoặc null
      setLessonQuiz(res.data?.data ?? null);
    } catch (err) {
      // 404 -> lesson chưa có quiz -> coi như null
      if (err.response?.status === 404) {
        setLessonQuiz(null);
      } else {
        console.error("Load lesson quiz failed", err);
      }
    } finally {
      setQuizLoading(false);
    }
  };
  useEffect(() => {
    loadLessonQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonFromTree?.id]);
  // library quiz trong localStorage (tạo ở CreateQuizPage)
  const libraryQuizzes = useMemo(() => {
    try {
      const raw = localStorage.getItem("hokori_quizzes");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);

  const handleCreateQuiz = () => {
    setBuilderInitialQuiz(null); // tạo mới
    setOpenQuizModal(true);
  };

  const handleEditQuiz = (qz) => {
    setBuilderInitialQuiz(qz || lessonQuiz || null);
    setOpenQuizModal(true);
  };

  const handleImportQuiz = () => {
    setOpenImportModal(true);
  };

  const handlePickImportedQuiz = (templateQuiz) => {
    if (!templateQuiz) return;
    setOpenImportModal(false);
    setBuilderInitialQuiz(templateQuiz);
    setOpenQuizModal(true);
  };

  const handleBulkDone = (questions) => {
    setOpenBulkModal(false);
    if (!questions?.length) return;

    const base = builderInitialQuiz ||
      lessonQuiz || {
        title: lessonFromTree?.title || "",
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

    const next = {
      ...base,
      questions: [...(base.questions || []), ...questions],
    };

    message.success(`Đã thêm ${questions.length} câu hỏi từ bulk import`);
    setBuilderInitialQuiz(next);
    setOpenQuizModal(true);
  };

  // Xoá quiz (nếu BE có API delete quiz)
  const handleRemoveQuiz = async (quizId) => {
    if (!lessonFromTree?.id || !quizId) return;
    try {
      await api.delete(
        `teacher/lessons/${lessonFromTree.id}/quizzes/${quizId}`
      );
      setLessonQuiz(null);
      message.success("Đã xoá quiz của lesson");
    } catch (err) {
      console.error(err);
      message.error("Xoá quiz thất bại (kiểm tra API delete quiz).");
    }
  };

  // Save quiz cho lesson: tạo/ update quiz + questions + options + QUIZ_REF
  const handleSaveQuiz = async (builderQuiz) => {
    if (!lessonFromTree?.id) {
      message.error("Thiếu lessonId.");
      return;
    }

    try {
      setQuizSaving(true);
      const lessonId = lessonFromTree.id;

      /* ---- 1. Lấy quiz hiện có (nếu có) ---- */
      let existingQuiz = null;
      try {
        const res = await api.get(`teacher/lessons/${lessonId}/quizzes`);
        const body = res.data; // { success, data: {...} } hoặc {...}
        const d = body.data ?? body; // ưu tiên field data
        existingQuiz = Array.isArray(d) ? d[0] : d;
      } catch (err) {
        const statusCode = err?.response?.status;
        const msg = err?.response?.data?.message;
        if (!(statusCode === 404 || msg === "Quiz not found for this lesson")) {
          throw err;
        }
      }

      /* ---- 2. Tạo / update quiz meta ---- */
      const timeLimitMin =
        builderQuiz.timeLimit ?? builderQuiz.timeLimitMin ?? null;
      const passScore =
        builderQuiz.passingScore ?? builderQuiz.passScorePercent ?? 0;

      const quizPayload = {
        title: builderQuiz.title,
        description: builderQuiz.description,
        timeLimitSec: timeLimitMin ? timeLimitMin * 60 : null,
        passScorePercent: typeof passScore === "number" ? passScore : 0,
      };

      let quizId;

      if (!existingQuiz) {
        // tạo mới
        const res = await api.post(
          `teacher/lessons/${lessonId}/quizzes`,
          quizPayload
        );
        const body = res.data; // { success, data: {...} }
        const d = body.data ?? body; // ưu tiên field data
        quizId = d.id;
      } else {
        // update
        quizId = existingQuiz.id;
        await api.put(
          `teacher/lessons/${lessonId}/quizzes/${quizId}`,
          quizPayload
        );
      }

      if (!quizId) {
        throw new Error("Không lấy được quizId sau khi lưu quiz");
      }

      /* ---- 3. Xoá tất cả câu hỏi cũ ---- */
      try {
        const qRes = await api.get(
          `teacher/lessons/${lessonId}/quizzes/${quizId}/questions`
        );
        const body = qRes.data;
        const qData = body.data ?? body;
        const oldQuestions = qData || [];
        for (const q of oldQuestions) {
          await api.delete(
            `teacher/lessons/${lessonId}/quizzes/questions/${q.id}`
          );
        }
      } catch (err) {
        const statusCode = err?.response?.status;
        if (statusCode !== 404) {
          throw err;
        }
      }

      /* ---- 4. Tạo lại questions + options ---- */
      const rawQuestions = builderQuiz.questions || [];
      const questions = rawQuestions
        .filter(
          (q) =>
            (q.type === "single" || q.type === "multiple") &&
            (q.text || q.content) &&
            (q.options || []).length >= 2
        )
        .map((q, idx) => ({ ...q, _orderIndex: idx }));

      for (const q of questions) {
        const content = q.content ?? q.text ?? "";
        const explanation = q.explanation ?? "";
        const type = q.type ?? q.questionType ?? "single";

        const qRes = await api.post(
          `teacher/lessons/${lessonId}/quizzes/${quizId}/questions`,
          {
            content,
            explanation,
            questionType: mapQuestionType(type),
            orderIndex: q._orderIndex ?? 0,
          }
        );
        const qBody = qRes.data;
        const qData = qBody.data ?? qBody;
        const questionId = qData.id;

        // helper: đoán cờ đúng từ nhiều field khác nhau
        const pickIsCorrect = (opt, idx, q) => {
          // 1. Nếu option tự có isCorrect thì ưu tiên
          if (typeof opt.isCorrect === "boolean") return opt.isCorrect;
          // 2. Hoặc xài field correct / isTrue nếu có
          if (typeof opt.correct === "boolean") return opt.correct;
          if (typeof opt.isTrue === "boolean") return opt.isTrue;
          // 3. Nếu question có lưu id/ index đáp án đúng
          if (q.correctOptionId && opt.id && q.correctOptionId === opt.id)
            return true;
          if (
            typeof q.correctOptionIndex === "number" &&
            q.correctOptionIndex === idx
          )
            return true;

          return false;
        };

        let optionsPayload = (q.options || []).map((opt, idx) => ({
          content: opt.content ?? opt.text ?? "",
          isCorrect: pickIsCorrect(opt, idx, q),
          orderIndex: idx,
        }));

        // Với SINGLE_CHOICE: BE yêu cầu EXACTLY ONE option đúng
        if ((q.type ?? q.questionType) === "single") {
          const correctIndexes = optionsPayload
            .map((o, i) => (o.isCorrect ? i : -1))
            .filter((i) => i >= 0);

          if (correctIndexes.length === 0 && optionsPayload.length > 0) {
            // nếu lỡ không tìm được flag nào -> cho đáp án đầu tiên là đúng
            optionsPayload = optionsPayload.map((o, i) => ({
              ...o,
              isCorrect: i === 0,
            }));
          } else if (correctIndexes.length > 1) {
            // nếu có >1 cái true -> giữ cái đầu tiên, set các cái còn lại false
            const keep = correctIndexes[0];
            optionsPayload = optionsPayload.map((o, i) => ({
              ...o,
              isCorrect: i === keep,
            }));
          }
        }

        if (optionsPayload.length >= 2) {
          await api.post(
            `teacher/lessons/${lessonId}/quizzes/questions/${questionId}/options`,
            optionsPayload
          );
        }
      }

      /* ---- 5. Đảm bảo có section + QUIZ_REF content ---- */
      let section = mainSectionInfo.section;
      if (!section) {
        const createSecPayload = await dispatch(
          createSectionThunk({
            lessonId,
            data: {
              title: "Main section",
              orderIndex: 1,
              studyType: "GRAMMAR",
              flashcardSetId: null,
            },
          })
        ).unwrap();
        section = createSecPayload.section || createSecPayload;
      }

      const quizContent = mainSectionInfo.quizContent;
      const baseQuizContent = {
        orderIndex: quizContent?.orderIndex || 100,
        contentFormat: "QUIZ_REF",
        primaryContent: false,
        filePath: null,
        richText: null,
        quizId,
        flashcardSetId: null,
      };

      if (quizContent?.id) {
        await dispatch(
          updateContentThunk({
            contentId: quizContent.id,
            data: baseQuizContent,
          })
        ).unwrap();
      } else {
        await dispatch(
          createContentThunk({
            sectionId: section.id,
            data: {
              ...baseQuizContent,
              orderIndex: (section.contents?.length || 0) + 1,
            },
          })
        ).unwrap();
      }

      /* ---- 6. Reload tree + quiz ---- */
      if (currentCourseMeta?.id) {
        await dispatch(fetchCourseTree(currentCourseMeta.id));
      }

      const finalRes = await api.get(`teacher/lessons/${lessonId}/quizzes`);
      const finalBody = finalRes.data;
      const finalData = finalBody.data ?? finalBody;
      const savedQuiz = Array.isArray(finalData) ? finalData[0] : finalData;
      setLessonQuiz(savedQuiz || null);

      message.success("Đã lưu quiz cho lesson");
      setOpenQuizModal(false);
    } catch (err) {
      console.error(err);
      message.error("Lưu quiz thất bại.");
    } finally {
      setQuizSaving(false);
    }
  };

  const tabItems = [
    {
      key: "content",
      label: "Content",
      children: (
        <div className={styles.tabBody}>
          <Form form={form} layout="vertical">
            <Form.Item
              name="title"
              label="Lesson title"
              rules={[
                { required: true, message: "Vui lòng nhập tiêu đề lesson." },
              ]}
            >
              <Input placeholder="Lesson title" />
            </Form.Item>

            <Form.Item label="Lesson video">
              {videoPreviewUrl ? (
                <div className={styles.videoBox}>
                  <Text strong>Current video</Text>
                  <br />
                  <a href={videoPreviewUrl} target="_blank" rel="noreferrer">
                    {videoPreviewUrl}
                  </a>
                  <div style={{ marginTop: 8 }}>
                    <Space>
                      <Upload
                        multiple={false}
                        showUploadList={false}
                        customRequest={handleSelectVideoFile}
                      >
                        <Button>Change video</Button>
                      </Upload>
                      <Button
                        onClick={() => {
                          setVideoFile(null);
                          setVideoPreviewUrl(null);
                        }}
                        danger
                      >
                        Remove
                      </Button>
                    </Space>
                  </div>
                </div>
              ) : (
                <Upload.Dragger
                  multiple={false}
                  showUploadList={false}
                  customRequest={handleSelectVideoFile}
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">
                    Click hoặc kéo thả file video vào đây
                  </p>
                  <p className="ant-upload-hint">
                    Khi bấm &quot;Save lesson&quot; hệ thống sẽ upload qua API
                    <br />
                    <code>
                      POST /teacher/courses/sections/{"{sectionId}"}/files
                    </code>{" "}
                    rồi tạo Content ASSET.
                  </p>
                </Upload.Dragger>
              )}
            </Form.Item>

            <Form.Item name="description" label="Lesson description">
              <TextArea rows={5} placeholder="Mô tả nội dung bài học..." />
            </Form.Item>
          </Form>
        </div>
      ),
    },
    {
      key: "quiz",
      label: "Quiz & Flashcards",
      children: (
        <div className={styles.tabBody}>
          <Text>
            Ở đây bạn có thể gắn quiz hoặc bộ flashcard cho lesson này. Quiz khi
            lưu sẽ được map sang <code>contentFormat = "QUIZ_REF"</code>.
          </Text>

          {/* header button */}
          <div style={{ marginTop: 16, marginBottom: 12 }}>
            <Space wrap>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateQuiz}
              >
                New quiz
              </Button>
              <Button onClick={handleImportQuiz}>Import from library</Button>
              <Button onClick={() => setOpenBulkModal(true)}>
                Bulk import
              </Button>
            </Space>
          </div>

          {/* danh sách quiz cho lesson (BE hiện hỗ trợ 1 quiz/lesson) */}
          <Spin spinning={quizLoading}>
            <QuizList
              value={lessonQuiz ? [lessonQuiz] : []}
              onEdit={handleEditQuiz}
              onRemove={(id) => handleRemoveQuiz(id)}
            />
          </Spin>

          {/* Import từ library localStorage */}
          <ImportQuizModal
            open={openImportModal}
            onCancel={() => setOpenImportModal(false)}
            library={libraryQuizzes}
            onPick={handlePickImportedQuiz}
          />

          {/* Bulk import */}
          <BulkImportModal
            open={openBulkModal}
            onCancel={() => setOpenBulkModal(false)}
            onDone={handleBulkDone}
          />

          {/* Quiz builder */}
          <QuizBuilderModal
            open={openQuizModal}
            lessonId={lessonFromTree?.id}
            initial={builderInitialQuiz}
            onCancel={() => setOpenQuizModal(false)}
            onSave={handleSaveQuiz}
            saving={quizSaving}
          />
        </div>
      ),
    },
  ];

  return (
    <Drawer
      open={open}
      title={`Edit lesson: ${lessonFromTree?.title || ""}`}
      width={720}
      onClose={onClose}
      destroyOnClose={false}
      footer={
        <div className={styles.footer}>
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              type="primary"
              onClick={handleSaveLesson}
              loading={uploading}
            >
              Save lesson
            </Button>
          </Space>
        </div>
      }
    >
      <Tabs defaultActiveKey="content" items={tabItems} />
    </Drawer>
  );
}
