import React, { useCallback, useEffect, useState } from "react";
import { Button, Form, Input, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

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

const { Text } = Typography;

function extractContentId(created) {
  if (!created) return null;
  if (created.content?.id) return created.content.id;
  if (created.id) return created.id;
  return null;
}

export default function VocabFlashcardTab({
  lesson,
  section, // ✅ section đã được tạo từ Drawer
  onSaved,
  onDurationComputed,
}) {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const [opening, setOpening] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [contentId, setContentId] = useState(null);

  const { currentSet } = useSelector(
    (state) => state.flashcardTeacher || state.flashcard
  );

  // clear state khi đổi lesson
  useEffect(() => {
    dispatch(resetFlashcardState());
  }, [dispatch, lesson?.id]);

  // sync contentId từ section.contents
  useEffect(() => {
    if (!section?.id) return;

    const flashContent = (section.contents || []).find(
      (c) => c.contentFormat === "FLASHCARD_SET"
    );
    setContentId(flashContent?.id || null);

    form.setFieldsValue({
      sectionTitle:
        section.title || `Vocabulary – ${lesson?.title || "Lesson"}`,
    });
  }, [section?.id, section?.title, section?.contents, lesson?.title, form]);

  // duration: có set => 10 phút
  useEffect(() => {
    if (!onDurationComputed) return;
    onDurationComputed(contentId ? 600 : 0);
  }, [contentId, onDurationComputed]);

  const hasSet = !!(contentId && currentSet?.id);

  const handleCreateOrOpen = useCallback(async () => {
    if (!lesson?.id) return toast.error("Missing lessonId");
    if (!section?.id)
      return toast.error("Chưa có section. Hãy tạo phần từ nút + trước.");

    let sectionTitle = "";
    try {
      const v = await form.validateFields();
      sectionTitle = v.sectionTitle;
    } catch {
      return;
    }

    setOpening(true);

    try {
      // 1) update title section
      if (sectionTitle && sectionTitle !== section.title) {
        await dispatch(
          updateSectionThunk({
            sectionId: section.id,
            data: { title: sectionTitle },
          })
        ).unwrap();
      }

      // 2) tạo content FLASHCARD_SET nếu chưa có
      let cntId = contentId;
      if (!cntId) {
        const createdContent = await dispatch(
          createContentThunk({
            sectionId: section.id,
            data: {
              orderIndex: 0,
              contentFormat: "FLASHCARD_SET",
            },
          })
        ).unwrap();

        cntId = extractContentId(createdContent);
        if (!cntId) throw new Error("Cannot extract sectionContentId");
        setContentId(cntId);
      }

      // 3) tạo flashcard set nếu chưa có
      if (!currentSet?.id) {
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

      // 4) reload tree
      await onSaved?.();

      // 5) mở modal
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
    section?.id,
    section?.title,
    contentId,
    form,
    dispatch,
    onSaved,
    currentSet,
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
