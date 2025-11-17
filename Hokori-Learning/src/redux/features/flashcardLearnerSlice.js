import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios";

// ===== Helpers =====
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
  progressPercent: 0, // chưa có SRS backend
});

// ===== Thunks =====

// 1) Lấy danh sách PERSONAL set + đếm số thẻ từng set
export const fetchPersonalSetsWithCounts = createAsyncThunk(
  "flashcards/fetchPersonalSetsWithCounts",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/flashcards/sets/me", {
        params: { type: "PERSONAL" },
      });
      const sets = Array.isArray(res.data) ? res.data : [];

      // lấy count card cho từng set
      const cardCountList = await Promise.all(
        sets.map((s) =>
          api
            .get(`/flashcards/sets/${s.id}/cards`)
            .then((r) => ({
              setId: s.id,
              count: Array.isArray(r.data) ? r.data.length : 0,
            }))
            .catch(() => ({ setId: s.id, count: 0 }))
        )
      );

      const countMap = {};
      cardCountList.forEach((c) => {
        countMap[c.setId] = c.count;
      });

      const mapped = sets.map((s) => decorateSet(s, countMap[s.id]));
      return mapped;
    } catch (err) {
      console.error("fetchPersonalSetsWithCounts error:", err);
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
      console.error("fetchCardsBySet error:", err);
      return rejectWithValue(err.response?.data || "ERROR_FETCH_CARDS");
    }
  }
);

// 3) Tạo PERSONAL set
export const createPersonalSet = createAsyncThunk(
  "flashcards/createPersonalSet",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post("/flashcards/sets/personal", payload);
      const created = res.data;
      return decorateSet(created, 0);
    } catch (err) {
      console.error("createPersonalSet error:", err);
      return rejectWithValue(err.response?.data || "ERROR_CREATE_SET");
    }
  }
);

// 4) Thêm nhiều thẻ vào 1 set (AddWordModal)
export const addCardsBatchToSet = createAsyncThunk(
  "flashcards/addCardsBatchToSet",
  async ({ setId, cards }, { rejectWithValue }) => {
    try {
      const createdCards = [];
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
        createdCards.push(res.data);
      }
      return { setId, createdCards };
    } catch (err) {
      console.error("addCardsBatchToSet error:", err);
      return rejectWithValue(err.response?.data || "ERROR_ADD_CARDS");
    }
  }
);

// ===== Slice =====
const flashcardSlice = createSlice({
  name: "flashcards",
  initialState: {
    sets: [], // danh sách set đã decorate
    cardsBySet: {}, // { [setId]: Card[] }
    loadingSets: false,
    loadingCards: {}, // { [setId]: boolean }
    error: null,
  },
  reducers: {
    // Xoá local (chưa có API BE)
    removeDeckLocally(state, action) {
      const id = action.payload;
      state.sets = state.sets.filter((s) => s.id !== id);
      delete state.cardsBySet[id];
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchPersonalSetsWithCounts
      .addCase(fetchPersonalSetsWithCounts.pending, (state) => {
        state.loadingSets = true;
        state.error = null;
      })
      .addCase(fetchPersonalSetsWithCounts.fulfilled, (state, action) => {
        state.loadingSets = false;
        state.sets = action.payload || [];
      })
      .addCase(fetchPersonalSetsWithCounts.rejected, (state, action) => {
        state.loadingSets = false;
        state.error = action.payload || "Fetch sets failed";
      })

      // fetchCardsBySet
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
        state.error = action.payload || "Fetch cards failed";
      })

      // createPersonalSet
      .addCase(createPersonalSet.fulfilled, (state, action) => {
        if (!action.payload) return;
        state.sets.push(action.payload);
      })

      // addCardsBatchToSet
      .addCase(addCardsBatchToSet.fulfilled, (state, action) => {
        const { setId, createdCards } = action.payload || {};
        if (!setId || !createdCards) return;

        if (!state.cardsBySet[setId]) state.cardsBySet[setId] = [];
        state.cardsBySet[setId] = [
          ...state.cardsBySet[setId],
          ...createdCards,
        ];

        const deck = state.sets.find((s) => s.id === setId);
        if (deck) {
          deck.totalCards = (deck.totalCards || 0) + createdCards.length;
          deck.lastReviewText = "Vừa tạo";
        }
      });
  },
});

export const { removeDeckLocally } = flashcardSlice.actions;
export default flashcardSlice.reducer;
