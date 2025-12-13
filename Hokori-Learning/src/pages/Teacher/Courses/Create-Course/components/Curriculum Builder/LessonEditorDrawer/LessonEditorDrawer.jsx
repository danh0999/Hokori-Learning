import React, { useMemo, useState, useCallback } from "react";
import { Drawer, Tabs, Button, Space, Typography } from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  BookOutlined,
  FontSizeOutlined,
  TranslationOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";

import {
  fetchCourseTree,
  updateLessonThunk,
} from "../../../../../../../redux/features/teacherCourseSlice.js";
import useLessonSections from "./useLessonSections.js";

import GrammarKanjiTab from "./tabs/GrammarKanjiTab.jsx";
import VocabFlashcardTab from "./tabs/VocabFlashcardTab.jsx";
import QuizTab from "./tabs/QuizTab.jsx";

import styles from "./styles.module.scss";
import { toast } from "react-toastify";

const { Text } = Typography;

export default function LessonEditorDrawer({ open, lesson, onClose, onSave }) {
  const dispatch = useDispatch();
  const { currentCourseTree, currentCourseMeta } = useSelector(
    (s) => s.teacherCourse
  );

  const [activeTab, setActiveTab] = useState("grammar");

  // ✅ state để dedupe duration, tránh dispatch lặp
  const [sectionDurations, setSectionDurations] = useState({
    GRAMMAR: 0,
    KANJI: 0,
    VOCABULARY: 0,
    QUIZ: 0,
  });

  // luôn lấy lesson mới nhất trong tree
  const lessonFromTree = useMemo(() => {
    if (!lesson?.id || !currentCourseTree?.chapters) return lesson;
    for (const ch of currentCourseTree.chapters) {
      const l = (ch.lessons || []).find((x) => x.id === lesson.id);
      if (l) return l;
    }
    return lesson;
  }, [lesson, currentCourseTree]);

  const sectionsHook = useLessonSections(lessonFromTree);
  const quizSection = sectionsHook.sectionsByType.QUIZ;

  // ✅ chỉ update lesson duration khi studyType đó thật sự thay đổi
  const handleSectionDurationChange = useCallback(
    (studyType, seconds) => {
      if (!lessonFromTree?.id) return;

      const nextVal = Math.max(seconds || 0, 0);

      setSectionDurations((prev) => {
        const currentVal = prev[studyType] || 0;
        if (currentVal === nextVal) return prev; // ✅ không đổi → khỏi dispatch

        const next = { ...prev, [studyType]: nextVal };
        const total = Object.values(next).reduce((sum, v) => sum + (v || 0), 0);

        dispatch(
          updateLessonThunk({
            lessonId: lessonFromTree.id,
            data: {
              title: lessonFromTree.title || "Untitled lesson",
              totalDurationSec: total,
            },
          })
        ).catch(() => {
          toast.error("Không cập nhật được thời lượng lesson.");
        });

        return next;
      });
    },
    [lessonFromTree?.id, lessonFromTree?.title, dispatch]
  );

  // ✅ memoized callbacks để không làm đổi reference mỗi render
  const onGrammarDuration = useCallback(
    (s) => handleSectionDurationChange("GRAMMAR", s),
    [handleSectionDurationChange]
  );
  const onKanjiDuration = useCallback(
    (s) => handleSectionDurationChange("KANJI", s),
    [handleSectionDurationChange]
  );
  const onVocabDuration = useCallback(
    (s) => handleSectionDurationChange("VOCABULARY", s),
    [handleSectionDurationChange]
  );
  const onQuizDuration = useCallback(
    (s) => handleSectionDurationChange("QUIZ", s),
    [handleSectionDurationChange]
  );

  const renderLessonMetaShort = (les) => {
    if (!les) return "";
    const s = les.sections?.length || 0;
    const c = (les.sections || []).reduce(
      (sum, sec) => sum + (sec.contents?.length || 0),
      0
    );
    return `${s} section · ${c} content`;
  };

  const handleChildSaved = useCallback(async () => {
    try {
      if (currentCourseMeta?.id) {
        await dispatch(fetchCourseTree(currentCourseMeta.id)).unwrap();
      }
      onSave?.();
    } catch {
      toast.error("Không reload được curriculum.");
    }
  }, [currentCourseMeta?.id, dispatch, onSave]);

  const tabs = [
    {
      key: "grammar",
      label: (
        <div className={styles.lessonTabLabel}>
          <BookOutlined /> Grammar
        </div>
      ),
      children: (
        <GrammarKanjiTab
          type="GRAMMAR"
          lesson={lessonFromTree}
          sectionsHook={sectionsHook}
          onSaved={handleChildSaved}
          onDurationComputed={onGrammarDuration}
        />
      ),
    },
    {
      key: "kanji",
      label: (
        <div className={styles.lessonTabLabel}>
          <FontSizeOutlined /> Kanji
        </div>
      ),
      children: (
        <GrammarKanjiTab
          type="KANJI"
          lesson={lessonFromTree}
          sectionsHook={sectionsHook}
          onSaved={handleChildSaved}
          onDurationComputed={onKanjiDuration}
        />
      ),
    },
    {
      key: "vocab",
      label: (
        <div className={styles.lessonTabLabel}>
          <TranslationOutlined /> Vocab
        </div>
      ),
      children: (
        <VocabFlashcardTab
          lesson={lessonFromTree}
          sectionsHook={sectionsHook}
          onSaved={handleChildSaved}
          onDurationComputed={onVocabDuration}
        />
      ),
    },
    {
      key: "quiz",
      label: (
        <div className={styles.lessonTabLabel}>
          <QuestionCircleOutlined /> Quiz
        </div>
      ),
      children: (
        <QuizTab
          lesson={lessonFromTree}
          quizSection={quizSection}
          onSaved={handleChildSaved}
          onDurationComputed={onQuizDuration}
        />
      ),
    },
  ];

  return (
    <Drawer
      width={960}
      className={styles.lessonDrawer}
      open={open}
      onClose={onClose}
      destroyOnClose={false}
      maskClosable={false}
      title={
        <div className={styles.drawerHeader}>
          <div className={styles.drawerTitle}>Soạn bài học</div>
          <div className={styles.drawerMeta}>
            Lesson #{lessonFromTree?.id} ·{" "}
            {renderLessonMetaShort(lessonFromTree)}
          </div>
        </div>
      }
      footer={
        <div className={styles.drawerFooter}>
          <span className={styles.footerHint}>
            Grammar / Kanji lưu trực tiếp · Quiz & Flashcard lưu trong modal
          </span>
          <Space>
            <Button onClick={onClose}>Đóng</Button>
          </Space>
        </div>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabs}
        tabBarGutter={24}
      />
    </Drawer>
  );
}
