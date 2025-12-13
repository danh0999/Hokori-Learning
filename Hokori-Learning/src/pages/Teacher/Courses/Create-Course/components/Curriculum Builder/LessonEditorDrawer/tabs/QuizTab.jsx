import React, { useEffect, useState, useCallback } from "react";
import { Button, Space, Typography, Spin, message, Modal } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import {
  fetchLessonQuizThunk,
  deleteLessonQuizThunk,
  clearCurrentQuiz,
} from "../../../../../../../../redux/features/quizSlice.js";

import QuizList from "../../../../../../ManageDocument/Quiz/QuizList/QuizList.jsx";
import QuizBuilderModal from "../../../../../../ManageDocument/Quiz/QuizBuilderModal/QuizBuilderModal.jsx";
import BulkImportModal from "../../../../../../ManageDocument/Quiz/BulkImportModal/BulkImportModal.jsx";

import styles from "../styles.module.scss";

const { Text } = Typography;

export default function QuizTab({
  lesson,
  section,
  onDurationComputed,
  onSaved,
}) {
  const dispatch = useDispatch();
  const { currentQuiz, loading, saving } = useSelector(
    (state) => state.quiz || {}
  );

  const sectionId = section?.id;

  const [openBuilder, setOpenBuilder] = useState(false);
  const [openBulk, setOpenBulk] = useState(false);
  const [draftQuiz, setDraftQuiz] = useState(null);

  useEffect(() => {
    dispatch(clearCurrentQuiz());
    if (!sectionId) return;
    dispatch(fetchLessonQuizThunk(sectionId));
  }, [sectionId, dispatch]);

  useEffect(() => {
    if (!currentQuiz || typeof onDurationComputed !== "function") return;
    const sec =
      typeof currentQuiz.timeLimitSec === "number" &&
      currentQuiz.timeLimitSec > 0
        ? currentQuiz.timeLimitSec
        : 30 * 60;
    onDurationComputed(sec);
  }, [currentQuiz, onDurationComputed]);

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

  const handleCreate = async () => {
    if (!sectionId) return toast.error("Chưa có section Quiz.");
    setDraftQuiz(null);
    setOpenBuilder(true);
  };

  const handleEdit = () => {
    setDraftQuiz(currentQuiz || null);
    setOpenBuilder(true);
  };

  const handleBulkDone = (questions) => {
    setOpenBulk(false);
    if (!questions || !questions.length) return;

    const base = draftQuiz ||
      currentQuiz || {
        title: lesson?.title || "Quiz",
        description: "",
        timeLimitSec: 30 * 60,
        passScorePercent: 60,
        questions: [],
      };

    setDraftQuiz({
      ...base,
      questions: [...(base.questions || []), ...questions],
    });
    setOpenBuilder(true);
  };

  const handleSaved = async ({ timeLimitMinutes }) => {
    try {
      if (sectionId) {
        await dispatch(fetchLessonQuizThunk(sectionId)).unwrap();
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

  const handleRemove = async (quizId) => {
    try {
      console.log("[REMOVE QUIZ] deleting...", { sectionId, quizId });

      await dispatch(deleteLessonQuizThunk({ sectionId, quizId })).unwrap();

      message.success("Đã xóa quiz.");
      await dispatch(fetchLessonQuizThunk(sectionId)).unwrap();
      dispatch(clearCurrentQuiz());
      await onSaved?.(); // reload curriculum nếu cần
    } catch (err) {
      console.error(err);
      toast.error(err || "Không thể xóa quiz.");
    }
  };

  return (
    <div className={styles.tabBody}>
      <Text>
        Mỗi lesson chỉ có <b>1 quiz tổng hợp</b>. Quiz nằm trong section QUIZ
        (tạo từ nút +).
      </Text>

      <div style={{ marginTop: 16, marginBottom: 12 }}>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            disabled={!!currentQuiz}
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
        sectionId={sectionId}
        initial={draftQuiz}
        onCancel={() => setOpenBuilder(false)}
        onSaved={handleSaved}
      />
    </div>
  );
}
