// src/pages/AiAnalysePage/components/AnalysisResult.jsx
import React from "react";
import styles from "./AnalysisResult.module.scss";
import { HiMiniSpeakerWave } from "react-icons/hi2";
import { IoIosArrowRoundForward } from "react-icons/io";
import { FaBook, FaCode, FaSitemap, FaLightbulb } from "react-icons/fa6";

const AnalysisResult = ({ loading, error, data }) => {
  /* ===========================================
     TEXT TO SPEECH – Japan Voice
  ============================================ */
  const speakJapanese = (text) => {
    if (!text) return;

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "ja-JP";
    utter.rate = 1;
    utter.pitch = 1;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  const isJapanese = (text) => /[\u3040-\u30FF\u4E00-\u9FAF]/.test(text);

  /* ===========================================
     LOADING / ERROR / EMPTY
  ============================================ */
  if (loading)
    return (
      <div className={styles.loading}>
        <div className={styles.dot}></div>
        <div className={styles.dot}></div>
        <div className={styles.dot}></div>
      </div>
    );

  if (error)
    return <div className={`${styles.state} ${styles.error}`}>{error}</div>;

  if (!data)
    return (
      <div className={styles.state}>
        Nhập câu &amp; bấm phân tích để xem kết quả.
      </div>
    );

  /* ===========================================
     DATA FIELDS
  ============================================ */
  const {
    sentence, // câu tiếng Nhật (gốc hoặc đã dịch)
    originalSentence, // câu tiếng Việt (nếu input Việt)
    isTranslated, // true nếu input Việt
    vietnameseTranslation, // câu tiếng Việt nghĩa (nếu input Nhật)
    level,
    vocabulary,
    grammar,
    sentenceBreakdown,
    relatedSentences,
  } = data;

  /* ===========================================
     UI MAIN RETURN
  ============================================ */
  return (
    <div className={styles.fadeIn}>
      <div className={styles.card}>

        {/* ========= Header ========= */}
        <div className={styles.header}>
          <h3>Kết quả phân tích</h3>
          {level && <span className={styles.levelTag}>{level}</span>}
        </div>

        {/* ============================================================
           CASE 1 — NGƯỜI DÙNG NHẬP TIẾNG VIỆT
           - originalSentence = Vietnamese
           - sentence = Japanese
           - isTranslated = true
        ============================================================ */}
        {isTranslated && originalSentence ? (
          <div className={styles.translationBlock}>

            <div className={styles.comparisonRow}>
              {/* ---- Câu tiếng Việt ---- */}
              <div className={styles.originalBox}>
                <label>Tiếng Việt (câu gốc)</label>
                <p>{originalSentence}</p>
              </div>

              {/* ---- Câu tiếng Nhật (đã dịch) + loa ---- */}
              <div className={styles.jpBox}>
                <label>
                  <IoIosArrowRoundForward />
                  Tiếng Nhật (dùng để phân tích)
                </label>

                <div className={styles.jpLine}>
                  <span>{sentence}</span>

                  {isJapanese(sentence) && (
                    <button
                      className={styles.speakerBtn}
                      onClick={() => speakJapanese(sentence)}
                      title="Phát âm tiếng Nhật"
                    >
                      <HiMiniSpeakerWave size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================
             CASE 2 — NGƯỜI DÙNG NHẬP TIẾNG NHẬT
             - originalSentence = null
             - sentence = Japanese
             - vietnameseTranslation = Vietnamese meaning
           ============================================================ */
          <div className={styles.jpBlock}>

            {/* ---- Câu Nhật + loa ---- */}
            <div className={styles.sentenceBox}>
              <label>Câu tiếng Nhật</label>

              <div className={styles.jpLine}>
                <span>{sentence}</span>

                {isJapanese(sentence) && (
                  <button
                    className={styles.speakerBtn}
                    onClick={() => speakJapanese(sentence)}
                    title="Phát âm tiếng Nhật"
                  >
                    <HiMiniSpeakerWave size={20} />
                  </button>
                )}
              </div>
            </div>

            {/* ---- Dịch sang tiếng Việt (BE trả về) ---- */}
            {vietnameseTranslation && (
              <div className={styles.translatedBox}>
                <label>Ý nghĩa tiếng Việt</label>
                <p>{vietnameseTranslation}</p>
              </div>
            )}
          </div>
        )}

        {/* ========= Vocabulary ========= */}
        <Section
          title="Từ vựng"
          icon={<FaBook />}
          items={vocabulary}
          type="vocab"
        />

        {/* ========= Grammar ========= */}
        <Section
          title="Ngữ pháp"
          icon={<FaCode />}
          items={grammar}
          type="grammar"
        />

        {/* ========= Sentence Breakdown ========= */}
        {sentenceBreakdown && (
          <div className={styles.breakdownCard}>
            <div className={styles.sectionHeader}>
              <FaSitemap className={styles.sectionIcon} />
              <h4>Cấu trúc câu</h4>
            </div>

            {sentenceBreakdown.subject && (
              <p>
                <strong>Chủ ngữ:</strong> {sentenceBreakdown.subject}
              </p>
            )}
            {sentenceBreakdown.object && (
              <p>
                <strong>Tân ngữ:</strong> {sentenceBreakdown.object}
              </p>
            )}
            {sentenceBreakdown.predicate && (
              <p>
                <strong>Động từ:</strong> {sentenceBreakdown.predicate}
              </p>
            )}

            {sentenceBreakdown.explanationVi && (
              <p className={styles.explain}>
                {sentenceBreakdown.explanationVi}
              </p>
            )}
          </div>
        )}

        {/* ========= Related Sentences ========= */}
        {relatedSentences?.length > 0 && (
          <div className={styles.relatedCard}>
            <div className={styles.sectionHeader}>
              <FaLightbulb className={styles.sectionIcon} />
              <h4>Các câu liên quan</h4>
            </div>

            <div className={styles.relatedGrid}>
              {relatedSentences.map((s, i) => (
                <div
                  key={i}
                  className={`${styles.relatedItem} ${styles.blockAnim}`}
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================
   SECTION COMPONENT (Vocabulary / Grammar blocks)
============================================================ */
const Section = ({ title, icon, items, type }) => (
  <div className={styles.sectionCard}>
    <div className={styles.sectionHeader}>
      {icon}
      <h4>{title}</h4>
    </div>

    <div className={styles.twoColumn}>
      {items?.map((item, i) => (
        <div
          key={i}
          className={`${styles.blockItem} ${styles.blockAnim}`}
          style={{ animationDelay: `${i * 0.06}s` }}
        >
          {/* ---- Title ---- */}
          <div className={styles.blockTitle}>
            {type === "vocab"
              ? `${item.word}（${item.reading}）`
              : item.pattern}
          </div>

          {/* ---- Content ---- */}
          <div className={styles.blockContent}>
            {type === "vocab" ? (
              <>
                <p>
                  <strong>Nghĩa:</strong> {item.meaningVi}
                </p>
                <p>
                  <strong>JLPT:</strong> {item.jlptLevel}
                </p>

                {item.examples && (
                  <ul>
                    {item.examples.map((ex, j) => (
                      <li key={j}>{ex}</li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <>
                <p>
                  <strong>Giải thích:</strong> {item.explanationVi}
                </p>
                {item.example && (
                  <p>
                    <strong>Ví dụ:</strong> {item.example}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default AnalysisResult;
