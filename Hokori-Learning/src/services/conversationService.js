// src/pages/AiConversationPage/services/conversationService.js
import api from "../configs/axios";

export const conversationService = {
  startConversation(payload) {
    return api.post("/ai/conversation/start", payload);
  },

  respondToConversation(payload) {
    return api.post("/ai/conversation/respond", payload);
  },

  endConversation(payload) {
    return api.post("/ai/conversation/end", payload);
  },
};
