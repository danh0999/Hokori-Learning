// LessonEditorDrawer/LessonEditorDrawer.jsx
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
  //eslint-disable-next-line no-unused-vars
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

  // cập nhật totalDurationSec cho lesson, tránh loop
  const handleSectionDurationChange = useCallback(
    (studyType, seconds) => {
      if (!lessonFromTree?.id) return;

      setSectionDurations((prev) => {
        const nextVal = seconds || 0;
        const currentVal = prev[studyType] || 0;
        if (nextVal === currentVal) return prev; // không đổi → khỏi dispatch

        const next = { ...prev, [studyType]: nextVal };
        const total = Object.values(next).reduce((sum, v) => sum + (v || 0), 0);

        const safeTitle =
          lessonFromTree.title && lessonFromTree.title.trim().length > 0
            ? lessonFromTree.title
            : "Untitled lesson";

        dispatch(
          updateLessonThunk({
            lessonId: lessonFromTree.id,
            data: {
              title: safeTitle, // BE bắt buộc không được rỗng
              totalDurationSec: total,
            },
          })
        ).catch((err) => {
          console.error(err);
          toast.error("Không cập nhật được tổng thời lượng lesson.");
        });

        return next;
      });
    },
    [lessonFromTree?.id, lessonFromTree?.title, dispatch]
  );

  const renderLessonMetaShort = (les) => {
    if (!les) return null;
    const sectionCount = les.sections?.length || 0;
    const contentCount = (les.sections || []).reduce(
      (sum, s) => sum + (s.contents?.length || 0),
      0
    );
    if (!sectionCount && !contentCount) return "Chưa có section / content";
    return `${sectionCount} section(s) · ${contentCount} content item(s)`;
  };

  const handleChildSaved = async () => {
    try {
      if (currentCourseMeta?.id) {
        await dispatch(fetchCourseTree(currentCourseMeta.id)).unwrap();
      }
      onSave?.();
    } catch (err) {
      console.error(err);
      toast.error("Không reload được course tree sau khi lưu.");
    }
  };

  const tabs = [
    {
      key: "grammar",
      label: (
        <span>
          <BookOutlined /> Grammar
        </span>
      ),
      children: (
        <GrammarKanjiTab
          type="GRAMMAR"
          lesson={lessonFromTree}
          sectionsHook={sectionsHook}
          onSaved={handleChildSaved}
          onDurationComputed={(sec) =>
            handleSectionDurationChange("GRAMMAR", sec)
          }
        />
      ),
    },
    {
      key: "kanji",
      label: (
        <span>
          <FontSizeOutlined /> Kanji
        </span>
      ),
      children: (
        <GrammarKanjiTab
          type="KANJI"
          lesson={lessonFromTree}
          sectionsHook={sectionsHook}
          onSaved={handleChildSaved}
          onDurationComputed={(sec) =>
            handleSectionDurationChange("KANJI", sec)
          }
        />
      ),
    },
    {
      key: "vocab",
      label: (
        <span>
          <TranslationOutlined /> Vocab / Flashcard
        </span>
      ),
      children: (
        <VocabFlashcardTab
          lesson={lessonFromTree}
          sectionsHook={sectionsHook}
          onSaved={handleChildSaved}
          onDurationComputed={(sec) =>
            handleSectionDurationChange("VOCABULARY", sec)
          }
        />
      ),
    },
    {
      key: "quiz",
      label: (
        <span>
          <QuestionCircleOutlined /> Quiz
        </span>
      ),
      children: (
        <QuizTab
          lesson={lessonFromTree}
          sectionsHook={sectionsHook}
          quizSection={quizSection}
          onSaved={handleChildSaved}
          onDurationComputed={(sec) => handleSectionDurationChange("QUIZ", sec)}
        />
      ),
    },
  ];

  return (
    <Drawer
      width={960}
      title={
        <div className={styles.header}>
          <div>
            <Text strong>Chỉnh sửa lesson</Text>
            <div className={styles.meta}>
              <span>ID: {lessonFromTree?.id}</span>
              <span>{renderLessonMetaShort(lessonFromTree)}</span>
            </div>
          </div>
        </div>
      }
      open={open}
      onClose={onClose}
      destroyOnClose={false}
      maskClosable={false}
      footer={
        <Space style={{ justifyContent: "flex-end", width: "100%" }}>
          <Button onClick={onClose}>Đóng</Button>
        </Space>
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
