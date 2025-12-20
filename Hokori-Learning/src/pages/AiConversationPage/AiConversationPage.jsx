// src/pages/AiConversationPage/AiConversationPage.jsx
import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
} from "react";
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

/* ===============================
   Helper: bỏ romaji trong ngoặc ()
================================ */
const stripRomaji = (text = "") => {
  if (!text) return "";
  return text.split("(")[0].trim();
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
  const [turnNumber, setTurnNumber] = useState(0);
  const [maxTurns, setMaxTurns] = useState(7);
  const [originalScenario, setOriginalScenario] = useState("");

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

  /* ===============================
     LOAD LOCAL STORAGE (RESUME MODE)
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
      setMaxTurns(saved.maxTurns || 7);
      setEndResult(saved.endResult || null);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [STORAGE_KEY]);

  /* ===============================
     SAVE LOCAL STORAGE
  ================================ */
  useEffect(() => {
    if (!STORAGE_KEY || !conversationId) return;

    const dataToSave = {
      level,
      scenario,
      originalScenario,
      conversationId,
      history,
      turnNumber,
      maxTurns,
      endResult,
      savedAt: Date.now(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [
    STORAGE_KEY,
    level,
    scenario,
    originalScenario,
    conversationId,
    history,
    turnNumber,
    maxTurns,
    endResult,
  ]);

  /* ===============================
     HANDLERS
  ================================ */
  const handleAudioReady = useCallback((blob) => {
    setAudioBlob(blob);
  }, []);

  const progressText = useMemo(() => {
    if (!started) return "Chưa bắt đầu";
    return `Turn ${turnNumber}/${maxTurns}`;
  }, [started, turnNumber, maxTurns]);

  /* ===============================
     START (NEW CONVERSATION)
  ================================ */
  const handleStart = async () => {
    if (!scenario.trim()) {
      setError(
        "Vui lòng nhập tình huống trước (ví dụ: nhà hàng, mua sắm, xin việc…)."
      );
      return;
    }

    setLoading(true);
    setError(null);
    setEndResult(null);
    setAudioBlob(null);

    const res = await runService("CONVERSATION", () =>
      conversationService.startConversation({
        level,
        scenario: scenario.trim(),
      })
    );

    setLoading(false);
    if (!res) return;

    const data = res?.data?.data;
    if (!data) {
      setError("Không thể bắt đầu hội thoại. Vui lòng thử lại.");
      return;
    }

    setConversationId(data.conversationId);
    setHistory(data.conversationHistory || []);
    setTurnNumber(data.turnNumber || 1);
    setMaxTurns(data.maxTurns || 7);
    setOriginalScenario(data.originalScenario || scenario.trim());

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

    setLoading(true);
    setError(null);

    try {
      const base64 = await convertBlobToBase64(audioBlob);
      const audioFormat = getAudioFormat(audioBlob) || "wav";

      const res = await runService("CONVERSATION", () =>
        conversationService.respondToConversation({
          conversationId,
          audioData: base64,
          audioFormat,
          conversationHistory: history,
          level,
          scenario: originalScenario || scenario.trim(),
        })
      );

      setLoading(false);
      if (!res) return;

      const data = res?.data?.data;
      if (!data) {
        setError("Không thể gửi câu trả lời. Vui lòng thử lại.");
        return;
      }

      setHistory(data.conversationHistory || []);
      setTurnNumber(data.turnNumber || turnNumber + 1);
      setAudioBlob(null);

      const lastAI = [...(data.conversationHistory || [])]
        .reverse()
        .find((m) => m.role === "AI");

      speakJapanese(stripRomaji(lastAI?.text));

      if (
        data.isEnding ||
        (data.turnNumber || 0) >= (data.maxTurns || maxTurns)
      ) {
        await handleEnd(true);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
      setError("Lỗi xử lý hội thoại. Kiểm tra mic và thử lại.");
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

    const data = res?.data?.data;
    if (!data && !silent) {
      setError("Không thể kết thúc & lấy đánh giá.");
      return;
    }

    setEndResult(data);
  };

  /* ===============================
     RESET (START NEW MODE)
  ================================ */
  const handleReset = () => {
    if (STORAGE_KEY) {
      localStorage.removeItem(STORAGE_KEY);
    }

    setConversationId(null);
    setHistory([]);
    setTurnNumber(0);
    setMaxTurns(7);
    setOriginalScenario("");
    setAudioBlob(null);
    setLoading(false);
    setEnding(false);
    setError(null);
    setEndResult(null);
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
              rows={3}
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
                  {ending ? "Đang kết thúc..." : "Kết thúc sớm"}
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

          <div className={styles.divider} />

          <div className={styles.recorderBlock}>
            <AudioRecorder onAudioReady={handleAudioReady} />
            <button
              className={styles.primaryBtn}
              onClick={handleRespond}
              disabled={!started || loading || ending}
              style={{ marginTop: 12 }}
            >
              {loading ? "Đang gửi..." : "Gửi câu trả lời"}
            </button>
          </div>

          {error && <div className={styles.errorBox}>❌ {error}</div>}
        </section>

        {/* RIGHT */}
        <section className={`${styles.card} ${styles.rightCard}`}>
          {!endResult ? (
            <div className={styles.chatBox}>
              {history?.length ? (
                history.map((m, idx) => (
                  <ChatBubble
                    key={`${m.role}-${idx}`}
                    role={m.role}
                    jp={m.text}
                    vi={m.textVi}
                    ts={m.timestamp}
                  />
                ))
              ) : (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>💬</div>
                  <div className={styles.guide}>
                    <p className={styles.guideTitle}>
                      Cách bắt đầu trò chuyện cùng AI
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
