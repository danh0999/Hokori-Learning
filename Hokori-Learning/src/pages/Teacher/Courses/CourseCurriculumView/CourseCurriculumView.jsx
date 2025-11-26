import React, { useState } from "react";
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
} from "@ant-design/icons";

import styles from "./CourseCurriculumView.module.scss";
import api from "../../../../configs/axios";

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

export default function CourseCurriculumView({
  courseMeta,
  courseTree,
  loading,
  onEditLesson,
}) {
  const [selectedContent, setSelectedContent] = useState(null);
  const [openSectionIds, setOpenSectionIds] = useState([]);

  const [quizPreview, setQuizPreview] = useState({
    quiz: null,
    questions: [],
    loading: false,
    error: null,
    lessonTitle: "",
    lessonId: null,
  });

  const [flashcardPreview, setFlashcardPreview] = useState({
    set: null,
    cards: [],
    loading: false,
    error: null,
  });

  const chapters = courseTree?.chapters || [];

  const thumbUrl =
    courseMeta?.thumbnailUrl ||
    courseMeta?.coverImageUrl ||
    courseMeta?.imageUrl ||
    null;

  /* -----------------------------
     Icon cho từng loại content
  ----------------------------- */
  const renderContentIcon = (c) => {
    switch (c.contentFormat) {
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
     Chọn content (flashcard, ...)
  ----------------------------- */
  const handleSelectContent = async (content) => {
    // click lại content đang chọn → đóng
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

    // clear quiz preview khi đang focus content
    setQuizPreview((prev) => ({
      ...prev,
      quiz: null,
      questions: [],
      error: null,
      lessonId: null,
    }));

    if (content.contentFormat === "FLASHCARD_SET") {
      setFlashcardPreview({
        set: null,
        cards: [],
        loading: true,
        error: null,
      });

      try {
        // 1) lấy flashcard set theo sectionContentId
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

        // 2) lấy cards trong set
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
      // không phải flashcard → clear preview
      setFlashcardPreview({
        set: null,
        cards: [],
        loading: false,
        error: null,
      });
    }
  };

  /* -----------------------------
     View quiz theo lesson
  ----------------------------- */
  const handleViewQuiz = async (lesson) => {
    // ấn lại quiz cùng lesson → đóng
    if (quizPreview.lessonId === lesson.id && quizPreview.quiz) {
      setQuizPreview({
        quiz: null,
        questions: [],
        loading: false,
        error: null,
        lessonTitle: "",
        lessonId: null,
      });
      return;
    }

    // đang xem quiz thì không highlight content
    setSelectedContent(null);

    setQuizPreview({
      quiz: null,
      questions: [],
      loading: true,
      error: null,
      lessonTitle: lesson.title,
      lessonId: lesson.id,
    });

    try {
      const res = await api.get(`teacher/lessons/${lesson.id}/quizzes`);
      let data = unwrap(res);

      if (!data || (Array.isArray(data) && data.length === 0)) {
        setQuizPreview({
          quiz: null,
          questions: [],
          loading: false,
          error: "Lesson này chưa có quiz.",
          lessonTitle: lesson.title,
          lessonId: lesson.id,
        });
        return;
      }

      const quiz = Array.isArray(data) ? data[0] : data;

      const qRes = await api.get(
        `teacher/lessons/${lesson.id}/quizzes/${quiz.id}/questions`
      );
      const questions = unwrap(qRes) || [];

      setQuizPreview({
        quiz,
        questions,
        loading: false,
        error: null,
        lessonTitle: lesson.title,
        lessonId: lesson.id,
      });
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;

      if (
        status === 404 ||
        (status === 400 &&
          typeof msg === "string" &&
          msg.includes("Quiz not found")) ||
        (typeof msg === "string" &&
          msg.includes("Index 0 out of bounds for length 0"))
      ) {
        setQuizPreview({
          quiz: null,
          questions: [],
          loading: false,
          error: "Lesson này chưa có quiz.",
          lessonTitle: lesson.title,
          lessonId: lesson.id,
        });
      } else {
        setQuizPreview({
          quiz: null,
          questions: [],
          loading: false,
          error: getError(err),
          lessonTitle: lesson.title,
          lessonId: lesson.id,
        });
      }
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
     Quiz inline preview theo lesson
  ----------------------------- */
  const renderQuizInline = (lessonId) => {
    if (quizPreview.lessonId !== lessonId) return null;

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
     Preview cho content (dùng cho otherContents)
  ----------------------------- */
  const renderContentInlinePreview = (content) => {
    if (!content) return null;

    const url = buildFileUrl(content.filePath || content.assetPath);

    if (content.contentFormat === "ASSET" && url) {
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

    if (content.contentFormat === "RICH_TEXT") {
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

    if (content.contentFormat === "FLASHCARD_SET") {
      return renderFlashcardInline();
    }

    return (
      <div className={styles.inlinePreviewBox}>
        <Text type="secondary">Không có preview cho content này.</Text>
      </div>
    );
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
      <Empty
        description="Course này chưa có curriculum."
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  /* -----------------------------
     Main render
  ----------------------------- */
  return (
    <div className={styles.layoutSingle}>
      {/* Summary course */}
      <Card className={styles.courseSummary} size="small">
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
              {chapters.length} chapter(s) ·{" "}
              {chapters.reduce((sum, ch) => sum + (ch.lessons?.length || 0), 0)}{" "}
              lesson(s)
            </Text>
          </div>
        </Space>
      </Card>

      {/* Chapter list */}
      <Collapse accordion className={styles.chapterCollapse}>
        {chapters.map((ch) => (
          <Panel
            header={
              <Space>
                <Text strong>{ch.title}</Text>
                <Tag>{(ch.lessons || []).length} lessons</Tag>
              </Space>
            }
            key={ch.id}
          >
            <List
              dataSource={ch.lessons || []}
              renderItem={(lesson) => (
                <List.Item key={lesson.id} className={styles.lessonItem}>
                  <div className={styles.lessonMain}>
                    {/* Header lesson */}
                    <div className={styles.lessonHeader}>
                      <div className={styles.lessonHeaderLeft}>
                        <div className={styles.lessonTitle}>{lesson.title}</div>
                        <div className={styles.lessonMeta}>
                          {(lesson.sections || []).length} section(s)
                        </div>
                      </div>
                      <Space className={styles.lessonHeaderActions}>
                        {onEditLesson && (
                          <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => onEditLesson(lesson)}
                          >
                            Edit
                          </Button>
                        )}

                        <Button
                          size="small"
                          className={styles.quizButton}
                          onClick={() => handleViewQuiz(lesson)}
                        >
                          Quiz
                        </Button>
                      </Space>
                    </div>

                    {/* Quiz preview inline */}
                    {renderQuizInline(lesson.id)}

                    {/* Section list */}
                    {(lesson.sections || []).map((sec) => {
                      const contents = sec.contents || [];
                      const assetContent = contents.find(
                        (c) => c.contentFormat === "ASSET"
                      );
                      const richTextContent = contents.find(
                        (c) => c.contentFormat === "RICH_TEXT"
                      );
                      const otherContents = contents.filter(
                        (c) => !["ASSET", "RICH_TEXT"].includes(c.contentFormat)
                      );
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
                              Nội dung chính
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
                              Description
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
                          {/* Section header → click để mở/đóng */}
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

                          {/* Chỉ render nội dung khi section mở */}
                          {isOpen && (
                            <>
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
                                        onClick={() => handleSelectContent(c)}
                                      >
                                        <Space>
                                          {renderContentIcon(c)}
                                          <span>
                                            {c.contentFormat}
                                            {c.primaryContent
                                              ? " (primary)"
                                              : ""}
                                          </span>
                                        </Space>
                                      </List.Item>

                                      {selectedContent?.id === c.id && (
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
              )}
            />
          </Panel>
        ))}
      </Collapse>
    </div>
  );
}
