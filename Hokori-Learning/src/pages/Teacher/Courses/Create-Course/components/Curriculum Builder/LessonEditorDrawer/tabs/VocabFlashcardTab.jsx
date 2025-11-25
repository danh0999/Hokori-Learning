// LessonEditorDrawer/tabs/VocabFlashcardTab.jsx
import React, { useCallback, useEffect, useState } from "react";
import { Button, Typography, message, Form, Input } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";

import { createContentThunk } from "../../../../../../../../redux/features/teacherCourseSlice.js";
import { createCourseVocabSet } from "../../../../../../../../redux/features/flashcardSlice.js";

import FlashcardBuilderModal from "../../../../../../ManageDocument/Flashcard/FlashcardBuilderModal.jsx";

import styles from "../styles.module.scss";

const { Text } = Typography;

// Bóc id content từ response createContentThunk (tuỳ BE shape)
const extractContentId = (created) => {
  if (!created) return null;

  if (created.content) {
    const c = created.content;
    if (c.id) return c.id;
    if (c.data && c.data.id) return c.data.id;
  }

  if (created.id) return created.id;
  if (created.data && created.data.id) return created.data.id;

  return null;
};

export default function VocabFlashcardTab({
  lesson,
  sectionsHook,
  onDurationComputed,
}) {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const [opening, setOpening] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // lưu section & content hiện tại (nếu đã tồn tại trong tree)
  const [vocabSectionId, setVocabSectionId] = useState(null);
  const [sectionContentId, setSectionContentId] = useState(null);

  // ====== Detect section + FLASHCARD_SET content từ lesson tree ======
  useEffect(() => {
    if (!lesson) {
      setVocabSectionId(null);
      setSectionContentId(null);
      return;
    }

    let foundSection = null;
    let foundContent = null;

    const sections = lesson.sections || [];

    // 1) Ưu tiên: section đã có contentFormat = FLASHCARD_SET
    for (const sec of sections) {
      const contents = sec.contents || [];
      const flash = contents.find((c) => c.contentFormat === "FLASHCARD_SET");
      if (flash) {
        foundSection = sec;
        foundContent = flash;
        break;
      }
    }

    // 2) Fallback: chưa có flashcard thì lấy section studyType = VOCABULARY (nếu có)
    if (!foundSection) {
      foundSection = sections.find((sec) => sec.studyType === "VOCABULARY");
    }

    setVocabSectionId(foundSection?.id || null);
    setSectionContentId(foundContent?.id || null);

    const defaultTitle =
      foundSection?.title ||
      (lesson.title ? `Vocabulary – ${lesson.title}` : "Vocabulary section");
    form.setFieldsValue({
      sectionTitle: defaultTitle,
    });
  }, [lesson?.id, lesson?.title, lesson?.sections, form]);

  // báo duration cho parent: có flashcards -> 10 phút, không có -> 0
  useEffect(() => {
    if (typeof onDurationComputed !== "function") return;
    if (sectionContentId) {
      onDurationComputed(10 * 60);
    } else {
      onDurationComputed(0);
    }
  }, [sectionContentId, onDurationComputed]);

  const hasFlashcards = !!sectionContentId;

  const handleOpen = useCallback(async () => {
    if (!lesson?.id) {
      message.error("Thiếu lessonId.");
      return;
    }
    if (opening) return;

    // validate title section
    let sectionTitle = "";
    try {
      const values = await form.validateFields();
      sectionTitle = values.sectionTitle || "";
    } catch {
      return;
    }

    setOpening(true);
    try {
      let sectionId = vocabSectionId;

      // 1. Nếu chưa có section Vocabulary -> tạo mới qua ensureSection
      if (!sectionId) {
        if (!sectionsHook?.ensureSection) {
          message.error("Không tìm được hàm ensureSection cho Vocabulary.");
          return;
        }

        const createdSec = await sectionsHook.ensureSection("VOCABULARY", {
          title: sectionTitle || "Vocabulary",
          studyType: "VOCABULARY",
        });

        sectionId = createdSec?.id;
        setVocabSectionId(sectionId);
      }

      if (!sectionId) {
        message.error("Không tạo được section Vocabulary.");
        return;
      }

      // 2. Nếu đã có FLASHCARD_SET content rồi -> chỉ mở modal, KHÔNG tạo mới
      if (sectionContentId) {
        setModalOpen(true);
        return;
      }

      // 3. Nếu chưa có FLASHCARD_SET -> tạo content + flashcard set
      const createdContent = await dispatch(
        createContentThunk({
          sectionId,
          data: {
            orderIndex: 0,
            contentFormat: "FLASHCARD_SET",
            primaryContent: false,
            filePath: null,
            richText: null,
            quizId: null,
            flashcardSetId: null,
          },
        })
      ).unwrap();

      const newContentId = extractContentId(createdContent);
      if (!newContentId) {
        console.error("[VocabTab] createContent response:", createdContent);
        message.error(
          "Không lấy được sectionContentId sau khi tạo FLASHCARD_SET."
        );
        return;
      }

      setSectionContentId(newContentId);

      try {
        const newSet = await dispatch(
          createCourseVocabSet({
            title: `Từ vựng – ${lesson.title || "Lesson"}`,
            description: "",
            level: lesson.level || null,
            sectionContentId: newContentId,
          })
        ).unwrap();

        if (!newSet || !newSet.id) {
          message.warning(
            "Tạo flashcard set không trả về id. Hãy kiểm tra lại API nếu flashcard không hoạt động."
          );
        } else {
          message.success("Đã tạo bộ flashcard cho Vocabulary.");
        }
      } catch (err) {
        console.error("[VocabTab] createCourseVocabSet error:", err);
        message.error(
          err?.message ||
            "Không tạo được flashcard set. Vui lòng thử lại hoặc báo BE kiểm tra."
        );
      }

      setModalOpen(true);
    } catch (err) {
      console.error("[VocabFlashcardTab] handleOpen error:", err);
      message.error(
        err?.message ||
          "Không mở được flashcard. Vui lòng thử lại hoặc nhờ BE kiểm tra API."
      );
    } finally {
      setOpening(false);
    }
  }, [
    lesson?.id,
    lesson?.title,
    lesson?.level,
    vocabSectionId,
    sectionContentId,
    sectionsHook?.ensureSection,
    dispatch,
    opening,
    form,
  ]);

  return (
    <div className={styles.tabBody}>
      <Form form={form} layout="vertical">
        <Form.Item
          name="sectionTitle"
          label="Vocabulary section title"
          rules={[
            {
              required: true,
              message: "Vui lòng nhập tiêu đề section Vocabulary.",
            },
          ]}
        >
          <Input
            placeholder={
              lesson?.title
                ? `Ví dụ: Từ vựng – ${lesson.title}`
                : "Ví dụ: Vocabulary – Bài 1"
            }
          />
        </Form.Item>

        <Text>
          Đây là phần <b>Vocabulary</b> của lesson. Bạn có thể tạo bộ flashcard
          để học từ vựng.
        </Text>

        <div style={{ marginTop: 16, marginBottom: 12 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpen}
            loading={opening}
          >
            {hasFlashcards ? "Edit flashcards" : "Create flashcards"}
          </Button>
        </div>
      </Form>

      <FlashcardBuilderModal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        sectionContentId={sectionContentId}
      />
    </div>
  );
}
