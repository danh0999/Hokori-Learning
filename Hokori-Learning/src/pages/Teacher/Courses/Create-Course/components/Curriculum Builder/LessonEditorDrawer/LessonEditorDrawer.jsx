// LessonEditorDrawer/LessonEditorDrawer.jsx
import React, { useMemo, useState } from "react";
import { Drawer, Tabs, Button, Space, message } from "antd";
import { useDispatch, useSelector } from "react-redux";

import { fetchCourseTree } from "../../../../../../../redux/features/teacherCourseSlice.js";
import useLessonSections from "./useLessonSections.js";

import GrammarKanjiTab from "./tabs/GrammarKanjiTab.jsx";
import VocabFlashcardTab from "./tabs/VocabFlashcardTab.jsx";
import QuizTab from "./tabs/QuizTab.jsx";

import styles from "./styles.module.scss";

export default function LessonEditorDrawer({ open, lesson, onClose, onSave }) {
  const dispatch = useDispatch();
  const { currentCourseTree, currentCourseMeta } = useSelector(
    (s) => s.teacherCourse
  );

  const [activeTab, setActiveTab] = useState("grammar");

  // lấy lesson mới nhất từ tree
  const lessonFromTree = useMemo(() => {
    if (!lesson?.id || !currentCourseTree?.chapters) return lesson;
    for (const ch of currentCourseTree.chapters) {
      const l = (ch.lessons || []).find((x) => x.id === lesson.id);
      if (l) return l;
    }
    return lesson;
  }, [lesson, currentCourseTree]);

  const sectionsHook = useLessonSections(lessonFromTree);

  const handleReloadTreeAndClose = async () => {
    try {
      if (currentCourseMeta?.id) {
        await dispatch(fetchCourseTree(currentCourseMeta.id)).unwrap();
      }
      message.success("Đã cập nhật lesson.");
      onSave?.();
      onClose?.();
    } catch (err) {
      console.error(err);
      message.error("Có lỗi khi reload curriculum.");
    }
  };

  const tabItems = [
    {
      key: "grammar",
      label: "Grammar",
      children: (
        <GrammarKanjiTab
          type="GRAMMAR"
          lesson={lessonFromTree}
          sectionsHook={sectionsHook}
        />
      ),
    },
    {
      key: "kanji",
      label: "Kanji",
      children: (
        <GrammarKanjiTab
          type="KANJI"
          lesson={lessonFromTree}
          sectionsHook={sectionsHook}
        />
      ),
    },
    {
      key: "vocab",
      label: "Vocabulary",
      children: (
        <VocabFlashcardTab
          lesson={lessonFromTree}
          sectionsHook={sectionsHook}
        />
      ),
    },
    {
      key: "quiz",
      label: "Quiz",
      children: <QuizTab lesson={lessonFromTree} />,
    },
  ];

  return (
    <Drawer
      open={open}
      width={800}
      title={`Edit lesson: ${lessonFromTree?.title || ""}`}
      onClose={onClose}
      destroyOnClose={false}
      extra={
        <Button type="primary" onClick={handleReloadTreeAndClose}>
          Save lesson
        </Button>
      }
      footer={
        <div className={styles.footer}>
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            {activeTab === "grammar" && (
              <span className={styles.footerHint}>
                Nhấn &quot;Save&quot; trong tab Grammar để lưu nội dung.
              </span>
            )}
            {activeTab === "kanji" && (
              <span className={styles.footerHint}>
                Nhấn &quot;Save&quot; trong tab Kanji để lưu nội dung.
              </span>
            )}
            {activeTab === "vocab" && (
              <span className={styles.footerHint}>
                Flashcard được lưu trong modal flashcard.
              </span>
            )}
            {activeTab === "quiz" && (
              <span className={styles.footerHint}>
                Quiz được lưu bằng nút <b>Save</b> trong cửa sổ Quiz.
              </span>
            )}
          </Space>
        </div>
      }
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
    </Drawer>
  );
}
