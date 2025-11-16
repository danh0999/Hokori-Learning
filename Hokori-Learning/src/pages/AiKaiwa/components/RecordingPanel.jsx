import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { analyzeSpeech } from "../../redux/features/aiSpeechSlice";

const RecordingPanel = ({ audioBlob, targetText, level }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (audioBlob) {
      dispatch(
        analyzeSpeech({
          audioBlob,
          targetText,
          level,
        })
      );
    }
  }, [audioBlob]) ;

  return null;
};

export default RecordingPanel;
