// LessonEditorDrawer/tabs/VocabFlashcardTab.jsx
import React, { useCallback, useEffect, useState, useMemo } from "react";
import { Button, Typography, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";

import { createContentThunk } from "../../../../../../../../redux/features/teacherCourseSlice.js";
import { createCourseVocabSet } from "../../../../../../../../redux/features/flashcardSlice.js";

import FlashcardBuilderModal from "../../../../../../ManageDocument/Flashcard/FlashcardBuilderModal.jsx";

import styles from "../styles.module.scss";

const { Text } = Typography;

// bóc id content từ response createContentThunk
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

export default function VocabFlashcardTab({ lesson, sectionsHook }) {
  const dispatch = useDispatch();

  const [opening, setOpening] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [sectionContentId, setSectionContentId] = useState(null);

  // lấy section VOCABULARY từ hook hoặc từ lesson
  const vocabSection = useMemo(() => {
    return (
      sectionsHook?.sectionsByType?.VOCABULARY ||
      (lesson?.sections || []).find((s) => s.studyType === "VOCABULARY") ||
      null
    );
  }, [sectionsHook?.sectionsByType?.VOCABULARY, lesson?.sections]);

  // mỗi khi vocabSection thay đổi, nếu đã có content FLASHCARD_SET thì lưu lại id
  useEffect(() => {
    const flashContent =
      (vocabSection?.contents || []).find(
        (c) => c.contentFormat === "FLASHCARD_SET"
      ) || null;
    if (flashContent?.id) {
      setSectionContentId(flashContent.id);
    }
  }, [vocabSection?.id, vocabSection?.contents]);

  const hasFlashcards = !!sectionContentId;

  const handleOpen = useCallback(async () => {
    if (!lesson?.id) {
      message.error("Thiếu lessonId.");
      return;
    }
    if (opening) return;

    setOpening(true);
    try {
      // 1. Đảm bảo có section VOCABULARY
      let section = vocabSection;
      if (!section) {
        if (!sectionsHook?.ensureSection) {
          message.error("Không tìm được hàm ensureSection cho Vocabulary.");
          return;
        }

        // tạo section VOCABULARY (BE cho phép flashcardSetId = null)
        section = await sectionsHook.ensureSection("VOCABULARY", {
          title: "Vocabulary",
          studyType: "VOCABULARY",
        });
      }

      if (!section?.id) {
        message.error("Không tạo được section Vocabulary.");
        return;
      }

      // 2. Nếu đã có contentId (FLASHCARD_SET) rồi -> chỉ mở modal,
      // FlashcardBuilderModal sẽ tự gọi GET /flashcards/sets/by-section-content
      if (sectionContentId) {
        setModalOpen(true);
        return;
      }

      // 3. Nếu section chưa có content FLASHCARD_SET -> tạo placeholder content
      const createdContent = await dispatch(
        createContentThunk({
          sectionId: section.id,
          data: {
            orderIndex: section.contents?.length || 0,
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

      // lưu lại id để dùng cho modal + API flashcard
      setSectionContentId(newContentId);

      // 4. Sau khi có sectionContentId -> gọi API /flashcards/sets/course-vocab
      // BE sẽ tự gán flashcardSetId cho section + content
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

      // mở modal để teacher thêm card
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
    vocabSection,
    sectionsHook?.ensureSection,
    dispatch,
    opening,
    sectionContentId,
  ]);

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
          {hasFlashcards ? "Edit flashcards" : "Create flashcards"}
        </Button>
      </div>

      <FlashcardBuilderModal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        sectionContentId={sectionContentId}
        // không cần truyền flashcardSet, modal sẽ tự fetch theo sectionContentId
      />
    </div>
  );
}
