import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios";
import { convertBlobToBase64 } from "../../utils/convertBlobToBase64";

export const analyzeSpeech = createAsyncThunk(
  "aiSpeech/analyzeSpeech",
  async ({ audioBlob, targetText, level }, { rejectWithValue }) => {
    try {
      if (!audioBlob) return rejectWithValue("Không có dữ liệu âm thanh.");

      const base64Audio = await convertBlobToBase64(audioBlob);

      const payload = {
        targetText,
        audioData: base64Audio,
        level,
        language: "ja-JP",
        voice: "female",         // ✔ REQUIRED (theo Swagger)
        speed: "normal",          // ✔ REQUIRED
        audioFormat: "wav",
        validAudioFormat: true,
        validSpeed: true,
        validLevel: true,
      };

      const res = await api.post("ai/kaiwa-practice", payload);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Không thể phân tích giọng nói"
      );
    }
  }
);

const aiSpeechSlice = createSlice({
  name: "aiSpeech",
  initialState: {
    loading: false,
    error: null,
    transcript: "",
    overallScore: null,
    pronunciationScore: null,
    accuracyScore: null,
    feedback: null,
    userTranscript: "",
    targetText: "",
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(analyzeSpeech.pending, (state) => {
        state.loading = true;
      })
      .addCase(analyzeSpeech.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload;
        state.transcript = data.userTranscript;
        state.targetText = data.targetText;
        state.overallScore = data.overallScore;
        state.pronunciationScore = data.pronunciationScore;
        state.accuracyScore = data.accuracyScore;
        state.feedback = data.feedback;
      })
      .addCase(analyzeSpeech.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default aiSpeechSlice.reducer;
