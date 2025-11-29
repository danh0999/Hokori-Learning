// src/redux/features/flashcardSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios";

const unwrapData = (res) => {
  if (!res) return null;
  if (res.data && typeof res.data === "object") {
    if ("data" in res.data) return res.data.data;
    return res.data;
  }
  return res.data ?? res;
};

const getError = (err) =>
  err?.response?.data?.message ||
  err?.response?.data ||
  err.message ||
  "Something went wrong";

// 1) Lấy set gắn với 1 sectionContentId (COURSE_VOCAB)
export const fetchSetBySectionContent = createAsyncThunk(
  "flashcard/fetchSetBySectionContent",
  async (sectionContentId, { rejectWithValue }) => {
    try {
      const res = await api.get(
        `flashcards/sets/by-section-content/${sectionContentId}`
      );
      const data = unwrapData(res);

      // Nếu BE trả kiểu {status: "error", message: "...not found..."} thì coi như chưa có set
      if (
        data &&
        typeof data === "object" &&
        data.status === "error" &&
        typeof data.message === "string" &&
        data.message.includes("FlashcardSet not found")
      ) {
        return null;
      }

      return data;
    } catch (err) {
      const msg = getError(err);
      if (
        err.response?.status === 404 ||
        (typeof msg === "string" && msg.includes("FlashcardSet not found"))
      ) {
        return null; // chưa có set
      }
      return rejectWithValue(msg);
    }
  }
);

// 2) Teacher tạo set COURSE_VOCAB mới cho 1 sectionContent
export const createCourseVocabSet = createAsyncThunk(
  "flashcard/createCourseVocabSet",
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

      const res = await api.post("flashcards/sets/course-vocab", body);
      return unwrapData(res);
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

// 3) Lấy toàn bộ card của 1 set
export const fetchCardsBySetId = createAsyncThunk(
  "flashcard/fetchCardsBySetId",
  async (setId, { rejectWithValue }) => {
    try {
      const res = await api.get(`flashcards/sets/${setId}/cards`);
      return unwrapData(res) || [];
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

// 4) Thêm 1 card vào set
export const addFlashcardToSet = createAsyncThunk(
  "flashcard/addFlashcardToSet",
  async ({ setId, card }, { rejectWithValue }) => {
    try {
      const res = await api.post(`flashcards/sets/${setId}/cards`, card);
      return unwrapData(res);
    } catch (err) {
      return rejectWithValue(getError(err));
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
      return unwrapData(res) || [];
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);
// update 1 card
export const updateFlashcardCard = createAsyncThunk(
  "flashcard/updateFlashcardCard",
  async ({ setId, cardId, card }, { rejectWithValue }) => {
    try {
      const res = await api.put(
        `flashcards/sets/${setId}/cards/${cardId}`,
        card
      );
      return unwrapData(res);
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

// delete 1 card
export const deleteFlashcardCard = createAsyncThunk(
  "flashcard/deleteFlashcardCard",
  async ({ setId, cardId }, { rejectWithValue }) => {
    try {
      await api.delete(`flashcards/sets/${setId}/cards/${cardId}`);
      return { cardId };
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

export const deleteFlashcardSet = createAsyncThunk(
  "flashcards/deleteSet",
  async (setId, { rejectWithValue }) => {
    try {
      await api.delete(`flashcards/sets/${setId}`); // BE: DELETE /api/flashcards/sets/{setId}
      return setId;
    } catch (err) {
      // tuỳ bạn đang handle error thế nào trong slice
      const message =
        err.response?.data?.message ||
        err.message ||
        "Xóa flashcard set thất bại";
      return rejectWithValue(message);
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

      .addCase(createCourseVocabSet.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createCourseVocabSet.fulfilled, (state, action) => {
        state.saving = false;
        state.currentSet = action.payload || null;
      })
      .addCase(createCourseVocabSet.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || action.error.message;
      })

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

      .addCase(addFlashcardToSet.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(addFlashcardToSet.fulfilled, (state, action) => {
        state.saving = false;
        if (action.payload) {
          state.cards.push(action.payload);
        }
      })
      .addCase(addFlashcardToSet.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || action.error.message;
      })

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
      })
      .addCase(updateFlashcardCard.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateFlashcardCard.fulfilled, (state, action) => {
        state.saving = false;
        if (action.payload) {
          const index = state.cards.findIndex(
            (card) => card.id === action.payload.id
          );
          if (index !== -1) {
            state.cards[index] = action.payload;
          }
        }
      })
      .addCase(updateFlashcardCard.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(deleteFlashcardCard.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(deleteFlashcardCard.fulfilled, (state, action) => {
        state.saving = false;
        if (action.payload) {
          state.cards = state.cards.filter(
            (card) => card.id !== action.payload.cardId
          );
        }
      })
      .addCase(deleteFlashcardCard.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(deleteFlashcardSet.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(deleteFlashcardSet.fulfilled, (state, action) => {
        state.saving = false;

        // nếu set hiện tại chính là set vừa xóa → clear khỏi store
        if (state.currentSet && state.currentSet.id === action.payload) {
          state.currentSet = null;
          state.cards = [];
        }
      })
      .addCase(deleteFlashcardSet.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Xóa flashcard set thất bại";
      });
  },
});

export const { resetFlashcardState } = flashcardSlice.actions;
export default flashcardSlice.reducer;
