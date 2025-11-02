import React, { useState, useEffect, useRef } from "react";
import styles from "./Listening.module.scss";
import SidebarQuestionList from "./components/SidebarQuestionList";
import QuestionCard from "./components/QuestionCard";
import SubmitModal from "../QuizPage/components/SubmitModal";

const Listening = ({ onNextSection }) => {
  // ===== MOCK DATA =====
  const jlpt_test = {
    test_id: 102,
    title: "JLPT N3 - Nghe hiểu",
    time_limit_minutes: 30,
    total_questions: 3,
  };

  // 🎧 Bảng jlpt_listening_question (theo DB Diagram)
  const jlpt_listening_questions = [
    {
      id: 1,
      test_id: 102,
      order_index: 1,
      audio_url:
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      content: "Nghe đoạn hội thoại và chọn đáp án đúng.",
      options: [
        "Người đàn ông muốn uống cà phê.",
        "Người phụ nữ muốn đi mua sắm.",
        "Họ đang nói về thời tiết.",
        "Họ đang nói về công việc.",
      ],
      correct: "Người đàn ông muốn uống cà phê.",
    },
    {
      id: 2,
      test_id: 102,
      order_index: 2,
      audio_url:
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      content: "Nghe đoạn sau và chọn câu đúng nhất.",
      options: [
        "Cô ấy thích nấu ăn.",
        "Cô ấy không thích nấu ăn.",
        "Cô ấy đang học nấu ăn.",
        "Cô ấy làm đầu bếp.",
      ],
      correct: "Cô ấy đang học nấu ăn.",
    },
    {
      id: 3,
      test_id: 102,
      order_index: 3,
      audio_url:
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
      content: "Nghe đoạn hội thoại và chọn đáp án phù hợp.",
      options: [
        "Họ đang ở siêu thị.",
        "Họ đang ở nhà hàng.",
        "Họ đang ở trường học.",
        "Họ đang ở bệnh viện.",
      ],
      correct: "Họ đang ở nhà hàng.",
    },
  ];

  // ===== STATES =====
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(jlpt_test.time_limit_minutes * 60);
  const [modalData, setModalData] = useState(null);
 

  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const formatAudioTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  // ===== TIMER =====
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit(true);
      return;
    }
    const t = setInterval(() => setTimeLeft((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  const formatTime = (sec) =>
    `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(
      sec % 60
    ).padStart(2, "0")}`;

  // ===== AUDIO =====
  const handlePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAudioEnd = () => setIsPlaying(false);

  // ===== LOGIC =====
  const handleSelectAnswer = (qid, opt) =>
    setAnswers((prev) => ({ ...prev, [qid]: opt }));

  const handleChangeQuestion = (i) => {
    setCurrentIndex(i);
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < jlpt_listening_questions.length - 1)
      setCurrentIndex((i) => i + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const handleSubmit = (force = false) => {
    const total = jlpt_listening_questions.length;
    const done = Object.keys(answers).length;

    if (done < total && !force) {
      setModalData({ type: "warn" });
      return;
    }

    let correct = 0;
    jlpt_listening_questions.forEach((q) => {
      if (answers[q.id] === q.correct) correct++;
    });

    setModalData({
      type: "result",
      score: {
        correct,
        total,
        percent: Math.round((correct / total) * 100),
      },
    });
  };

  const currentQ = jlpt_listening_questions[currentIndex];
  const progress = Math.round(
    (Object.keys(answers).length / jlpt_listening_questions.length) * 100
  );

  // ===== RENDER =====
  return (
    <div className={styles.wrapper}>
      {/* HEADER */}
      <header className={styles.headerBar}>
        <h1 className={styles.testTitle}>{jlpt_test.title}</h1>
        <div className={styles.headerRight}>
          <div className={styles.timerBox}>
            <i className="fa-regular fa-clock" />
            <span>{formatTime(timeLeft)}</span>
          </div>
          <button
            className={styles.submitBtn}
            onClick={() => handleSubmit(false)}
          >
            Nộp bài
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className={styles.main}>
        {/* SIDEBAR */}
        <aside className={styles.sidebarCard}>
          <SidebarQuestionList
            questions={jlpt_listening_questions.map((q) => ({
              question_id: q.id,
              order_index: q.order_index,
            }))}
            currentIndex={currentIndex}
            answersByQuestion={answers}
            totalQuestions={jlpt_listening_questions.length}
            onJumpTo={handleChangeQuestion}
          />
        </aside>

        {/* QUESTION AREA */}
        <section className={styles.questionArea}>
          {/* 🎧 Audio player */}
          <div className={styles.audioBlock}>
  <audio
    ref={audioRef}
    src={currentQ.audio_url}
    onEnded={handleAudioEnd}
    onLoadedMetadata={() => setDuration(audioRef.current.duration)}
    onTimeUpdate={() => setCurrentTime(audioRef.current.currentTime)}
  />

  <div className={styles.audioControls}>
    <div className={styles.waveWrapper}>
      <div className={`${styles.waveBar} ${isPlaying ? styles.playing : ""}`} />
      <div className={`${styles.waveBar} ${isPlaying ? styles.playing : ""}`} />
      <div className={`${styles.waveBar} ${isPlaying ? styles.playing : ""}`} />
      <div className={`${styles.waveBar} ${isPlaying ? styles.playing : ""}`} />
    </div>

    <button
      className={`${styles.audioBtn} ${isPlaying ? styles.playing : ""}`}
      onClick={handlePlayAudio}
    >
      {isPlaying ? (
        <i className="fa-solid fa-pause" />
      ) : (
        <i className="fa-solid fa-play" />
      )}
    </button>

    <div className={styles.progressContainer}>
      <input
        type="range"
        className={styles.progressBar}
        min="0"
        max={duration}
        step="0.1"
        value={currentTime}
        onChange={(e) => {
          const newTime = parseFloat(e.target.value);
          audioRef.current.currentTime = newTime;
          setCurrentTime(newTime);
        }}
      />
      <div className={styles.timeBox}>
        <span>{formatAudioTime(currentTime)}</span>
        <span>{formatAudioTime(duration)}</span>
      </div>
    </div>
  </div>
</div>


          {/* Question block (giống hệt MultipleChoice) */}
          <QuestionCard
            question={{
              question_id: currentQ.id,
              order_index: currentQ.order_index,
              content: currentQ.content,
              options: currentQ.options.map((opt, i) => ({
                option_id: i,
                label: String.fromCharCode(65 + i),
                text: opt,
              })),
            }}
            selectedOptionId={answers[currentQ.id]}
            onSelectOption={(qid, opt) => handleSelectAnswer(qid, opt)}
            onPrev={handlePrev}
            onNext={handleNext}
            lastSavedAt={"Tự động lưu"}
          />

          <div className={styles.nextSection}>
            <button
              className={styles.nextSectionBtn}
              onClick={() => {
                handleSubmit(false);
                if (onNextSection) onNextSection();
              }}
            >
              Hoàn thành phần Nghe hiểu
            </button>
          </div>

          {/* Progress Bar */}
          <div className={styles.progressCard}>
            <div className={styles.progressTopRow}>
              <span>Tiến độ hoàn thành</span>
              <span>{progress}%</span>
            </div>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressBar}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </section>
      </main>

      {/* MODAL */}
      <SubmitModal
        data={modalData}
        onClose={() => setModalData(null)}
        onConfirm={() => {
          setModalData(null);
          handleSubmit(true);
        }}
      />
    </div>
  );
};

export default Listening;
