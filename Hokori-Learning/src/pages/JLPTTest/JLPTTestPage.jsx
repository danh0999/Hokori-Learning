import React, { useState } from "react";
import MultipleChoice from "./MultipleChoice";
import Reading from "./Reading";
import Listening from "./Listening";
import Result from "./Result"; // sửa lại import chuẩn
import styles from "./JLPTTestPage.module.scss";

const JLPTTestPage = () => {
  const [currentSection, setCurrentSection] = useState("multiple");

  // lưu điểm từng phần
  const [sectionScores, setSectionScores] = useState({
    multiple: null,
    reading: null,
    listening: null,
  });

  // hàm nhận điểm từ mỗi phần thi và chuyển sang phần kế tiếp
  const handleNextSection = (sectionName, scorePercent) => {
    setSectionScores((prev) => ({ ...prev, [sectionName]: scorePercent }));

    if (sectionName === "multiple") setCurrentSection("reading");
    else if (sectionName === "reading") setCurrentSection("listening");
    else if (sectionName === "listening") setCurrentSection("result");
  };

  return (
    <div className={styles.wrapper}>
      {/* Phần trắc nghiệm */}
      {currentSection === "multiple" && (
        <MultipleChoice
          onNextSection={(score) => handleNextSection("multiple", score)}
        />
      )}

      {/* Phần đọc hiểu */}
      {currentSection === "reading" && (
        <Reading
          onNextSection={(score) => handleNextSection("reading", score)}
        />
      )}

      {/* Phần nghe hiểu */}
      {currentSection === "listening" && (
        <Listening
          onNextSection={(score) => handleNextSection("listening", score)}
        />
      )}

      {/* Kết quả tổng */}
      {currentSection === "result" && (
        <Result sectionScores={sectionScores} />
      )}
    </div>
  );
};

export default JLPTTestPage;
