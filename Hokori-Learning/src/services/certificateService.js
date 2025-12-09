import api from "../configs/axios";

export const ensureCertificateByCourse = (courseId) =>
  api.post(`/learner/certificates/course/${courseId}/ensure`);

export const getCertificateById = (certificateId) =>
  api.get(`/learner/certificates/${certificateId}`);

// Fetch certificate info by courseId (GET /learner/certificates/course/{courseId})
export const getCertificateByCourse = (courseId) =>
  api.get(`/learner/certificates/course/${courseId}`);
