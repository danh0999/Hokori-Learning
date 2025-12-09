// LessonEditorDrawer/tabs/VocabFlashcardTab.jsx
import React, { useCallback, useEffect, useState } from "react";
import { Button, Typography, Form, Input } from "antd";
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
import { toast } from "react-toastify";

const { Text } = Typography;

// bóc id content từ response createContentThunk
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
  onDurationComputed,
  onSaved,
}) {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const [vocabSectionId, setVocabSectionId] = useState(null);
  const [sectionContentId, setSectionContentId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [opening, setOpening] = useState(false);

  // Lấy currentSet từ Redux để biết lesson này đã có bộ flashcard chưa
  const { currentSet } = useSelector(
    (state) => state.flashcardTeacher || state.flashcard
  );

  const hasSet = !!currentSet;

  /* Khi đổi lesson → reset state flashcard (tránh dính từ lesson cũ) */
  useEffect(() => {
    dispatch(resetFlashcardState());
    setVocabSectionId(null);
    setSectionContentId(null);
  }, [lesson?.id, dispatch]);

  /* Đồng bộ section + content theo tree hiện tại của lesson */
  useEffect(() => {
    if (!lesson?.sections) return;

    const sections = lesson.sections || [];

    let foundSection = null;
    let foundContent = null;

    for (const sec of sections) {
      if (sec.studyType !== "VOCABULARY") continue;

      foundSection = sec;

      const flash = (sec.contents || []).find(
        (c) => c.contentFormat === "FLASHCARD_SET"
      );
      if (flash) {
        foundContent = flash;
        break;
      }
    }

    if (!foundSection) {
      foundSection = sections.find((sec) => sec.studyType === "VOCABULARY");
    }

    setVocabSectionId(foundSection?.id || null);
    setSectionContentId(foundContent?.id || null);

    const defaultTitle =
      foundSection?.title ||
      (lesson.title ? `Vocabulary – ${lesson.title}` : "Vocabulary section");

    form.setFieldsValue({ sectionTitle: defaultTitle });
  }, [lesson?.id, lesson?.title, lesson?.sections, form]);

  /* duration: nếu đã có flashcard content thì fix 10' */
  useEffect(() => {
    if (typeof onDurationComputed !== "function") return;
    if (sectionContentId) onDurationComputed(600);
    else onDurationComputed(0);
  }, [sectionContentId, onDurationComputed]);

  const handleOpenBuilder = useCallback(async () => {
    if (!lesson?.id) return toast.error("Missing lessonId");

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
      let sectionId = vocabSectionId;

      // 1) Đảm bảo đã có section VOCABULARY
      if (!sectionId) {
        const createdSec = await sectionsHook.ensureSection("VOCABULARY", {
          title: sectionTitle,
          studyType: "VOCABULARY",
        });

        sectionId = createdSec?.id;
        setVocabSectionId(sectionId);
      } else {
        // update title section nếu đã tồn tại
        await dispatch(
          updateSectionThunk({
            sectionId,
            data: { title: sectionTitle },
          })
        );
      }

      // 2) Đảm bảo đã có content FLASHCARD_SET trong section
      let newContentId = sectionContentId;

      if (!newContentId) {
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

        newContentId = extractContentId(createdContent);
        if (!newContentId) {
          throw new Error("Cannot extract sectionContentId from response");
        }

        // 3) Tạo flashcard set cho content này (COURSE_VOCAB)
        const action = await dispatch(
          createCourseVocabSet({
            title: `Từ vựng – ${lesson.title || "New lesson"}`,
            sectionContentId: newContentId,
          })
        );
        if (createCourseVocabSet.rejected.match(action)) {
          throw new Error(action.payload || "Create flashcard set failed");
        }

        // Chỉ set lại sectionContentId sau khi set tạo thành công
        setSectionContentId(newContentId);
      }

      onSaved?.();
      setModalOpen(true);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Không thể mở Flashcard builder.");
    } finally {
      setOpening(false);
    }
  }, [
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
          label="Tiêu đề phần từ vựng"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Text>
          Đây là phần <b>Vocabulary</b> của lesson. Lesson này có thể gắn{" "}
          <b>một</b> bộ flashcard để học từ vựng.
        </Text>

        <div style={{ marginTop: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenBuilder}
            loading={opening}
            disabled={hasSet}
          >
            {hasSet ? "Bộ flashcard đã tồn tại" : "Tạo bộ flashcard"}
          </Button>
        </div>
      </Form>

      {/* FLASHCARD LIST */}
      <div style={{ marginTop: 32 }}>
        <FlashcardList
          sectionContentId={sectionContentId}
          onEditSet={() => setModalOpen(true)}
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
