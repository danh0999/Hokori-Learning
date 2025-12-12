// src/pages/AiConversationPage/AiConversationPage.jsx
import React, { useCallback, useMemo, useState } from "react";
import styles from "./AiConversationPage.module.scss";

import HeroSection from "./components/HeroSection";
import ChatBubble from "./components/ChatBubble";
import ResultPanel from "./components/ResultPanel";

// Reuse recorder + utils từ Kaiwa (đỡ duplicate)
import AudioRecorder from "../../pages/AiKaiwa/components/AudioRecorder";
import { convertBlobToBase64, getAudioFormat } from "../../utils/audioUtils";

import useAiService from "../../hooks/useAiService";
import { conversationService } from "../../services/conversationService";
const LEVELS = ["N5", "N4", "N3", "N2", "N1"];

const safeText = (v) => (typeof v === "string" ? v : "");

const playBase64Mp3 = async (base64) => {
  if (!base64) return;
  try {
    // BE trả audioUrl base64 mp3
    const audio = new Audio(`data:audio/mpeg;base64,${base64}`);
    await audio.play();
  } catch (e) {
    // không crash UI nếu browser chặn autoplay
    console.warn("Audio autoplay blocked:", e);
  }
};

export default function AiConversationPage() {
  const { runService } = useAiService();

  // input (pre-start)
  const [level, setLevel] = useState("N5");
  const [scenario, setScenario] = useState("");

  // session state
  const [conversationId, setConversationId] = useState(null);
  const [history, setHistory] = useState([]);
  const [turnNumber, setTurnNumber] = useState(0);
  const [maxTurns, setMaxTurns] = useState(7);
  const [originalScenario, setOriginalScenario] = useState("");

  // audio
  const [audioBlob, setAudioBlob] = useState(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState(null);

  // result
  const [endResult, setEndResult] = useState(null);

  const started = !!conversationId && !endResult;

  const handleAudioReady = useCallback((blob) => {
    setAudioBlob(blob);
  }, []);

  const progressText = useMemo(() => {
    if (!started) return "Chưa bắt đầu";
    return `Turn ${turnNumber}/${maxTurns}`;
  }, [started, turnNumber, maxTurns]);

  const handleStart = async () => {
    if (!scenario.trim()) {
      setError("Nhập tình huống trước đã (ví dụ: nhà hàng, mua sắm, xin việc, ...).");
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

    if (!res) return; // hết quota -> modal tự bật

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

    // play first AI audio
    playBase64Mp3(data.audioUrl);
  };

  const handleRespond = async () => {
    if (!started) return;

    if (!audioBlob) {
      setError("Mày phải ghi âm câu trả lời trước đã.");
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
          conversationHistory: history, // IMPORTANT: FE tự maintain & gửi mỗi lần
          level,
          scenario: originalScenario || scenario.trim(),
        })
      );

      setLoading(false);

      if (!res) return; // hết quota -> modal

      const data = res?.data?.data;
      if (!data) {
        setError("Không thể gửi câu trả lời. Vui lòng thử lại.");
        return;
      }

      // IMPORTANT: lấy history từ BE (đã update đủ AI/User/AI)
      setHistory(data.conversationHistory || []);
      setTurnNumber(data.turnNumber || turnNumber + 1);

      // reset recorder
      setAudioBlob(null);

      // play next AI audio
      playBase64Mp3(data.audioUrl);

      // auto end nếu BE báo kết thúc
      if (data.isEnding || (data.turnNumber || 0) >= (data.maxTurns || maxTurns)) {
        await handleEnd(true);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
      setError("Lỗi xử lý audio / hội thoại. Thử ghi âm lại hoặc kiểm tra mic.");
    }
  };

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

    if (!res) return; // hết quota -> modal

    const data = res?.data?.data;
    if (!data) {
      if (!silent) setError("Không thể kết thúc & lấy đánh giá. Vui lòng thử lại.");
      return;
    }

    setEndResult(data);
  };

  const handleReset = () => {
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

  return (
    <div className={styles.page}>
      <HeroSection />

      <main className={styles.main}>
        {/* LEFT: Setup + Recorder */}
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
              placeholder='Ví dụ: "nhà hàng", "mua sắm", "gọi cảnh sát", ...'
            />
            {started && (
              <div className={styles.note}>
                <span className={styles.noteKey}>Scenario:</span>{" "}
                <span className={styles.noteVal}>{safeText(originalScenario)}</span>
              </div>
            )}
          </div>

          <div className={styles.actions}>
            {!started ? (
              <button className={styles.primaryBtn} onClick={handleStart} disabled={loading || ending}>
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

                <button className={styles.ghostBtn} onClick={handleReset} disabled={loading || ending}>
                  Làm lại
                </button>
              </>
            )}
          </div>

          <div className={styles.divider} />

          <div className={styles.recorderBlock}>
            <h4 className={styles.subTitle}>Ghi âm câu trả lời</h4>
            <p className={styles.subDesc}>
              AI hỏi xong thì mày ghi âm trả lời. Xong bấm <b>Gửi câu trả lời</b>.
            </p>

            <AudioRecorder onAudioReady={handleAudioReady} />

            <button
              className={styles.primaryBtn}
              onClick={handleRespond}
              disabled={!started || loading || ending}
              style={{ marginTop: 12 }}
            >
              {loading ? "Đang gửi..." : "Gửi câu trả lời"}
            </button>

            {!audioBlob && started && <p className={styles.hint}>Chưa có audio mới. Hãy ghi âm trước.</p>}
          </div>

          {error && <div className={styles.errorBox}>❌ {error}</div>}
        </section>

        {/* RIGHT: Chat / Result */}
        <section className={`${styles.card} ${styles.rightCard}`}>
          {!endResult ? (
            <>
              <div className={styles.cardHeader}>
                <h3 className={styles.sectionTitle}>Trò chuyện cùng AI</h3>
                <div className={styles.smallNote}>AI sẽ hiển thị tiếng Nhật + dịch Việt.</div>
              </div>

              <div className={styles.chatBox}>
                {history?.length ? (
                  history.map((m, idx) => (
                    <ChatBubble
                      key={`${m.role || "msg"}-${idx}`}
                      role={m.role}
                      jp={m.text || m.aiQuestion || m.userTranscript}
                      vi={m.textVi || m.aiQuestionVi || m.userTranscriptVi}
                      ts={m.timestamp}
                    />
                  ))
                ) : (
                  <div className={styles.empty}>
                    <div className={styles.emptyIcon}>💬</div>
                    <p>Chưa có hội thoại. Bấm “Bắt đầu trò chuyện” để AI hỏi câu đầu tiên.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <ResultPanel result={endResult} onRestart={handleReset} />
          )}
        </section>
      </main>
    </div>
  );
}
