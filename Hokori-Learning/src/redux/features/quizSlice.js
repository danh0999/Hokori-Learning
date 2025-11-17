// src/redux/features/quizSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios";

const getError = (err) =>
  err?.response?.data?.message ||
  err?.response?.data ||
  err.message ||
  "Something went wrong";

// helper bóc data cho mềm (BE hay bọc { success, data, ... })
const unwrap = (res) => res.data?.data ?? res.data;

/**
 * Convert FE question.type -> BE questionType
 * FE: "single" | "multiple"
 * BE: "SINGLE_CHOICE" | "MULTIPLE_CHOICE"
 */
const mapQuestionType = (type) => {
  if (type === "multiple") return "MULTIPLE_CHOICE";
  return "SINGLE_CHOICE";
};

/**
 * Chuẩn hoá list câu hỏi trước khi gửi lên BE:
 * - Chỉ giữ single / multiple
 * - Bỏ những câu ko có text hoặc < 2 options
 * - Gán _orderIndex để giữ thứ tự
 */
const normalizeQuestions = (questions = []) =>
  questions
    .filter(
      (q) =>
        (q.type === "single" || q.type === "multiple") &&
        q?.text &&
        (q.options || []).length >= 2
    )
    .map((q, idx) => ({
      ...q,
      _orderIndex: idx,
    }));

/* =========================================================
 *                    THUNKS
 * ======================================================= */

/**
 * Lấy quiz của 1 lesson (nếu không có sẽ trả null)
 * GET /api/teacher/lessons/{lessonId}/quizzes
 */
export const fetchLessonQuizThunk = createAsyncThunk(
  "quiz/fetchLessonQuiz",
  async (lessonId, { rejectWithValue }) => {
    try {
      const res = await api.get(`teacher/lessons/${lessonId}/quizzes`);
      const data = unwrap(res);
      if (!data) return null;
      return Array.isArray(data) ? data[0] : data;
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;

      // BE đang trả 400 + "Quiz not found for this lesson" khi chưa có quiz
      if (
        status === 404 ||
        (status === 400 &&
          typeof msg === "string" &&
          msg.includes("Quiz not found"))
      ) {
        return null; // lesson chưa có quiz
      }

      return rejectWithValue(getError(err));
    }
  }
);

/**
 * Lấy danh sách câu hỏi của 1 quiz
 * GET /api/teacher/lessons/{lessonId}/quizzes/{quizId}/questions
 */
export const fetchQuizQuestionsThunk = createAsyncThunk(
  "quiz/fetchQuizQuestions",
  async ({ lessonId, quizId }, { rejectWithValue }) => {
    try {
      const res = await api.get(
        `teacher/lessons/${lessonId}/quizzes/${quizId}/questions`
      );
      return unwrap(res) || [];
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

/**
 * Tạo / cập nhật quiz cho 1 lesson + toàn bộ questions & options
 *
 * draftQuiz từ QuizBuilderModal:
 * {
 *   id?,
 *   title,
 *   description,
 *   timeLimit,      // phút
 *   passingScore,   // %
 *   questions: [
 *     {
 *       id?,
 *       text,
 *       explanation,
 *       type: "single" | "multiple",
 *       points,
 *       options: [{ text, isCorrect }]
 *     }
 *   ]
 * }
 */
export const saveLessonQuizThunk = createAsyncThunk(
  "quiz/saveLessonQuiz",
  async ({ lessonId, draftQuiz }, { rejectWithValue }) => {
    try {
      const questions = normalizeQuestions(draftQuiz.questions);

      // 1. Check lesson đã có quiz chưa
      let existingQuiz = null;
      try {
        const res = await api.get(`teacher/lessons/${lessonId}/quizzes`);
        const data = unwrap(res);
        existingQuiz = Array.isArray(data) ? data[0] : data;
      } catch (err) {
        const status = err?.response?.status;
        const msg = err?.response?.data?.message;

        if (
          status === 404 ||
          (status === 400 &&
            typeof msg === "string" &&
            msg.includes("Quiz not found"))
        ) {
          existingQuiz = null;
        } else {
          throw err;
        }
      }

      // 2. Payload meta quiz (swagger: title, description, timeLimitSec, passScorePercent)
      const quizPayload = {
        title: draftQuiz.title,
        description: draftQuiz.description,
        timeLimitSec:
          draftQuiz.timeLimit && Number(draftQuiz.timeLimit) > 0
            ? Number(draftQuiz.timeLimit) * 60
            : null, // null = không giới hạn
        passScorePercent:
          typeof draftQuiz.passingScore === "number"
            ? draftQuiz.passingScore
            : 0,
      };

      let quizId;

      // 3. Tạo mới hoặc update quiz meta
      if (!existingQuiz) {
        const res = await api.post(
          `teacher/lessons/${lessonId}/quizzes`,
          quizPayload
        );
        const quizObj = unwrap(res); // { id, lessonId, ... }
        quizId = quizObj.id; // 👈 FIX quizId
      } else {
        quizId = existingQuiz.id;
        await api.put(
          `teacher/lessons/${lessonId}/quizzes/${quizId}`,
          quizPayload
        );
      }

      // 4. Xoá toàn bộ câu hỏi cũ (nếu có)
      try {
        const qRes = await api.get(
          `teacher/lessons/${lessonId}/quizzes/${quizId}/questions`
        );
        const oldQuestions = unwrap(qRes) || [];
        for (const q of oldQuestions) {
          await api.delete(
            `teacher/lessons/${lessonId}/quizzes/questions/${q.id}`
          );
        }
      } catch (err) {
        if (err?.response?.status !== 404) {
          throw err;
        }
      }

      // 5. Tạo lại từng câu hỏi + options
      for (const q of questions) {
        // 5.1 Tạo question
        const qRes = await api.post(
          `teacher/lessons/${lessonId}/quizzes/${quizId}/questions`,
          {
            content: q.text || "",
            explanation: q.explanation || "",
            questionType: mapQuestionType(q.type),
            orderIndex: q._orderIndex ?? 0,
          }
        );
        const questionObj = unwrap(qRes);
        const questionId = questionObj.id;

        // 5.2 Chuẩn hoá options để đảm bảo
        //     - single: EXACTLY 1 isCorrect
        //     - multiple: ít nhất 1 isCorrect
        const rawOptions = q.options || [];
        let correctIdxs = [];

        rawOptions.forEach((opt, idx) => {
          if (opt.isCorrect) correctIdxs.push(idx);
        });

        if (q.type === "single") {
          if (correctIdxs.length === 0) {
            correctIdxs = [0]; // auto chọn option đầu nếu user quên tick
          } else if (correctIdxs.length > 1) {
            correctIdxs = [correctIdxs[0]]; // chỉ giữ 1 cái đầu tiên
          }
        } else {
          // multiple choice
          if (correctIdxs.length === 0 && rawOptions.length > 0) {
            correctIdxs = [0]; // ít nhất 1 cái đúng cho BE
          }
        }

        const correctSet = new Set(correctIdxs);

        const normalizedOptions = rawOptions.map((opt, idx) => ({
          ...opt,
          isCorrect: correctSet.has(idx),
        }));

        const optionsPayload = normalizedOptions.map((opt, idx) => ({
          content: opt.text || "",
          isCorrect: !!opt.isCorrect,
          orderIndex: idx,
        }));

        await api.post(
          `teacher/lessons/${lessonId}/quizzes/questions/${questionId}/options`,
          optionsPayload
        );
      }

      // 6. Lấy lại quiz meta sau khi đã có câu hỏi
      const finalRes = await api.get(`teacher/lessons/${lessonId}/quizzes`);
      const finalData = unwrap(finalRes);
      const savedQuiz = Array.isArray(finalData) ? finalData[0] : finalData;

      return { lessonId, quiz: savedQuiz };
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

/* =========================================================
 *                    SLICE
 * ======================================================= */

const initialState = {
  currentQuiz: null,
  loading: false,
  saving: false,
  error: null,
};

const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    setCurrentQuiz(state, action) {
      state.currentQuiz = action.payload;
    },
    clearCurrentQuiz(state) {
      state.currentQuiz = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchLessonQuiz
    builder
      .addCase(fetchLessonQuizThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLessonQuizThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.currentQuiz = action.payload;
      })
      .addCase(fetchLessonQuizThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // saveLessonQuiz
    builder
      .addCase(saveLessonQuizThunk.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveLessonQuizThunk.fulfilled, (state, action) => {
        state.saving = false;
        state.currentQuiz = action.payload?.quiz || state.currentQuiz;
      })
      .addCase(saveLessonQuizThunk.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });
  },
});

export const { setCurrentQuiz, clearCurrentQuiz } = quizSlice.actions;
export default quizSlice.reducer;
