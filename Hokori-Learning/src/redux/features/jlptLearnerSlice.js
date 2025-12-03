// src/redux/features/jlptLearnerSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios";

/* =========================================================
   1) GET EVENT MỞ
========================================================= */
export const fetchOpenEvents = createAsyncThunk(
  "jlptLearner/fetchOpenEvents",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/jlpt/events/open");
      return res.data;
    } catch (err) {
      const status = err.response?.status;
      if (status === 403) return [];
      return rejectWithValue(
        err.response?.data?.message || err.response?.data || err.message
      );
    }
  }
);

/* =========================================================
   2) GET TESTS BY EVENT
========================================================= */
export const fetchTestsByEvent = createAsyncThunk(
  "jlptLearner/fetchTestsByEvent",
  async (eventId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/learner/jlpt/events/${eventId}/tests`);
      return res.data;
    } catch (err) {
      const status = err.response?.status;
      if (status === 403) return [];
      return rejectWithValue(
        err.response?.data?.message || err.response?.data || err.message
      );
    }
  }
);

/* =========================================================
   QUESTIONS
========================================================= */
export const fetchGrammarVocab = createAsyncThunk(
  "jlptLearner/fetchGrammarVocab",
  async (testId, { rejectWithValue }) => {
    try {
      const res = await api.get(
        `/learner/jlpt/tests/${testId}/questions/grammar-vocab`
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchReading = createAsyncThunk(
  "jlptLearner/fetchReading",
  async (testId, { rejectWithValue }) => {
    try {
      const res = await api.get(
        `/learner/jlpt/tests/${testId}/questions/reading`
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchListening = createAsyncThunk(
  "jlptLearner/fetchListening",
  async (testId, { rejectWithValue }) => {
    try {
      const res = await api.get(
        `/learner/jlpt/tests/${testId}/questions/listening`
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

/* =========================================================
   ACTIVE USERS
========================================================= */
export const fetchActiveUsers = createAsyncThunk(
  "jlptLearner/fetchActiveUsers",
  async (testId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/learner/jlpt/tests/${testId}/active-users`);

      const data = res.data;
      let count = 0;

      if (typeof data === "number") count = data;
      else if (data?.activeUsers !== undefined) count = data.activeUsers;

      return { testId, count };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

/* =========================================================
   SUBMIT ANSWER
========================================================= */
export const submitAnswer = createAsyncThunk(
  "jlptLearner/submitAnswer",
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

/* =========================================================
   GET RESULT
========================================================= */
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

/* =========================================================
   STATE
========================================================= */
const initialState = {
  events: [],
  loadingEvents: false,
  eventsError: null,

  allTests: [],
  loadingAllTests: false,
  testsError: null,

  grammarVocab: [],
  reading: [],
  listening: [],
  loadingQuestions: false,
  questionsError: null,

  answers: {},

  result: null,
  loadingResult: false,
  resultError: null,

  activeUsers: {},

  // TIMER + RESTORE
  timeLeft: null,
  durationMin: null,
  currentTestId: null, // 🔥 Thêm để restore chính xác
};

/* =========================================================
   SLICE
========================================================= */
const jlptLearnerSlice = createSlice({
  name: "jlptLearner",
  initialState,
  reducers: {
    clearTestData: (state) => {
      state.grammarVocab = [];
      state.reading = [];
      state.listening = [];
      state.answers = {};
      state.result = null;
      // ❗ không reset timer ở đây
    },

    clearTestSession: (state) => {
      // dùng khi EXIT hoặc NỘP BÀI
      state.grammarVocab = [];
      state.reading = [];
      state.listening = [];
      state.answers = {};
      state.result = null;

      state.timeLeft = null;
      state.durationMin = null;
      state.currentTestId = null;
      state.activeUsers = {};
    },

    setTestTime: (state, action) => {
      state.timeLeft = action.payload.timeLeft;
      if (action.payload.durationMin) {
        state.durationMin = action.payload.durationMin; // chỉ set lúc start
      }
    },

    updateTimeLeft: (state) => {
      if (state.timeLeft > 0) state.timeLeft -= 1;
    },

    setCurrentTestId: (state, action) => {
      state.currentTestId = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder
      /* EVENTS */
      .addCase(fetchOpenEvents.pending, (state) => {
        state.loadingEvents = true;
        state.eventsError = null;
      })
      .addCase(fetchOpenEvents.fulfilled, (state, action) => {
        state.loadingEvents = false;
        state.events = action.payload || [];
      })
      .addCase(fetchOpenEvents.rejected, (state, action) => {
        state.loadingEvents = false;
        state.eventsError = action.payload;
      })

      /* TESTS */
      .addCase(fetchTestsByEvent.pending, (state) => {
        state.loadingAllTests = true;
        state.testsError = null;
      })
      .addCase(fetchTestsByEvent.fulfilled, (state, action) => {
        state.loadingAllTests = false;
        state.allTests = action.payload?.filter((t) => !t.deleteFlag) || [];
      })
      .addCase(fetchTestsByEvent.rejected, (state, action) => {
        state.loadingAllTests = false;
        state.testsError = action.payload;
      })

      /* QUESTIONS */
      .addCase(fetchGrammarVocab.pending, (state) => {
        state.loadingQuestions = true;
      })
      .addCase(fetchGrammarVocab.fulfilled, (state, action) => {
        state.grammarVocab = action.payload || [];
        state.loadingQuestions = false;
      })
      .addCase(fetchReading.fulfilled, (state, action) => {
        state.reading = action.payload || [];
      })
      .addCase(fetchListening.fulfilled, (state, action) => {
        state.listening = action.payload || [];
      })

      /* ACTIVE USERS */
      /* ACTIVE USERS – FIX CRASH */
      .addCase(fetchActiveUsers.fulfilled, (state, action) => {
        const payload = action.payload;

        // Nếu payload không phải object => bỏ qua
        if (!payload || typeof payload !== "object") return;

        const testId = payload.testId;
        const count = payload.count;

        // Nếu testId không hợp lệ => bỏ qua
        if (testId === undefined || testId === null) return;

        state.activeUsers[testId] = count ?? 0;
      })

      /* SUBMIT */
      .addCase(submitAnswer.fulfilled, (state, action) => {
        const { questionId, selectedOptionId } = action.payload;
        state.answers[questionId] = selectedOptionId;
      })

      /* RESULT */
      .addCase(fetchMyJlptResult.pending, (state) => {
        state.loadingResult = true;
        state.resultError = null;
      })
      .addCase(fetchMyJlptResult.fulfilled, (state, action) => {
        state.loadingResult = false;
        state.result = action.payload;
      })
      .addCase(fetchMyJlptResult.rejected, (state, action) => {
        state.loadingResult = false;
        state.resultError = action.payload;
      });
  },
});

/* EXPORT ACTIONS */
export const {
  clearTestData,
  clearTestSession,
  setTestTime,
  updateTimeLeft,
  setCurrentTestId,
} = jlptLearnerSlice.actions;

export default jlptLearnerSlice.reducer;
