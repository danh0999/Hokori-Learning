// src/redux/features/flashcardSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios";

const unwrapData = (res) =>
  res.data && res.data.data !== undefined ? res.data.data : res.data;
// 1) (giữ) Lấy set gắn với 1 sectionContentId (COURSE_VOCAB) – dùng cho learner hoặc chỗ khác
export const fetchSetBySectionContent = createAsyncThunk(
  "flashcard/fetchSetBySectionContent",
  async (sectionContentId, { rejectWithValue }) => {
    try {
      const res = await api.get(
        `flashcards/sets/by-section-content/${sectionContentId}`
      );
      return res.data; // FlashcardSet | null
    } catch (err) {
      if (err.response && err.response.status === 404) {
        return null;
      }
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 2) ✅ Teacher tạo set COURSE_VOCAB mới cho 1 lesson
//    BE mới bảo: bấm nút là tạo set trước -> cần lessonId
export const createCourseVocabSet = createAsyncThunk(
  "flashcards/createCourseVocabSet",
  async (
    { title, description, level, sectionContentId },
    { rejectWithValue }
  ) => {
    try {
      if (!sectionContentId) {
        throw new Error(
          "Missing sectionContentId when creating COURSE_VOCAB set"
        );
      }

      const body = {
        title: title || "Từ vựng",
        description: description || "",
        level: level || null,
        sectionContentId: Number(sectionContentId),
      };

      console.log("[createCourseVocabSet] body gửi lên:", body);

      const res = await api.post("flashcards/sets/course-vocab", body);
      const data = unwrapData(res);

      console.log("[createCourseVocabSet] response:", data);
      return data;
    } catch (err) {
      console.error("[createCourseVocabSet] error:", err?.response || err);
      const msg =
        err?.response?.data?.message ||
        err.message ||
        "Failed to create vocab flashcard set";
      return rejectWithValue(msg);
    }
  }
);

// 3) Lấy toàn bộ card của 1 set
export const fetchCardsBySetId = createAsyncThunk(
  "flashcard/fetchCardsBySetId",
  async (setId, { rejectWithValue }) => {
    try {
      const res = await api.get(`flashcards/sets/${setId}/cards`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 4) Thêm 1 card vào set
export const addFlashcardToSet = createAsyncThunk(
  "flashcard/addFlashcardToSet",
  async ({ setId, card }, { rejectWithValue }) => {
    try {
      const res = await api.post(`flashcards/sets/${setId}/cards`, card);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 5) (tuỳ chọn) Lấy tất cả set của current user
export const fetchMyFlashcardSets = createAsyncThunk(
  "flashcard/fetchMyFlashcardSets",
  async ({ type }, { rejectWithValue }) => {
    try {
      const res = await api.get("flashcards/sets/me", {
        params: type ? { type } : {},
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const flashcardSlice = createSlice({
  name: "flashcardTeacher",
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
      // get set by sectionContent (giữ nguyên)
      .addCase(fetchSetBySectionContent.pending, (state) => {
        state.loadingSet = true;
        state.error = null;
      })
      .addCase(fetchSetBySectionContent.fulfilled, (state, action) => {
        state.loadingSet = false;
        state.currentSet = action.payload;
      })
      .addCase(fetchSetBySectionContent.rejected, (state, action) => {
        state.loadingSet = false;
        state.error = action.payload || action.error.message;
      })

      // ✅ create course vocab set
      .addCase(createCourseVocabSet.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createCourseVocabSet.fulfilled, (state, action) => {
        state.saving = false;
        state.currentSet = action.payload; // set vừa tạo
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
