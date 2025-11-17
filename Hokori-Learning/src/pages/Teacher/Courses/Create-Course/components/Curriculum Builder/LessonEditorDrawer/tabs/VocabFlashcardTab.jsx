// LessonEditorDrawer/tabs/VocabFlashcardTab.jsx
import React, { useEffect, useState } from "react";
import { Button, Space, Typography, message, Spin } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchSetBySectionContent,
  createCourseVocabSet,
} from "../../../../../../../../redux/features/flashcardSlice.js"; // chỉnh path tuỳ dự án

import { createContentThunk } from "../../../../../../../../redux/features/teacherCourseSlice.js"; // chỉnh path tuỳ dự án
import FlashcardBuilderModal from "../../../../../../ManageDocument/Flashcard/FlashcardBuilderModal.jsx"; // chỉnh path tuỳ dự án
import styles from "../styles.module.scss";

const { Text } = Typography;

export default function VocabFlashcardTab({ lesson, sectionsHook }) {
  const dispatch = useDispatch();
  const { sectionsByType, vocabInfo, ensureSection } = sectionsHook;

  const { currentSet, loadingSet, saving } = useSelector(
    (state) => state.flashcard || {}
  );

  const [sectionContentId, setSectionContentId] = useState(
    vocabInfo.flashcardContent?.id || null
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  // sync khi reload tree
  useEffect(() => {
    setSectionContentId(vocabInfo.flashcardContent?.id || null);
  }, [vocabInfo.flashcardContent?.id]);

  // Khi đã có contentId, load set tương ứng (nếu có)
  useEffect(() => {
    if (!sectionContentId) return;
    dispatch(fetchSetBySectionContent(sectionContentId));
  }, [sectionContentId, dispatch]);

  const handleOpen = async () => {
    if (!lesson?.id) {
      message.error("Thiếu lessonId.");
      return;
    }

    try {
      setInitialLoading(true);

      // 1. ensure section VOCABULARY
      let section = sectionsByType.VOCABULARY;
      if (!section) {
        section = await ensureSection("VOCABULARY");
      }

      // 2. nếu đã có contentId -> chỉ mở modal
      if (sectionContentId) {
        setModalOpen(true);
        return;
      }

      // 3. nếu chưa có content FLASHCARD_SET -> tạo content trước
      const createdContent = await dispatch(
        createContentThunk({
          sectionId: section.id,
          data: {
            contentFormat: "FLASHCARD_SET",
            primaryContent: true,
            filePath: null,
            richText: null,
            flashcardSetId: null, // BE sẽ gán sau
            quizId: null,
            orderIndex: (section.contents?.length || 0) + 1,
          },
        })
      ).unwrap();

      const content = createdContent.content || createdContent;
      setSectionContentId(content.id);

      // 4. tạo set COURSE_VOCAB gắn với sectionContentId
      await dispatch(
        createCourseVocabSet({
          title: lesson.title || "Vocabulary",
          description: "",
          level: null, // hoặc lesson.level / course.level nếu có
          sectionContentId: content.id,
        })
      ).unwrap();

      setModalOpen(true);
    } catch (err) {
      console.error(err);
      message.error("Không tạo được flashcard set.");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSaved = () => {
    message.success("Đã lưu flashcards.");
  };

  return (
    <div className={styles.tabBody}>
      <Text>
        Đây là phần <b>Vocabulary</b> của lesson. Bạn có thể tạo bộ flashcard để
        học từ vựng trong bài.
      </Text>

      <div style={{ marginTop: 16 }}>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpen}
            loading={initialLoading || loadingSet || saving}
          >
            {currentSet ? "Edit flashcards" : "Create flashcards"}
          </Button>

          {currentSet && (
            <Text type="secondary">
              Set: <code>{currentSet.id}</code> –{" "}
              {currentSet.title || "Untitled"}
            </Text>
          )}
        </Space>
      </div>

      <Spin spinning={initialLoading || loadingSet || saving} />

      {/* Modal builder – bên trong dùng flashcardSlice để CRUD card */}
      <FlashcardBuilderModal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        sectionContentId={sectionContentId}
        flashcardSet={currentSet}
        onSaved={handleSaved}
      />
    </div>
  );
}
