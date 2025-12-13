// LessonEditorDrawer/tabs/QuizTab.jsx
import React, { useEffect, useState, useCallback } from "react";
import { Button, Space, Typography, Spin, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import {
  fetchLessonQuizThunk,
  clearCurrentQuiz,
} from "../../../../../../../../redux/features/quizSlice.js";
import { createSectionThunk } from "../../../../../../../../redux/features/teacherCourseSlice.js";

import QuizList from "../../../../../../ManageDocument/Quiz/QuizList/QuizList.jsx";
import QuizBuilderModal from "../../../../../../ManageDocument/Quiz/QuizBuilderModal/QuizBuilderModal.jsx";
import BulkImportModal from "../../../../../../ManageDocument/Quiz/BulkImportModal/BulkImportModal.jsx";

import styles from "../styles.module.scss";

const { Text } = Typography;

/**
 * Props:
 *  - lesson: lessonFromTree
 *  - quizSection: section có studyType = "QUIZ" (nếu đã tồn tại trong tree)
 *  - onDurationComputed: (sec) => void
 */
export default function QuizTab({
  lesson,
  quizSection,
  onDurationComputed,
  onSaved,
}) {
  const dispatch = useDispatch();
  const { currentQuiz, loading, saving } = useSelector(
    (state) => state.quiz || {}
  );

  // section QUIZ: ưu tiên cái vừa tạo local, nếu không thì lấy từ tree
  const [localSection, setLocalSection] = useState(null);
  const effectiveSection = localSection || quizSection || null;
  const sectionId = effectiveSection?.id;

  const [openBuilder, setOpenBuilder] = useState(false);
  const [openBulk, setOpenBulk] = useState(false);
  const [draftQuiz, setDraftQuiz] = useState(null);

  // ── helper: đảm bảo luôn có section QUIZ ─────────────────
  const ensureQuizSection = useCallback(async () => {
    // đã có section thì xài luôn
    if (sectionId) return effectiveSection;

    if (!lesson?.id) {
      toast.error("Thiếu lessonId để tạo section Quiz.");
      return null;
    }

    try {
      const created = await dispatch(
        createSectionThunk({
          lessonId: lesson.id,
          data: {
            title: quizSection?.title || `Quiz - ${lesson.title || ""}`,
            orderIndex: (lesson.sections?.length || 0) + 1,
            studyType: "QUIZ", // ⚠️ QUAN TRỌNG: phải là QUIZ
          },
        })
      ).unwrap();

      const sec = created.section || created;
      setLocalSection(sec);
      return sec;
    } catch (err) {
      console.error("Tạo section QUIZ thất bại", err);
      toast.error("Không tạo được section cho Quiz.");
      return null;
    }
  }, [dispatch, lesson, quizSection, sectionId, effectiveSection]);

  // ── Load quiz khi có sectionId ────────────────────────────
  useEffect(() => {
    dispatch(clearCurrentQuiz());
    if (!sectionId) return;
    dispatch(fetchLessonQuizThunk(sectionId));
  }, [sectionId, dispatch]);

  // Nếu BE đã có quiz với timeLimitSec -> báo duration cho parent
  useEffect(() => {
    if (!currentQuiz || typeof onDurationComputed !== "function") return;

    const sec =
      typeof currentQuiz.timeLimitSec === "number" &&
      currentQuiz.timeLimitSec > 0
        ? currentQuiz.timeLimitSec
        : 30 * 60; // default 30 phút

    onDurationComputed(sec);
  }, [currentQuiz, onDurationComputed]);

  // map QuizDto từ BE -> format cho builder (meta only)
  const mapQuizFromBE = useCallback((q) => {
    if (!q) return null;
    return {
      id: q.id,
      title: q.title,
      description: q.description,
      timeLimit:
        typeof q.timeLimitSec === "number" && q.timeLimitSec > 0
          ? Math.round(q.timeLimitSec / 60)
          : 30,
      passingScore:
        typeof q.passScorePercent === "number" ? q.passScorePercent : 60,
      shuffleQuestions: !!q.shuffleQuestions,
      shuffleOptions: q.shuffleOptions !== false,
      showExplanation:
        typeof q.showExplanation === "boolean" ? q.showExplanation : true,
      isRequired: !!q.isRequired,
      tags: q.tags || [],
      questions: [],
    };
  }, []);

  // ── Tạo quiz mới ─────────────────────────────────────────
  const handleCreate = async () => {
    const sec = await ensureQuizSection();
    if (!sec?.id) return;

    setDraftQuiz(null);
    setOpenBuilder(true);
  };

  // ── Sửa quiz đang có ─────────────────────────────────────
  const handleEdit = () => {
    if (!currentQuiz) {
      setDraftQuiz(null);
    } else {
      setDraftQuiz(mapQuizFromBE(currentQuiz));
    }
    setOpenBuilder(true);
  };

  // ── Bulk import → merge vào draftQuiz ────────────────────
  const handleBulkDone = (questions) => {
    setOpenBulk(false);
    if (!questions || !questions.length) return;

    const base = draftQuiz ||
      mapQuizFromBE(currentQuiz) || {
        title: lesson?.title || "Quiz",
        description: "",
        timeLimit: 30,
        passingScore: 60,
        questions: [],
      };

    setDraftQuiz({
      ...base,
      questions: [...(base.questions || []), ...questions],
    });
    setOpenBuilder(true);
  };

  // ── Sau khi modal lưu xong (đã gọi hết API) ───────────────
  // onSaved sẽ nhận meta (ít nhất có timeLimitMinutes)
  const handleSaved = async ({ timeLimitMinutes }) => {
    try {
      const sec = sectionId ? effectiveSection : await ensureQuizSection();
      if (sec?.id) {
        await dispatch(fetchLessonQuizThunk(sec.id)).unwrap();
      }

      message.success("Đã lưu quiz.");
      await onSaved?.();

      if (typeof onDurationComputed === "function") {
        const minutes =
          typeof timeLimitMinutes === "number" && timeLimitMinutes > 0
            ? timeLimitMinutes
            : 30;
        onDurationComputed(minutes * 60);
      }
    } catch (err) {
      console.error(err);
      toast.error("Không reload được quiz sau khi lưu.");
    } finally {
      setOpenBuilder(false);
    }
  };

  const handleRemove = async () => {
    toast.error("Chưa implement delete quiz 😅");
  };

  return (
    <div className={styles.tabBody}>
      <Text>
        Mỗi lesson chỉ có <b>1 quiz tổng hợp</b>, học viên làm sau khi học xong
        Grammar / Kanji / Vocabulary.
      </Text>

      <div style={{ marginTop: 16, marginBottom: 12 }}>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            disabled={!!currentQuiz} // đã có quiz → không cho tạo mới
          >
            Tạo quiz
          </Button>
          <Button onClick={() => setOpenBulk(true)} disabled={!!currentQuiz}>
            Nhập câu hỏi hàng loạt
          </Button>
        </Space>
      </div>

      <Spin spinning={loading || saving}>
        <QuizList
          value={currentQuiz ? [currentQuiz] : []}
          onEdit={handleEdit}
          onRemove={handleRemove}
        />
      </Spin>

      <BulkImportModal
        open={openBulk}
        onCancel={() => setOpenBulk(false)}
        onDone={handleBulkDone}
      />

      <QuizBuilderModal
        open={openBuilder}
        sectionId={sectionId || localSection?.id}
        initial={draftQuiz}
        onCancel={() => setOpenBuilder(false)}
        onSaved={handleSaved}
      />
    </div>
  );
}
