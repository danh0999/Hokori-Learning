// src/redux/features/quizAttemptSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios";

const getError = (err) =>
  err?.response?.data?.message ||
  err?.response?.data ||
  err.message ||
  "Something went wrong";

const unwrap = (res) => res.data?.data ?? res.data;

/* =========================================================
 *                    THUNKS (LEARNER)
 * ======================================================= */

/**
 * 1) Lấy quiz info của 1 lesson (learner)
 * GET /api/learner/lessons/{lessonId}/quiz/info
 */
export const fetchQuizInfoThunk = createAsyncThunk(
  "quizAttempt/fetchQuizInfo",
  async (lessonId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/learner/lessons/${lessonId}/quiz/info`);
      const data = unwrap(res); // { quizId, title, totalQuestions, timeLimitSec, ... }
      return { lessonId, quizInfo: data };
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

/**
 * 2) Bắt đầu / tiếp tục 1 attempt
 * POST /api/learner/lessons/{lessonId}/quiz/attempts/start
 */
export const startAttemptThunk = createAsyncThunk(
  "quizAttempt/startAttempt",
  async (lessonId, { rejectWithValue }) => {
    try {
      const res = await api.post(
        `/learner/lessons/${lessonId}/quiz/attempts/start`
      );
      const data = unwrap(res); // BE có thể trả { attemptId, ... }
      return { lessonId, attempt: data };
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

/**
 * 3) Lấy toàn bộ câu hỏi bằng cách gọi /next nhiều lần
 * GET /api/learner/lessons/{lessonId}/quiz/attempts/{attemptId}/next
 *
 * BE: mỗi lần trả 1 câu hỏi, data = null khi hết câu
 */
export const loadAllQuestionsThunk = createAsyncThunk(
  "quizAttempt/loadAllQuestions",
  async ({ lessonId, attemptId }, { rejectWithValue }) => {
    try {
      const questions = [];
      const seenIds = new Set();

      // loop an toàn, tránh infinite (ví dụ tối đa 500 câu)
      for (let i = 0; i < 500; i++) {
        const res = await api.get(
          `/learner/lessons/${lessonId}/quiz/attempts/${attemptId}/next`
        );
        const data = unwrap(res); // question hoặc null

        if (!data) break;
        if (seenIds.has(data.questionId)) {
          // đã gặp lại => khả năng BE lặp, tránh vòng vô hạn
          break;
        }

        seenIds.add(data.questionId);
        questions.push(data);
      }

      return { questions };
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

/**
 * 4) Lưu đáp án 1 câu (auto-save)
 * POST /api/learner/lessons/{lessonId}/quiz/attempts/{attemptId}/questions/{questionId}/answer
 * body: { optionId }
 */
export const answerQuestionThunk = createAsyncThunk(
  "quizAttempt/answerQuestion",
  async ({ lessonId, attemptId, questionId, optionId }, { rejectWithValue }) => {
    try {
      await api.post(
        `/learner/lessons/${lessonId}/quiz/attempts/${attemptId}/questions/${questionId}/answer`,
        { optionId }
      );
      // FE lưu lại state local
      return { questionId, optionId };
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

/**
 * 5) Nộp bài
 * POST /api/learner/lessons/{lessonId}/quiz/attempts/{attemptId}/submit
 */
export const submitAttemptThunk = createAsyncThunk(
  "quizAttempt/submitAttempt",
  async ({ lessonId, attemptId }, { rejectWithValue }) => {
    try {
      const res = await api.post(
        `/learner/lessons/${lessonId}/quiz/attempts/${attemptId}/submit`
      );
      const data = unwrap(res); // kết quả bài làm: điểm, số câu đúng, ...
      return { result: data };
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

/* =========================================================
 *                    SLICE
 * ======================================================= */

const initialState = {
  lessonId: null,
  quizInfo: null, // info quiz
  attemptId: null,
  attempt: null, // toàn bộ object BE trả khi start
  questions: [], // list câu hỏi
  answers: {}, // { [questionId]: optionId }
  loading: false,
  error: null,
  submitting: false,
  result: null, // kết quả sau submit
};

const quizAttemptSlice = createSlice({
  name: "quizAttempt",
  initialState,
  reducers: {
    resetQuizAttempt(state) {
      state.lessonId = null;
      state.quizInfo = null;
      state.attemptId = null;
      state.attempt = null;
      state.questions = [];
      state.answers = {};
      state.loading = false;
      state.error = null;
      state.submitting = false;
      state.result = null;
    },
    // nếu muốn hydrate từ localStorage sau này
    setAnswerLocal(state, action) {
      const { questionId, optionId } = action.payload;
      state.answers[questionId] = optionId;
    },
  },
  extraReducers: (builder) => {
    // fetchQuizInfo
    builder
      .addCase(fetchQuizInfoThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuizInfoThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.lessonId = action.payload.lessonId;
        state.quizInfo = action.payload.quizInfo;
      })
      .addCase(fetchQuizInfoThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // startAttempt
    builder
      .addCase(startAttemptThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startAttemptThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.lessonId = action.payload.lessonId;
        state.attempt = action.payload.attempt;
        state.attemptId =
          action.payload.attempt?.attemptId || action.payload.attempt?.id;
      })
      .addCase(startAttemptThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // loadAllQuestions
    builder
      .addCase(loadAllQuestionsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.questions = [];
      })
      .addCase(loadAllQuestionsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.questions = action.payload.questions || [];
      })
      .addCase(loadAllQuestionsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // answerQuestion
    builder
      .addCase(answerQuestionThunk.fulfilled, (state, action) => {
        const { questionId, optionId } = action.payload;
        state.answers[questionId] = optionId;
      })
      .addCase(answerQuestionThunk.rejected, (state, action) => {
        state.error = action.payload;
      });

    // submitAttempt
    builder
      .addCase(submitAttemptThunk.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(submitAttemptThunk.fulfilled, (state, action) => {
        state.submitting = false;
        state.result = action.payload.result;
      })
      .addCase(submitAttemptThunk.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      });
  },
});

export const { resetQuizAttempt, setAnswerLocal } = quizAttemptSlice.actions;
export default quizAttemptSlice.reducer;
