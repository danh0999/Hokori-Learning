// ================================
// Hokori Kaiwa — AI Speech Slice (FINAL & CORRECT VERSION)
// Convert WebM (Opus 48kHz) -> WAV (PCM16 16kHz) -> Base64 -> Backend JSON
// ================================

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../configs/axios.js";
import { convertWebmToWav } from "../../utils/convertWebmToWav.js";

// ================================
// Helper — Convert Blob -> Base64
// ================================
const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64 = reader.result.split(",")[1]; // remove header
      resolve(base64);
    };
    reader.onerror = reject;
  });

// ================================
// Thunk: gửi audio -> Backend
// ================================
export const analyzeSpeech = createAsyncThunk(
  "aiSpeech/analyzeSpeech",
  async (audioBlob, { rejectWithValue }) => {
    try {
      if (!audioBlob) {
        return rejectWithValue("Không có dữ liệu âm thanh để phân tích.");
      }

      console.log("🎤 Original WebM:", audioBlob.type, audioBlob.size);

      // 1️⃣ Convert WebM -> WAV (PCM16 16kHz)
      const wavBlob = await convertWebmToWav(audioBlob);
      console.log("🎧 Converted WAV:", wavBlob.type, wavBlob.size);

      // 2️⃣ Convert WAV -> Base64
      const audioBase64 = await blobToBase64(wavBlob);

      // 3️⃣ Payload JSON theo Swagger backend
      const payload = {
        audioData: audioBase64,
        language: "ja-JP",
        audioFormat: "wav",          // ✔ Backend mặc định WAV
        validAudioFormat: true       // ✔ Swagger field
      };

      console.log("📡 Sending to backend:", {
        url: "ai/speech-to-text",
        audioFormat: payload.audioFormat,
        base64_length: audioBase64.length,
      });

      const response = await api.post("ai/speech-to-text", payload, {
        headers: { "Content-Type": "application/json" },
      });

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
// Slice
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
    resetAiSpeech: (state) => {
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
        state.error = action.payload || "Có lỗi xảy ra khi phân tích giọng nói.";
      });
  },
});

export const { resetAiSpeech } = aiSpeechSlice.actions;
export default aiSpeechSlice.reducer;
