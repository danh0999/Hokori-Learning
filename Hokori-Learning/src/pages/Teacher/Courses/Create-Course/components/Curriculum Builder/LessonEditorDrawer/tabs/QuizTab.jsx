// LessonEditorDrawer/tabs/QuizTab.jsx
import React, { useEffect, useState, useCallback } from "react";
import { Button, Space, Typography, Spin } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchLessonQuizThunk,
  saveLessonQuizThunk,
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
  const { currentQuiz, loading, saving } = useSelector(
    (state) => state.quiz || {}
  );

  const [openBuilder, setOpenBuilder] = useState(false);
  const [openBulk, setOpenBulk] = useState(false);
  const [draftQuiz, setDraftQuiz] = useState(null);

  // load quiz khi mở/chọn lesson
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

  // map QuizDto từ BE -> Quiz builder format
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

  const handleCreate = () => {
    setDraftQuiz(null);
    setOpenBuilder(true);
  };

  const handleEdit = () => {
    if (!currentQuiz) {
      setDraftQuiz(null);
    } else {
      setDraftQuiz(mapQuizFromBE(currentQuiz));
    }
    setOpenBuilder(true);
  };

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

  const handleSaveQuiz = async (builderQuiz) => {
    if (!lesson?.id) {
      toast.error("Thiếu lessonId.");
      return;
    }

    const action = await dispatch(
      saveLessonQuizThunk({
        lessonId: lesson.id,
        draftQuiz: builderQuiz,
      })
    );

    if (saveLessonQuizThunk.fulfilled.match(action)) {
      toast.success("Đã lưu quiz.");
      setOpenBuilder(false);

      // duration = timeLimit (phút) * 60
      if (typeof onDurationComputed === "function") {
        const minutes =
          typeof builderQuiz.timeLimit === "number" && builderQuiz.timeLimit > 0
            ? builderQuiz.timeLimit
            : 30;
        onDurationComputed(minutes * 60);
      }
    } else {
      toast.error(action.payload || "Lưu quiz thất bại.");
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
            disabled={!!currentQuiz} // <–– lesson đã có quiz → disable
          >
            New quiz
          </Button>
          <Button onClick={() => setOpenBulk(true)} disabled={!!currentQuiz}>
            Bulk import
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
        onSave={handleSaveQuiz}
        saving={saving}
      />
    </div>
  );
}
