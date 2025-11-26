import React, { useCallback, useEffect, useState } from "react";
import { Button, Typography, message, Form, Input } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";

import {
  createContentThunk,
  updateSectionThunk,
} from "../../../../../../../../redux/features/teacherCourseSlice.js";

import {
  createCourseVocabSet,
  resetFlashcardState,
} from "../../../../../../../../redux/features/flashcardSlice.js";

import FlashcardBuilderModal from "../../../../../../ManageDocument/Flashcard/FlashcardBuilderModal.jsx";
import FlashcardList from "../../../../../../ManageDocument/Flashcard/FlashcardList/FlashcardList.jsx";

import styles from "../styles.module.scss";

const { Text } = Typography;

const extractContentId = (created) => {
  if (!created) return null;
  if (created.content?.id) return created.content.id;
  if (created.id) return created.id;
  if (created.data?.id) return created.data.id;
  return null;
};

export default function VocabFlashcardTab({
  lesson,
  sectionsHook,
  onSaved,
  onDurationComputed,
}) {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const [opening, setOpening] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [vocabSectionId, setVocabSectionId] = useState(null);
  const [sectionContentId, setSectionContentId] = useState(null);

  const { currentSet, saving } = useSelector(
    (state) => state.flashcardTeacher || state.flashcard
  );

  // 🔹 Khi đổi sang lesson khác ⇒ reset state flashcard (xóa set & cards cũ)
  useEffect(() => {
    if (lesson?.id) {
      dispatch(resetFlashcardState());
      setSectionContentId(null);
      setVocabSectionId(null);
    }
  }, [lesson?.id, dispatch]);

  // 🔹 Đọc section + content FLASHCARD_SET từ lesson.tree (nếu có)
  useEffect(() => {
    if (!lesson) {
      setVocabSectionId(null);
      setSectionContentId(null);
      form.resetFields();
      return;
    }

    const sections = lesson.sections || [];
    let foundSection = null;
    let foundContent = null;

    for (const sec of sections) {
      const flash = (sec.contents || []).find(
        (c) => c.contentFormat === "FLASHCARD_SET"
      );
      if (flash) {
        foundSection = sec;
        foundContent = flash;
        break;
      }
    }

    if (!foundSection) {
      foundSection = sections.find((sec) => sec.studyType === "VOCABULARY");
    }

    setVocabSectionId((prev) => prev || foundSection?.id || null);

    if (foundContent?.id) {
      setSectionContentId(foundContent.id);
    }

    const defaultTitle =
      foundSection?.title ||
      (lesson.title ? `Vocabulary – ${lesson.title}` : "Vocabulary section");

    form.setFieldsValue({ sectionTitle: defaultTitle });
  }, [lesson?.id, lesson?.title, lesson?.sections, form]);

  // 🔹 Tính lesson duration: có flashcard thì cho 10'
  useEffect(() => {
    if (typeof onDurationComputed !== "function") return;
    if (sectionContentId) onDurationComputed(600);
    else onDurationComputed(0);
  }, [sectionContentId, onDurationComputed]);

  // 🔹 Chỉ coi là "đã có set" nếu currentSet thuộc đúng sectionContentId này
  const hasSet = !!currentSet;
  // Tạo set mới (1 lesson chỉ 1 set)
  const handleCreateNewSet = useCallback(async () => {
    if (hasSet) {
      message.info("Lesson này đã có 1 bộ flashcard rồi.");
      return;
    }

    if (!lesson?.id) return message.error("Missing lessonId");

    // validate title
    let sectionTitle = "";
    try {
      const v = await form.validateFields();
      sectionTitle = v.sectionTitle;
    } catch {
      return;
    }

    setOpening(true);

    try {
      // 1) Đảm bảo có section VOCABULARY
      let sectionId = vocabSectionId;

      if (!sectionId) {
        const createdSec = await sectionsHook.ensureSection("VOCABULARY", {
          title: sectionTitle,
          studyType: "VOCABULARY",
        });

        sectionId = createdSec?.id;
        setVocabSectionId(sectionId);
      } else {
        // update lại title section nếu đã có
        await dispatch(
          updateSectionThunk({
            sectionId,
            data: { title: sectionTitle },
          })
        );
      }

      // 2) Đảm bảo có content FLASHCARD_SET
      let contentId = sectionContentId;
      if (!contentId) {
        const createdContent = await dispatch(
          createContentThunk({
            sectionId,
            data: {
              orderIndex: 0,
              contentFormat: "FLASHCARD_SET",
              primaryContent: false,
            },
          })
        ).unwrap();

        contentId = extractContentId(createdContent);
        await dispatch(
          createCourseVocabSet({
            title: `Từ vựng – ${lesson.title || "Lesson"}`,
            sectionContentId: contentId,
          })
        ).unwrap();
        setSectionContentId(contentId);
      }

      onSaved?.();
      setModalOpen(true);
    } finally {
      setOpening(false);
    }
  }, [
    hasSet,
    lesson?.id,
    lesson?.title,
    vocabSectionId,
    sectionContentId,
    dispatch,
    form,
    sectionsHook,
    onSaved,
  ]);

  return (
    <div className={styles.tabBody}>
      <Form form={form} layout="vertical">
        <Form.Item
          name="sectionTitle"
          label="Vocabulary section title"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Text>
          Đây là phần <b>Vocabulary</b> của lesson. Lesson này có thể gắn{" "}
          <b>một</b> bộ flashcard để học từ vựng.
        </Text>

        <div className={styles.actionRow}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateNewSet}
            loading={opening || saving}
            disabled={hasSet}
          >
            Create flashcard set
          </Button>
        </div>
      </Form>

      {/* LIST SET + CARDS */}
      <div className={styles.flashcardListWrapper}>
        <FlashcardList
          sectionContentId={sectionContentId}
          onEditSet={() => setModalOpen(true)}
          onEditCard={() => setModalOpen(true)}
        />
      </div>

      {/* MODAL BUILDER */}
      <FlashcardBuilderModal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        sectionContentId={sectionContentId}
      />
    </div>
  );
}
