// src/redux/features/jlptLearnerSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios";

/* ============================
   ASYNC THUNKS (Learner Only)
============================ */

// 1) Lấy danh sách Event OPEN
export const fetchOpenEvents = createAsyncThunk(
  "jlptLearner/fetchOpenEvents",
  async (level, { rejectWithValue }) => {
    try {
      const url = level
        ? `/jlpt/events/open?level=${level}`
        : `/jlpt/events/open`;

      const res = await api.get(url);
      return { events: res.data, level: level || "" };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 2) Bắt đầu làm test
export const startJlptTest = createAsyncThunk(
  "jlptLearner/startJlptTest",
  async (testId, { rejectWithValue }) => {
    try {
      const res = await api.post(`/learner/jlpt/tests/${testId}/start`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 3) Reload câu hỏi khi F5
export const fetchTestQuestions = createAsyncThunk(
  "jlptLearner/fetchTestQuestions",
  async (testId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/learner/jlpt/tests/${testId}/questions`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 4) Nộp câu trả lời
export const submitJlptAnswer = createAsyncThunk(
  "jlptLearner/submitJlptAnswer",
  async ({ testId, questionId, selectedOptionId }, { rejectWithValue }) => {
    try {
      await api.post(`/learner/jlpt/tests/${testId}/answers`, {
        questionId,
        selectedOptionId,
      });
      return { questionId, selectedOptionId };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 5) Lấy kết quả bài thi
export const fetchMyJlptResult = createAsyncThunk(
  "jlptLearner/fetchMyJlptResult",
  async (testId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/learner/jlpt/tests/${testId}/my-result`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

/* ============================
   STATE
============================ */

const initialState = {
  events: [],
  levelFilter: "",

  currentTestMeta: null,
  questions: [],
  answers: {},
  result: null,

  loadingEvents: false,
  loadingStart: false,
  loadingQuestions: false,
  submittingAnswer: false,
  loadingResult: false,

  error: null,
};

/* ============================
   SLICE
============================ */

const jlptLearnerSlice = createSlice({
  name: "jlptLearner",
  initialState,
  reducers: {
    setLocalAnswer(state, action) {
      const { questionId, selectedOptionId } = action.payload;
      state.answers[questionId] = selectedOptionId;
    },
    resetCurrentTest(state) {
      state.currentTestMeta = null;
      state.questions = [];
      state.answers = {};
      state.result = null;
    },
  },
  extraReducers: (builder) => {
    builder

      // EVENTS
      .addCase(fetchOpenEvents.pending, (state) => {
        state.loadingEvents = true;
        state.error = null;
      })
      .addCase(fetchOpenEvents.fulfilled, (state, action) => {
        state.loadingEvents = false;
        const { events, level } = action.payload;

        state.events = events;
        state.levelFilter = level;
      })
      .addCase(fetchOpenEvents.rejected, (state, action) => {
        state.loadingEvents = false;
        state.error = action.payload;
      })

      // START TEST
      .addCase(startJlptTest.pending, (state) => {
        state.loadingStart = true;
        state.error = null;
        state.result = null;
      })
      .addCase(startJlptTest.fulfilled, (state, action) => {
        state.loadingStart = false;

        const data = action.payload;

        state.currentTestMeta = {
          testId: data.testId,
          level: data.level,
          durationMin: data.durationMin,
          totalScore: data.totalScore,
          startedAt: data.startedAt,
        };

        state.questions = data.questions || [];
        state.answers = {};
      })
      .addCase(startJlptTest.rejected, (state, action) => {
        state.loadingStart = false;
        state.error = action.payload;
      })

      // QUESTIONS
      .addCase(fetchTestQuestions.pending, (state) => {
        state.loadingQuestions = true;
        state.error = null;
      })
      .addCase(fetchTestQuestions.fulfilled, (state, action) => {
        state.loadingQuestions = false;
        state.questions = action.payload;
      })
      .addCase(fetchTestQuestions.rejected, (state, action) => {
        state.loadingQuestions = false;
        state.error = action.payload;
      })

      // SUBMIT ANSWER
      .addCase(submitJlptAnswer.pending, (state) => {
        state.submittingAnswer = true;
      })
      .addCase(submitJlptAnswer.fulfilled, (state, action) => {
        state.submittingAnswer = false;

        const { questionId, selectedOptionId } = action.payload;
        state.answers[questionId] = selectedOptionId;
      })
      .addCase(submitJlptAnswer.rejected, (state, action) => {
        state.submittingAnswer = false;
        state.error = action.payload;
      })

      // RESULT
      .addCase(fetchMyJlptResult.pending, (state) => {
        state.loadingResult = true;
        state.error = null;
      })
      .addCase(fetchMyJlptResult.fulfilled, (state, action) => {
        state.loadingResult = false;
        state.result = action.payload;
      })
      .addCase(fetchMyJlptResult.rejected, (state, action) => {
        state.loadingResult = false;
        state.error = action.payload;
      });
  },
});

export const { setLocalAnswer, resetCurrentTest } =
  jlptLearnerSlice.actions;

export default jlptLearnerSlice.reducer;
