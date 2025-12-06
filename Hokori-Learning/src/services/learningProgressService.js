import api from "../configs/axios";

export const updateContentProgress = (contentId, payload) => {
  return api.patch(
    `/learner/contents/${contentId}/progress`,
    payload
  );
};
