// src/redux/features/flashcardSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios";

// 1) Lấy set gắn với 1 sectionContentId (COURSE_VOCAB)
export const fetchSetBySectionContent = createAsyncThunk(
  "flashcard/fetchSetBySectionContent",
  async (sectionContentId, { rejectWithValue }) => {
    try {
      const res = await api.get(
        `/api/flashcards/sets/by-section-content/${sectionContentId}`
      );
      return res.data; // FlashcardSet | null
    } catch (err) {
      // nếu BE trả 404 khi chưa có set
      if (err.response && err.response.status === 404) {
        return null;
      }
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 2) Teacher tạo set COURSE_VOCAB mới gắn với sectionContentId
export const createCourseVocabSet = createAsyncThunk(
  "flashcard/createCourseVocabSet",
  async (
    { title, description, level, sectionContentId },
    { rejectWithValue }
  ) => {
    try {
      const body = { title, description, level, sectionContentId };
      const res = await api.post("/api/flashcards/sets/course-vocab", body);
      return res.data; // FlashcardSet
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 3) Lấy toàn bộ card của 1 set
export const fetchCardsBySetId = createAsyncThunk(
  "flashcard/fetchCardsBySetId",
  async (setId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/flashcards/sets/${setId}/cards`);
      return res.data; // array card
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 4) Thêm 1 card vào set
export const addFlashcardToSet = createAsyncThunk(
  "flashcard/addFlashcardToSet",
  async ({ setId, card }, { rejectWithValue }) => {
    // card = { frontText, backText, reading, exampleSentence, orderIndex }
    try {
      const res = await api.post(`/api/flashcards/sets/${setId}/cards`, card);
      return res.data; // card mới
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// (option) Lấy tất cả set của current user (nếu bạn cần list)
export const fetchMyFlashcardSets = createAsyncThunk(
  "flashcard/fetchMyFlashcardSets",
  async ({ type }, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/flashcards/sets/me", {
        params: type ? { type } : {},
      });
      return res.data; // array set
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const flashcardSlice = createSlice({
  name: "flashcard",
  initialState: {
    currentSet: null,
    cards: [],
    mySets: [],
    loadingSet: false,
    loadingCards: false,
    loadingMySets: false,
    saving: false,
    error: null,
  },
  reducers: {
    resetFlashcardState: (state) => {
      state.currentSet = null;
      state.cards = [];
      state.mySets = [];
      state.loadingSet = false;
      state.loadingCards = false;
      state.loadingMySets = false;
      state.saving = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // get set by sectionContent
      .addCase(fetchSetBySectionContent.pending, (state) => {
        state.loadingSet = true;
        state.error = null;
      })
      .addCase(fetchSetBySectionContent.fulfilled, (state, action) => {
        state.loadingSet = false;
        state.currentSet = action.payload; // có thể là null
      })
      .addCase(fetchSetBySectionContent.rejected, (state, action) => {
        state.loadingSet = false;
        state.error = action.payload || action.error.message;
      })

      // create course vocab set
      .addCase(createCourseVocabSet.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createCourseVocabSet.fulfilled, (state, action) => {
        state.saving = false;
        state.currentSet = action.payload;
      })
      .addCase(createCourseVocabSet.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || action.error.message;
      })

      // fetch cards
      .addCase(fetchCardsBySetId.pending, (state) => {
        state.loadingCards = true;
        state.error = null;
      })
      .addCase(fetchCardsBySetId.fulfilled, (state, action) => {
        state.loadingCards = false;
        state.cards = action.payload || [];
      })
      .addCase(fetchCardsBySetId.rejected, (state, action) => {
        state.loadingCards = false;
        state.error = action.payload || action.error.message;
      })

      // add card
      .addCase(addFlashcardToSet.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(addFlashcardToSet.fulfilled, (state, action) => {
        state.saving = false;
        state.cards.push(action.payload);
      })
      .addCase(addFlashcardToSet.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || action.error.message;
      })

      // my sets
      .addCase(fetchMyFlashcardSets.pending, (state) => {
        state.loadingMySets = true;
        state.error = null;
      })
      .addCase(fetchMyFlashcardSets.fulfilled, (state, action) => {
        state.loadingMySets = false;
        state.mySets = action.payload || [];
      })
      .addCase(fetchMyFlashcardSets.rejected, (state, action) => {
        state.loadingMySets = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { resetFlashcardState } = flashcardSlice.actions;
export default flashcardSlice.reducer;
