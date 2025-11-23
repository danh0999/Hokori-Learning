// src/redux/features/flashcardLearnerSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios";

/* ========================================
   HELPERS
======================================== */
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
  progressPercent: 0,
});

/* ========================================
   THUNKS — LEARNER FLASHCARDS
======================================== */

/** 1) Lấy toàn bộ PERSONAL sets + đếm số thẻ */
export const fetchPersonalSetsWithCounts = createAsyncThunk(
  "flashcards/fetchPersonalSetsWithCounts",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/flashcards/sets/me", {
        params: { type: "PERSONAL" },
      });

      const sets = Array.isArray(res.data) ? res.data : [];

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

      return sets.map((s) => decorateSet(s, map[s.id] || 0));
    } catch (err) {
      return rejectWithValue(err.response?.data || "ERROR_FETCH_SETS");
    }
  }
);

/** 2) Lấy danh sách cards trong 1 set */
export const fetchCardsBySet = createAsyncThunk(
  "flashcards/fetchCardsBySet",
  async (setId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/flashcards/sets/${setId}/cards`);
      const cards = Array.isArray(res.data) ? res.data : [];
      return { setId, cards };
    } catch (err) {
      return rejectWithValue(err.response?.data || "ERROR_FETCH_CARDS");
    }
  }
);

/** 3) Tạo PERSONAL set */
export const createPersonalSet = createAsyncThunk(
  "flashcards/createPersonalSet",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post(`/flashcards/sets/personal`, payload);
      return decorateSet(res.data, 0);
    } catch (err) {
      return rejectWithValue(err.response?.data || "ERROR_CREATE_SET");
    }
  }
);

/** 4) Thêm nhiều cards */
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

/** 5) Cập nhật progress */
export const updateFlashcardProgress = createAsyncThunk(
  "flashcards/updateFlashcardProgress",
  async ({ cardId, status }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/flashcards/progress/${cardId}`, { status });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "ERROR_UPDATE_PROGRESS");
    }
  }
);

/** 6) Xoá set */
export const deleteSet = createAsyncThunk(
  "flashcards/deleteSet",
  async (setId, { rejectWithValue }) => {
    try {
      await api.delete(`/flashcards/sets/${setId}`);
      return setId;
    } catch (err) {
      return rejectWithValue(err.response?.data || "ERROR_DELETE_SET");
    }
  }
);

/** 7) Xoá card */
export const deleteCardInSet = createAsyncThunk(
  "flashcards/deleteCardInSet",
  async ({ setId, cardId }, { rejectWithValue }) => {
    try {
      await api.delete(`/flashcards/sets/${setId}/cards/${cardId}`);
      return { setId, cardId };
    } catch (err) {
      return rejectWithValue(err.response?.data || "ERROR_DELETE_CARD");
    }
  }
);

/** 8) Update set metadata */
export const updateSet = createAsyncThunk(
  "flashcards/updateSet",
  async ({ setId, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/flashcards/sets/${setId}`, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "ERROR_UPDATE_SET");
    }
  }
);

/** 9) Update card */
export const updateCardInSet = createAsyncThunk(
  "flashcards/updateCardInSet",
  async ({ setId, cardId, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(
        `/flashcards/sets/${setId}/cards/${cardId}`,
        data
      );
      return { setId, card: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data || "ERROR_UPDATE_CARD");
    }
  }
);

/** 10) ⭐ Dashboard Flashcards (API mới) */
export const fetchDashboardFlashcards = createAsyncThunk(
  "flashcards/fetchDashboardFlashcards",
  async (level, { rejectWithValue }) => {
    try {
      const res = await api.get("/flashcards/sets/dashboard/me", {
        params: { level: level || "" },
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "ERROR_DASHBOARD");
    }
  }
);

/* ========================================
   SLICE
======================================== */
const flashcardSlice = createSlice({
  name: "flashcards",
  initialState: {
    sets: [],
    cardsBySet: {},
    loadingSets: false,
    loadingCards: {},
    saving: false,
    error: null,
    progressByCard: {},

    // ⭐ NEW — Dashboard state
    dashboard: {
      totalSets: 0,
      totalCards: 0,
      reviewedToday: 0,
      streakDays: 0,
    },
  },

  reducers: {
    removeDeckLocally(state, action) {
      const id = action.payload;
      state.sets = state.sets.filter((s) => s.id !== id);
      delete state.cardsBySet[id];
    },

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
      /* -------- Fetch Personal Sets -------- */
      .addCase(fetchPersonalSetsWithCounts.pending, (state) => {
        state.loadingSets = true;
        state.error = null;
      })
      .addCase(fetchPersonalSetsWithCounts.fulfilled, (state, action) => {
        state.loadingSets = false;
        state.sets = action.payload;
      })
      .addCase(fetchPersonalSetsWithCounts.rejected, (state, action) => {
        state.loadingSets = false;
        state.error = action.payload;
      })

      /* -------- Fetch Cards In Set -------- */
      .addCase(fetchCardsBySet.pending, (state, action) => {
        const setId = action.meta.arg;
        state.loadingCards[setId] = true;
      })
      .addCase(fetchCardsBySet.fulfilled, (state, action) => {
        const { setId, cards } = action.payload;
        state.loadingCards[setId] = false;
        state.cardsBySet[setId] = cards;

        const deck = state.sets.find((s) => s.id === setId);
        if (deck) {
          deck.cards = cards;
          deck.totalCards = cards.length;
        }
      })
      .addCase(fetchCardsBySet.rejected, (state, action) => {
        const setId = action.meta.arg;
        state.loadingCards[setId] = false;
        state.error = action.payload;
      })

      /* -------- Create Set -------- */
      .addCase(createPersonalSet.fulfilled, (state, action) => {
        state.sets.push(action.payload);
      })

      /* -------- Add Cards Batch -------- */
      .addCase(addCardsBatchToSet.fulfilled, (state, action) => {
        const { setId, created } = action.payload;

        if (!state.cardsBySet[setId]) state.cardsBySet[setId] = [];
        state.cardsBySet[setId].push(...created);

        const deck = state.sets.find((s) => s.id === setId);
        if (deck) {
          deck.totalCards += created.length;
          deck.cards = state.cardsBySet[setId];
        }
      })

      /* -------- Update Card Progress -------- */
      .addCase(updateFlashcardProgress.fulfilled, (state, action) => {
        const progress = action.payload;
        state.progressByCard[progress.flashcardId] = progress.status;
      })

      /* -------- Delete Set -------- */
      .addCase(deleteSet.fulfilled, (state, action) => {
        const id = action.payload;
        state.sets = state.sets.filter((s) => s.id !== id);
        delete state.cardsBySet[id];
      })

      /* -------- Delete Card -------- */
      .addCase(deleteCardInSet.fulfilled, (state, action) => {
        const { setId, cardId } = action.payload;
        if (!state.cardsBySet[setId]) return;

        state.cardsBySet[setId] = state.cardsBySet[setId].filter(
          (c) => c.id !== cardId
        );

        const deck = state.sets.find((s) => s.id === setId);
        if (deck) {
          deck.totalCards = Math.max(0, (deck.totalCards || 0) - 1);
          deck.cards = state.cardsBySet[setId];
        }
      })

      /* -------- Update Set -------- */
      .addCase(updateSet.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.sets.findIndex((s) => s.id === updated.id);
        if (index !== -1) {
          state.sets[index] = decorateSet(
            updated,
            state.sets[index].totalCards
          );
        }
      })

      /* -------- Update Card -------- */
      .addCase(updateCardInSet.fulfilled, (state, action) => {
        const { setId, card } = action.payload;
        if (!state.cardsBySet[setId]) return;

        const idx = state.cardsBySet[setId].findIndex((c) => c.id === card.id);
        if (idx !== -1) {
          state.cardsBySet[setId][idx] = card;
        }

        const deck = state.sets.find((s) => s.id === setId);
        if (deck) {
          deck.cards = state.cardsBySet[setId];
        }
      })

      /* --------  Dashboard Flashcards -------- */
      .addCase(fetchDashboardFlashcards.fulfilled, (state, action) => {
        const d = action.payload || {};

        state.dashboard = {
          totalSets: d.totalSets ?? 0,
          totalCards: d.totalCards ?? 0,
          reviewedToday: d.reviewedToday ?? 0,
          streakDays: d.streakDays ?? 0,
        };
      })
      .addCase(fetchDashboardFlashcards.rejected, (state, action) => {
        // Giữ dashboard mặc định, không làm FE crash
        state.dashboard = {
          totalSets: 0,
          totalCards: 0,
          reviewedToday: 0,
          streakDays: 0,
        };
        state.error = action.payload;
      });
  },
});

export const { removeDeckLocally, setDeckProgress } = flashcardSlice.actions;
export default flashcardSlice.reducer;
