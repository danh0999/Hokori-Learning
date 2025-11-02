import React, { useState } from "react";
import MultipleChoice from "./MultipleChoice";
import Reading from "./Reading";
import Listening from "./Listening";
import styles from "./JLPTTestPage.module.scss";

const JLPTTestPage = () => {
  // currentSection: xác định phần hiện tại (multiple / reading / listening / result)
  const [currentSection, setCurrentSection] = useState("multiple");

  // hàm dùng chung để chuyển tiếp sang phần sau
  const handleNextSection = () => {
    if (currentSection === "multiple") setCurrentSection("reading");
    else if (currentSection === "reading") setCurrentSection("listening");
    else if (currentSection === "listening") setCurrentSection("result");
  };

  return (
    <div className={styles.wrapper}>
      {/*  Phần trắc nghiệm (Từ vựng & Ngữ pháp) */}
      {currentSection === "multiple" && (
        <MultipleChoice onNextSection={handleNextSection} />
      )}

      {/*  Phần đọc hiểu */}
      {currentSection === "reading" && (
        <Reading onNextSection={handleNextSection} />
      )}

      {/*  Phần nghe hiểu */}
      {currentSection === "listening" && (
        <Listening onNextSection={handleNextSection} />
      )}

      {/*  (Tùy chọn) Màn kết quả cuối cùng */}
      {currentSection === "result" && (
        <div className={styles.resultBox}>
          <h2> Bạn đã hoàn thành toàn bộ bài thi JLPT N3!</h2>
          <p>Chúc mừng bạn! Hệ thống sẽ lưu kết quả vào hồ sơ học tập.</p>
          <button
            className={styles.retryBtn}
            onClick={() => setCurrentSection("multiple")}
          >
            Làm lại
          </button>
        </div>
      )}
    </div>
  );
};

export default JLPTTestPage;
