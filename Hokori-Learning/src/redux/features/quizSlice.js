import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios";

const getError = (err) =>
  err?.response?.data?.message ||
  err?.response?.data ||
  err.message ||
  "Something went wrong";

/**
 * Convert FE question.type -> BE questionType
 * FE: "single" | "multiple" (chỉ dùng 2 loại này cho BE)
 * BE: "SINGLE_CHOICE" | "MULTIPLE_CHOICE"
 */
const mapQuestionType = (type) => {
  if (type === "multiple") return "MULTIPLE_CHOICE";
  return "SINGLE_CHOICE";
};

/**
 * Chuẩn hóa questions trước khi gửi lên BE:
 * - chỉ giữ loại `single` và `multiple`
 * - bỏ qua câu không có text hoặc < 2 options
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

/* =========================
   THUNKS DÙNG CHUNG
   ========================= */

/**
 * Lấy quiz của 1 lesson (nếu không có sẽ trả null)
 * GET /api/teacher/lessons/{lessonId}/quizzes
 */
export const fetchLessonQuizThunk = createAsyncThunk(
  "quiz/fetchLessonQuiz",
  async (lessonId, { rejectWithValue }) => {
    try {
      const res = await api.get(`teacher/lessons/${lessonId}/quizzes`);
      // BE có thể trả object hoặc array, xử lý mềm dẻo
      const data = res.data;
      if (!data) return null;
      return Array.isArray(data) ? data[0] : data;
    } catch (err) {
      if (err?.response?.status === 404) {
        // lesson chưa có quiz
        return null;
      }
      return rejectWithValue(getError(err));
    }
  }
);

/**
 * Tạo / cập nhật quiz cho 1 lesson + tạo toàn bộ questions & options.
 * Dùng được cho cả:
 * 1) tạo quiz khi đang tạo course (LessonEditorDrawer + QuizBuilderModal)
 * 2) import quiz từ CreateQuizPage (lấy từ library rồi push lên lesson)
 *
 * draftQuiz structure (FE):
 * {
 *   id?, title, description,
 *   timeLimit,        // phút
 *   passingScore,     // %
 *   questions: [
 *     {
 *       id,
 *       text,
 *       explanation,
 *       type: "single" | "multiple",
 *       options: [{ id, text, isCorrect }]
 *     }
 *   ]
 * }
 */
export const saveLessonQuizThunk = createAsyncThunk(
  "quiz/saveLessonQuiz",
  async ({ lessonId, draftQuiz }, { rejectWithValue }) => {
    try {
      // 1. Chuẩn hoá câu hỏi
      const questions = normalizeQuestions(draftQuiz.questions);

      // 2. Kiểm tra xem lesson đã có quiz chưa
      let existingQuiz = null;
      try {
        const res = await api.get(`teacher/lessons/${lessonId}/quizzes`);
        const data = res.data;
        existingQuiz = Array.isArray(data) ? data[0] : data;
      } catch (err) {
        if (err?.response?.status !== 404) {
          throw err;
        }
      }

      const quizPayload = {
        title: draftQuiz.title,
        description: draftQuiz.description,
        timeLimitSec: draftQuiz.timeLimit ? draftQuiz.timeLimit * 60 : null,
        passScorePercent:
          typeof draftQuiz.passingScore === "number"
            ? draftQuiz.passingScore
            : 0,
      };

      let quizId;

      // 3. Tạo mới hoặc cập nhật metadata quiz
      if (!existingQuiz) {
        const res = await api.post(
          `teacher/lessons/${lessonId}/quizzes`,
          quizPayload
        );
        quizId = res.data.id;
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
        const oldQuestions = qRes.data || [];
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

      // 5. Tạo lại questions + options
      for (const q of questions) {
        // 5.1 Create question
        const qRes = await api.post(
          `teacher/lessons/${lessonId}/quizzes/${quizId}/questions`,
          {
            content: q.text || "",
            explanation: q.explanation || "",
            questionType: mapQuestionType(q.type),
            orderIndex: q._orderIndex ?? 0,
          }
        );
        const questionId = qRes.data.id;

        // 5.2 Create options (array)
        const optionsPayload = (q.options || []).map((opt, idx) => ({
          content: opt.text || "",
          isCorrect: !!opt.isCorrect,
          orderIndex: idx,
        }));

        await api.post(
          `teacher/lessons/${lessonId}/quizzes/questions/${questionId}/options`,
          optionsPayload
        );
      }

      // 6. Lấy lại quiz meta để trả về cho FE
      const finalRes = await api.get(`teacher/lessons/${lessonId}/quizzes`);
      const savedQuiz = Array.isArray(finalRes.data)
        ? finalRes.data[0]
        : finalRes.data;

      return { lessonId, quiz: savedQuiz };
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

/* =========================
   SLICE
   ========================= */

const initialState = {
  currentQuiz: null, // quiz đang edit trong QuizBuilderModal / CreateQuizPage
  loading: false,
  saving: false,
  error: null,
};

const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    // set quiz đang edit (dùng cho cả 2 màn)
    setCurrentQuiz(state, action) {
      state.currentQuiz = action.payload;
    },
    clearCurrentQuiz(state) {
      state.currentQuiz = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // FETCH
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

    // SAVE
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
