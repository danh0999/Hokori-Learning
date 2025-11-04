import React, { useState, useRef, useEffect } from "react";
import styles from "./Listening.module.scss";
import SidebarQuestionList from "./components/SidebarQuestionList";
import QuestionCard from "./components/QuestionCard";
import JLPTModal from "./components/JLPTModal";

const jlpt_listening_questions = [
  {
    id: 1,
    audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
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
    audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    content: "Nghe đoạn sau và chọn câu đúng nhất.",
    options: [
      "Cô ấy thích nấu ăn.",
      "Cô ấy không thích nấu ăn.",
      "Cô ấy đang học nấu ăn.",
      "Cô ấy làm đầu bếp.",
    ],
    correct: "Cô ấy đang học nấu ăn.",
  },
];

const Listening = ({ onFinishTest }) => {
  const jlpt_test = {
    test_id: 102,
    title: "JLPT N3 - Nghe hiểu",
  };

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [modalOpen, setModalOpen] = useState(false);

  // ====== Audio logic ======
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  // ====== Format Time ======
  const formatTime = (sec = 0) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ====== Effect: Update progress ======
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => setAudioProgress(audio.currentTime);
    const setDuration = () => setAudioDuration(audio.duration || 0);

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", setDuration);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("loadedmetadata", setDuration);
    };
  }, []);

  // ====== Handle play/pause ======
  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        await audio.pause();
        setIsPlaying(false);
      } else {
        if (!audioDuration && audio.duration) setAudioDuration(audio.duration);
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.warn("Không thể phát audio:", error);
    }
  };

  // ====== Câu hỏi và điểm ======
  const handleSelectAnswer = (qid, opt) =>
    setAnswers((prev) => ({ ...prev, [qid]: opt }));

  const calcScorePercent = () => {
    let correct = 0;
    jlpt_listening_questions.forEach((q) => {
      if (answers[q.id] === q.correct) correct++;
    });
    return Math.round((correct / jlpt_listening_questions.length) * 100);
  };

  const total = jlpt_listening_questions.length;
  const answered = Object.keys(answers).length;
  const hasUnanswered = answered < total;
  const progress = Math.round((answered / total) * 100);
  const currentQ = jlpt_listening_questions[currentIndex];

  // ====== Next/Prev ======
  const handleNextQuestion = () => {
    if (currentIndex < total - 1) setCurrentIndex((i) => i + 1);
  };

  const handlePrevQuestion = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  // ====== Modal logic ======
  const openSubmitModal = () => setModalOpen(true);
  const handleModalCancel = () => setModalOpen(false);
  const handleModalConfirm = () => {
    const scorePercent = calcScorePercent();
    onFinishTest && onFinishTest(scorePercent);
    setModalOpen(false);
  };

  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <header className={styles.headerBar}>
        <h1 className={styles.testTitle}>{jlpt_test.title}</h1>
        <div className={styles.headerRight}>
          <button className={styles.submitBtn} onClick={openSubmitModal}>
            Nộp bài
          </button>
        </div>
      </header>

      {/* Main */}
      <main className={styles.main}>
        <aside className={styles.sidebarCard}>
          <SidebarQuestionList
            questions={jlpt_listening_questions.map((q, i) => ({
              question_id: q.id,
              order_index: i + 1,
            }))}
            currentIndex={currentIndex}
            answersByQuestion={answers}
            onJumpTo={setCurrentIndex}
          />
        </aside>

        <section className={styles.questionArea}>
          {/* AUDIO PLAYER */}
          <div className={styles.audioBlock}>
            <audio ref={audioRef} src={currentQ.audio_url} preload="metadata" />
            <button className={styles.audioBtn} onClick={handlePlayPause}>
              {isPlaying ? (
                <i className="fa-solid fa-pause" />
              ) : (
                <i className="fa-solid fa-play" />
              )}
            </button>

            <div className={styles.progressContainer}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{
                    width: `${audioDuration
                      ? (audioProgress / audioDuration) * 100
                      : 0}%`,
                  }}
                ></div>
              </div>
              <div className={styles.timeBox}>
                <span>{formatTime(audioProgress)}</span>
                <span>{formatTime(audioDuration)}</span>
              </div>
            </div>

            <div className={styles.waveWrapper}>
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`${styles.waveBar} ${
                    isPlaying ? styles.playing : ""
                  }`}
                ></div>
              ))}
            </div>
          </div>

          {/* Câu hỏi */}
          <QuestionCard
            question={{
              question_id: currentQ.id,
              order_index: currentIndex + 1,
              content: currentQ.content,
              options: currentQ.options.map((opt, i) => ({
                option_id: i,
                label: String.fromCharCode(65 + i),
                text: opt,
              })),
            }}
            selectedOptionId={answers[currentQ.id]}
            onSelectOption={handleSelectAnswer}
            onPrev={handlePrevQuestion}
            onNext={handleNextQuestion}
            lastSavedAt="Tự động lưu"
          />

          {/* Nút hoàn thành */}
          <div className={styles.nextSection}>
            <button
              className={styles.nextSectionBtn}
              onClick={openSubmitModal}
            >
              Hoàn thành phần Nghe hiểu & Xem kết quả
            </button>
          </div>

          {/* Tiến độ */}
          <div className={styles.progressCard}>
            <div className={styles.progressTopRow}>
              <span className={styles.progressLabel}>Tiến độ hoàn thành</span>
              <span className={styles.progressPct}>{progress}%</span>
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

      {/* Modal xác nhận nộp */}
      <JLPTModal
        open={modalOpen}
        title="Nộp bài phần Nghe hiểu?"
        message={
          hasUnanswered
            ? `Bạn mới trả lời ${answered}/${total} câu. Nếu nộp bây giờ, các câu chưa làm sẽ bị tính sai.`
            : "Bạn đã hoàn thành toàn bộ phần Nghe hiểu. Nộp bài và xem kết quả tổng?"
        }
        confirmLabel="Nộp bài & Xem kết quả"
        cancelLabel="Ở lại làm tiếp"
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
      />
    </div>
  );
};

export default Listening;
