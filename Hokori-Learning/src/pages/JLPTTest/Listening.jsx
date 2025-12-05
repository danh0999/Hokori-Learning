import React, { useState, useRef, useEffect } from "react";
import styles from "./Listening.module.scss";

import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";

import SidebarQuestionList from "./components/SidebarQuestionList";
import QuestionCard from "./components/QuestionCard";
import JLPTModal from "./components/JLPTModal";
import LoadingOverlay from "../../components/Loading/LoadingOverlay";

import {
  fetchListening,
  fetchActiveUsers,
  submitAnswer,
  setTestTime,
  updateTimeLeft,
  clearTestData,
  submitJlptTest,
} from "../../redux/features/jlptLearnerSlice";

import api from "../../configs/axios";

/* ========================================================================== */
// Validate attemptId trước khi gọi API (copy từ guide BE)
function validateAttemptId(attemptId) {
  if (attemptId === null || attemptId === undefined) return null;
  if (attemptId === "null" || attemptId === "undefined") return null;

  const numId = Number(attemptId);
  if (isNaN(numId) || numId <= 0) return null;

  return numId;
}

const buildFileUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;

  let base = api.defaults.baseURL || "";
  base = base.replace(/\/api\/?$/, "");
  return `${base}${path.startsWith("/") ? path : "/" + path}`;
};
/* ========================================================================== */

const Listening = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { testId } = useParams();
  const numericTestId = Number(testId);
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("eventId");
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const { listening, answers, loadingQuestions, timeLeft } = useSelector(
    (state) => state.jlptLearner
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [localAnswers, setLocalAnswers] = useState({});
  const [modalOpen, setModalOpen] = useState(false);

  // AUDIO
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  /* ========================================================================== 
      CLEAR REDUX KHI RỜI TRANG 
  ========================================================================== */
  useEffect(() => {
    return () => {
      dispatch(clearTestData());
    };
  }, [dispatch]);

  /* ========================================================================== 
      INIT TEST: chỉ /start nếu chưa có timeLeft, luôn fetchListening
  ========================================================================== */
  useEffect(() => {
    async function init() {
      try {
        if (!timeLeft || timeLeft <= 0) {
          const res = await api.post(
            `/learner/jlpt/tests/${numericTestId}/start`
          );
          const duration = res.data?.durationMin || 180;

          dispatch(
            setTestTime({
              timeLeft: duration * 60,
              durationMin: duration,
            })
          );
        }

        // Luôn fetch câu hỏi Listening
        dispatch(fetchListening(numericTestId));
      } catch {
        navigate("/jlpt");
      }
    }

    init();
  }, [dispatch, numericTestId, navigate, timeLeft]);

  /* ========================================================================== 
      POLLING ACTIVE USERS
  ========================================================================== */
  useEffect(() => {
    const run = () => dispatch(fetchActiveUsers(numericTestId));
    run();
    const id = setInterval(run, 3000);
    return () => clearInterval(id);
  }, [dispatch, numericTestId]);

  /* ========================================================================== 
      SYNC ANSWERS REDUX → LOCAL
  ========================================================================== */
  useEffect(() => {
    setLocalAnswers({ ...answers });
  }, [answers]);

  /* ========================================================================== 
      GLOBAL TIMER
  ========================================================================== */
  useEffect(() => {
    if (!timeLeft || timeLeft <= 0) return;
    const id = setInterval(() => dispatch(updateTimeLeft()), 1000);
    return () => clearInterval(id);
  }, [dispatch, timeLeft]);

  /* ========================================================================== 
      AUTO MOVE WHEN TIME OUT → RESULT
  ========================================================================== */
  useEffect(() => {
    if (timeLeft === 0 && !hasSubmitted) {
      finish();
    }
  }, [timeLeft, hasSubmitted]); // eslint có kêu cũng kệ 😄

  const formatTime = (sec) => {
    if (!sec) return "00:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  /* ========================================================================== 
      AUDIO SETUP
  ========================================================================== */
  const audioUrl =
    listening && listening[0]?.audioUrl
      ? buildFileUrl(listening[0].audioUrl)
      : "";

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    const updateTime = () => setAudioProgress(audio.currentTime);
    const updateDuration = () => {
      if (audio.duration > 0) setAudioDuration(audio.duration);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("play", () => setIsPlaying(true));
    audio.addEventListener("pause", () => setIsPlaying(false));
    audio.addEventListener("ended", () => setIsPlaying(false));

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
    };
  }, [audioUrl]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.paused ? audio.play().catch(console.error) : audio.pause();
  };

  /* ========================================================================== 
      QUESTIONS LOGIC
  ========================================================================== */
  const questions = listening || [];
  const total = questions.length;

  const findNextUnanswered = () => {
    for (let i = currentIndex + 1; i < total; i++) {
      if (!localAnswers[questions[i].id]) return i;
    }
    for (let i = 0; i < currentIndex; i++) {
      if (!localAnswers[questions[i].id]) return i;
    }
    return null;
  };

  const next = () => {
    const n = findNextUnanswered();
    if (n !== null) setCurrentIndex(n);
    else setCurrentIndex((i) => (i < total - 1 ? i + 1 : 0));
  };

  const prev = () => currentIndex > 0 && setCurrentIndex((i) => i - 1);

  const finish = async () => {
    if (hasSubmitted) return; // tránh double submit
    setHasSubmitted(true);

    try {
      const res = await dispatch(submitJlptTest(numericTestId)).unwrap();

      // lấy attemptId từ response
      const rawAttemptId = res?.attemptId;

      const validAttemptId = validateAttemptId(rawAttemptId);
      if (!validAttemptId) {
        console.error("Submit response không có attemptId hợp lệ:", res);
        // fallback: vẫn cho vào trang result tổng quan
        const params = new URLSearchParams();
        if (eventId) params.set("eventId", eventId);
        const qs = params.toString();
        navigate(`/jlpt/test/${numericTestId}/result${qs ? `?${qs}` : ""}`);
        return;
      }

      // lưu để dùng lại sau (phòng khi reload)
      localStorage.setItem(
        `jlpt_lastAttemptId_${numericTestId}`,
        validAttemptId.toString()
      );

      const params = new URLSearchParams();
      if (eventId) params.set("eventId", eventId);
      params.set("attemptId", validAttemptId.toString());

      navigate(`/jlpt/test/${numericTestId}/result?${params.toString()}`);
    } catch (error) {
      console.error("Lỗi submit JLPT test:", error);
      setHasSubmitted(false); // cho phép user thử lại
      // tuỳ bạn: toast / message lỗi
    }
  };

  /* ========================================================================== 
      UI QUESTION SHAPE
  ========================================================================== */
  const uiQuestion =
    questions.length > 0
      ? {
          question_id: questions[currentIndex].id,
          order_index: currentIndex + 1,
          content: questions[currentIndex].content,
          options: questions[currentIndex].options.map((opt, i) => ({
            option_id: opt.id,
            label: String.fromCharCode(65 + i),
            text: opt.content,
          })),
        }
      : null;

  const answeredCount = questions.filter((q) => localAnswers[q.id]).length;
  const progressPct = total ? Math.round((answeredCount / total) * 100) : 0;

  const handleSelectAnswer = (qid, optId) => {
    setLocalAnswers((prev) => ({
      ...prev,
      [qid]: optId,
    }));

    dispatch(
      submitAnswer({
        testId: numericTestId,
        questionId: qid,
        selectedOptionId: optId,
      })
    );
  };

  /* ========================================================================== 
      RENDER
  ========================================================================== */
  return (
    <>
      {(loadingQuestions || questions.length === 0) && <LoadingOverlay />}

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
              questions={questions.map((q, i) => ({
                question_id: q.id,
                order_index: i + 1,
              }))}
              answersByQuestion={localAnswers}
              currentIndex={currentIndex}
              onJumpTo={setCurrentIndex}
            />
          </aside>

          <section className={styles.questionArea}>
            <div className={styles.questionCardWrap}>
              {/* PROGRESS */}
              <div className={styles.progressCard}>
                <div className={styles.progressTopRow}>
                  <span className={styles.progressLabel}>
                    Tiến độ hoàn thành
                  </span>
                  <span className={styles.progressPct}>{progressPct}%</span>
                </div>

                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressBar}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* AUDIO */}
              {audioUrl && (
                <div className={styles.audioBlock}>
                  <audio ref={audioRef} src={audioUrl} preload="metadata" />

                  <button
                    className={styles.hokoriPlayBtn}
                    onClick={handlePlayPause}
                  >
                    {isPlaying ? (
                      <i className="fa-solid fa-pause" />
                    ) : (
                      <i className="fa-solid fa-play" />
                    )}
                  </button>

                  <div className={styles.audioProgressWrap}>
                    <div className={styles.audioProgressTrack}>
                      <div
                        className={styles.audioProgressFill}
                        style={{
                          width:
                            audioDuration > 0
                              ? (audioProgress / audioDuration) * 100 + "%"
                              : "0%",
                        }}
                      />
                    </div>

                    <div className={styles.audioTimeRow}>
                      <span>{formatTime(audioProgress)}</span>
                      <span>{formatTime(audioDuration)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* QUESTION */}
              {uiQuestion && (
                <QuestionCard
                  question={uiQuestion}
                  selectedOptionId={localAnswers[uiQuestion.question_id]}
                  onSelectOption={handleSelectAnswer}
                  onPrev={prev}
                  onNext={next}
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
          message={`Bạn đã trả lời ${answeredCount}/${total} câu.`}
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
