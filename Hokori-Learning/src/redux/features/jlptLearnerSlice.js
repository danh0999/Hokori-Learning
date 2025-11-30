// src/redux/features/jlptLearnerSlice.js
// :contentReference[oaicite:1]{index=1}
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios";

/* =========================================================
   1) GET danh sách EVENT mở
========================================================= */
export const fetchOpenEvents = createAsyncThunk(
  "jlptLearner/fetchOpenEvents",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/jlpt/events/open");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

/* =========================================================
   2) GET danh sách đề thi theo EVENT (API mới)
   GET /learner/jlpt/events/{eventId}/tests
========================================================= */
export const fetchTestsByEvent = createAsyncThunk(
  "jlptLearner/fetchTestsByEvent",
  async (eventId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/learner/jlpt/events/${eventId}/tests`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

/* =========================================================
   3) GET Grammar + Vocabulary
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

/* =========================================================
   4) GET Reading
========================================================= */
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

/* =========================================================
   5) GET Listening
========================================================= */
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
   6) GET Active users (polling)
========================================================= */
export const fetchActiveUsers = createAsyncThunk(
  "jlptLearner/fetchActiveUsers",
  async (testId, { rejectWithValue }) => {
    try {
      const res = await api.get(
        `/learner/jlpt/tests/${testId}/active-users`
      );

      const data = res.data;
      let count = 0;

      if (typeof data === "number") count = data;
      else if (data?.activeUsers !== undefined) count = data.activeUsers;
      else if (Array.isArray(data) && typeof data[0] === "number")
        count = data[0];

      return { testId, count };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

/* =========================================================
   7) SUBMIT ANSWER
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
   8) GET RESULT
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
  activeUsersError: null,
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
  },
  extraReducers: (builder) => {
    builder
      /* EVENTS */
      .addCase(fetchOpenEvents.pending, (state) => {
        state.loadingEvents = true;
      })
      .addCase(fetchOpenEvents.fulfilled, (state, action) => {
        state.loadingEvents = false;
        state.events = action.payload || [];
      })
      .addCase(fetchOpenEvents.rejected, (state, action) => {
        state.loadingEvents = false;
        state.eventsError = action.payload;
      })

      /* TEST LIST BY EVENT */
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
        state.loadingQuestions = false;
        state.grammarVocab = action.payload || [];
      })
      .addCase(fetchGrammarVocab.rejected, (state, action) => {
        state.loadingQuestions = false;
        state.questionsError = action.payload;
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
        state.activeUsers[testId] = count;
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

export const { clearTestData } = jlptLearnerSlice.actions;
export default jlptLearnerSlice.reducer;
