import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios";
import { convertBlobToBase64 } from "../../utils/convertBlobToBase64";

export const analyzeSpeech = createAsyncThunk(
  "aiSpeech/analyzeSpeech",
  async ({ audioBlob, targetText, level }, { rejectWithValue }) => {
    try {
      if (!audioBlob) {
        return rejectWithValue("Không có dữ liệu âm thanh.");
      }

      const base64Audio = await convertBlobToBase64(audioBlob);

      const payload = {
        targetText: targetText,
        audioData: base64Audio,
        level: level,
        language: "ja-JP",
        audioFormat: "wav",
        validAudioFormat: true,
        validSpeed: true,
        validLevel: true
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
  reducers: {
    resetAiSpeech(state) {
      state.loading = false;
      state.error = null;
      state.transcript = "";
      state.overallScore = null;
      state.pronunciationScore = null;
      state.accuracyScore = null;
      state.feedback = null;
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

export const { resetAiSpeech } = aiSpeechSlice.actions;
export default aiSpeechSlice.reducer;
