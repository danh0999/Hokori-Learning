// src/pages/JLPTTest/Listening.jsx
import React, { useState, useRef, useEffect } from "react";
import styles from "./Listening.module.scss";

import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";

import SidebarQuestionList from "./components/SidebarQuestionList";
import QuestionCard from "./components/QuestionCard";
import JLPTModal from "./components/JLPTModal";
import LoadingOverlay from "../../components/Loading/LoadingOverlay";
import {
  fetchListening,
  submitAnswer,
  clearTestData,
} from "../../redux/features/jlptLearnerSlice";

import api from "../../configs/axios";

// =========================================
// FIX 100% – Build URL KHÔNG PHÁ https://
// =========================================
const buildFileUrl = (path) => {
  if (!path) return "";

  // Nếu backend trả full URL: ok
  if (path.startsWith("http")) return path;

  let base = api.defaults.baseURL || ""; // https://xxx/api
  base = base.replace(/\/api\/?$/, "");  // https://xxx

  // GHÉP CHUẨN
  return `${base}/${path}`; // ==> https://xxx/jlpt-demo/listening/abc.m4a
};

const Listening = () => {
  const { testId } = useParams();
  const numericTestId = Number(testId);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { listening, answers, loadingQuestions } = useSelector(
    (state) => state.jlptLearner
  );

  const listeningQuestions = listening || [];

  // UI states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localAnswers, setLocalAnswers] = useState({});
  const [modalOpen, setModalOpen] = useState(false);

  // AUDIO state
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  // 30 phút
  const [timeLeft, setTimeLeft] = useState(30 * 60);

  // clear test
  useEffect(() => {
    return () => dispatch(clearTestData());
  }, [dispatch]);

  useEffect(() => {
    const load = async () => {
      await dispatch(fetchListening(numericTestId));
    };
    load();
  }, [dispatch, numericTestId]);

  useEffect(() => {
    setLocalAnswers({ ...answers });
  }, [answers]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // AUDIO EVENTS
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const upd = () => setAudioProgress(audio.currentTime);
    const setDur = () => setAudioDuration(audio.duration || 0);

    audio.addEventListener("timeupdate", upd);
    audio.addEventListener("loadedmetadata", setDur);

    return () => {
      audio.removeEventListener("timeupdate", upd);
      audio.removeEventListener("loadedmetadata", setDur);
    };
  }, []);

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (isPlaying) {
        await audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch {}
  };

  const handleSeek = (e) => {
    const value = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setAudioProgress(value);
    }
  };

  const total = listeningQuestions.length;
  const answeredCount = listeningQuestions.filter(
    (q) => localAnswers[q.id] !== undefined
  ).length;
  const progress = total ? Math.round((answeredCount / total) * 100) : 0;

  const currentQ = total ? listeningQuestions[currentIndex] : null;

  // Chuẩn hóa format cho QuestionCard
  const uiQuestion =
    currentQ &&
    (() => ({
      question_id: currentQ.id,
      order_index: currentIndex + 1,
      content: currentQ.content,
      options: currentQ.options.map((opt, i) => ({
        option_id: opt.id,
        label: String.fromCharCode(65 + i),
        text: opt.content,
      })),
    }))();

  // FIX 100% – MATCH đúng QuestionCard params
  const handleSelectAnswer = (qid, optionId) => {
    setLocalAnswers((prev) => ({
      ...prev,
      [qid]: optionId,
    }));

    dispatch(
      submitAnswer({
        testId: numericTestId,
        questionId: qid,
        selectedOptionId: optionId,
      })
    );
  };

  const next = () => currentIndex < total - 1 && setCurrentIndex((i) => i + 1);
  const prev = () => currentIndex > 0 && setCurrentIndex((i) => i - 1);

  const finish = () => navigate(`/jlpt/test/${numericTestId}/result`);

  return (
    <>
        {(loadingQuestions || listeningQuestions.length === 0) && <LoadingOverlay />}
    <div className={styles.wrapper}>
      <header className={styles.headerBar}>
        <h1 className={styles.testTitle}>JLPT - Nghe hiểu</h1>
        <div className={styles.headerRight}>
          <div className={styles.timerBox}>
            <span className={styles.timerText}>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <aside className={styles.sidebarCard}>
          <SidebarQuestionList
            questions={listeningQuestions.map((q, i) => ({
              question_id: q.id,
              order_index: i + 1,
            }))}
            currentIndex={currentIndex}
            answersByQuestion={localAnswers}
            onJumpTo={setCurrentIndex}
          />
        </aside>

        <section className={styles.questionArea}>
          <div className={styles.questionCardWrap}>
            {/* Progress card */}
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

            {/* AUDIO BLOCK */}
            <div className={styles.audioBlock}>
              <audio
                ref={audioRef}
                src={buildFileUrl(currentQ?.audioUrl)}
                preload="metadata"
              />

              <button className={styles.audioBtn} onClick={handlePlayPause}>
                {isPlaying ? (
                  <i className="fa-solid fa-pause" />
                ) : (
                  <i className="fa-solid fa-play" />
                )}
              </button>

              <div className={styles.progressContainer}>
                <div className={styles.progressBar1}>
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

            {/* QUESTION */}
            {uiQuestion && (
              <QuestionCard
                question={uiQuestion}
                selectedOptionId={localAnswers[uiQuestion.question_id]}
                onSelectOption={handleSelectAnswer} // FIX CHUẨN
                onPrev={prev}
                onNext={next}
                lastSavedAt="Tự động lưu"
              />
            )}
          </div>

          <div className={styles.nextSection}>
            <button className={styles.nextSectionBtn} onClick={() => setModalOpen(true)}>
              Hoàn thành phần Nghe hiểu & Xem kết quả
            </button>
          </div>
        </section>
      </main>

      <JLPTModal
        open={modalOpen}
        title="Nộp bài phần Nghe hiểu?"
        message={
          answeredCount < total
            ? `Bạn mới trả lời ${answeredCount}/${total} câu.`
            : "Bạn đã hoàn thành toàn bộ câu hỏi."
        }
        confirmLabel="Xem kết quả"
        cancelLabel="Làm tiếp"
        onConfirm={finish}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  </>
  );
};

export default Listening;
