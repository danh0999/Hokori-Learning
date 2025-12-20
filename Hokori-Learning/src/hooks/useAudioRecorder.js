// src/hooks/useAudioRecorder.js
// ============================================
// Hook ghi âm dùng cho Kaiwa (WebM + Opus)
// ============================================
import { useCallback, useEffect, useRef, useState } from "react";

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      setAudioBlob(null);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        chunksRef.current = [];

        if (blob.size > 2000) {
          setAudioBlob(blob);
        } else {
          console.warn("⚠ Blob quá nhỏ, vui lòng ghi âm lại.");
          setAudioBlob(null);
        }

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
      };

      // timeslice 100ms để flush dữ liệu đều hơn
    recorder.start(100);
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
      alert("Không thể truy cập micro. Vui lòng kiểm tra cài đặt trình duyệt.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === "recording") {
      recorder.stop();
    }
    setIsRecording(false);
  }, []);

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  return {
    isRecording,
    audioBlob,
    startRecording,
    stopRecording,
  };
};
