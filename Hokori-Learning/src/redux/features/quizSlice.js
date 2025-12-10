// src/redux/features/quizSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios";

/**
 * Helper lấy message lỗi từ Axios error
 */
const getError = (err) =>
  err?.response?.data?.message ||
  err?.response?.data ||
  err.message ||
  "Something went wrong";

/**
 * Helper unwrap response (BE hay bọc { success, data, ... })
 */
const unwrap = (res) => res.data?.data ?? res.data;

/* =========================================================
 *                    QUIZ LEVEL
 * ======================================================= */

/**
 * GET /api/teacher/lessons/{lessonId}/quizzes
 * Lấy quiz của 1 lesson (mỗi lesson hiện tại chỉ có 1 quiz)
 */
export const fetchLessonQuizThunk = createAsyncThunk(
  "quiz/fetchLessonQuiz",
  async (lessonId, { rejectWithValue }) => {
    try {
      const res = await api.get(`teacher/lessons/${lessonId}/quizzes`);
      const data = unwrap(res);
      // BE có thể trả list hoặc 1 object
      if (!data) return null;
      return Array.isArray(data) ? data[0] : data;
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;

      // Lesson chưa có quiz → coi như null, không xem là lỗi
      if (
        status === 404 ||
        (status === 400 &&
          typeof msg === "string" &&
          msg.includes("Quiz not found")) ||
        (typeof msg === "string" &&
          msg.includes("Index 0 out of bounds for length 0"))
      ) {
        return null;
      }

      return rejectWithValue(getError(err));
    }
  }
);

/**
 * Chuẩn hoá meta quiz từ FE → payload cho BE
 * - FE thường dùng: { title, description, timeLimit (phút), passingScore }
 * - BE: { title, description, timeLimitSec, passScorePercent }
 */
const buildQuizMetaPayload = (meta = {}) => {
  const minutes =
    typeof meta.timeLimit === "number"
      ? meta.timeLimit
      : typeof meta.timeLimitMinutes === "number"
      ? meta.timeLimitMinutes
      : meta.timeLimit
      ? Number(meta.timeLimit)
      : 0;

  const timeLimitSec =
    typeof meta.timeLimitSec === "number"
      ? meta.timeLimitSec
      : minutes > 0
      ? minutes * 60
      : null;

  let passScorePercent = 0;
  if (typeof meta.passingScore === "number") {
    passScorePercent = meta.passingScore;
  } else if (typeof meta.passScorePercent === "number") {
    passScorePercent = meta.passScorePercent;
  }

  return {
    title: meta.title,
    description: meta.description,
    timeLimitSec,
    passScorePercent,
  };
};

/**
 * POST /api/teacher/lessons/{lessonId}/quizzes
 * Tạo quiz cho lesson (chỉ meta, chưa có câu hỏi)
 */
export const createLessonQuizThunk = createAsyncThunk(
  "quiz/createLessonQuiz",
  async ({ lessonId, meta }, { rejectWithValue }) => {
    try {
      const payload = buildQuizMetaPayload(meta);
      const res = await api.post(
        `teacher/lessons/${lessonId}/quizzes`,
        payload
      );
      const quiz = unwrap(res);
      return quiz;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

/**
 * PUT /api/teacher/lessons/{lessonId}/quizzes/{quizId}
 * Cập nhật meta quiz
 */
export const updateLessonQuizThunk = createAsyncThunk(
  "quiz/updateLessonQuiz",
  async ({ lessonId, quizId, meta }, { rejectWithValue }) => {
    try {
      const payload = buildQuizMetaPayload(meta);
      const res = await api.put(
        `teacher/lessons/${lessonId}/quizzes/${quizId}`,
        payload
      );
      const quiz = unwrap(res);
      return quiz;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

/* =========================================================
 *                 QUESTION + OPTION LEVEL
 * ======================================================= */

/**
 * GET /api/teacher/lessons/{lessonId}/quizzes/{quizId}/questions
 * Lấy danh sách câu hỏi kèm options của 1 quiz
 */
export const fetchQuizQuestionsThunk = createAsyncThunk(
  "quiz/fetchQuizQuestions",
  async ({ lessonId, quizId }, { rejectWithValue }) => {
    try {
      const res = await api.get(
        `teacher/lessons/${lessonId}/quizzes/${quizId}/questions`
      );
      const questions = unwrap(res) || [];
      return questions;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

/**
 * POST /api/teacher/lessons/{lessonId}/quizzes/{quizId}/questions
 * Tạo câu hỏi mới cho quiz
 * Body BE kỳ vọng: { content, explanation, questionType, orderIndex?, points? }
 */
export const createQuizQuestionThunk = createAsyncThunk(
  "quiz/createQuizQuestion",
  async ({ lessonId, quizId, question }, { rejectWithValue }) => {
    try {
      const res = await api.post(
        `teacher/lessons/${lessonId}/quizzes/${quizId}/questions`,
        question
      );
      const created = unwrap(res);
      return created;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

/**
 * PUT /api/teacher/lessons/{lessonId}/quizzes/questions/{questionId}
 * Cập nhật câu hỏi
 */
export const updateQuizQuestionThunk = createAsyncThunk(
  "quiz/updateQuizQuestion",
  async ({ lessonId, questionId, question }, { rejectWithValue }) => {
    try {
      const res = await api.put(
        `teacher/lessons/${lessonId}/quizzes/questions/${questionId}`,
        question
      );
      const updated = unwrap(res);
      return updated;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

/**
 * DELETE /api/teacher/lessons/{lessonId}/quizzes/questions/{questionId}
 * Xoá câu hỏi
 */
export const deleteQuizQuestionThunk = createAsyncThunk(
  "quiz/deleteQuizQuestion",
  async ({ lessonId, questionId }, { rejectWithValue }) => {
    try {
      await api.delete(
        `teacher/lessons/${lessonId}/quizzes/questions/${questionId}`
      );
      return questionId;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

/**
 * POST /api/teacher/lessons/{lessonId}/quizzes/questions/{questionId}/options
 * Thêm nhiều options cho 1 câu hỏi
 * Body: Array<{ content, isCorrect, orderIndex }>
 */
export const createQuestionOptionsThunk = createAsyncThunk(
  "quiz/createQuestionOptions",
  async ({ lessonId, questionId, options }, { rejectWithValue }) => {
    try {
      const res = await api.post(
        `teacher/lessons/${lessonId}/quizzes/questions/${questionId}/options`,
        options
      );
      const created = unwrap(res);
      return created;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

/**
 * PUT /api/teacher/lessons/{lessonId}/quizzes/options/{optionId}
 * Cập nhật 1 option
 */
export const updateQuestionOptionThunk = createAsyncThunk(
  "quiz/updateQuestionOption",
  async ({ lessonId, optionId, option }, { rejectWithValue }) => {
    try {
      const res = await api.put(
        `teacher/lessons/${lessonId}/quizzes/options/${optionId}`,
        option
      );
      const updated = unwrap(res);
      return updated;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

/**
 * DELETE /api/teacher/lessons/{lessonId}/quizzes/options/{optionId}
 * Xoá 1 option
 */
export const deleteQuestionOptionThunk = createAsyncThunk(
  "quiz/deleteQuestionOption",
  async ({ lessonId, optionId }, { rejectWithValue }) => {
    try {
      await api.delete(
        `teacher/lessons/${lessonId}/quizzes/options/${optionId}`
      );
      return optionId;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

/* =========================================================
 *                    SLICE
 * ======================================================= */

const initialState = {
  currentQuiz: null, // meta quiz
  questions: [], // danh sách câu hỏi + options
  loading: false, // loading quiz meta
  loadingQuestions: false, // loading questions
  saving: false, // tạo / update bất cứ thứ gì
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
      state.questions = [];
      state.error = null;
      state.loading = false;
      state.loadingQuestions = false;
      state.saving = false;
    },
  },
  extraReducers: (builder) => {
    /* ------- FETCH QUIZ BY LESSON ------- */
    builder
      .addCase(fetchLessonQuizThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLessonQuizThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.currentQuiz = action.payload; // có thể là null
      })
      .addCase(fetchLessonQuizThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.currentQuiz = null;
      });

    /* ------- CREATE QUIZ ------- */
    builder
      .addCase(createLessonQuizThunk.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createLessonQuizThunk.fulfilled, (state, action) => {
        state.saving = false;
        state.currentQuiz = action.payload;
      })
      .addCase(createLessonQuizThunk.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });

    /* ------- UPDATE QUIZ ------- */
    builder
      .addCase(updateLessonQuizThunk.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateLessonQuizThunk.fulfilled, (state, action) => {
        state.saving = false;
        state.currentQuiz = action.payload;
      })
      .addCase(updateLessonQuizThunk.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });

    /* ------- FETCH QUESTIONS ------- */
    builder
      .addCase(fetchQuizQuestionsThunk.pending, (state) => {
        state.loadingQuestions = true;
        state.error = null;
      })
      .addCase(fetchQuizQuestionsThunk.fulfilled, (state, action) => {
        state.loadingQuestions = false;
        state.questions = action.payload || [];
      })
      .addCase(fetchQuizQuestionsThunk.rejected, (state, action) => {
        state.loadingQuestions = false;
        state.error = action.payload;
        state.questions = [];
      });

    /* ------- CREATE QUESTION ------- */
    builder
      .addCase(createQuizQuestionThunk.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createQuizQuestionThunk.fulfilled, (state, action) => {
        state.saving = false;
        if (action.payload) {
          state.questions.push(action.payload);
        }
      })
      .addCase(createQuizQuestionThunk.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });

    /* ------- UPDATE QUESTION ------- */
    builder
      .addCase(updateQuizQuestionThunk.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateQuizQuestionThunk.fulfilled, (state, action) => {
        state.saving = false;
        const updated = action.payload;
        if (!updated) return;
        const idx = state.questions.findIndex((q) => q.id === updated.id);
        if (idx !== -1) {
          state.questions[idx] = {
            ...state.questions[idx],
            ...updated,
          };
        }
      })
      .addCase(updateQuizQuestionThunk.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });

    /* ------- DELETE QUESTION ------- */
    builder
      .addCase(deleteQuizQuestionThunk.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(deleteQuizQuestionThunk.fulfilled, (state, action) => {
        state.saving = false;
        const id = action.payload;
        state.questions = state.questions.filter((q) => q.id !== id);
      })
      .addCase(deleteQuizQuestionThunk.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });

    /* ------- CREATE OPTIONS ------- */
    builder
      .addCase(createQuestionOptionsThunk.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createQuestionOptionsThunk.fulfilled, (state) => {
        state.saving = false;
        // payload tuỳ BE, thường không cần merge chi tiết ở đây
        // component có thể gọi fetchQuizQuestionsThunk lại nếu cần
      })
      .addCase(createQuestionOptionsThunk.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });

    /* ------- UPDATE OPTION ------- */
    builder
      .addCase(updateQuestionOptionThunk.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateQuestionOptionThunk.fulfilled, (state, action) => {
        state.saving = false;
        const updated = action.payload;
        if (!updated) return;

        // cập nhật option trong questions (nếu đang có)
        const qIdx = state.questions.findIndex((q) =>
          (q.options || []).some((op) => op.id === updated.id)
        );
        if (qIdx !== -1) {
          const opts = state.questions[qIdx].options || [];
          const oIdx = opts.findIndex((op) => op.id === updated.id);
          if (oIdx !== -1) {
            opts[oIdx] = { ...opts[oIdx], ...updated };
            state.questions[qIdx].options = opts;
          }
        }
      })
      .addCase(updateQuestionOptionThunk.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });

    /* ------- DELETE OPTION ------- */
    builder
      .addCase(deleteQuestionOptionThunk.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(deleteQuestionOptionThunk.fulfilled, (state, action) => {
        state.saving = false;
        const id = action.payload;
        // xoá option khỏi questions (nếu đang cache)
        state.questions = state.questions.map((q) => ({
          ...q,
          options: (q.options || []).filter((op) => op.id !== id),
        }));
      })
      .addCase(deleteQuestionOptionThunk.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });
  },
});

export const { setCurrentQuiz, clearCurrentQuiz } = quizSlice.actions;
export default quizSlice.reducer;
