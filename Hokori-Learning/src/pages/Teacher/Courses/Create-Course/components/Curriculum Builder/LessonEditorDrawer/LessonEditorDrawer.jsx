import React, { useMemo, useState, useCallback, useEffect } from "react";
import {
  Drawer,
  Tabs,
  Button,
  Space,
  Typography,
  Modal,
  Popconfirm,
  Select,
  message,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  PlusOutlined,
  DeleteOutlined,
  BookOutlined,
  FontSizeOutlined,
  TranslationOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";

import {
  fetchCourseTree,
  updateLessonThunk,
  createSectionThunk,
  deleteContentThunk,
  deleteSectionThunk,
} from "../../../../../../../redux/features/teacherCourseSlice.js";
import { deleteFlashcardSet } from "../../../../../../../redux/features/flashcardSlice.js";
import { deleteLessonQuizThunk } from "../../../../../../../redux/features/quizSlice.js";

import useLessonSections from "./useLessonSections.js";
import GrammarKanjiTab from "./tabs/GrammarKanjiTab.jsx";
import VocabFlashcardTab from "./tabs/VocabFlashcardTab.jsx";
import QuizTab from "./tabs/QuizTab.jsx";

import styles from "./styles.module.scss";

const { Text } = Typography;

const STUDY_TYPES = ["GRAMMAR", "KANJI", "VOCABULARY", "QUIZ"];

const TYPE_META = {
  GRAMMAR: { label: "Grammar", icon: <BookOutlined /> },
  KANJI: { label: "Kanji", icon: <FontSizeOutlined /> },
  VOCABULARY: { label: "Vocab / Flashcard", icon: <TranslationOutlined /> },
  QUIZ: { label: "Quiz", icon: <QuestionCircleOutlined /> },
};

function defaultSectionTitle(type, lessonTitle) {
  const base = TYPE_META[type]?.label || "Section";
  return lessonTitle ? `${base} - ${lessonTitle}` : base;
}

export default function LessonEditorDrawer({ open, lesson, onClose, onSave }) {
  const dispatch = useDispatch();
  const { currentCourseTree, currentCourseMeta } = useSelector(
    (s) => s.teacherCourse
  );

  const [activeKey, setActiveKey] = useState(""); // key = sectionId string
  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selectedType, setSelectedType] = useState(null);

  // duration dedupe (tránh spam API)
  const [sectionDurations, setSectionDurations] = useState({
    GRAMMAR: 0,
    KANJI: 0,
    VOCABULARY: 0,
    QUIZ: 0,
  });

  // lấy lesson mới nhất trong tree
  const lessonFromTree = useMemo(() => {
    if (!lesson?.id || !currentCourseTree?.chapters) return lesson;
    for (const ch of currentCourseTree.chapters) {
      const l = (ch.lessons || []).find((x) => x.id === lesson.id);
      if (l) return l;
    }
    return lesson;
  }, [lesson, currentCourseTree]);

  const sectionsHook = useLessonSections(lessonFromTree);

  const sections = useMemo(() => {
    return (lessonFromTree?.sections || []).slice().sort((a, b) => {
      const ao = typeof a.orderIndex === "number" ? a.orderIndex : 0;
      const bo = typeof b.orderIndex === "number" ? b.orderIndex : 0;
      return ao - bo;
    });
  }, [lessonFromTree?.sections]);

  const existingTypes = useMemo(() => {
    return new Set(sections.map((s) => s.studyType).filter(Boolean));
  }, [sections]);

  // set active tab key mặc định khi mở drawer / khi sections thay đổi
  useEffect(() => {
    if (!open) return;
    if (!sections.length) {
      setActiveKey("");
      return;
    }
    // giữ activeKey nếu còn tồn tại
    if (activeKey && sections.some((s) => String(s.id) === String(activeKey)))
      return;
    setActiveKey(String(sections[0].id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sections.length]);

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
    } catch (e) {
      console.error(e);
      toast.error("Không reload được curriculum.");
    }
  }, [currentCourseMeta?.id, dispatch, onSave]);

  // update totalDurationSec, chỉ dispatch khi studyType đổi thật
  const handleSectionDurationChange = useCallback(
    (studyType, seconds) => {
      if (!lessonFromTree?.id) return;

      const nextVal = Math.max(seconds || 0, 0);

      setSectionDurations((prev) => {
        const currentVal = prev[studyType] || 0;
        if (currentVal === nextVal) return prev;

        const next = { ...prev, [studyType]: nextVal };
        const total = Object.values(next).reduce((sum, v) => sum + (v || 0), 0);

        // ✅ Guard: tránh overwrite về 0 khi lesson hiện tại đang có duration > 0
        const prevTotalFromTree =
          typeof lessonFromTree?.totalDurationSec === "number"
            ? lessonFromTree.totalDurationSec
            : 0;

        if (total === 0 && prevTotalFromTree > 0) {
          return next; // bỏ dispatch, giữ duration cũ
        }

        dispatch(
          updateLessonThunk({
            lessonId: lessonFromTree.id,
            data: {
              title: lessonFromTree.title || "Untitled lesson",
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

  const onDurationByType = useCallback(
    (type) => (sec) => handleSectionDurationChange(type, sec),
    [handleSectionDurationChange]
  );

  const handleOpenAdd = () => {
    setSelectedType(null);
    setAddOpen(true);
  };

  const handleCreateSection = async () => {
    if (!lessonFromTree?.id) return toast.error("Thiếu lessonId");
    if (!selectedType) return message.warning("Chọn studyType trước.");

    if (existingTypes.has(selectedType)) {
      message.info("Lesson đã có phần này rồi.");
      return;
    }

    setAdding(true);
    try {
      const maxOrder =
        sections.reduce(
          (max, s) =>
            Math.max(max, typeof s.orderIndex === "number" ? s.orderIndex : 0),
          0
        ) || 0;

      const created = await dispatch(
        createSectionThunk({
          lessonId: lessonFromTree.id,
          data: {
            title: defaultSectionTitle(selectedType, lessonFromTree.title),
            orderIndex: maxOrder + 1,
            studyType: selectedType,
          },
        })
      ).unwrap();

      const sec = created.section || created;
      setAddOpen(false);

      // set active sang section mới tạo ngay
      if (sec?.id) setActiveKey(String(sec.id));

      await handleChildSaved();
      toast.success("Đã thêm phần mới.");
    } catch (e) {
      console.error(e);
      toast.error("Không tạo được section.");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteSection = useCallback(
    async (section) => {
      if (!lessonFromTree?.id || !section?.id) return;

      const secId = section.id;
      const contents = section.contents || [];
      try {
        console.log("[DELETE] start", secId);
        for (const c of contents) {
          // ✅ nếu content là QUIZ, xóa quiz trước (cascade questions/options + sectionContent QUIZ)
          if (c.contentFormat === "QUIZ" && c.quizId) {
            await dispatch(
              deleteLessonQuizThunk({ sectionId: secId, quizId: c.quizId })
            ).unwrap();
            continue; // vì endpoint deleteQuiz đã xóa luôn sectionContent QUIZ rồi
          }

          // ✅ nếu content là FLASHCARD_SET, xóa set trước nếu BE không cascade
          if (c.contentFormat === "FLASHCARD_SET" && c.flashcardSetId) {
            await dispatch(deleteFlashcardSet(c.flashcardSetId)).unwrap();
          }

          await dispatch(
            deleteContentThunk({ sectionId: secId, contentId: c.id })
          ).unwrap();
        }
        await dispatch(
          deleteSectionThunk({ lessonId: lessonFromTree.id, sectionId: secId })
        ).unwrap();
        await handleChildSaved();
        setActiveKey(""); // để effect tự chọn tab hợp lệ
        toast.success("Đã xóa phần.");
      } catch (e) {
        console.error(e);
        toast.error(e?.message || "Không thể xóa phần.");
      }
    },
    [dispatch, handleChildSaved, lessonFromTree?.id]
  );
  const isSectionEmpty = (sec) => !(sec?.contents?.length > 0);

  const handleCloseDrawer = () => {
    const emptySecs = sections.filter(isSectionEmpty);
    if (emptySecs.length > 0) {
      const names = emptySecs
        .map((s) => TYPE_META[s.studyType]?.label || s.studyType)
        .join(", ");
      toast.warning(`Bạn còn phần chưa có nội dung: ${names}.`);
    }
    onClose?.();
  };

  const tabItems = useMemo(() => {
    return sections.map((sec) => {
      const type = sec.studyType;
      const meta = TYPE_META[type] || { label: type || "Section", icon: null };

      return {
        key: String(sec.id),
        label: (
          <div className={styles.lessonTabLabel}>
            <span className={styles.lessonTabLabelLeft}>
              {meta.icon} {meta.label}
            </span>

            <Popconfirm
              title="Xóa phần này?"
              description="Sẽ xóa toàn bộ content trong phần này và không thể khôi phục."
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
              onConfirm={(e) => {
                console.log(e);
                // e ở đây đôi khi undefined, không sao
                handleDeleteSection(sec); // handleDeleteSection giờ là async delete thật luôn
              }}
              onPopupClick={(e) => e.stopPropagation()}
            >
              <Button
                danger
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                className={styles.tabDeleteBtn}
                onClick={(e) => {
                  // chặn Tabs bắt click đổi tab
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onMouseDown={(e) => {
                  // ✅ QUAN TRỌNG: chặn Tabs chiếm focus/click trước confirm
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                Xóa phần
              </Button>
            </Popconfirm>
          </div>
        ),
        children: (
          <div className={styles.tabWrap}>
            {type === "GRAMMAR" || type === "KANJI" ? (
              <GrammarKanjiTab
                type={type}
                lesson={lessonFromTree}
                section={sec}
                sectionsHook={sectionsHook}
                onSaved={handleChildSaved}
                onDurationComputed={onDurationByType(type)}
              />
            ) : type === "VOCABULARY" ? (
              <VocabFlashcardTab
                lesson={lessonFromTree}
                section={sec}
                onSaved={handleChildSaved}
                onDurationComputed={onDurationByType("VOCABULARY")}
              />
            ) : type === "QUIZ" ? (
              <QuizTab
                lesson={lessonFromTree}
                section={sec}
                onSaved={handleChildSaved}
                onDurationComputed={onDurationByType("QUIZ")}
              />
            ) : (
              <Text type="secondary">StudyType chưa hỗ trợ.</Text>
            )}
          </div>
        ),
      };
    });
  }, [
    sections,
    lessonFromTree,
    sectionsHook,
    handleChildSaved,
    handleDeleteSection,
    onDurationByType,
  ]);

  const addOptions = useMemo(() => {
    return STUDY_TYPES.filter((t) => !existingTypes.has(t)).map((t) => ({
      value: t,
      label: `${TYPE_META[t]?.label || t}`,
    }));
  }, [existingTypes]);

  return (
    <Drawer
      width={980}
      className={styles.lessonDrawer}
      open={open}
      onClose={handleCloseDrawer}
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
            Bấm “+ Thêm phần” để tạo section trước, rồi mới thêm content bên
            trong.
          </span>
          <Space>
            <Button onClick={handleCloseDrawer}>Đóng</Button>
          </Space>
        </div>
      }
    >
      {tabItems.length === 0 ? (
        <div className={styles.emptyWrap}>
          <Text type="secondary">
            Lesson chưa có phần nào. Bấm <b>+ Thêm phần</b> để tạo section theo
            studyType.
          </Text>
          <div style={{ marginTop: 14 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenAdd}
            >
              Thêm phần
            </Button>
          </div>
        </div>
      ) : (
        <Tabs
          activeKey={activeKey}
          onChange={setActiveKey}
          items={tabItems}
          tabBarGutter={20}
          tabBarExtraContent={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenAdd}
            >
              Thêm phần
            </Button>
          }
        />
      )}

      <Modal
        open={addOpen}
        title="Thêm phần mới"
        onCancel={() => setAddOpen(false)}
        onOk={handleCreateSection}
        okText="Tạo"
        confirmLoading={adding}
        okButtonProps={{ disabled: !selectedType }}
        cancelText="Hủy"
        destroyOnClose
      >
        <Text type="secondary">
          Chọn <b>studyType</b> để tạo section. Sau đó tab sẽ xuất hiện để bạn
          thêm nội dung.
        </Text>

        <div style={{ marginTop: 12 }}>
          <Select
            style={{ width: "100%" }}
            placeholder="Chọn studyType…"
            value={selectedType}
            onChange={setSelectedType}
            options={addOptions}
          />
        </div>

        {addOptions.length === 0 && (
          <div style={{ marginTop: 12 }}>
            <Text type="secondary">
              Lesson đã có đủ các phần (Grammar/Kanji/Vocab/Quiz).
            </Text>
          </div>
        )}
      </Modal>
    </Drawer>
  );
}
