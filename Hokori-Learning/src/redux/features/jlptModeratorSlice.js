// src/redux/features/jlptModeratorSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios.js";

// -----------------------------
// FETCH tests of event
// -----------------------------
export const fetchTestsByEventThunk = createAsyncThunk(
  "jlptModerator/fetchTestsByEvent",
  async (eventId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/jlpt/events/${eventId}/tests`);
      return { eventId, tests: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// -----------------------------
// CREATE test for event
// -----------------------------
export const createJlptTestForEventThunk = createAsyncThunk(
  "jlptModerator/createTestForEvent",
  async ({ eventId, data }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/jlpt/events/${eventId}/tests`, data);
      return { eventId, test: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// -----------------------------
// GET Questions of test
// -----------------------------
export const fetchJlptTestQuestionsThunk = createAsyncThunk(
  "jlptModerator/fetchQuestions",
  async (testId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/jlpt/tests/${testId}/questions`);
      return { testId, questions: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// -----------------------------
// CREATE Question
// -----------------------------
export const createJlptQuestionThunk = createAsyncThunk(
  "jlptModerator/createQuestion",
  async ({ testId, data }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/jlpt/tests/${testId}/questions`, data);
      return { testId, question: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// -----------------------------
// CREATE Option
// -----------------------------
export const createJlptOptionThunk = createAsyncThunk(
  "jlptModerator/createOption",
  async ({ questionId, data }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/jlpt/questions/${questionId}/options`, data);
      return { questionId, option: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// -----------------------------
// UPDATE Option
// PUT /api/jlpt/questions/{questionId}/options/{optionId}
// -----------------------------
export const updateJlptOptionThunk = createAsyncThunk(
  "jlptModerator/updateOption",
  async ({ questionId, optionId, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(
        `/jlpt/questions/${questionId}/options/${optionId}`,
        data
      );
      return { questionId, option: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// -----------------------------
// DELETE Option
// DELETE /api/jlpt/questions/{questionId}/options/{optionId}
// -----------------------------
export const deleteJlptOptionThunk = createAsyncThunk(
  "jlptModerator/deleteOption",
  async ({ questionId, optionId }, { rejectWithValue }) => {
    try {
      await api.delete(`/jlpt/questions/${questionId}/options/${optionId}`);
      return { questionId, optionId };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// -----------------------------
// UPDATE TEST
// -----------------------------
export const updateJlptTestThunk = createAsyncThunk(
  "jlptModerator/updateTest",
  async ({ testId, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/jlpt/tests/${testId}`, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// -----------------------------
// DELETE TEST
// -----------------------------
export const deleteJlptTestThunk = createAsyncThunk(
  "jlptModerator/deleteTest",
  async (testId, { rejectWithValue }) => {
    try {
      await api.delete(`/jlpt/tests/${testId}`);
      return testId;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// -----------------------------
// UPDATE QUESTION
// -----------------------------
export const updateJlptQuestionThunk = createAsyncThunk(
  "jlptModerator/updateQuestion",
  async ({ testId, questionId, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(
        `/jlpt/tests/${testId}/questions/${questionId}`,
        data
      );
      return res.data; // includes testId, id, etc.
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// -----------------------------
// DELETE QUESTION
// -----------------------------
export const deleteJlptQuestionThunk = createAsyncThunk(
  "jlptModerator/deleteQuestion",
  async ({ testId, questionId }, { rejectWithValue }) => {
    try {
      await api.delete(`/jlpt/tests/${testId}/questions/${questionId}`);
      return { testId, questionId };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// -----------------------------
// UPLOAD LISTENING AUDIO for TEST
// POST /api/jlpt/tests/{testId}/files
// -----------------------------
export const uploadJlptTestAudioThunk = createAsyncThunk(
  "jlptModerator/uploadTestAudio",
  async ({ testId, file }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post(`/jlpt/tests/${testId}/files`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // BE spec: { filePath: "string", url: "string" }
      return {
        testId,
        filePath: res.data.filePath,
        url: res.data.url,
      };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// =====================================================
// SLICE
// =====================================================
const jlptModeratorSlice = createSlice({
  name: "jlptModerator",
  initialState: {
    testsByEvent: {},
    questionsByTest: {},
    audioByTest: {}, // { [testId]: { filePath, url } }
    loading: false,
    uploadingAudio: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetch tests
      .addCase(fetchTestsByEventThunk.fulfilled, (state, action) => {
        state.testsByEvent[action.payload.eventId] = action.payload.tests;
      })

      // create test
      .addCase(createJlptTestForEventThunk.fulfilled, (state, action) => {
        const { eventId, test } = action.payload;
        state.testsByEvent[eventId] = [
          ...(state.testsByEvent[eventId] || []),
          test,
        ];
      })

      // update test
      .addCase(updateJlptTestThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        Object.keys(state.testsByEvent).forEach((eventId) => {
          const list = state.testsByEvent[eventId] || [];
          state.testsByEvent[eventId] = list.map((t) =>
            t.id === updated.id ? updated : t
          );
        });
      })

      // delete test
      .addCase(deleteJlptTestThunk.fulfilled, (state, action) => {
        const deletedTestId = action.payload;

        // Xoá test khỏi từng event
        Object.keys(state.testsByEvent || {}).forEach((eventId) => {
          const list = state.testsByEvent[eventId] || [];
          state.testsByEvent[eventId] = list.filter(
            (t) => String(t.id) !== String(deletedTestId)
          );
        });

        // Xoá cache câu hỏi & audio của test đó (check null trước)
        if (state.questionsByTest) {
          delete state.questionsByTest[deletedTestId];
          delete state.questionsByTest[String(deletedTestId)];
        }
        if (state.audioByTest) {
          delete state.audioByTest[deletedTestId];
          delete state.audioByTest[String(deletedTestId)];
        }
      })

      // fetch questions
      .addCase(fetchJlptTestQuestionsThunk.fulfilled, (state, action) => {
        state.questionsByTest[action.payload.testId] = action.payload.questions;
      })

      // create question
      .addCase(createJlptQuestionThunk.fulfilled, (state, action) => {
        const { testId, question } = action.payload;
        state.questionsByTest[testId] = [
          ...(state.questionsByTest[testId] || []),
          question,
        ];
      })

      // create option
      .addCase(createJlptOptionThunk.fulfilled, (state, action) => {
        const { questionId, option } = action.payload;

        for (let testId in state.questionsByTest) {
          const list = state.questionsByTest[testId];
          const index = list.findIndex((q) => q.id === questionId);
          if (index !== -1) {
            list[index].options = [...(list[index].options || []), option];
          }
        }
      })

      // update question
      .addCase(updateJlptQuestionThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        const testId = updated.testId;

        if (!testId || !state.questionsByTest[testId]) return;

        state.questionsByTest[testId] = state.questionsByTest[testId].map((q) =>
          q.id === updated.id ? updated : q
        );
      })

      // update option
      .addCase(updateJlptOptionThunk.fulfilled, (state, action) => {
        const { questionId, option } = action.payload;

        for (let testId in state.questionsByTest) {
          const list = state.questionsByTest[testId] || [];
          const qIndex = list.findIndex(
            (q) => String(q.id) === String(questionId)
          );
          if (qIndex === -1) continue;

          const opts = list[qIndex].options || [];
          list[qIndex].options = opts.map((op) =>
            String(op.id) === String(option.id) ? option : op
          );
        }
      })

      .addCase(deleteJlptOptionThunk.fulfilled, (state, action) => {
        const { questionId, optionId } = action.payload;

        for (const testId in state.questionsByTest) {
          const list = state.questionsByTest[testId] || [];
          const qIndex = list.findIndex(
            (q) => String(q.id) === String(questionId)
          );
          if (qIndex === -1) continue;

          const opts = list[qIndex].options || [];
          list[qIndex].options = opts.filter(
            (op) => String(op.id) !== String(optionId)
          );
        }
      })

      // delete question
      .addCase(deleteJlptQuestionThunk.fulfilled, (state, action) => {
        const { testId, questionId } = action.payload;

        if (!state.questionsByTest[testId]) return;

        state.questionsByTest[testId] = state.questionsByTest[testId].filter(
          (q) => q.id !== questionId
        );
      })

      // upload audio
      .addCase(uploadJlptTestAudioThunk.pending, (state) => {
        state.uploadingAudio = true;
        state.error = null;
      })
      .addCase(uploadJlptTestAudioThunk.fulfilled, (state, action) => {
        state.uploadingAudio = false;
        const { testId, filePath, url } = action.payload;
        state.audioByTest[testId] = { filePath, url };
      })
      .addCase(uploadJlptTestAudioThunk.rejected, (state, action) => {
        state.uploadingAudio = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export default jlptModeratorSlice.reducer;
