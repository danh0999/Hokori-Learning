// src/pages/AiConversationPage/AiConversationPage.jsx
import React, { useCallback, useMemo, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import styles from "./AiConversationPage.module.scss";
import { FaLightbulb } from "react-icons/fa";
import HeroSection from "./components/HeroSection";
import ChatBubble from "./components/ChatBubble";
import ResultPanel from "./components/ResultPanel";
import { GiBrain } from "react-icons/gi";
import AudioRecorder from "../../pages/AiKaiwa/components/AudioRecorder";
import { convertBlobToBase64, getAudioFormat } from "../../utils/audioUtils";

import useAiService from "../../hooks/useAiService";
import { conversationService } from "../../services/conversationService";

const LEVELS = ["N5", "N4", "N3", "N2", "N1"];
const safeText = (v) => (typeof v === "string" ? v : "");

const STORAGE_PREFIX = "ai_conversation_session_";
const MAX_AUDIO_MB = 1.3;

const SCENARIO_MIN = 5;
const SCENARIO_MAX = 200;

/* ===============================
   Helper: bỏ romaji trong ngoặc ()
================================ */
const stripRomaji = (text = "") => {
  if (!text) return "";
  return text.split("(")[0].trim();
};

/* ===============================
   Parse suggestion: "JP (VI)"
================================ */
const parseSuggestion = (s = "") => {
  const raw = String(s || "").trim();
  const match = raw.match(/^(.+?)\s*\((.+?)\)\s*$/);
  if (!match) return { jp: raw, vi: "" };
  return { jp: match[1].trim(), vi: match[2].trim() };
};

/* ===============================
   Normalize role về "ai"/"user"
================================ */
const normalizeRole = (role) => {
  const r = String(role || "").toLowerCase();
  if (r === "ai") return "ai";
  if (r === "user") return "user";
  // fallback nếu BE trả "AI"/"USER"
  if (r === "aI".toLowerCase()) return "ai";
  return r.includes("user") ? "user" : "ai";
};

const normalizeHistory = (arr) =>
  (Array.isArray(arr) ? arr : []).map((m) => ({
    ...m,
    role: normalizeRole(m.role),
    text: safeText(m.text),
    textVi: safeText(m.textVi),
  }));

/* ===============================
   Play audio base64 (BE audioUrl)
================================ */
const playBase64Audio = (base64) => {
  if (!base64) return false;
  try {
    // base64 có thể là raw base64 hoặc data:audio/...;base64,...
    const src = String(base64).startsWith("data:")
      ? String(base64)
      : `data:audio/mp3;base64,${base64}`;

    const audio = new Audio(src);
    audio.play().catch(() => {});
    return true;
  } catch {
    return false;
  }
};
let __ttsBusy = false;
let __lastSpoken = "";
let __lastTime = 0;

const speakJapanese = (text = "") => {
  if (!text || __ttsBusy) return;

  // 1️⃣ trích xuất ký tự Nhật
  const jpParts = String(text)
    .replace(/\([^)]*\)/g, "")
    .match(/[\u3040-\u30FF\u4E00-\u9FFF]+/g);

  if (!jpParts || !jpParts.length) return;

  const jpOnly = jpParts.join(" ");

  const now = Date.now();
  if (jpOnly === __lastSpoken && now - __lastTime < 1000) return;

  __lastSpoken = jpOnly;
  __lastTime = now;

  const synth = window.speechSynthesis;
  if (!synth) return;

  const speakNow = () => {
    __ttsBusy = true;
    synth.cancel();

    setTimeout(() => {
      const utter = new SpeechSynthesisUtterance(jpOnly);
      utter.lang = "ja-JP";
      utter.rate = 0.95;
      utter.pitch = 1;

      utter.onend = () => {
        __ttsBusy = false;
      };
      utter.onerror = () => {
        __ttsBusy = false;
      };

      synth.speak(utter);
    }, 120);
  };

  //  QUAN TRỌNG: đợi voice load
  //  chỉ cho phép bind voiceschanged 1 lần duy nhất
  if (!synth.__jpVoiceReady) {
    const voices = synth.getVoices();
    if (voices.length === 0) {
      synth.__jpVoiceReady = true;
      synth.onvoiceschanged = () => {
        synth.onvoiceschanged = null;
      };
      return; //  chưa nói
    }
  }

  // nói NGAY – không đợi voiceschanged nữa
  speakNow();
};

export default function AiConversationPage() {
  const { runService } = useAiService();

  /* ===============================
     USER / STORAGE KEY
  ================================ */
  const userId = useSelector((state) => state.user?.id);
  const STORAGE_KEY = userId ? `${STORAGE_PREFIX}${userId}` : null;

  /* ===============================
     INPUT
  ================================ */
  const [level, setLevel] = useState("N5");
  const [scenario, setScenario] = useState("");

  /* ===============================
     SESSION
  ================================ */
  const [conversationId, setConversationId] = useState(null);
  const [history, setHistory] = useState([]);
  const [turnNumber, setTurnNumber] = useState(0);
  const [originalScenario, setOriginalScenario] = useState("");

  // user speaks first
  const [userSpeaksFirst, setUserSpeaksFirst] = useState(false);
  const [startingSuggestions, setStartingSuggestions] = useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);

  /* ===============================
     AUDIO
  ================================ */
  const [audioBlob, setAudioBlob] = useState(null);

  /* ===============================
     UI
  ================================ */
  const [loading, setLoading] = useState(false);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState(null);
  const [userTyping, setUserTyping] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);

  /* ===============================
     TURN FEEDBACK (NEW)
  ================================ */
  const [turnFeedback, setTurnFeedback] = useState(null);

  /* ===============================
     RESULT
  ================================ */
  const [endResult, setEndResult] = useState(null);

  const started = !!conversationId && !endResult;
  const waitingFirstUserAudio =
    started && userSpeaksFirst && history.length === 0;

  /* ===============================
     LOAD LOCAL STORAGE
  ================================ */
  useEffect(() => {
    if (!STORAGE_KEY) return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const saved = JSON.parse(raw);
      setLevel(saved.level || "N5");
      setScenario(saved.scenario || "");
      setOriginalScenario(saved.originalScenario || "");
      setConversationId(saved.conversationId || null);
      setHistory(saved.history || []);
      setTurnNumber(saved.turnNumber || 0);
      setEndResult(saved.endResult || null);
      setUserSpeaksFirst(!!saved.userSpeaksFirst);
      setStartingSuggestions(saved.startingSuggestions || []);
      setSelectedSuggestion(saved.selectedSuggestion || null);
      setTurnFeedback(saved.turnFeedback || null);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [STORAGE_KEY]);

  /* ===============================
     SAVE LOCAL STORAGE
  ================================ */
  useEffect(() => {
    if (!STORAGE_KEY || !conversationId) return;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        level,
        scenario,
        originalScenario,
        conversationId,
        history,
        turnNumber,
        endResult,
        userSpeaksFirst,
        startingSuggestions,
        selectedSuggestion,
        turnFeedback,
        savedAt: Date.now(),
      })
    );
  }, [
    STORAGE_KEY,
    level,
    scenario,
    originalScenario,
    conversationId,
    history,
    turnNumber,
    endResult,
    userSpeaksFirst,
    startingSuggestions,
    selectedSuggestion,
    turnFeedback,
  ]);

  /* ===============================
     HANDLERS
  ================================ */
  const handleAudioReady = useCallback((blob) => {
    setAudioBlob(blob);
  }, []);

  const progressText = useMemo(() => {
    if (!started) return "Chưa bắt đầu";
    return "Đang trò chuyện";
  }, [started]);

  /* ===============================
     START
  ================================ */
  const handleStart = async () => {
    const trimmedScenario = scenario.trim();

    if (trimmedScenario.length < SCENARIO_MIN) {
      setError(
        `Vui lòng nhập tình huống rõ ràng hơn (ít nhất ${SCENARIO_MIN} ký tự).`
      );
      return;
    }
    if (trimmedScenario.length > SCENARIO_MAX) {
      setError(`Tình huống quá dài. Tối đa ${SCENARIO_MAX} ký tự.`);
      return;
    }

    // START: user chưa gửi gì, AI đang chuẩn bị hỏi
    setUserTyping(false);
    setAiTyping(true);

    setLoading(true);
    setError(null);
    setEndResult(null);
    setAudioBlob(null);
    setHistory([]);
    setTurnNumber(0);
    setSelectedSuggestion(null);
    setStartingSuggestions([]);
    setUserSpeaksFirst(false);
    setTurnFeedback(null);

    const res = await runService("CONVERSATION", () =>
      conversationService.startConversation({
        level,
        scenario: trimmedScenario,
      })
    );

    setLoading(false);
    if (!res) {
      setAiTyping(false);
      return;
    }

    const data = res?.data?.data;
    if (!data) {
      setError("Không thể bắt đầu hội thoại.");
      setAiTyping(false);
      return;
    }

    setConversationId(data.conversationId || `conv-${Date.now()}`);
    setTurnNumber(data.turnNumber || 1);
    setOriginalScenario(
      data.scenario || data.originalScenario || trimmedScenario
    );

    const isUserFirst = !!data.userSpeaksFirst;
    setUserSpeaksFirst(isUserFirst);

    if (isUserFirst) {
      // user nói trước => AI không typing
      setStartingSuggestions(data.startingSuggestions || []);
      setHistory([]);
      setAiTyping(false);
      return;
    }

    setUserTyping(false);
    setAiTyping(true);

    // ⏱ delay để AI “suy nghĩ” trước khi nói
    await new Promise((r) => setTimeout(r, 600));

    const hist = normalizeHistory(data.conversationHistory || []);
    setHistory(hist);

    const firstAI = hist?.[0];
    speakJapanese(firstAI?.text);

    setAiTyping(false);
  };

  /* ===============================
     RESPOND
  ================================ */
  const handleRespond = async () => {
    if (!started) return;

    if (!audioBlob) {
      setError("Bạn cần ghi âm câu trả lời trước.");
      return;
    }

    const sizeMB = audioBlob.size / (1024 * 1024);
    if (sizeMB > MAX_AUDIO_MB) {
      setError(
        "Đoạn ghi âm quá dài. Vui lòng nói ngắn hơn (tối đa khoảng 60 giây)."
      );
      return;
    }

    //  user đang gửi
    setUserTyping(true);
    setAiTyping(false);

    setLoading(true);
    setError(null);

    try {
      const base64 = await convertBlobToBase64(audioBlob);
      const audioFormat = getAudioFormat(audioBlob) || "wav";

      const isFirstTurnUserFirst = userSpeaksFirst && history.length === 0;

      const res = await runService("CONVERSATION", () =>
        conversationService.respondToConversation({
          conversationId,
          audioData: base64,
          audioFormat,
          conversationHistory: isFirstTurnUserFirst ? [] : history,
          language: "ja",
          level,
          scenario: originalScenario,
        })
      );

      setLoading(false);
      if (!res) {
        setUserTyping(false);
        setAiTyping(false);
        return;
      }

      const data = res?.data?.data;
      if (!data) {
        setError("Không thể gửi câu trả lời.");
        setUserTyping(false);
        setAiTyping(false);
        return;
      }

      // USER gửi xong → AI bắt đầu typing
      setUserTyping(false);
      setAiTyping(true);

      // ⏱ delay giả lập AI đang gõ (rất quan trọng cho UX)
      await new Promise((r) => setTimeout(r, 700));

      // cập nhật hội thoại
      const hist = normalizeHistory(data.conversationHistory || []);
      setHistory(hist);
      setTurnNumber(data.turnNumber || turnNumber + 1);
      setAudioBlob(null);

      // NEW: turnFeedback optional
      setTurnFeedback(data.turnFeedback || null);

      // tìm câu AI mới nhất
      const lastAI = [...hist].reverse().find((m) => m.role === "ai");

      // play audio / TTS
      speakJapanese(lastAI?.text);

      // AI gõ xong
      setAiTyping(false);

      if (data.isEnding) {
        await handleEnd(true);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
      setError("Lỗi xử lý hội thoại. Vui lòng thử lại.");
      setUserTyping(false);
      setAiTyping(false);
    }
  };

  /* ===============================
     END
  ================================ */
  const handleEnd = async (silent = false) => {
    if (!conversationId) return;

    setEnding(true);
    if (!silent) setError(null);

    const res = await runService("CONVERSATION", () =>
      conversationService.endConversation({
        conversationId,
        conversationHistory: history,
        level,
        scenario: originalScenario,
      })
    );

    setEnding(false);
    if (!res) return;

    setEndResult(res?.data?.data || null);
  };
  

  /* ===============================
     RESET
  ================================ */
  const handleReset = () => {
    if (STORAGE_KEY) localStorage.removeItem(STORAGE_KEY);

    setConversationId(null);
    setHistory([]);
    setTurnNumber(0);
    setOriginalScenario("");
    setAudioBlob(null);
    setLoading(false);
    setEnding(false);
    setError(null);
    setEndResult(null);

    setUserSpeaksFirst(false);
    setStartingSuggestions([]);
    setSelectedSuggestion(null);
    setTurnFeedback(null);

    // ✅ reset typing
    setUserTyping(false);
    setAiTyping(false);
  };

  /* ===============================
     SUGGESTION ACTION
  ================================ */
  const handlePickSuggestion = (raw) => {
    const { jp } = parseSuggestion(raw);
    setSelectedSuggestion(jp);
    speakJapanese(stripRomaji(jp));
  };

  /* ===============================
     RENDER
  ================================ */
  return (
    <div className={styles.page}>
      <HeroSection />

      <main className={styles.main}>
        {/* LEFT */}
        <section className={`${styles.card} ${styles.leftCard}`}>
          <div className={styles.cardHeader}>
            <h3 className={styles.sectionTitle}>Thiết lập hội thoại</h3>
            <div className={styles.badge}>{progressText}</div>
          </div>

          <div className={styles.formRow}>
            <label className={styles.label}>Trình độ</label>
            <select
              className={styles.select}
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              disabled={started || loading || ending}
            >
              {LEVELS.map((lv) => (
                <option key={lv} value={lv}>
                  {lv}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formRow}>
            <label className={styles.label}>Tình huống</label>
            <textarea
              className={styles.textarea}
              value={scenario}
              onChange={(e) => {
                const val = e.target.value || "";
                setScenario(val.slice(0, SCENARIO_MAX));
              }}
              disabled={started || loading || ending}
            />
            <div className={styles.note}>
              <span className={styles.noteKey}>Độ dài:</span>{" "}
              <span className={styles.noteVal}>
                {scenario.trim().length}/{SCENARIO_MAX}
              </span>
            </div>

            {started && (
              <div className={styles.note}>
                <span className={styles.noteKey}>Scenario:</span>{" "}
                <span className={styles.noteVal}>
                  {safeText(originalScenario)}
                </span>
              </div>
            )}
          </div>

          {/* ACTIONS */}
          <div className={styles.actions}>
            {!started ? (
              <button
                className={styles.primaryBtn}
                onClick={handleStart}
                disabled={loading || ending}
              >
                {loading ? "Đang bắt đầu..." : "Bắt đầu trò chuyện"}
              </button>
            ) : (
              <>
                <button
                  className={styles.secondaryBtn}
                  onClick={() => handleEnd(false)}
                  disabled={loading || ending}
                >
                  {ending ? "Đang kết thúc..." : "Kết thúc"}
                </button>
                <button
                  className={styles.ghostBtn}
                  onClick={handleReset}
                  disabled={loading || ending}
                >
                  Làm lại
                </button>
              </>
            )}
          </div>

          {/* USER SPEAKS FIRST – SUGGESTIONS */}
          {started && userSpeaksFirst && !endResult && (
            <div className={styles.suggestionBlock}>
              <div className={styles.suggestionTitle}>
                Gợi ý mở đầu (bạn nói trước)
              </div>

              {startingSuggestions.length ? (
                <div className={styles.suggestionGrid}>
                  {startingSuggestions.slice(0, 3).map((s, idx) => {
                    const { jp, vi } = parseSuggestion(s);
                    const active = selectedSuggestion === jp;
                    return (
                      <button
                        key={idx}
                        className={`${styles.suggestionItem} ${
                          active ? styles.activeSuggestion : ""
                        }`}
                        onClick={() => handlePickSuggestion(s)}
                      >
                        <div className={styles.sgJp}>{jp}</div>
                        <div className={styles.sgVi}>{vi}</div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.suggestionEmpty}>
                  (Không có gợi ý – bạn có thể tự nói)
                </div>
              )}
            </div>
          )}

          <div className={styles.divider} />

          <div className={styles.recorderBlock}>
            <AudioRecorder onAudioReady={handleAudioReady} />
            <button
              className={styles.primaryBtn}
              onClick={handleRespond}
              disabled={!started || loading || ending}
              style={{ marginTop: 12 }}
            >
              {loading
                ? "Đang gửi..."
                : waitingFirstUserAudio
                ? "Gửi câu mở đầu"
                : "Gửi câu trả lời"}
            </button>
          </div>

          {/* NEW: hiển thị feedback theo lượt */}
          {turnFeedback && !endResult ? (
            <div className={styles.turnFeedbackBox}>
              <div className={styles.turnFeedbackTitle}>
                {" "}
                <GiBrain />
                Phản hồi lượt này
              </div>
              <div className={styles.turnFeedbackText}>
                {turnFeedback.feedbackVi || "—"}
              </div>
              {turnFeedback.suggestionVi ? (
                <div className={styles.turnFeedbackHint}>
                  <FaLightbulb /> {turnFeedback.suggestionVi}
                </div>
              ) : null}
            </div>
          ) : null}

          {error && <div className={styles.errorBox}>❌ {error}</div>}
        </section>

        {/* RIGHT */}
        <section className={`${styles.card} ${styles.rightCard}`}>
          {!endResult ? (
            <div className={styles.chatBox}>
              {history.length ? (
                <>
                  {history.map((m, idx) => (
                    <ChatBubble
                      key={`${m.role}-${idx}`}
                      role={m.role}
                      jp={m.text}
                      vi={m.textVi}
                      ts={m.timestamp}
                    />
                  ))}

                  {/*  typing bubbles */}
                  {userTyping && <ChatBubble role="user" isTyping />}
                  {aiTyping && <ChatBubble role="ai" isTyping />}
                </>
              ) : started && userSpeaksFirst ? (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>🎤</div>
                  <div className={styles.guide}>
                    <p className={styles.guideTitle}>
                      Bạn sẽ là người nói trước
                    </p>
                    <ol className={styles.guideList}>
                      <li>Chọn một gợi ý mở đầu (hoặc tự nói).</li>
                      <li>Ghi âm câu tiếng Nhật bạn muốn nói.</li>
                      <li>
                        Bấm <b>Gửi câu mở đầu</b> để AI phản hồi.
                      </li>
                    </ol>
                  </div>
                </div>
              ) : (
                <div className={styles.empty}>
                  <div className={styles.guide}>
                    <p className={styles.guideTitle}>
                      Cách bắt đầu trò chuyện cùng AI 💬
                    </p>
                    <ol className={styles.guideList}>
                      <li>Chọn trình độ JLPT phù hợp.</li>
                      <li>Nhập tình huống hội thoại bạn muốn luyện tập.</li>
                      <li>
                        Bấm <b>Bắt đầu trò chuyện</b> để AI hỏi câu đầu tiên.
                      </li>
                      <li>Nghe câu hỏi và ghi âm câu trả lời của bạn.</li>
                      <li>Gửi câu trả lời để tiếp tục hội thoại.</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <ResultPanel result={endResult} onRestart={handleReset} />
          )}
        </section>
      </main>
    </div>
  );
}
