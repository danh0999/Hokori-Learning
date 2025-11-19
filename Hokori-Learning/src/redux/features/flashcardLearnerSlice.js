// src/redux/features/flashcardLearnerSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios";

// ========================================
// Helper
// ========================================
const levelColorMap = {
  N5: "xanh",
  N4: "xanhLa",
  N3: "tim",
  N2: "cam",
  N1: "do",
};

const formatTime = (iso) => {
  if (!iso) return "Chưa có";
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    });
  } catch {
    return "Chưa có";
  }
};

const decorateSet = (set, totalCards = 0) => ({
  ...set,
  totalCards,
  lastReviewText: formatTime(set.updatedAt || set.createdAt),
  colorClass: levelColorMap[set.level] || "xanh",
  progressPercent: 0, // FE sẽ update sau khi học
});

// ========================================
// THUNKS — Learner Flashcards
// ========================================

// 1) Lấy tất cả set PERSONAL của user + đếm số thẻ
export const fetchPersonalSetsWithCounts = createAsyncThunk(
  "flashcards/fetchPersonalSetsWithCounts",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/flashcards/sets/me", {
        params: { type: "PERSONAL" },
      });

      const sets = Array.isArray(res.data) ? res.data : [];

      // Lấy số thẻ cho từng set
      const counts = await Promise.all(
        sets.map((s) =>
          api
            .get(`/flashcards/sets/${s.id}/cards`)
            .then((r) => ({
              id: s.id,
              count: Array.isArray(r.data) ? r.data.length : 0,
            }))
            .catch(() => ({ id: s.id, count: 0 }))
        )
      );

      const map = {};
      counts.forEach((c) => (map[c.id] = c.count));

      return sets.map((set) => decorateSet(set, map[set.id] || 0));
    } catch (err) {
      return rejectWithValue(err.response?.data || "ERROR_FETCH_SETS");
    }
  }
);

// 2) Lấy danh sách thẻ của 1 set
export const fetchCardsBySet = createAsyncThunk(
  "flashcards/fetchCardsBySet",
  async (setId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/flashcards/sets/${setId}/cards`);
      return { setId, cards: Array.isArray(res.data) ? res.data : [] };
    } catch (err) {
      return rejectWithValue(err.response?.data || "ERROR_FETCH_CARDS");
    }
  }
);

// 3) Tạo 1 PERSONAL set
export const createPersonalSet = createAsyncThunk(
  "flashcards/createPersonalSet",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post("/flashcards/sets/personal", payload);
      return decorateSet(res.data, 0);
    } catch (err) {
      return rejectWithValue(err.response?.data || "ERROR_CREATE_SET");
    }
  }
);

// 4) Thêm nhiều thẻ 1 lúc vào set
export const addCardsBatchToSet = createAsyncThunk(
  "flashcards/addCardsBatchToSet",
  async ({ setId, cards }, { rejectWithValue }) => {
    try {
      const created = [];

      for (let i = 0; i < cards.length; i++) {
        const c = cards[i];
        const payload = {
          frontText: c.term,
          backText: c.meaning,
          reading: "",
          exampleSentence: c.example || "",
          orderIndex: i,
        };

        const res = await api.post(`/flashcards/sets/${setId}/cards`, payload);
        created.push(res.data);
      }

      return { setId, created };
    } catch (err) {
      return rejectWithValue(err.response?.data || "ERROR_ADD_CARDS");
    }
  }
);

// 5) Cập nhật trạng thái học 1 flashcard (NEW / LEARNING / MASTERED)
export const updateFlashcardProgress = createAsyncThunk(
  "flashcards/updateFlashcardProgress",
  async ({ cardId, status }, { rejectWithValue }) => {
    try {
      // POST /api/flashcards/progress/{flashcardId}
      const res = await api.post(`/flashcards/progress/${cardId}`, { status });
      return res.data; // progress object
    } catch (err) {
      return rejectWithValue(err.response?.data || "ERROR_UPDATE_PROGRESS");
    }
  }
);

// ========================================
// SLICE
// ========================================
const flashcardSlice = createSlice({
  name: "flashcards",
  initialState: {
    sets: [], // danh sách PERSONAL sets
    cardsBySet: {}, // cardsBySet[setId] = array cards
    loadingSets: false,
    loadingCards: {}, // loadingCards[setId] = boolean
    saving: false,
    error: null,
    progressByCard: {}, // progressByCard[cardId] = status ("NEW"/"LEARNING"/"MASTERED")
  },

  reducers: {
    removeDeckLocally(state, action) {
      const id = action.payload;
      state.sets = state.sets.filter((s) => s.id !== id);
      delete state.cardsBySet[id];
    },

    // FE cập nhật % tiến độ cho 1 deck sau khi học xong
    setDeckProgress(state, action) {
      const { setId, percent } = action.payload;
      const deck = state.sets.find((d) => d.id === setId);
      if (deck) {
        deck.progressPercent = percent;
        deck.lastReviewText = "Vừa học";
      }
    },
  },

  extraReducers: (builder) => {
    builder
      // ===== Fetch sets =====
      .addCase(fetchPersonalSetsWithCounts.pending, (state) => {
        state.loadingSets = true;
      })
      .addCase(fetchPersonalSetsWithCounts.fulfilled, (state, action) => {
        state.loadingSets = false;
        state.sets = action.payload;
      })
      .addCase(fetchPersonalSetsWithCounts.rejected, (state, action) => {
        state.loadingSets = false;
        state.error = action.payload;
      })

      // ===== Fetch cards of a set =====
      .addCase(fetchCardsBySet.pending, (state, action) => {
        const setId = action.meta.arg;
        state.loadingCards[setId] = true;
      })
      .addCase(fetchCardsBySet.fulfilled, (state, action) => {
        const { setId, cards } = action.payload;
        state.loadingCards[setId] = false;
        state.cardsBySet[setId] = cards;
      })
      .addCase(fetchCardsBySet.rejected, (state, action) => {
        const setId = action.meta.arg;
        state.loadingCards[setId] = false;
        state.error = action.payload;
      })

      // ===== Create set =====
      .addCase(createPersonalSet.pending, (state) => {
        state.saving = true;
      })
      .addCase(createPersonalSet.fulfilled, (state, action) => {
        state.saving = false;
        state.sets.push(action.payload);
      })
      .addCase(createPersonalSet.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      // ===== Add cards batch =====
      .addCase(addCardsBatchToSet.pending, (state) => {
        state.saving = true;
      })
      .addCase(addCardsBatchToSet.fulfilled, (state, action) => {
        state.saving = false;
        const { setId, created } = action.payload;

        if (!state.cardsBySet[setId]) state.cardsBySet[setId] = [];
        state.cardsBySet[setId] = [...state.cardsBySet[setId], ...created];

        const deck = state.sets.find((s) => s.id === setId);
        if (deck) deck.totalCards += created.length;
      })
      .addCase(addCardsBatchToSet.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      // ===== Update progress of 1 card =====
      .addCase(updateFlashcardProgress.fulfilled, (state, action) => {
        const progress = action.payload;
        if (progress && progress.flashcardId) {
          state.progressByCard[progress.flashcardId] = progress.status;
        }
      });
  },
});

export const { removeDeckLocally, setDeckProgress } = flashcardSlice.actions;


export default flashcardSlice.reducer;
