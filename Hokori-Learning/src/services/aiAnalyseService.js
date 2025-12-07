// src/services/aiAnalyseService.js
import api from "../configs/axios";

// Phân tích 1 câu (MAIN API)
export const analyseSentence = async (sentence, level) => {
  const payload = { sentence, level };

  const res = await api.post("/ai/sentence-analysis", payload, {
    headers: { "Content-Type": "application/json" },
  });

  // res.data dạng { success, message, data, ... }
  return res.data;
};

// Lấy danh sách câu ví dụ theo level (OPTIONAL)
export const fetchSentenceExamples = async (level) => {
  const res = await api.get(`/ai/sentence-examples/${level}`);
  return res.data;
};

// Lấy 1 câu random theo level (OPTIONAL)
export const fetchRandomSentence = async (level) => {
  const res = await api.get(`/ai/sentence-examples/${level}/random`);
  return res.data;
};
