// LessonEditorDrawer/tabs/QuizTab.jsx
import React, { useEffect, useState, useCallback } from "react";
import { Button, Space, Typography, Spin } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchLessonQuizThunk,
  clearCurrentQuiz,
} from "../../../../../../../../redux/features/quizSlice.js";

import QuizList from "../../../../../../ManageDocument/Quiz/QuizList/QuizList.jsx";
import QuizBuilderModal from "../../../../../../ManageDocument/Quiz/QuizBuilderModal/QuizBuilderModal.jsx";
import BulkImportModal from "../../../../../../ManageDocument/Quiz/BulkImportModal/BulkImportModal.jsx";

import styles from "../styles.module.scss";
import { toast } from "react-toastify";

const { Text } = Typography;

export default function QuizTab({ lesson, onDurationComputed }) {
  const dispatch = useDispatch();
  const { currentQuiz, loading } = useSelector((state) => state.quiz || {});

  const [openBuilder, setOpenBuilder] = useState(false);
  const [openBulk, setOpenBulk] = useState(false);
  const [draftQuiz, setDraftQuiz] = useState(null);

  // ── Load quiz khi mở/chọn lesson ─────────────────────────
  useEffect(() => {
    dispatch(clearCurrentQuiz());
    if (!lesson?.id) return;
    dispatch(fetchLessonQuizThunk(lesson.id));
  }, [lesson?.id, dispatch]);

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
      // câu hỏi sẽ để builder tự fetch
      questions: [],
    };
  }, []);

  // ── Tạo quiz mới ─────────────────────────────────────────
  const handleCreate = () => {
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

  // ── Bulk import → đưa câu hỏi vào draftQuiz khi mở modal ─
  const handleBulkDone = (questions) => {
    setOpenBulk(false);
    if (!questions?.length) return;

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
    // reload quiz từ BE để list luôn đúng
    if (lesson?.id) {
      await dispatch(fetchLessonQuizThunk(lesson.id));
    }

    setOpenBuilder(false);
    toast.success("Đã lưu quiz.");

    if (typeof onDurationComputed === "function") {
      const minutes =
        typeof timeLimitMinutes === "number" && timeLimitMinutes > 0
          ? timeLimitMinutes
          : 30;
      onDurationComputed(minutes * 60);
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

      <Spin spinning={loading}>
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
        lessonId={lesson?.id}
        initial={draftQuiz}
        onCancel={() => setOpenBuilder(false)}
        onSaved={handleSaved}
      />
    </div>
  );
}
