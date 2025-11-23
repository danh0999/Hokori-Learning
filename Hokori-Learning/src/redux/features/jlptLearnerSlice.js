// src/redux/features/jlptLearnerSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios";

/* ============================
   ASYNC THUNKS
============================ */

// 1) Lấy danh sách Event đang OPEN (có thể filter level=N3)
export const fetchOpenEvents = createAsyncThunk(
  "jlptLearner/fetchOpenEvents",
  async (level, { rejectWithValue }) => {
    try {
      const url = level
        ? `/api/jlpt/events/open?level=${level}`
        : `/api/jlpt/events/open`;
      const res = await api.get(url); // trả về list JlptEventResponse
      return { events: res.data, level: level || "" };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 2) Lấy danh sách Test của 1 Event
export const fetchTestsByEvent = createAsyncThunk(
  "jlptLearner/fetchTestsByEvent",
  async (eventId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/jlpt/events/${eventId}/tests`);
      // res.data: list JlptTestResponse (id, eventId, level, durationMin, totalScore, resultNote, ...)
      return { eventId, tests: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 3) Bắt đầu làm 1 Test (xoá answer cũ + trả đề)  --> /api/learner/jlpt/...
export const startJlptTest = createAsyncThunk(
  "jlptLearner/startJlptTest",
  async (testId, { rejectWithValue }) => {
    try {
      const res = await api.post(`/api/learner/jlpt/tests/${testId}/start`);
      return res.data; // JlptTestStartResponse
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 4) Reload danh sách câu hỏi (khi F5)
export const fetchTestQuestions = createAsyncThunk(
  "jlptLearner/fetchTestQuestions",
  async (testId, { rejectWithValue }) => {
    try {
      const res = await api.get(
        `/api/learner/jlpt/tests/${testId}/questions`
      );
      return res.data; // list question + options
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 5) Nộp đáp án cho 1 câu hỏi
export const submitJlptAnswer = createAsyncThunk(
  "jlptLearner/submitJlptAnswer",
  async ({ testId, questionId, selectedOptionId }, { rejectWithValue }) => {
    try {
      await api.post(`/api/learner/jlpt/tests/${testId}/answers`, {
        questionId,
        selectedOptionId,
      });
      return { questionId, selectedOptionId };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 6) Lấy kết quả bài thi của chính mình
export const fetchMyJlptResult = createAsyncThunk(
  "jlptLearner/fetchMyJlptResult",
  async (testId, { rejectWithValue }) => {
    try {
      const res = await api.get(
        `/api/learner/jlpt/tests/${testId}/my-result`
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

/* ============================
   INITIAL STATE
============================ */

const initialState = {
  // LIST PAGE
  events: [], // list event OPEN
  testsByEvent: {}, // { [eventId]: [tests] }
  selectedEventId: null,
  levelFilter: "", // N1 / N2 / ... hoặc ""

  // TEST PAGE
  currentTestMeta: null, // info từ startTest
  questions: [],
  answers: {}, // { [questionId]: selectedOptionId }
  result: null,

  // Loading flags
  loadingEvents: false,
  loadingTests: false,
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
    setSelectedEventId(state, action) {
      state.selectedEventId = action.payload;
    },
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

        // Luôn chọn event đầu tiên của list (nếu có)
        state.selectedEventId = events.length > 0 ? events[0].id : null;
      })
      .addCase(fetchOpenEvents.rejected, (state, action) => {
        state.loadingEvents = false;
        state.error = action.payload;
      })

      // TESTS BY EVENT
      .addCase(fetchTestsByEvent.pending, (state) => {
        state.loadingTests = true;
        state.error = null;
      })
      .addCase(fetchTestsByEvent.fulfilled, (state, action) => {
        state.loadingTests = false;
        const { eventId, tests } = action.payload;
        state.testsByEvent[eventId] = tests;
      })
      .addCase(fetchTestsByEvent.rejected, (state, action) => {
        state.loadingTests = false;
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

      // RELOAD QUESTIONS
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

export const { setSelectedEventId, setLocalAnswer, resetCurrentTest } =
  jlptLearnerSlice.actions;

export default jlptLearnerSlice.reducer;
