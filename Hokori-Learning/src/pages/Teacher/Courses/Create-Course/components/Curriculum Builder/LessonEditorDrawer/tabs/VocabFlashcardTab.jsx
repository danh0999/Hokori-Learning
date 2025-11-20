// LessonEditorDrawer/tabs/VocabFlashcardTab.jsx
import React, { useCallback, useEffect, useState } from "react";
import { Button, Typography, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";

import { createContentThunk } from "../../../../../../../../redux/features/teacherCourseSlice.js";
import { createCourseVocabSet } from "../../../../../../../../redux/features/flashcardSlice.js";

import FlashcardBuilderModal from "../../../../../../ManageDocument/Flashcard/FlashcardBuilderModal.jsx";

import styles from "../styles.module.scss";

const { Text } = Typography;

/**
 * Bóc id content từ response createContentThunk
 * FE mình không chắc BE bọc data như nào nên xử lý đủ trường hợp.
 */
const extractContentId = (created) => {
  if (!created) return null;

  // Nếu thunk trả về { content: {...} }
  if (created.content) {
    const c = created.content;
    if (c.id) return c.id;
    if (c.data && c.data.id) return c.data.id;
  }

  // Nếu trả thẳng object content
  if (created.id) return created.id;
  if (created.data && created.data.id) return created.data.id;

  return null;
};

export default function VocabFlashcardTab({ lesson, sectionsHook }) {
  const dispatch = useDispatch();

  const [opening, setOpening] = useState(false); // loading local
  const [modalOpen, setModalOpen] = useState(false);
  const [currentSet, setCurrentSet] = useState(null);
  const [sectionContentId, setSectionContentId] = useState(null);

  // Nếu bạn có truyền sectionsHook từ LessonEditorDrawer thì dùng, không thì fallback từ lesson
  const vocabSectionFromHook = sectionsHook?.sectionsByType?.VOCABULARY || null;

  const vocabSectionFromLesson =
    (lesson?.sections || []).find((s) => s.studyType === "VOCABULARY") || null;

  const vocabSection = vocabSectionFromHook || vocabSectionFromLesson;

  // nếu hook có sẵn thông tin flashcard thì set lại
  useEffect(() => {
    if (sectionsHook?.vocabInfo?.flashcardSet) {
      setCurrentSet(sectionsHook.vocabInfo.flashcardSet);
      setSectionContentId(sectionsHook.vocabInfo.flashcardContent?.id || null);
    }
  }, [
    sectionsHook?.vocabInfo?.flashcardSet,
    sectionsHook?.vocabInfo?.flashcardContent?.id,
  ]);

  const handleOpen = useCallback(async () => {
    if (!lesson?.id) {
      message.error("Thiếu lessonId.");
      return;
    }
    if (opening) return; // tránh double click

    setOpening(true);
    try {
      // 1. Đảm bảo có section VOCABULARY
      let section = vocabSection;

      if (!section) {
        if (!sectionsHook?.ensureSection) {
          message.error("Không tìm được hàm ensureSection cho Vocabulary.");
          return;
        }
        section = await sectionsHook.ensureSection("VOCABULARY");
      }

      if (!section?.id) {
        message.error("Không tạo được section Vocabulary.");
        return;
      }

      // 2. Tìm content FLASHCARD_SET của section nếu đã có
      let contentId = sectionContentId;
      let flashcardSet = currentSet;

      if (!contentId) {
        const existingFlashContent =
          (section.contents || []).find(
            (c) => c.contentFormat === "FLASHCARD_SET"
          ) || null;

        if (existingFlashContent) {
          contentId = existingFlashContent.id;
          flashcardSet = existingFlashContent.flashcardSet || flashcardSet;
        }
      }

      // 3. Nếu vẫn chưa có SectionContent => tạo mới
      if (!contentId) {
        const created = await dispatch(
          createContentThunk({
            lessonId: lesson.id,
            sectionId: section.id,
            data: {
              contentFormat: "FLASHCARD_SET",
              primaryContent: false,
              filePath: null,
              richText: null,
              quizId: null,
              flashcardSetId: null,
            },
          })
        ).unwrap();

        const newContentId = extractContentId(created);
        if (!newContentId) {
          console.error("[VocabTab] create content response:", created);
          message.error("Không lấy được sectionContentId sau khi tạo content.");
          return;
        }

        contentId = newContentId;
      }

      setSectionContentId(contentId);

      // 4. Nếu đã có flashcardSet rồi thì mở modal luôn
      if (flashcardSet || currentSet) {
        setCurrentSet(flashcardSet || currentSet);
        setModalOpen(true);
        return;
      }

      // 5. Chưa có set => gọi POST /api/flashcards/sets/course-vocab
      const newSet = await dispatch(
        createCourseVocabSet({
          title: `Từ vựng – ${lesson.title || "Lesson"}`,
          description: "",
          level: null, // nếu cần map theo level của course thì truyền thêm
          sectionContentId: contentId,
        })
      ).unwrap();

      setCurrentSet(newSet);
      message.success("Đã tạo bộ flashcard cho Vocabulary.");
      setModalOpen(true);
    } catch (err) {
      console.error("[VocabFlashcardTab] handleOpen error:", err);
      message.error(
        err?.message ||
          "Không tạo được bộ flashcard. Vui lòng thử lại hoặc nhờ BE kiểm tra API."
      );
    } finally {
      setOpening(false); // đảm bảo luôn tắt loading
    }
  }, [
    lesson?.id,
    lesson?.title,
    lesson?.sections,
    opening,
    vocabSection,
    sectionsHook?.ensureSection,
    dispatch,
    currentSet,
    sectionContentId,
  ]);

  const handleSavedSet = (updatedSet) => {
    if (updatedSet) setCurrentSet(updatedSet);
  };

  return (
    <div className={styles.tabBody}>
      <Text>
        Đây là phần <b>Vocabulary</b> của lesson. Bạn có thể tạo bộ flashcard để
        học từ vựng.
      </Text>

      <div style={{ marginTop: 16, marginBottom: 12 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpen}
          loading={opening}
        >
          {currentSet ? "Edit flashcards" : "Create flashcards"}
        </Button>
      </div>

      <FlashcardBuilderModal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        flashcardSet={currentSet}
        sectionContentId={sectionContentId}
        onSaved={handleSavedSet}
      />
    </div>
  );
}
