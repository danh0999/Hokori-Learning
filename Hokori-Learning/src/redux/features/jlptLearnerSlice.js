// src/redux/features/jlptLearnerSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios";

/* =========================================================
   0) UTIL - CLEAN TEST ID
========================================================= */
const safeTestId = (id) => {
  if (!id || id === "null" || id === "undefined") return null;
  return Number(id);
};

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
   3) START TEST (NEW)
========================================================= */
export const startJlptTest = createAsyncThunk(
  "jlptLearner/startJlptTest",
  async (testId, { rejectWithValue }) => {
    const safeId = safeTestId(testId);
    if (!safeId) return rejectWithValue("Invalid test ID");

    try {
      const res = await api.post(`/learner/jlpt/tests/${safeId}/start`);
      return res.data; // { startedAt, durationMin, questions }
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

/* =========================================================
   4) FETCH QUESTIONS (READING / LISTENING / GRAMMAR)
========================================================= */
export const fetchGrammarVocab = createAsyncThunk(
  "jlptLearner/fetchGrammarVocab",
  async (testId, { rejectWithValue }) => {
    const id = safeTestId(testId);
    try {
      const res = await api.get(
        `/learner/jlpt/tests/${id}/questions/grammar-vocab`
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
    const id = safeTestId(testId);
    try {
      const res = await api.get(`/learner/jlpt/tests/${id}/questions/reading`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchListening = createAsyncThunk(
  "jlptLearner/fetchListening",
  async (testId, { rejectWithValue }) => {
    const id = safeTestId(testId);
    try {
      const res = await api.get(
        `/learner/jlpt/tests/${id}/questions/listening`
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

/* =========================================================
   5) ACTIVE USERS
========================================================= */
export const fetchActiveUsers = createAsyncThunk(
  "jlptLearner/fetchActiveUsers",
  async (testId, { rejectWithValue }) => {
    const id = safeTestId(testId);

    try {
      const res = await api.get(`/learner/jlpt/tests/${id}/active-users`);
      const data = res.data;

      const count =
        typeof data === "number"
          ? data
          : data?.activeUsers !== undefined
          ? data.activeUsers
          : 0;

      return { testId: id, count };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

/* =========================================================
   6) SUBMIT ANSWER
========================================================= */
export const submitAnswer = createAsyncThunk(
  "jlptLearner/submitAnswer",
  async ({ testId, questionId, selectedOptionId }, { rejectWithValue }) => {
    const id = safeTestId(testId);

    try {
      await api.post(`/learner/jlpt/tests/${id}/answers`, {
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
   7) SUBMIT TEST (NEW)
========================================================= */
export const submitJlptTest = createAsyncThunk(
  "jlptLearner/submitJlptTest",
  async (testId, { rejectWithValue }) => {
    const id = safeTestId(testId);

    try {
      const res = await api.post(`/learner/jlpt/tests/${id}/submit`);
      return res.data; // FULL RESULT
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

/* =========================================================
   8) GET RESULT
========================================================= */
export const fetchMyJlptResult = createAsyncThunk(
  "jlptLearner/fetchMyJlptResult",
  async (testId, { rejectWithValue }) => {
    const id = safeTestId(testId);

    try {
      const res = await api.get(`/learner/jlpt/tests/${id}/my-result`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

/* =========================================================
   9) STATE
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
  currentTestId: null,
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
    },

    clearTestSession: (state) => {
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
    clearResult: (state) => {
      state.result = null;
      state.resultError = null;
    },

    setTestTime: (state, action) => {
      state.timeLeft = action.payload.timeLeft;
      if (action.payload.durationMin) {
        state.durationMin = action.payload.durationMin;
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

      /* START TEST */
      .addCase(startJlptTest.pending, (state) => {
        state.loadingQuestions = true;
        state.questionsError = null;
      })
      .addCase(startJlptTest.fulfilled, (state, action) => {
        state.loadingQuestions = false;

        const payload = action.payload;
        if (!payload) return;

        state.durationMin = payload.durationMin;
        state.timeLeft = payload.durationMin * 60;

        const questions = payload.questions || [];

        state.grammarVocab = questions.filter(
          (q) => q.section === "GRAMMAR" || q.section === "VOCAB"
        );
        state.reading = questions.filter((q) => q.section === "READING");
        state.listening = questions.filter((q) => q.section === "LISTENING");

        // Restore answers
        questions.forEach((q) => {
          if (q.selectedOptionId) {
            state.answers[q.id] = q.selectedOptionId;
          }
        });
      })
      .addCase(startJlptTest.rejected, (state, action) => {
        state.loadingQuestions = false;
        state.questionsError = action.payload;
      })

      /* QUESTIONS */
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
      .addCase(fetchActiveUsers.fulfilled, (state, action) => {
        const { testId, count } = action.payload || {};
        if (!testId) return;
        state.activeUsers[testId] = count ?? 0;
      })

      /* SUBMIT ANSWER */
      .addCase(submitAnswer.fulfilled, (state, action) => {
        const { questionId, selectedOptionId } = action.payload;
        state.answers[questionId] = selectedOptionId;
      })

      /* SUBMIT TEST */
      .addCase(submitJlptTest.pending, (state) => {
        state.loadingResult = true;
        state.resultError = null;
      })
      .addCase(submitJlptTest.fulfilled, (state, action) => {
        state.loadingResult = false;
        state.result = action.payload;

        // BE xóa session → FE clear answers
        state.answers = {};
      })
      .addCase(submitJlptTest.rejected, (state, action) => {
        state.loadingResult = false;
        state.resultError = action.payload;
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

/* =========================================================
   EXPORT ACTIONS
========================================================= */
export const {
  clearTestData,
  clearTestSession,
  setTestTime,
  updateTimeLeft,
  setCurrentTestId,
  clearResult,
} = jlptLearnerSlice.actions;

export default jlptLearnerSlice.reducer;
