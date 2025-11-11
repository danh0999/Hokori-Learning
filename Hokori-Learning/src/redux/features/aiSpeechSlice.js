// ================================
// Hokori Kaiwa — AI Speech Slice (Final Stable Version)
// Gửi audio base64 -> backend JSON (Google Cloud Speech-to-Text)
// ================================

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../configs/axios.js";

// ✅ Lấy base URL từ file .env (ví dụ: VITE_API_BASE_URL=https://hokoribe-production.up.railway.app/api)
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// ================================
// Helper — Chuyển Blob sang base64 (WebM -> base64 string)
// ================================
const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const result = reader.result || "";
      // cắt bỏ tiền tố "data:audio/webm;base64,"
      const base64 = result.toString().split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });

// ================================
// Thunk: Gửi audio -> AI API
// ================================
export const analyzeSpeech = createAsyncThunk(
  "aiSpeech/analyzeSpeech",
  async (audioBlob, { rejectWithValue }) => {
    try {
      if (!audioBlob) {
        return rejectWithValue("Không có dữ liệu âm thanh để phân tích.");
      }

      // 1️⃣ Chuyển audio blob sang base64
      const audioBase64 = await blobToBase64(audioBlob);

      // 2️⃣ Tạo payload gửi backend
      const payload = {
        audioData: audioBase64,
        language: "ja-JP", // ngôn ngữ tiếng Nhật
        audioFormat: "ogg", // ⚠️ WebM và OGG đều dùng codec Opus → backend chấp nhận
        validAudioFormat: true,
      };

      // 3️⃣ Debug log (chỉ xuất hiện khi chạy dev)
      console.log("📤 Gửi request Kaiwa:", {
        url: `${BASE_URL}/ai/speech-to-text`,
        size: audioBlob.size,
        type: audioBlob.type,
        audioFormat: payload.audioFormat,
      });

      // 4️⃣ Gửi request bằng axios instance (đã gắn token tự động)
      const response = await api.post(
        `${BASE_URL}/ai/speech-to-text`,
        payload,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      return response.data;
    } catch (error) {
      console.error("❌ analyzeSpeech error:", error);
      return rejectWithValue(
        error.response?.data?.message ||
          "Không thể phân tích giọng nói. Vui lòng thử lại."
      );
    }
  }
);

// ================================
// Redux State + Slice
// ================================
const initialState = {
  loading: false,
  error: null,
  transcript: "",
  overallScore: null,
  pronunciation: null,
  intonation: null,
  fluency: null,
};

const aiSpeechSlice = createSlice({
  name: "aiSpeech",
  initialState,
  reducers: {
    resetAiSpeech(state) {
      state.loading = false;
      state.error = null;
      state.transcript = "";
      state.overallScore = null;
      state.pronunciation = null;
      state.intonation = null;
      state.fluency = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(analyzeSpeech.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(analyzeSpeech.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        const {
          transcript,
          overallScore,
          pronunciation,
          intonation,
          fluency,
        } = action.payload || {};

        state.transcript = transcript || "";
        state.overallScore = overallScore ?? null;
        state.pronunciation = pronunciation ?? null;
        state.intonation = intonation ?? null;
        state.fluency = fluency ?? null;
      })
      .addCase(analyzeSpeech.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Có lỗi xảy ra khi phân tích.";
      });
  },
});

export const { resetAiSpeech } = aiSpeechSlice.actions;
export default aiSpeechSlice.reducer;
