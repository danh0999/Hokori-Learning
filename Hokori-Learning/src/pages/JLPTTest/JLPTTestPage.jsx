import React, { useState } from "react";
import MultipleChoice from "./MultipleChoice";
import Reading from "./Reading";
import Listening from "./Listening";
import { Result } from "./Result";
import styles from "./JLPTTestPage.module.scss";

const JLPTTestPage = () => {
  // multiple | reading | listening | result
  const [currentSection, setCurrentSection] = useState("multiple");

  // Lưu điểm từng phần (percent)
  const [sectionScores, setSectionScores] = useState({
    multiple: null,
    reading: null,
    listening: null,
  });

  // Khi user CHUYỂN PHẦN (bấm "Tiếp tục phần ...")
  const handleNextSection = (sectionName, scorePercent) => {
    setSectionScores((prev) => ({
      ...prev,
      [sectionName]: scorePercent,
    }));

    if (sectionName === "multiple") setCurrentSection("reading");
    else if (sectionName === "reading") setCurrentSection("listening");
    else if (sectionName === "listening") setCurrentSection("result");
  };

  // Khi user NỘP BÀI từ một phần bất kỳ
  const handleFinishTest = (sectionName, scorePercent) => {
    setSectionScores((prev) => ({
      ...prev,
      [sectionName]: scorePercent,
    }));
    setCurrentSection("result");
  };

  return (
    <div className={styles.wrapper}>
      {currentSection === "multiple" && (
        <MultipleChoice
          onNextSection={(score) => handleNextSection("multiple", score)}
          onFinishTest={(score) => handleFinishTest("multiple", score)}
        />
      )}

      {currentSection === "reading" && (
        <Reading
          onNextSection={(score) => handleNextSection("reading", score)}
          onFinishTest={(score) => handleFinishTest("reading", score)}
        />
      )}

      {currentSection === "listening" && (
        <Listening
          onFinishTest={(score) => handleFinishTest("listening", score)}
        />
      )}

      {currentSection === "result" && (
        <Result sectionScores={sectionScores} />
      )}
    </div>
  );
};

export default JLPTTestPage;
