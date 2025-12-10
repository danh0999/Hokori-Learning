// src/pages/Teacher/Courses/Create-Course/components/Curriculum Builder/LessonEditorDrawer/tabs/VocabFlashcardTab.jsx
import React, { useCallback, useEffect, useState } from "react";
import { Button, Form, Input, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";

import {
  createContentThunk,
  updateSectionThunk,
} from "../../../../../../../../redux/features/teacherCourseSlice.js";
import {
  createCourseVocabSet,
  resetFlashcardState,
} from "../../../../../../../../redux/features/flashcardSlice.js";

import FlashcardList from "../../../../../../ManageDocument/Flashcard/FlashcardList/FlashcardList.jsx";
import FlashcardBuilderModal from "../../../../../../ManageDocument/Flashcard/FlashcardBuilderModal.jsx";

import styles from "../styles.module.scss";
import { toast } from "react-toastify";

const { Text } = Typography;

// Helper lấy id content từ response createContentThunk
function extractContentId(created) {
  if (!created) return null;
  if (created.content?.id) return created.content.id;
  if (created.id) return created.id;
  return null;
}

/**
 * Props:
 *  - lesson: lessonFromTree
 *  - sectionsHook
 *  - onSaved: gọi để LessonEditorDrawer fetchCourseTree
 *  - onDurationComputed: set duration cho VOCAB
 */
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

  const [sectionId, setSectionId] = useState(null);
  const [contentId, setContentId] = useState(null);

  // 🔹 Mỗi lần đổi lesson → clear currentSet, cards,… để không xài set của lesson trước
  useEffect(() => {
    dispatch(resetFlashcardState());
  }, [dispatch, lesson?.id]);

  // 🔹 Đồng bộ section + content từ lesson.sections
  useEffect(() => {
    if (!lesson?.sections) {
      setSectionId(null);
      setContentId(null);
      form.setFieldsValue({
        sectionTitle: `Vocabulary – ${lesson?.title || "Lesson"}`,
      });
      return;
    }

    const vocabSec = lesson.sections.find((s) => s.studyType === "VOCABULARY");
    setSectionId(vocabSec?.id || null);

    const flashContent = vocabSec?.contents?.find(
      (c) => c.contentFormat === "FLASHCARD_SET"
    );
    setContentId(flashContent?.id || null);

    form.setFieldsValue({
      sectionTitle:
        vocabSec?.title || `Vocabulary – ${lesson?.title || "Lesson"}`,
    });
  }, [lesson?.id, lesson?.title, lesson?.sections, form]);

  // 🔹 Duration: 1 flashcard set = 10 phút
  useEffect(() => {
    if (!onDurationComputed) return;
    onDurationComputed(contentId ? 600 : 0);
  }, [contentId, onDurationComputed]);

  const hasSet = !!contentId;

  const handleCreateOrOpen = useCallback(async () => {
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
      let secId = sectionId;

      // 1) Tạo / update section VOCABULARY
      if (!secId) {
        const createdSec = await sectionsHook.ensureSection("VOCABULARY", {
          title: sectionTitle,
          studyType: "VOCABULARY",
        });
        secId = createdSec?.id;
        setSectionId(secId);
      } else {
        await dispatch(
          updateSectionThunk({
            sectionId: secId,
            data: { title: sectionTitle },
          })
        ).unwrap();
      }

      // 2) Tạo content FLASHCARD_SET nếu chưa có
      let cntId = contentId;
      if (!cntId) {
        const createdContent = await dispatch(
          createContentThunk({
            sectionId: secId,
            data: {
              orderIndex: 0,
              contentFormat: "FLASHCARD_SET",
            },
          })
        ).unwrap();

        cntId = extractContentId(createdContent);
        if (!cntId) throw new Error("Cannot extract sectionContentId");
        setContentId(cntId);

        // 3) Tạo flashcard set cho content này
        const rs = await dispatch(
          createCourseVocabSet({
            title: `Từ vựng – ${lesson.title || "Lesson"}`,
            sectionContentId: cntId,
          })
        );
        if (createCourseVocabSet.rejected.match(rs)) {
          throw new Error(rs.payload || "Create flashcard set failed");
        }
      }

      // 4) Reload tree cho lesson / curriculum
      await onSaved?.();

      // 5) Mở modal builder
      setModalOpen(true);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Không thể mở flashcard builder");
    } finally {
      setOpening(false);
    }
  }, [
    lesson?.id,
    lesson?.title,
    sectionId,
    contentId,
    form,
    dispatch,
    sectionsHook,
    onSaved,
  ]);

  return (
    <div className={styles.tabBody}>
      <Form form={form} layout="vertical">
        <Form.Item
          name="sectionTitle"
          label="Tiêu đề phần từ vựng"
          rules={[{ required: true, message: "Nhập tiêu đề phần từ vựng" }]}
        >
          <Input />
        </Form.Item>

        <Text>
          Mỗi <b>lesson</b> chỉ có <b>1</b> bộ flashcard từ vựng.
        </Text>

        <div style={{ marginTop: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateOrOpen}
            loading={opening}
            disabled={hasSet}
          >
            {hasSet ? "Bộ flashcard đã tồn tại" : "Tạo bộ flashcard"}
          </Button>
        </div>
      </Form>

      <div style={{ marginTop: 32 }}>
        <FlashcardList
          sectionContentId={contentId}
          onEditSet={() => setModalOpen(true)}
        />
      </div>

      <FlashcardBuilderModal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        sectionContentId={contentId}
      />
    </div>
  );
}
