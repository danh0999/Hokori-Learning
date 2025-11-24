// LessonEditorDrawer/LessonEditorDrawer.jsx
import React, { useMemo, useState } from "react";
import { Drawer, Tabs, Button, Space, message, Typography } from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  BookOutlined,
  FontSizeOutlined,
  TranslationOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";

import { fetchCourseTree } from "../../../../../../../redux/features/teacherCourseSlice.js";
import useLessonSections from "./useLessonSections.js";

import GrammarKanjiTab from "./tabs/GrammarKanjiTab.jsx";
import VocabFlashcardTab from "./tabs/VocabFlashcardTab.jsx";
import QuizTab from "./tabs/QuizTab.jsx";

import styles from "./styles.module.scss";

const { Text } = Typography;

export default function LessonEditorDrawer({ open, lesson, onClose, onSave }) {
  const dispatch = useDispatch();
  const { currentCourseTree, currentCourseMeta } = useSelector(
    (s) => s.teacherCourse
  );

  const [activeTab, setActiveTab] = useState("grammar");

  // lấy lesson mới nhất từ tree (đề phòng bên ngoài đã reload)
  const lessonFromTree = useMemo(() => {
    if (!lesson?.id || !currentCourseTree?.chapters) return lesson;
    for (const ch of currentCourseTree.chapters) {
      const l = (ch.lessons || []).find((x) => x.id === lesson.id);
      if (l) return l;
    }
    return lesson;
  }, [lesson, currentCourseTree]);

  const sectionsHook = useLessonSections(lessonFromTree);

  const renderLessonMetaShort = (les) => {
    if (!les) return null;
    const sectionCount = les.sections?.length || 0;
    const contentCount = (les.sections || []).reduce(
      (sum, s) => sum + (s.contents?.length || 0),
      0
    );
    if (!sectionCount && !contentCount) return "Chưa có section / content";
    return `${sectionCount} section · ${contentCount} content`;
  };

  // 🔁 reload course tree sau khi 1 tab lưu xong
  const handleChildSaved = async () => {
    try {
      if (currentCourseMeta?.id) {
        await dispatch(fetchCourseTree(currentCourseMeta.id)).unwrap();
      }
      onSave?.();
    } catch (err) {
      console.error(err);
      message.error("Có lỗi khi reload curriculum.");
    }
  };

  // nút Save lesson ở góc phải
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
      label: (
        <div className={styles.lessonTabLabel}>
          <div className={styles.lessonTabLabelTop}>
            <span className={styles.lessonTabPill}>Section</span>
            <span className={styles.lessonTabName}>
              <BookOutlined className={styles.lessonTabIcon} />
              Grammar
            </span>
          </div>
          <div className={styles.lessonTabSub}>
            Video + mô tả ngữ pháp cho lesson này.
          </div>
        </div>
      ),
      children: (
        <GrammarKanjiTab
          type="GRAMMAR"
          lesson={lessonFromTree}
          sectionsHook={sectionsHook}
          onSaved={handleChildSaved}
        />
      ),
    },
    {
      key: "kanji",
      label: (
        <div className={styles.lessonTabLabel}>
          <div className={styles.lessonTabLabelTop}>
            <span className={styles.lessonTabPill}>Section</span>
            <span className={styles.lessonTabName}>
              <FontSizeOutlined className={styles.lessonTabIcon} />
              Kanji
            </span>
          </div>
          <div className={styles.lessonTabSub}>
            Video + ghi chú Kanji, ví dụ minh hoạ.
          </div>
        </div>
      ),
      children: (
        <GrammarKanjiTab
          type="KANJI"
          lesson={lessonFromTree}
          sectionsHook={sectionsHook}
          onSaved={handleChildSaved}
        />
      ),
    },
    {
      key: "vocab",
      label: (
        <div className={styles.lessonTabLabel}>
          <div className={styles.lessonTabLabelTop}>
            <span className={styles.lessonTabPill}>Section</span>
            <span className={styles.lessonTabName}>
              <TranslationOutlined className={styles.lessonTabIcon} />
              Vocabulary
            </span>
          </div>
          <div className={styles.lessonTabSub}>
            Tạo bộ flashcard cho từ vựng của lesson.
          </div>
        </div>
      ),
      children: (
        <VocabFlashcardTab
          lesson={lessonFromTree}
          sectionsHook={sectionsHook}
        />
      ),
    },
    {
      key: "quiz",
      label: (
        <div className={styles.lessonTabLabel}>
          <div className={styles.lessonTabLabelTop}>
            <span className={styles.lessonTabPill}>Content</span>
            <span className={styles.lessonTabName}>
              <QuestionCircleOutlined className={styles.lessonTabIcon} />
              Quiz tổng hợp
            </span>
          </div>
          <div className={styles.lessonTabSub}>
            1 quiz tổng hợp sau khi học Grammar / Kanji / Vocab.
          </div>
        </div>
      ),
      children: <QuizTab lesson={lessonFromTree} />,
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
                Đây là <b>Grammar section</b> của lesson. Nhấn &quot;Save
                Grammar&quot; để lưu video & mô tả.
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
                Đây là <b>Quiz content</b>. Quiz được lưu trong cửa sổ Quiz
                builder.
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
