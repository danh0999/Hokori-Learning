// LessonEditorDrawer/tabs/QuizTab.jsx
import React, { useEffect, useState } from "react";
import { Button, Space, Typography, message, Spin } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchLessonQuizThunk,
  saveLessonQuizThunk,
} from "../../../../../../../../redux/features/quizSlice.js";

import QuizList from "../../../../../../ManageDocument/Quiz/QuizList/QuizList.jsx";
import QuizBuilderModal from "../../../../../../ManageDocument/Quiz/QuizBuilderModal/QuizBuilderModal.jsx";
import BulkImportModal from "../../../../../../ManageDocument/Quiz/BulkImportModal/BulkImportModal.jsx";

import styles from "../styles.module.scss";

const { Text } = Typography;

export default function QuizTab({ lesson }) {
  const dispatch = useDispatch();
  const { currentQuiz, loading, saving } = useSelector(
    (state) => state.quiz || {}
  );

  const [openBuilder, setOpenBuilder] = useState(false);
  const [openBulk, setOpenBulk] = useState(false);
  const [draftQuiz, setDraftQuiz] = useState(null);

  // load quiz khi chọn lesson
  useEffect(() => {
    if (!lesson?.id) return;
    dispatch(fetchLessonQuizThunk(lesson.id));
  }, [lesson?.id, dispatch]);

  // Helper: map currentQuiz (BE) -> format cho builder
  const mapCurrentQuizToDraft = (q) => {
    if (!q) return null;
    return {
      id: q.id,
      title: q.title,
      description: q.description,
      // BE: timeLimitSec (giây) -> FE: timeLimit (phút)
      timeLimit:
        typeof q.timeLimitSec === "number" && q.timeLimitSec > 0
          ? Math.round(q.timeLimitSec / 60)
          : 30,
      // BE: passScorePercent -> FE: passingScore
      passingScore:
        typeof q.passScorePercent === "number" ? q.passScorePercent : 60,
      shuffleQuestions: !!q.shuffleQuestions,
      shuffleOptions: q.shuffleOptions !== false,
      showExplanation:
        typeof q.showExplanation === "boolean" ? q.showExplanation : true,
      isRequired: !!q.isRequired,
      tags: q.tags || [],
      // để QuizBuilderModal tự fetch câu hỏi từ BE
      questions: [],
    };
  };

  // Mở tạo quiz mới
  const handleCreate = () => {
    setDraftQuiz(null);
    setOpenBuilder(true);
  };

  // Edit quiz hiện tại
  const handleEdit = () => {
    if (currentQuiz) {
      setDraftQuiz(mapCurrentQuizToDraft(currentQuiz));
    } else {
      setDraftQuiz(null);
    }
    setOpenBuilder(true);
  };

  // Bulk import: gộp thêm questions vào draft/current
  const handleBulkDone = (questions) => {
    setOpenBulk(false);
    if (!questions?.length) return;

    const base = draftQuiz ||
      mapCurrentQuizToDraft(currentQuiz) || {
        title: lesson?.title || "Quiz",
        description: "",
        timeLimit: 30,
        passingScore: 60,
        shuffleQuestions: false,
        shuffleOptions: true,
        showExplanation: true,
        isRequired: false,
        tags: [],
        questions: [],
      };

    setDraftQuiz({
      ...base,
      questions: [...(base.questions || []), ...questions],
    });
    setOpenBuilder(true);
  };

  // Lưu quiz xuống BE (dùng quizSlice)
  const handleSaveQuiz = async (builderQuiz) => {
    if (!lesson?.id) {
      message.error("Thiếu lessonId.");
      return;
    }

    const action = await dispatch(
      saveLessonQuizThunk({
        lessonId: lesson.id,
        draftQuiz: builderQuiz,
      })
    );

    if (saveLessonQuizThunk.fulfilled.match(action)) {
      message.success("Đã lưu quiz.");
      setOpenBuilder(false);
    } else {
      message.error(action.payload || "Lưu quiz thất bại.");
    }
  };

  const handleRemove = async () => {
    // TODO: thêm deleteQuizThunk nếu BE có API xoá quiz
    message.error("Chưa implement delete quiz thunk 😅");
  };

  return (
    <div className={styles.tabBody}>
      <Text>
        Mỗi lesson chỉ có <b>1 quiz tổng hợp</b>, học viên làm sau khi học xong
        Grammar / Kanji / Vocabulary.
      </Text>

      <div style={{ marginTop: 16, marginBottom: 12 }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            New quiz
          </Button>
          <Button onClick={() => setOpenBulk(true)}>Bulk import</Button>
        </Space>
      </div>

      <Spin spinning={loading}>
        <QuizList
          value={currentQuiz ? [currentQuiz] : []}
          onEdit={handleEdit}
          onRemove={handleRemove}
        />
      </Spin>

      {/* Bulk import modal */}
      <BulkImportModal
        open={openBulk}
        onCancel={() => setOpenBulk(false)}
        onDone={handleBulkDone}
      />

      {/* Builder modal */}
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
