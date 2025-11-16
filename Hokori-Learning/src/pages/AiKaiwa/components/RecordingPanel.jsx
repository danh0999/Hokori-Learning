// ================================
// RecordingPanel.jsx (FINAL)
// ================================

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { analyzeSpeech } from "../../../redux/features/aiSpeechSlice"

const RecordingPanel = ({ audioBlob }) => {
  const dispatch = useDispatch();
  const { loading, transcript, error } = useSelector(
    (state) => state.aiSpeech
  );

  // Gửi audio lên AI mỗi khi có blob mới
  useEffect(() => {
    if (audioBlob) {
      dispatch(analyzeSpeech(audioBlob)); // gửi WebM -> slice convert
    }
  }, [audioBlob, dispatch]);

  return (
    <div className="recording-panel">
      {loading && <p> AI đang phân tích giọng nói...</p>}
      {transcript && <p> Kết quả: {transcript}</p>}
      {error && <p style={{ color: "red" }}>❌ {error}</p>}
    </div>
  );
};

export default RecordingPanel;
