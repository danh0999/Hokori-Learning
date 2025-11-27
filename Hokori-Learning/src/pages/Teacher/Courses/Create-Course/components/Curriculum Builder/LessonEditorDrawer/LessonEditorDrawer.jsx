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
      toast.error("Có lỗi khi reload curriculum.");
    }
  };

  const handleReloadTreeAndClose = async () => {
    try {
      if (currentCourseMeta?.id) {
        await dispatch(fetchCourseTree(currentCourseMeta.id)).unwrap();
      }
      toast.success("Đã cập nhật lesson.");
      onSave?.();
      onClose?.();
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi khi reload curriculum.");
    }
  };

  const tabItems = [
    {
      key: "grammar",
      label: (
        <div className={styles.lessonTabLabel}>
          <BookOutlined className={styles.tabIcon} />
          <span>Grammar</span>
        </div>
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
        <div className={styles.lessonTabLabel}>
          <FontSizeOutlined className={styles.tabIcon} />
          <span>Kanji</span>
        </div>
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
        <div className={styles.lessonTabLabel}>
          <TranslationOutlined className={styles.tabIcon} />
          <span>Vocabulary</span>
        </div>
      ),
      children: (
        <VocabFlashcardTab
          lesson={lessonFromTree}
          sectionsHook={sectionsHook}
          onSaved={handleChildSaved} // 👉 quan trọng: tạo flashcard xong thì reload tree
          onDurationComputed={(sec) =>
            handleSectionDurationChange("VOCABULARY", sec)
          }
        />
      ),
    },
    {
      key: "quiz",
      label: (
        <div className={styles.lessonTabLabel}>
          <QuestionCircleOutlined className={styles.tabIcon} />
          <span>Quiz</span>
        </div>
      ),
      children: (
        <QuizTab
          lesson={lessonFromTree}
          onDurationComputed={(sec) => handleSectionDurationChange("QUIZ", sec)}
        />
      ),
    },
  ];

  return (
    <Drawer
      open={open}
      width={860}
      onClose={onClose}
      destroyOnClose={false}
      title={
        <div className={styles.drawerTitle}>
          <div className={styles.drawerTitleBreadcrumb}>
            <span className={styles.crumbDim}>Course</span>
            <span> / Lesson</span>
          </div>
          <div className={styles.drawerTitleMain}>
            {lessonFromTree?.title || "Untitled lesson"}
          </div>
          <div className={styles.drawerTitleSub}>
            {currentCourseMeta?.title && (
              <>
                <span className={styles.courseTitle}>
                  {currentCourseMeta.title}
                </span>
                <span className={styles.dot}>&bull;</span>
              </>
            )}
            <span>{renderLessonMetaShort(lessonFromTree)}</span>
          </div>
        </div>
      }
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
                Đây là <b>Grammar section</b>. Nhấn &quot;Save Grammar&quot; để
                lưu video & mô tả.
              </span>
            )}
            {activeTab === "kanji" && (
              <span className={styles.footerHint}>
                Đây là <b>Kanji section</b>. Nhấn &quot;Save Kanji&quot; để lưu
                nội dung.
              </span>
            )}
            {activeTab === "vocab" && (
              <span className={styles.footerHint}>
                Đây là <b>Vocabulary section</b>. Flashcard được lưu trong modal
                flashcard.
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
      className={styles.lessonDrawer}
    >
      <div className={styles.drawerInner}>
        <div className={styles.drawerStructureHint}>
          <Text type="secondary" className={styles.structureText}>
            <span className={styles.structureLabel}>Structure&nbsp;</span>
            Chapter &gt; Lesson &gt; Section (Grammar / Kanji / Vocab) &gt;
            Content (Video / Flashcard / Quiz)
          </Text>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          className={styles.lessonTabs}
        />
      </div>
    </Drawer>
  );
}
