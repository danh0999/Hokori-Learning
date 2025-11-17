import api from "../configs/axios";

export const analyseSentence = async (sentence, level) => {
  const payload = {
    sentence,
    level
  };

  const res = await api.post("/ai/sentence-analysis", payload, {
    headers: { "Content-Type": "application/json" }
  });

  return res.data;
};
