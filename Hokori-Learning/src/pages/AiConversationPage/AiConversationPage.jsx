import React, { useCallback, useMemo, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import styles from "./AiConversationPage.module.scss";

import HeroSection from "./components/HeroSection";
import ChatBubble from "./components/ChatBubble";
import ResultPanel from "./components/ResultPanel";

import AudioRecorder from "../../pages/AiKaiwa/components/AudioRecorder";
import { convertBlobToBase64, getAudioFormat } from "../../utils/audioUtils";

import useAiService from "../../hooks/useAiService";
import { conversationService } from "../../services/conversationService";

const LEVELS = ["N5", "N4", "N3", "N2", "N1"];
const safeText = (v) => (typeof v === "string" ? v : "");

const STORAGE_PREFIX = "ai_conversation_session_";
const MAX_AUDIO_MB = 1.3;

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
   FE TTS – chỉ đọc tiếng Nhật
================================ */
const speakJapanese = (jpText) => {
  if (!jpText) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(jpText);
    utter.lang = "ja-JP";
    utter.rate = 0.95;
    window.speechSynthesis.speak(utter);
  } catch (e) {
    console.warn("TTS error:", e);
  }
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
  const [turnNumber, setTurnNumber] = useState(0); // chỉ tracking
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
    if (trimmedScenario.length < 5) {
      setError("Vui lòng nhập tình huống rõ ràng hơn (ít nhất 5 ký tự).");
      return;
    }

    setLoading(true);
    setError(null);
    setEndResult(null);
    setAudioBlob(null);
    setHistory([]);
    setTurnNumber(0);
    setSelectedSuggestion(null);

    const res = await runService("CONVERSATION", () =>
      conversationService.startConversation({
        level,
        scenario: trimmedScenario,
      })
    );

    setLoading(false);
    if (!res) return;

    const data = res?.data?.data;
    if (!data) {
      setError("Không thể bắt đầu hội thoại.");
      return;
    }

    setConversationId(data.conversationId);
    setTurnNumber(data.turnNumber || 1);
    setOriginalScenario(data.originalScenario || trimmedScenario);

    const isUserFirst = !!data.userSpeaksFirst;
    setUserSpeaksFirst(isUserFirst);

    if (isUserFirst) {
      setStartingSuggestions(data.startingSuggestions || []);
      setHistory([]);
      return;
    }

    setStartingSuggestions([]);
    setHistory(data.conversationHistory || []);

    const firstAI = data.conversationHistory?.[0];
    speakJapanese(stripRomaji(firstAI?.text));
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
          level,
          scenario: originalScenario,
        })
      );

      setLoading(false);
      if (!res) return;

      const data = res?.data?.data;
      if (!data) {
        setError("Không thể gửi câu trả lời.");
        return;
      }

      setHistory(data.conversationHistory || []);
      setTurnNumber(data.turnNumber || turnNumber + 1);
      setAudioBlob(null);

      const lastAI = [...(data.conversationHistory || [])]
        .reverse()
        .find((m) => m.role === "AI");

      speakJapanese(stripRomaji(lastAI?.text));

      if (data.isEnding) {
        await handleEnd(true);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
      setError("Lỗi xử lý hội thoại. Vui lòng thử lại.");
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
              onChange={(e) => setScenario(e.target.value)}
              disabled={started || loading || ending}
            />
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

          {error && <div className={styles.errorBox}>❌ {error}</div>}
        </section>

        {/* RIGHT */}
        <section className={`${styles.card} ${styles.rightCard}`}>
          {!endResult ? (
            <div className={styles.chatBox}>
              {history.length ? (
                history.map((m, idx) => (
                  <ChatBubble
                    key={`${m.role}-${idx}`}
                    role={m.role}
                    jp={m.text}
                    vi={m.textVi}
                    ts={m.timestamp}
                  />
                ))
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
