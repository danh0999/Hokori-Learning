// src/redux/features/jlptModeratorSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios";

// ========== THUNKS ==========

// 1. List tất cả JLPT events (Admin/Moderator)
export const fetchJlptEventsThunk = createAsyncThunk(
  "jlptModerator/fetchEvents",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("jlpt/events");
      return res.data; // array event
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 2. List test của 1 event
export const fetchTestsByEventThunk = createAsyncThunk(
  "jlptModerator/fetchTestsByEvent",
  async (eventId, { rejectWithValue }) => {
    try {
      const res = await api.get(`jlpt/events/${eventId}/tests`);
      return { eventId, tests: res.data }; // thường 1 test / event
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 3. Moderator tạo JLPT test cho event
export const createJlptTestForEventThunk = createAsyncThunk(
  "jlptModerator/createTestForEvent",
  async ({ eventId, payload }, { rejectWithValue }) => {
    try {
      const res = await api.post(`jlpt/events/${eventId}/tests`, payload);
      return { eventId, test: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 4. Lấy full câu hỏi + options cho 1 test
export const fetchJlptTestQuestionsThunk = createAsyncThunk(
  "jlptModerator/fetchTestQuestions",
  async (testId, { rejectWithValue }) => {
    try {
      const res = await api.get(`jlpt/tests/${testId}/questions`);
      return { testId, questions: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 5. Tạo 1 câu hỏi cho test
export const createJlptQuestionThunk = createAsyncThunk(
  "jlptModerator/createQuestion",
  async ({ testId, payload }, { rejectWithValue }) => {
    try {
      const res = await api.post(`jlpt/tests/${testId}/questions`, payload);
      return { testId, question: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 6. Tạo option cho 1 câu hỏi
export const createJlptOptionThunk = createAsyncThunk(
  "jlptModerator/createOption",
  async ({ questionId, payload }, { rejectWithValue }) => {
    try {
      const res = await api.post(
        `jlpt/questions/${questionId}/options`,
        payload
      );
      return { questionId, option: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// ========== SLICE ==========

const jlptModeratorSlice = createSlice({
  name: "jlptModerator",
  initialState: {
    events: [],
    eventsLoading: false,

    testsByEvent: {}, // { [eventId]: [tests] }
    questionsByTest: {}, // { [testId]: [questions-with-options] }

    creatingTest: false,
    creatingQuestion: false,
    creatingOption: false,

    error: null,
  },
  reducers: {
    clearJlptModeratorError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // events
    builder
      .addCase(fetchJlptEventsThunk.pending, (state) => {
        state.eventsLoading = true;
        state.error = null;
      })
      .addCase(fetchJlptEventsThunk.fulfilled, (state, action) => {
        state.eventsLoading = false;
        state.events = action.payload;
      })
      .addCase(fetchJlptEventsThunk.rejected, (state, action) => {
        state.eventsLoading = false;
        state.error = action.payload;
      });

    // tests by event
    builder
      .addCase(fetchTestsByEventThunk.fulfilled, (state, action) => {
        const { eventId, tests } = action.payload;
        state.testsByEvent[eventId] = tests;
      })
      .addCase(fetchTestsByEventThunk.rejected, (state, action) => {
        state.error = action.payload;
      });

    // create test
    builder
      .addCase(createJlptTestForEventThunk.pending, (state) => {
        state.creatingTest = true;
        state.error = null;
      })
      .addCase(createJlptTestForEventThunk.fulfilled, (state, action) => {
        state.creatingTest = false;
        const { eventId, test } = action.payload;
        const list = state.testsByEvent[eventId] || [];
        state.testsByEvent[eventId] = [...list, test];
      })
      .addCase(createJlptTestForEventThunk.rejected, (state, action) => {
        state.creatingTest = false;
        state.error = action.payload;
      });

    // fetch questions
    builder
      .addCase(fetchJlptTestQuestionsThunk.fulfilled, (state, action) => {
        const { testId, questions } = action.payload;
        state.questionsByTest[testId] = questions;
      })
      .addCase(fetchJlptTestQuestionsThunk.rejected, (state, action) => {
        state.error = action.payload;
      });

    // create question
    builder
      .addCase(createJlptQuestionThunk.pending, (state) => {
        state.creatingQuestion = true;
        state.error = null;
      })
      .addCase(createJlptQuestionThunk.fulfilled, (state, action) => {
        state.creatingQuestion = false;
        const { testId, question } = action.payload;
        const list = state.questionsByTest[testId] || [];
        state.questionsByTest[testId] = [...list, { ...question, options: [] }];
      })
      .addCase(createJlptQuestionThunk.rejected, (state, action) => {
        state.creatingQuestion = false;
        state.error = action.payload;
      });

    // create option
    builder
      .addCase(createJlptOptionThunk.pending, (state) => {
        state.creatingOption = true;
        state.error = null;
      })
      .addCase(createJlptOptionThunk.fulfilled, (state, action) => {
        state.creatingOption = false;
        const { questionId, option } = action.payload;

        // tìm question trong mọi test rồi push option
        Object.keys(state.questionsByTest).forEach((testId) => {
          const qs = state.questionsByTest[testId];
          const idx = qs.findIndex((q) => q.id === questionId);
          if (idx !== -1) {
            const q = qs[idx];
            q.options = [...(q.options || []), option];
          }
        });
      })
      .addCase(createJlptOptionThunk.rejected, (state, action) => {
        state.creatingOption = false;
        state.error = action.payload;
      });
  },
});

export const { clearJlptModeratorError } = jlptModeratorSlice.actions;
export default jlptModeratorSlice.reducer;
