import React, { useMemo, useState } from "react";
import {
  Card,
  Collapse,
  List,
  Space,
  Tag,
  Typography,
  Spin,
  Empty,
  Button,
  Modal,
  Input,
  Tooltip,
  Popconfirm,
} from "antd";
import {
  PlayCircleOutlined,
  FileImageOutlined,
  FileOutlined,
  ReadOutlined,
  BookOutlined,
  EditOutlined,
  RightOutlined,
  DownOutlined,
  FileTextOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

import { useDispatch } from "react-redux";
import { toast } from "react-toastify";

import styles from "./CourseCurriculumView.module.scss";
import api from "../../../../configs/axios";

import {
  createChapterThunk,
  updateChapterThunk,
  deleteChapterThunk,
  createLessonThunk,
  updateLessonThunk,
  deleteLessonThunk,
  fetchCourseTree,
} from "../../../../redux/features/teacherCourseSlice.js";

const { Panel } = Collapse;
const { Text } = Typography;

/* -----------------------------
   Helper build file URL
----------------------------- */
const API_BASE_URL =
  api.defaults.baseURL?.replace(/\/api\/?$/, "") ||
  import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, "") ||
  "";

const buildFileUrl = (filePath) => {
  if (!filePath) return null;
  if (/^https?:\/\//i.test(filePath)) return filePath;
  return `${API_BASE_URL}/files/${filePath}`.replace(/([^:]\/)\/+/g, "$1");
};

const unwrap = (res) => res.data?.data ?? res.data;
const getError = (err) =>
  err?.response?.data?.message ||
  err?.response?.data ||
  err.message ||
  "Something went wrong";

/* -----------------------------
   👉 Helper format duration
----------------------------- */
const formatDuration = (totalSec) => {
  if (!totalSec || totalSec <= 0) return null;
  const minutes = Math.round(totalSec / 60);

  if (minutes < 60) return `${minutes} phút`;

  const hours = Math.floor(minutes / 60);
  const remain = minutes % 60;

  if (!remain) return `${hours} giờ`;
  return `${hours} giờ ${remain} phút`;
};

/* -----------------------------
   👉 Detect Quiz content
----------------------------- */
const isQuizContent = (c) => {
  const fmt = (c?.contentFormat || "").toUpperCase();
  const type = (c?.contentType || c?.type || "").toUpperCase();
  return fmt === "QUIZ" || type === "QUIZ";
};

export default function CourseCurriculumView({
  courseMeta,
  courseTree,
  loading,
  onEditLesson,
  disableEditing,
  readOnly,
}) {
  const dispatch = useDispatch();

  const [selectedContent, setSelectedContent] = useState(null);
  const [openSectionIds, setOpenSectionIds] = useState([]);
  const isReadOnly = Boolean(readOnly || disableEditing);

  const [quizPreview, setQuizPreview] = useState({
    quiz: null,
    questions: [],
    loading: false,
    error: null,
    sectionTitle: "",
    sectionId: null,
  });

  const [flashcardPreview, setFlashcardPreview] = useState({
    set: null,
    cards: [],
    loading: false,
    error: null,
  });

  // ===== NEW: modals for chapter/lesson =====
  const [editChapterModal, setEditChapterModal] = useState({
    open: false,
    chapterId: null,
    title: "",
  });
  const [addChapterModal, setAddChapterModal] = useState({
    open: false,
    title: "",
    summary: "",
    isTrial: false,
  });

  const [editLessonModal, setEditLessonModal] = useState({
    open: false,
    lessonId: null,
    title: "",
  });
  const [addLessonModal, setAddLessonModal] = useState({
    open: false,
    chapterId: null,
    title: "",
  });

  const [savingLocal, setSavingLocal] = useState(false);

  const chapters = courseTree?.chapters || [];
  const courseId = courseMeta?.id ?? courseTree?.id ?? null;

  const thumbUrl =
    courseMeta?.thumbnailUrl ||
    courseMeta?.coverImageUrl ||
    courseMeta?.imageUrl ||
    null;

  const totalLessons = useMemo(() => {
    return chapters.reduce((sum, ch) => sum + (ch.lessons?.length || 0), 0);
  }, [chapters]);

  const totalDurationSec = useMemo(() => {
    return chapters.reduce((sum, ch) => {
      return (
        sum +
        (ch.lessons || []).reduce(
          (lsSum, les) => lsSum + (les.totalDurationSec || 0),
          0
        )
      );
    }, 0);
  }, [chapters]);

  /* -----------------------------
     Icon cho từng loại content
  ----------------------------- */
  const renderContentIcon = (c) => {
    const fmt = (c?.contentFormat || "").toUpperCase();

    if (isQuizContent(c)) return <FileTextOutlined />;

    switch (fmt) {
      case "ASSET": {
        const url = buildFileUrl(c.filePath);
        const isVideo = url && /\.(mp4|mov|webm|mkv)$/i.test(url);
        const isImage = url && /\.(jpe?g|png|gif|webp)$/i.test(url);
        if (isVideo) return <PlayCircleOutlined />;
        if (isImage) return <FileImageOutlined />;
        return <FileOutlined />;
      }
      case "RICH_TEXT":
        return <ReadOutlined />;
      case "FLASHCARD_SET":
        return <BookOutlined />;
      default:
        return <FileOutlined />;
    }
  };

  /* -----------------------------
     Chọn content (flashcard, asset,...)
  ----------------------------- */
  const handleSelectContent = async (content) => {
    if (selectedContent?.id === content.id) {
      setSelectedContent(null);
      setFlashcardPreview({
        set: null,
        cards: [],
        loading: false,
        error: null,
      });
      return;
    }

    setSelectedContent(content);

    // clear quiz preview khi đang focus content (khác quiz)
    setQuizPreview({
      quiz: null,
      questions: [],
      loading: false,
      error: null,
      sectionTitle: "",
      sectionId: null,
    });

    if ((content.contentFormat || "").toUpperCase() === "FLASHCARD_SET") {
      setFlashcardPreview({
        set: null,
        cards: [],
        loading: true,
        error: null,
      });

      try {
        const setRes = await api.get(
          `flashcards/sets/by-section-content/${content.id}`
        );
        const setData = unwrap(setRes);

        if (!setData || !setData.id) {
          setFlashcardPreview({
            set: null,
            cards: [],
            loading: false,
            error: "Không tìm thấy flashcard set cho content này.",
          });
          return;
        }

        const cardsRes = await api.get(`flashcards/sets/${setData.id}/cards`);
        const cards = unwrap(cardsRes) || [];

        setFlashcardPreview({
          set: setData,
          cards,
          loading: false,
          error: null,
        });
      } catch (err) {
        const status = err?.response?.status;

        if (status === 404) {
          setFlashcardPreview({
            set: null,
            cards: [],
            loading: false,
            error: "Section này chưa có flashcard set.",
          });
        } else {
          setFlashcardPreview({
            set: null,
            cards: [],
            loading: false,
            error:
              getError(err) || "Không thể tải danh sách flashcard của set này.",
          });
        }
      }
    } else {
      setFlashcardPreview({
        set: null,
        cards: [],
        loading: false,
        error: null,
      });
    }
  };

  /* -----------------------------
     View quiz theo SECTION
  ----------------------------- */
  const handleViewQuizBySection = async (section) => {
    if (!section?.id) return;

    // click lại cùng section → đóng
    if (quizPreview.sectionId === section.id && quizPreview.quiz) {
      setQuizPreview({
        quiz: null,
        questions: [],
        loading: false,
        error: null,
        sectionTitle: "",
        sectionId: null,
      });
      return;
    }

    // đang xem quiz thì không highlight content
    setSelectedContent(null);
    setFlashcardPreview({
      set: null,
      cards: [],
      loading: false,
      error: null,
    });

    setQuizPreview({
      quiz: null,
      questions: [],
      loading: true,
      error: null,
      sectionTitle: section.title,
      sectionId: section.id,
    });

    try {
      // NEW ENDPOINT: quizzes thuộc section
      const res = await api.get(`teacher/sections/${section.id}/quizzes`);
      const data = unwrap(res);

      if (!data || (Array.isArray(data) && data.length === 0)) {
        setQuizPreview({
          quiz: null,
          questions: [],
          loading: false,
          error: "Section này chưa có quiz.",
          sectionTitle: section.title,
          sectionId: section.id,
        });
        return;
      }

      const quiz = Array.isArray(data) ? data[0] : data;

      const qRes = await api.get(
        `teacher/sections/${section.id}/quizzes/${quiz.id}/questions`
      );
      const questions = unwrap(qRes) || [];

      setQuizPreview({
        quiz,
        questions,
        loading: false,
        error: null,
        sectionTitle: section.title,
        sectionId: section.id,
      });
    } catch (err) {
      setQuizPreview({
        quiz: null,
        questions: [],
        loading: false,
        error: getError(err),
        sectionTitle: section.title,
        sectionId: section.id,
      });
    }
  };

  /* -----------------------------
     Flashcard inline preview
  ----------------------------- */
  const renderFlashcardInline = () => {
    const set = flashcardPreview.set;

    return (
      <div className={styles.inlinePreviewBox}>
        <Text strong className={styles.previewTitle}>
          Flashcard set
        </Text>
        <p className={styles.previewSub}>
          Set ID: <code>{set?.id ?? "—"}</code>
          {set?.title ? (
            <>
              {" "}
              · <Text>{set.title}</Text>
            </>
          ) : null}
        </p>

        {flashcardPreview.loading ? (
          <Spin size="small" />
        ) : flashcardPreview.error ? (
          <Text type="danger">{flashcardPreview.error}</Text>
        ) : flashcardPreview.cards.length === 0 ? (
          <Text type="secondary">Set này chưa có card nào.</Text>
        ) : (
          <List
            size="small"
            dataSource={flashcardPreview.cards}
            className={styles.flashcardList}
            renderItem={(card, idx) => {
              const front =
                card.frontText || card.term || card.word || `Card #${idx + 1}`;
              const back =
                card.backText ||
                card.meaning ||
                card.translation ||
                card.back ||
                "";

              return (
                <List.Item className={styles.flashcardItem}>
                  <div>
                    <div className={styles.flashcardFront}>
                      {idx + 1}. {front}
                    </div>
                    {back && (
                      <div className={styles.flashcardBack}>→ {back}</div>
                    )}
                  </div>
                </List.Item>
              );
            }}
          />
        )}
      </div>
    );
  };

  /* -----------------------------
     Quiz inline preview theo SECTION
  ----------------------------- */
  const renderQuizInline = (sectionId) => {
    if (quizPreview.sectionId !== sectionId) return null;

    if (quizPreview.loading) {
      return (
        <div className={styles.inlinePreviewBox}>
          <Spin size="small" />
        </div>
      );
    }

    if (quizPreview.error && !quizPreview.quiz) {
      return (
        <div className={styles.inlinePreviewBox}>
          <Text type="secondary">{quizPreview.error}</Text>
        </div>
      );
    }

    if (!quizPreview.quiz) return null;

    const { quiz, questions } = quizPreview;

    return (
      <div className={styles.inlinePreviewBox}>
        <Text strong className={styles.previewTitle}>
          Quiz: {quiz.title || "Quiz"}
        </Text>
        {quiz.description && (
          <p className={styles.previewSub}>{quiz.description}</p>
        )}

        {questions.length === 0 ? (
          <Text type="secondary">Quiz này chưa có câu hỏi.</Text>
        ) : (
          <List
            size="small"
            dataSource={questions}
            className={styles.quizQuestionList}
            renderItem={(q, idx) => (
              <List.Item key={q.id || idx} className={styles.quizQuestionItem}>
                <div>
                  <div className={styles.quizQuestionHeader}>
                    <span>
                      Câu {idx + 1}: {q.content || q.text}
                    </span>
                  </div>

                  <List
                    size="small"
                    dataSource={q.options || []}
                    className={styles.quizOptionList}
                    renderItem={(opt, oIdx) => (
                      <List.Item
                        key={opt.id || oIdx}
                        className={
                          opt.isCorrect
                            ? styles.quizOptionCorrect
                            : styles.quizOption
                        }
                      >
                        <Space>
                          <span>{String.fromCharCode(65 + oIdx)}.</span>
                          <span>{opt.content || opt.text}</span>
                          {opt.isCorrect && <Tag>Đúng</Tag>}
                        </Space>
                      </List.Item>
                    )}
                  />
                </div>
              </List.Item>
            )}
          />
        )}
      </div>
    );
  };

  /* -----------------------------
     Preview cho content (other contents)
  ----------------------------- */
  const renderContentInlinePreview = (content) => {
    if (!content) return null;

    const url = buildFileUrl(content.filePath || content.assetPath);
    const fmt = (content.contentFormat || "").toUpperCase();

    if (fmt === "ASSET" && url) {
      const isVideo = /\.(mp4|mov|webm|mkv)$/i.test(url);
      const isImage = /\.(jpe?g|png|gif|webp)$/i.test(url);

      return (
        <div className={styles.inlinePreviewBox}>
          <Text strong className={styles.previewTitle}>
            Asset preview
          </Text>
          {isVideo ? (
            <video src={url} controls className={styles.previewVideo} />
          ) : isImage ? (
            <img src={url} alt="Asset" className={styles.previewImage} />
          ) : (
            <a href={url} target="_blank" rel="noreferrer">
              <FileOutlined /> Open file
            </a>
          )}
        </div>
      );
    }

    if (fmt === "RICH_TEXT") {
      return (
        <div className={styles.inlinePreviewBox}>
          <Text strong className={styles.previewTitle}>
            Description
          </Text>
          <div className={styles.previewRich}>
            {content.richText || <Text type="secondary">(Empty)</Text>}
          </div>
        </div>
      );
    }

    if (fmt === "FLASHCARD_SET") {
      return renderFlashcardInline();
    }

    return (
      <div className={styles.inlinePreviewBox}>
        <Text type="secondary">Không có preview cho content này.</Text>
      </div>
    );
  };

  /* =============================
     ✅ NEW: Chapter/Lesson actions
     ============================= */

  const openEditChapter = (ch) => {
    if (isReadOnly) return;
    setEditChapterModal({
      open: true,
      chapterId: ch?.id ?? null,
      title: ch?.title ?? "",
    });
  };

  const openAddChapter = () => {
    if (isReadOnly) return;
    setAddChapterModal({
      open: true,
      title: "",
      summary: "",
      isTrial: false,
    });
  };

  const openEditLesson = (lesson) => {
    if (isReadOnly) return;
    setEditLessonModal({
      open: true,
      lessonId: lesson?.id ?? null,
      title: lesson?.title ?? "",
    });
  };

  const openAddLesson = (chapterId) => {
    if (isReadOnly) return;
    setAddLessonModal({
      open: true,
      chapterId,
      title: "",
    });
  };

  const handleConfirmEditChapter = async () => {
    const chapterId = editChapterModal.chapterId;
    const title = (editChapterModal.title || "").trim();
    if (!chapterId) return;
    if (!title) {
      toast.error("Tên chapter không được để trống.");
      return;
    }

    setSavingLocal(true);
    try {
      await dispatch(
        updateChapterThunk({ chapterId, data: { title } })
      ).unwrap();
      toast.success("Đã cập nhật tên chapter.");
      setEditChapterModal({ open: false, chapterId: null, title: "" });

      // Optional: reload tree để chắc chắn data đồng bộ
      if (courseId) dispatch(fetchCourseTree(courseId));
    } catch (e) {
      toast.error(e || "Cập nhật chapter thất bại.");
    } finally {
      setSavingLocal(false);
    }
  };

  const handleConfirmAddChapter = async () => {
    if (!courseId) {
      toast.error("Thiếu courseId.");
      return;
    }
    const title = (addChapterModal.title || "").trim();
    if (!title) {
      toast.error("Tên chapter không được để trống.");
      return;
    }

    setSavingLocal(true);
    try {
      // BE thường nhận: {title, summary, isTrial}
      const data = {
        title,
        summary: (addChapterModal.summary || "").trim(),
        isTrial: Boolean(addChapterModal.isTrial),
      };

      await dispatch(createChapterThunk({ courseId, data })).unwrap();
      toast.success("Đã thêm chapter.");
      setAddChapterModal({
        open: false,
        title: "",
        summary: "",
        isTrial: false,
      });

      if (courseId) dispatch(fetchCourseTree(courseId));
    } catch (e) {
      toast.error(e || "Thêm chapter thất bại.");
    } finally {
      setSavingLocal(false);
    }
  };

  const handleConfirmEditLesson = async () => {
    const lessonId = editLessonModal.lessonId;
    const title = (editLessonModal.title || "").trim();
    if (!lessonId) return;
    if (!title) {
      toast.error("Tên lesson không được để trống.");
      return;
    }

    setSavingLocal(true);
    try {
      await dispatch(updateLessonThunk({ lessonId, data: { title } })).unwrap();
      toast.success("Đã cập nhật tên lesson.");
      setEditLessonModal({ open: false, lessonId: null, title: "" });

      if (courseId) dispatch(fetchCourseTree(courseId));
    } catch (e) {
      toast.error(e || "Cập nhật lesson thất bại.");
    } finally {
      setSavingLocal(false);
    }
  };

  const handleConfirmAddLesson = async () => {
    const chapterId = addLessonModal.chapterId;
    const title = (addLessonModal.title || "").trim();
    if (!chapterId) return;
    if (!title) {
      toast.error("Tên lesson không được để trống.");
      return;
    }

    setSavingLocal(true);
    try {
      const data = { title };
      await dispatch(createLessonThunk({ chapterId, data })).unwrap();
      toast.success("Đã thêm lesson.");
      setAddLessonModal({ open: false, chapterId: null, title: "" });

      if (courseId) dispatch(fetchCourseTree(courseId));
    } catch (e) {
      toast.error(e || "Thêm lesson thất bại.");
    } finally {
      setSavingLocal(false);
    }
  };

  const confirmDeleteChapter = async (chapterId) => {
    if (isReadOnly) return;
    if (!chapterId) return;

    setSavingLocal(true);
    try {
      await dispatch(deleteChapterThunk(chapterId)).unwrap();
      toast.success("Đã xóa chapter.");
      if (courseId) dispatch(fetchCourseTree(courseId));
    } catch (e) {
      toast.error(e || "Xóa chapter thất bại.");
    } finally {
      setSavingLocal(false);
    }
  };

  const confirmDeleteLesson = async (chapterId, lessonId) => {
    if (isReadOnly) return;
    if (!chapterId || !lessonId) return;

    setSavingLocal(true);
    try {
      await dispatch(deleteLessonThunk({ chapterId, lessonId })).unwrap();
      toast.success("Đã xóa lesson.");
      if (courseId) dispatch(fetchCourseTree(courseId));
    } catch (e) {
      toast.error(e || "Xóa lesson thất bại.");
    } finally {
      setSavingLocal(false);
    }
  };

  /* -----------------------------
     Loading / Empty
  ----------------------------- */
  if (loading) {
    return (
      <div className={styles.center}>
        <Spin />
      </div>
    );
  }

  if (!chapters.length) {
    return (
      <div>
        {!isReadOnly && (
          <div style={{ marginBottom: 12 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openAddChapter}
            >
              Thêm chapter
            </Button>
          </div>
        )}
        <Empty
          description="Course này chưa có curriculum."
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  /* -----------------------------
     Main render
  ----------------------------- */
  return (
    <div className={styles.layoutSingle}>
      {/* Summary course */}
      <Card className={styles.courseSummary} size="small">
        <Space
          align="start"
          style={{ width: "100%", justifyContent: "space-between" }}
        >
          <Space align="start">
            {thumbUrl && (
              <div className={styles.thumbBox}>
                <img
                  src={thumbUrl}
                  alt="Thumbnail"
                  className={styles.thumbImage}
                />
              </div>
            )}
            <div>
              <Text strong>{courseMeta?.title}</Text>
              <br />
              <Text type="secondary">
                {chapters.length} chapter(s) · {totalLessons} lesson(s)
                {totalDurationSec > 0 && (
                  <> · ~{formatDuration(totalDurationSec)}</>
                )}
              </Text>
            </div>
          </Space>

          {!isReadOnly && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openAddChapter}
            >
              Thêm chương
            </Button>
          )}
        </Space>
      </Card>

      {/* Chapter list */}
      <Collapse accordion className={styles.chapterCollapse}>
        {chapters.map((ch) => (
          <Panel
            header={
              <Space style={{ width: "100%", justifyContent: "space-between" }}>
                <Space>
                  <Text strong>{ch.title}</Text>
                  <Tag>{(ch.lessons || []).length} Bài</Tag>
                </Space>

                <Space>
                  {!isReadOnly && (
                    <>
                      <Tooltip title="Đổi tên chapter">
                        <Button
                          size="small"
                          icon={<EditOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditChapter(ch);
                          }}
                        />
                      </Tooltip>
                      <Popconfirm
                        title="Xóa chapter?"
                        description="Chương này sẽ bị xóa. Tất cả bài học/phần/nội dung bên trong cũng sẽ mất."
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true, loading: savingLocal }}
                        onConfirm={() => confirmDeleteChapter(ch.id)}
                        onPopupClick={(e) => e.stopPropagation()} // ✅ tránh collapse toggle
                      >
                        <Tooltip title="Xóa chapter">
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={(e) => e.stopPropagation()} // ✅ cực quan trọng trong header collapse
                          />
                        </Tooltip>
                      </Popconfirm>

                      <Tooltip title="Thêm lesson vào chapter này">
                        <Button
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            openAddLesson(ch.id);
                          }}
                        >
                          Thêm bài
                        </Button>
                      </Tooltip>
                    </>
                  )}
                </Space>
              </Space>
            }
            key={ch.id}
          >
            <List
              dataSource={ch.lessons || []}
              renderItem={(lesson) => {
                const lessonDurationLabel = formatDuration(
                  lesson.totalDurationSec
                );

                return (
                  <List.Item key={lesson.id} className={styles.lessonItem}>
                    <div className={styles.lessonMain}>
                      {/* Header lesson */}
                      <div className={styles.lessonHeader}>
                        <div className={styles.lessonHeaderLeft}>
                          <div className={styles.lessonTitle}>
                            {lesson.title}
                          </div>
                          <div className={styles.lessonMeta}>
                            {(lesson.sections || []).length} phần
                            {lessonDurationLabel && (
                              <> · ~{lessonDurationLabel}</>
                            )}
                          </div>
                        </div>

                        <Space className={styles.lessonHeaderActions}>
                          {!isReadOnly && (
                            <Tooltip title="Đổi tên lesson">
                              <Button
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => openEditLesson(lesson)}
                              >
                                Đổi tên
                              </Button>
                            </Tooltip>
                          )}

                          {onEditLesson && (
                            <Button
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => onEditLesson(lesson)}
                              disabled={isReadOnly}
                            >
                              Sửa
                            </Button>
                          )}

                          {!isReadOnly && (
                            <Popconfirm
                              title="Xóa lesson?"
                              description="Bài học này sẽ bị xóa. Tất cả phần/nội dung bên trong cũng sẽ mất."
                              okText="Xóa"
                              cancelText="Hủy"
                              okButtonProps={{
                                danger: true,
                                loading: savingLocal,
                              }}
                              onConfirm={() =>
                                confirmDeleteLesson(ch.id, lesson.id)
                              }
                            >
                              <Tooltip title="Xóa lesson">
                                <Button
                                  size="small"
                                  danger
                                  icon={<DeleteOutlined />}
                                >
                                  Xóa
                                </Button>
                              </Tooltip>
                            </Popconfirm>
                          )}
                        </Space>
                      </div>

                      {/* Section list */}
                      {(lesson.sections || []).map((sec) => {
                        const contents = sec.contents || [];
                        const assetContent = contents.find(
                          (c) =>
                            (c.contentFormat || "").toUpperCase() === "ASSET"
                        );
                        const richTextContent = contents.find(
                          (c) =>
                            (c.contentFormat || "").toUpperCase() ===
                            "RICH_TEXT"
                        );
                        const otherContents = contents.filter((c) => {
                          const fmt = (c.contentFormat || "").toUpperCase();
                          return !["ASSET", "RICH_TEXT"].includes(fmt);
                        });

                        const isOpen = openSectionIds.includes(sec.id);

                        const buildAssetPreview = () => {
                          if (!assetContent) return null;
                          const url = buildFileUrl(
                            assetContent.filePath || assetContent.assetPath
                          );
                          if (!url) return null;

                          const isVideo = /\.(mp4|mov|webm|mkv)$/i.test(url);
                          const isImage = /\.(jpe?g|png|gif|webp)$/i.test(url);

                          return (
                            <div className={styles.inlinePreviewBox}>
                              <Text strong className={styles.previewTitle}>
                                Tài liệu xem
                              </Text>
                              {isVideo ? (
                                <video
                                  src={url}
                                  controls
                                  className={styles.previewVideo}
                                />
                              ) : isImage ? (
                                <img
                                  src={url}
                                  alt="Asset"
                                  className={styles.previewImage}
                                />
                              ) : (
                                <a href={url} target="_blank" rel="noreferrer">
                                  <FileOutlined /> Open file
                                </a>
                              )}
                            </div>
                          );
                        };

                        const buildRichPreview = () => {
                          if (!richTextContent) return null;
                          return (
                            <div className={styles.inlinePreviewBox}>
                              <Text strong className={styles.previewTitle}>
                                Tài liệu đọc
                              </Text>
                              <div className={styles.previewRich}>
                                {richTextContent.richText || (
                                  <Text type="secondary">(Empty)</Text>
                                )}
                              </div>
                            </div>
                          );
                        };

                        return (
                          <div key={sec.id} className={styles.sectionBlock}>
                            {/* Section header */}
                            <div
                              className={styles.sectionHeader}
                              onClick={() =>
                                setOpenSectionIds((prev) =>
                                  prev.includes(sec.id)
                                    ? prev.filter((id) => id !== sec.id)
                                    : [...prev, sec.id]
                                )
                              }
                              style={{ cursor: "pointer" }}
                            >
                              <Space>
                                {isOpen ? <DownOutlined /> : <RightOutlined />}
                                <span>{sec.title}</span>
                              </Space>
                              <Tag size="small">{sec.studyType}</Tag>
                            </div>

                            {isOpen && (
                              <>
                                {renderQuizInline(sec.id)}

                                {(assetContent || richTextContent) && (
                                  <div className={styles.sectionContentGroup}>
                                    {buildAssetPreview()}
                                    {buildRichPreview()}
                                  </div>
                                )}

                                {otherContents.length > 0 && (
                                  <List
                                    size="small"
                                    dataSource={otherContents}
                                    renderItem={(c) => (
                                      <React.Fragment key={c.id}>
                                        <List.Item
                                          className={
                                            selectedContent?.id === c.id
                                              ? styles.contentItemActive
                                              : styles.contentItem
                                          }
                                          onClick={(e) => {
                                            e.stopPropagation();

                                            if (isQuizContent(c)) {
                                              handleViewQuizBySection(sec);
                                              return;
                                            }

                                            handleSelectContent(c);
                                          }}
                                        >
                                          <Space>
                                            {renderContentIcon(c)}
                                            <span>
                                              {isQuizContent(c)
                                                ? "QUIZ"
                                                : c.contentFormat}
                                              {c.primaryContent
                                                ? " (primary)"
                                                : ""}
                                            </span>
                                          </Space>
                                        </List.Item>

                                        {selectedContent?.id === c.id &&
                                          !isQuizContent(c) && (
                                            <div
                                              className={
                                                styles.contentInlineWrapper
                                              }
                                            >
                                              {renderContentInlinePreview(
                                                selectedContent
                                              )}
                                            </div>
                                          )}
                                      </React.Fragment>
                                    )}
                                  />
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </List.Item>
                );
              }}
            />
          </Panel>
        ))}
      </Collapse>

      {/* =========================
          MODALS
         ========================= */}

      <Modal
        open={editChapterModal.open}
        title="Đổi tên chapter"
        okText="Lưu"
        cancelText="Hủy"
        okButtonProps={{ disabled: isReadOnly, loading: savingLocal }}
        onCancel={() =>
          setEditChapterModal({ open: false, chapterId: null, title: "" })
        }
        onOk={handleConfirmEditChapter}
        destroyOnClose
      >
        <Input
          placeholder="Nhập tên chapter"
          value={editChapterModal.title}
          onChange={(e) =>
            setEditChapterModal((p) => ({ ...p, title: e.target.value }))
          }
        />
      </Modal>

      <Modal
        open={addChapterModal.open}
        title="Thêm chapter"
        okText="Tạo"
        cancelText="Hủy"
        okButtonProps={{ disabled: isReadOnly, loading: savingLocal }}
        onCancel={() =>
          setAddChapterModal({
            open: false,
            title: "",
            summary: "",
            isTrial: false,
          })
        }
        onOk={handleConfirmAddChapter}
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Input
            placeholder="Tên chapter"
            value={addChapterModal.title}
            onChange={(e) =>
              setAddChapterModal((p) => ({ ...p, title: e.target.value }))
            }
          />
          <Input.TextArea
            rows={3}
            placeholder="Tóm tắt (optional)"
            value={addChapterModal.summary}
            onChange={(e) =>
              setAddChapterModal((p) => ({ ...p, summary: e.target.value }))
            }
          />
        </Space>
      </Modal>

      <Modal
        open={editLessonModal.open}
        title="Đổi tên lesson"
        okText="Lưu"
        cancelText="Hủy"
        okButtonProps={{ disabled: isReadOnly, loading: savingLocal }}
        onCancel={() =>
          setEditLessonModal({ open: false, lessonId: null, title: "" })
        }
        onOk={handleConfirmEditLesson}
        destroyOnClose
      >
        <Input
          placeholder="Nhập tên lesson"
          value={editLessonModal.title}
          onChange={(e) =>
            setEditLessonModal((p) => ({ ...p, title: e.target.value }))
          }
        />
      </Modal>

      <Modal
        open={addLessonModal.open}
        title="Thêm lesson"
        okText="Tạo"
        cancelText="Hủy"
        okButtonProps={{ disabled: isReadOnly, loading: savingLocal }}
        onCancel={() =>
          setAddLessonModal({ open: false, chapterId: null, title: "" })
        }
        onOk={handleConfirmAddLesson}
        destroyOnClose
      >
        <Input
          placeholder="Tên lesson"
          value={addLessonModal.title}
          onChange={(e) =>
            setAddLessonModal((p) => ({ ...p, title: e.target.value }))
          }
        />
      </Modal>
    </div>
  );
}
