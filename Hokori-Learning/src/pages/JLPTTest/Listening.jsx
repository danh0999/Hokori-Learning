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
  fetchActiveUsers, // 🟦 mới
} from "../../redux/features/jlptLearnerSlice";

import api from "../../configs/axios";

// =========================================
// Build audio URL CHUẨN từ BE
// =========================================
const buildFileUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;

  let base = api.defaults.baseURL || "";
  base = base.replace(/\/api\/?$/, "");
  return `${base}/${path}`;
};

const Listening = () => {
  const { testId } = useParams();
  const numericTestId = Number(testId);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { listening, answers, loadingQuestions, activeUsers } = useSelector(
    (state) => state.jlptLearner
  );

  const listeningQuestions = listening || [];
  const [currentIndex, setCurrentIndex] = useState(0);

  const [localAnswers, setLocalAnswers] = useState({});
  const [modalOpen, setModalOpen] = useState(false);

  // AUDIO CONTROL
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  // TIME
  const [timeLeft, setTimeLeft] = useState(30 * 60);

  // CLEAR QUESTIONS WHEN EXIT
  useEffect(() => {
    return () => dispatch(clearTestData());
  }, [dispatch]);

  // LOAD DATA
  useEffect(() => {
    dispatch(fetchListening(numericTestId));
  }, [dispatch, numericTestId]);

  // 🟦 POLLING ACTIVE USERS
  useEffect(() => {
    if (!numericTestId) return;

    const fetchOnce = () => {
      dispatch(fetchActiveUsers(numericTestId));
    };

    fetchOnce();
    const intervalId = setInterval(fetchOnce, 3000);

    return () => clearInterval(intervalId);
  }, [dispatch, numericTestId]);

  // MERGE ANSWERS
  useEffect(() => {
    setLocalAnswers({ ...answers });
  }, [answers]);

  // COUNTDOWN
  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  const formatTime = (sec) =>
    `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

  // AUDIO EVENT HANDLERS
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setAudioProgress(audio.currentTime);
    const updateDuration = () => setAudioDuration(audio.duration || 0);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
    };
  }, [currentIndex]);

  // RESET AUDIO WHEN QUESTION CHANGES
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;

    setIsPlaying(false);
    setAudioProgress(0);
    setAudioDuration(0);
  }, [currentIndex]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const total = listeningQuestions.length;
  const answeredCount = listeningQuestions.filter(
    (q) => localAnswers[q.id] !== undefined
  ).length;

  const progressPct = total
    ? Math.round((answeredCount / total) * 100)
    : 0;

  const currentQ = listeningQuestions[currentIndex] || null;

  // Format BE → FE
  const uiQuestion =
    currentQ && {
      question_id: currentQ.id,
      order_index: currentIndex + 1,
      content: currentQ.content,
      options: currentQ.options.map((opt, i) => ({
        option_id: opt.id,
        label: String.fromCharCode(65 + i),
        text: opt.content,
      })),
    };

  const handleSelectAnswer = (qid, optionId) => {
    setLocalAnswers((prev) => ({ ...prev, [qid]: optionId }));

    dispatch(
      submitAnswer({
        testId: numericTestId,
        questionId: qid,
        selectedOptionId: optionId,
      })
    );
  };

  const next = () =>
    currentIndex < total - 1 && setCurrentIndex((i) => i + 1);

  const prev = () =>
    currentIndex > 0 && setCurrentIndex((i) => i - 1);

  const finish = () => navigate(`/jlpt/test/${numericTestId}/result`);

  const activeCount = activeUsers?.[numericTestId] ?? 0;

  return (
    <>
      {(loadingQuestions || listeningQuestions.length === 0) && (
        <LoadingOverlay />
      )}

      <div className={styles.wrapper}>
        <header className={styles.headerBar}>
          <h1 className={styles.testTitle}>JLPT - Nghe hiểu</h1>
          <div className={styles.headerRight}>
            <div className={styles.activeUsersBox}>
              <i className="fa-solid fa-user-group" />
              <span>
                Đang có {activeCount} người tham gia bài thi này
              </span>
            </div>
            <div className={styles.timerBox}>
              <span className={styles.timerText}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </header>

        <main className={styles.main}>
          {/* SIDEBAR */}
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

          {/* MAIN SECTION */}
          <section className={styles.questionArea}>
            <div className={styles.questionCardWrap}>
              {/* PROGRESS */}
              <div className={styles.progressCard}>
                <div className={styles.progressTopRow}>
                  <span className={styles.progressLabel}>
                    Tiến độ hoàn thành
                  </span>
                  <span className={styles.progressPct}>
                    {progressPct}%
                  </span>
                </div>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressBar}
                    style={{ width: `${progressPct}%` }}
                  ></div>
                </div>
              </div>

              {/* AUDIO PLAYER */}
              {currentQ && (
                <div className={styles.audioBlock}>
                  <audio
                    ref={audioRef}
                    preload="metadata"
                    src={buildFileUrl(currentQ.audioUrl)}
                  />

                  <button
                    className={styles.audioBtn}
                    onClick={handlePlayPause}
                  >
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
                          width: audioDuration
                            ? (audioProgress / audioDuration) * 100 + "%"
                            : "0%",
                        }}
                      ></div>
                    </div>

                    <div className={styles.timeBox}>
                      <span>{formatTime(audioProgress)}</span>
                      <span>{formatTime(audioDuration)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* QUESTION CARD */}
              {uiQuestion && (
                <QuestionCard
                  question={uiQuestion}
                  selectedOptionId={localAnswers[uiQuestion.question_id]}
                  onSelectOption={handleSelectAnswer}
                  onPrev={prev}
                  onNext={next}
                  lastSavedAt="Tự động lưu"
                />
              )}
            </div>

            <div className={styles.nextSection}>
              <button
                className={styles.nextSectionBtn}
                onClick={() => setModalOpen(true)}
              >
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
