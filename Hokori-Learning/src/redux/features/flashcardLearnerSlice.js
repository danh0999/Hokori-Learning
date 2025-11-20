// ======================================================
// FLASHCARD LEARNER SLICE — VERSION 3.0 (CỰC CHUẨN)
// ======================================================
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios";

// Color mapping theo level
const levelColorMap = {
  N5: "xanh",
  N4: "xanhLa",
  N3: "tim",
  N2: "cam",
  N1: "do",
};

// Format time UI
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

// Decorate set cho UI
const decorateSet = (set, totalCards = 0) => ({
  ...set,
  totalCards,
  colorClass: levelColorMap[set.level] || "xanh",
  lastReviewText: formatTime(set.updatedAt || set.createdAt),
  progressPercent: set.progressPercent || 0,
});

// ======================================================
// 1) FETCH ALL PERSONAL SETS
// ======================================================
export const fetchPersonalSetsWithCounts = createAsyncThunk(
  "flashcards/fetchPersonalSetsWithCounts",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/flashcards/sets/me");

      const sets = Array.isArray(res.data) ? res.data : [];

      // Count cards cho từng set
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
    } catch {
      return rejectWithValue("ERROR_FETCH_SETS");
    }
  }
);

// ======================================================
// 2) FETCH CARDS BY SET
// ======================================================
export const fetchCardsBySet = createAsyncThunk(
  "flashcards/fetchCardsBySet",
  async (setId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/flashcards/sets/${setId}/cards`);
      return {
        setId,
        cards: Array.isArray(res.data) ? res.data : [],
      };
    } catch {
      return rejectWithValue("ERROR_FETCH_CARDS");
    }
  }
);

// ======================================================
// 3) CREATE PERSONAL SET (CHUẨN REST)
// ======================================================
// --> FE chỉ gửi: { title, description, level }
export const createPersonalSet = createAsyncThunk(
  "flashcards/createPersonalSet",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post("/flashcards/sets/personal", payload);

      return decorateSet(res.data, 0);
    } catch {
      return rejectWithValue("ERROR_CREATE_SET");
    }
  }
);

// ======================================================
// 4) ADD MULTIPLE CARDS TO SET
// ======================================================
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
          reading: c.reading || "",
          exampleSentence: c.example || "",
          orderIndex: i,
        };

        const res = await api.post(`/flashcards/sets/${setId}/cards`, payload);
        created.push(res.data);
      }

      return { setId, created };
    } catch {
      return rejectWithValue("ERROR_ADD_CARDS");
    }
  }
);

// ======================================================
// 5) UPDATE FLASHCARD PROGRESS (again | medium | easy)
// ======================================================
export const updateFlashcardProgress = createAsyncThunk(
  "flashcards/updateFlashcardProgress",
  async ({ cardId, status }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/flashcards/progress/${cardId}`, { status });
      return res.data;
    } catch {
      return rejectWithValue("ERROR_UPDATE_PROGRESS");
    }
  }
);

// ======================================================
// 6) DELETE SET
// ======================================================
export const deleteSet = createAsyncThunk(
  "flashcards/deleteSet",
  async (setId, { rejectWithValue }) => {
    try {
      await api.delete(`/flashcards/sets/${setId}`);
      return setId;
    } catch {
      return rejectWithValue("ERROR_DELETE_SET");
    }
  }
);

// ======================================================
// 7) DELETE CARD
// ======================================================
export const deleteCardInSet = createAsyncThunk(
  "flashcards/deleteCardInSet",
  async ({ setId, cardId }, { rejectWithValue }) => {
    try {
      await api.delete(`/flashcards/sets/${setId}/cards/${cardId}`);
      return { setId, cardId };
    } catch {
      return rejectWithValue("ERROR_DELETE_CARD");
    }
  }
);

// ======================================================
// REDUX SLICE
// ======================================================
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
  },

  reducers: {
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
      // FETCH SETS
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

      // FETCH CARDS
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

      // CREATE SET
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

      // ADD CARDS
      .addCase(addCardsBatchToSet.pending, (state) => {
        state.saving = true;
      })
      .addCase(addCardsBatchToSet.fulfilled, (state, action) => {
        state.saving = false;

        const { setId, created } = action.payload;
        if (!state.cardsBySet[setId]) state.cardsBySet[setId] = [];

        state.cardsBySet[setId] = [...state.cardsBySet[setId], ...created];

        const deck = state.sets.find((d) => d.id === setId);
        if (deck) deck.totalCards += created.length;
      })
      .addCase(addCardsBatchToSet.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      // UPDATE PROGRESS
      .addCase(updateFlashcardProgress.fulfilled, (state, action) => {
        const p = action.payload;
        if (p && p.flashcardId) {
          state.progressByCard[p.flashcardId] = p.status;
        }
      })

      // DELETE SET
      .addCase(deleteSet.fulfilled, (state, action) => {
        const id = action.payload;
        state.sets = state.sets.filter((s) => s.id !== id);
        delete state.cardsBySet[id];
      })

      // DELETE CARD
      .addCase(deleteCardInSet.fulfilled, (state, action) => {
        const { setId, cardId } = action.payload;
        if (state.cardsBySet[setId]) {
          state.cardsBySet[setId] = state.cardsBySet[setId].filter(
            (c) => c.id !== cardId
          );
        }
      });
  },
});

export const { setDeckProgress } = flashcardSlice.actions;
export default flashcardSlice.reducer;
