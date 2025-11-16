// ================================
// Hokori Kaiwa — AI Speech Slice (Final Stable Version)
// Gửi audio base64 -> backend JSON (Google Cloud Speech-to-Text)
// ================================

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../configs/axios.js";

// ================================
// Helper — Chuyển Blob sang base64 (WebM -> base64 string)
// ================================
const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const result = reader.result || "";
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

      const audioBase64 = await blobToBase64(audioBlob);

      const payload = {
        audioData: audioBase64,
        language: "ja-JP",
        audioFormat: "ogg",
        validAudioFormat: true,
      };

      // Debug log theo baseURL thực tế của axios
      console.log(" Gửi request Kaiwa:", {
        baseURL: api.defaults.baseURL,
        url: "ai/speech-to-text",
        size: audioBlob.size,
        type: audioBlob.type,
        audioFormat: payload.audioFormat,
      });

      // ❗ Chỉ dùng relative path, không dùng thêm BASE_URL
      const response = await api.post("ai/speech-to-text", payload, {
        headers: { "Content-Type": "application/json" },
      });

      return response.data;
    } catch (error) {
      console.error(" analyzeSpeech error:", error);
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
