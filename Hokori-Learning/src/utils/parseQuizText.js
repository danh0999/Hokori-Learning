// utils/parseQuizText.js — v2.4 (TF + Audio block-level)

/**
 * Hỗ trợ:
 * - Multiple choice A/B/C/D
 * - True/False
 * - 1 audio chung cho nhiều câu (Audio: xxx đặt trước block)
 * - Audio riêng cho từng câu (Audio: xxx đặt cạnh câu)
 */

const isBlank = (s) => !s || !String(s).trim();

// Chuẩn hoá ký tự “thông minh” & mũi tên, gạch, khoảng trắng
function normalize(s) {
  return String(s)
    .replace(/\r/g, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—−]/g, "-") // en/em dash → -
    .replace(/[→⇒➔➜➝➤►›»]/g, "/") // các mũi tên → slash
    .replace(/\s*\/\s*/g, " / ") // chuẩn hoá khoảng trắng quanh /
    .replace(/\s+/g, (m) => (m.includes("\n") ? "\n" : " "))
    .trim();
}

// A. xxx
const optLetterRe = /^[A-H]\.\s*(.+)$/i;
// - [x] xxx  | - xxx | • xxx | ・xxx
const bulletRe = /^[ \- \* \u2022 \u30FB]\s*(\[[xX ]\])?\s*(.+)$/;
// Answer: xxx
const ansLineRe = /^ans(?:wer)?\s*:\s*(.+)$/i;
// Q1) | Q1. | 1) | 1.
const qStartRe = /^(?:Q\s*\d+[:.)]|\d+[:.)])/i;
// Audio: path/to/file.mp3  (hoặc audio - xxx)
const audioRe = /^audio\s*[:\-]\s*(.+)$/i;

// Nhận T/F rất rộng: True/False, T/F, Đúng/Sai, True - False, True / False...
const tfInlineRe =
  /(true|t|đúng)\s*(?:\/|-|\s\/\s|\s-\s)\s*(false|f|sai)|(false|f|sai)\s*(?:\/|-|\s\/\s|\s-\s)\s*(true|t|đúng)/i;

// 🔥 Audio dùng chung cho nhiều câu
let currentAudioPath = "";

/**
 * Flush 1 block câu hỏi ra mảng out[]
 */
function flushBlock(block, out) {
  if (!block) return;

  const options = [];
  let sawTF = false;

  if (tfInlineRe.test(block.qText)) sawTF = true;

  // gom option lines
  block.optLines.forEach((l) => {
    const mA = l.match(optLetterRe);
    if (mA) {
      options.push({ text: mA[1].trim(), lettered: true });
      return;
    }
    const mB = l.match(bulletRe);
    if (mB) {
      const checked = mB[1] && /\[x\]/i.test(mB[1]);
      options.push({ text: mB[2].trim(), checked });
      return;
    }
    if (tfInlineRe.test(l)) sawTF = true;
  });

  // Nếu là TF mà chưa có option, tạo mặc định
  if (sawTF && options.length === 0) {
    options.push({ text: "True" }, { text: "False" });
  }

  // xác định đáp án đúng
  let correctIdx = [];
  if (block.answerRaw) {
    const ans = block.answerRaw.trim();

    // Nếu chỉ có Answer: True/False mà KHÔNG có option → tạo option TF
    if (/^(true|false|t|f|đúng|sai)$/i.test(ans) && options.length === 0) {
      if (!sawTF) sawTF = true;
      options.push({ text: "True" }, { text: "False" });
    }

    // TF
    if (/^(true|t|đúng)$/i.test(ans)) correctIdx = [0];
    else if (/^(false|f|sai)$/i.test(ans)) correctIdx = [1];
    else {
      // A,C hoặc 1,3
      const tokens = ans
        .split(/[,; ]+/)
        .map((x) => x.trim())
        .filter(Boolean);
      tokens.forEach((tk) => {
        if (/^[A-H]$/i.test(tk)) {
          // map theo thứ tự xuất hiện A,B,C... trong options lettered
          let idx = -1;
          let letterCount = 0;
          for (let i = 0; i < options.length; i++) {
            if (options[i].lettered) {
              const expected = String.fromCharCode(65 + letterCount);
              if (expected === tk.toUpperCase()) {
                idx = i;
                break;
              }
              letterCount++;
            }
          }
          if (idx < 0) idx = tk.toUpperCase().charCodeAt(0) - 65; // fallback
          if (idx >= 0 && idx < options.length) correctIdx.push(idx);
        } else if (/^\d+$/.test(tk)) {
          const i = parseInt(tk, 10) - 1;
          if (i >= 0 && i < options.length) correctIdx.push(i);
        }
      });
    }
  } else {
    // không có Answer: → lấy [x]
    options.forEach((o, i) => o.checked && correctIdx.push(i));
  }

  // loại câu
  let type = "single";
  if (
    (sawTF || options.length === 2) &&
    /true|false/i.test((options[0]?.text || "") + (options[1]?.text || ""))
  ) {
    type = "truefalse";
  } else if (correctIdx.length > 1) {
    type = "multiple";
  } else {
    type = "single";
  }

  const q = {
    id: crypto.randomUUID(),
    type,
    text: (block.qText || "(Untitled)").trim(),
    points: 1,
    options:
      type === "truefalse"
        ? [
            {
              id: crypto.randomUUID(),
              text: "True",
              correct: correctIdx.includes(0),
            },
            {
              id: crypto.randomUUID(),
              text: "False",
              correct: correctIdx.includes(1),
            },
          ]
        : options.map((o, i) => ({
            id: crypto.randomUUID(),
            text: o.text,
            correct: correctIdx.includes(i),
          })),
    answers: [],
    explanation: "",
  };

  // 👉 Gắn audio: ưu tiên block.audioPath, nếu không thì dùng currentAudioPath
  const mergedAudio = block.audioPath || currentAudioPath;
  if (mergedAudio) {
    q.audioPath = mergedAudio.trim();
  }

  // safety: nếu chưa tìm được đáp án
  if (type !== "truefalse" && q.options.length && correctIdx.length === 0) {
    q.options[0].correct = true;
  }

  out.push(q);
}

export function parseQuizFromText(input) {
  const norm = normalize(input || "");
  const lines = norm.split("\n");

  const out = [];
  let block = null;

  const startNew = (firstLine) => {
    if (
      block &&
      (!isBlank(block.qText) || block.optLines.length || block.answerRaw)
    ) {
      flushBlock(block, out);
    }
    block = {
      qText: (firstLine || "").trim(),
      optLines: [],
      answerRaw: "",
      audioPath: "",
    };
  };

  // Mỗi lần parse mới → reset audio dùng chung
  currentAudioPath = "";

  for (const raw of lines) {
    const line = raw.trim();
    if (isBlank(line)) continue;

    // 1) Answer line
    const am = line.match(ansLineRe);
    if (am) {
      if (!block) startNew("");
      block.answerRaw = am[1];
      continue;
    }

    // 2) Audio line (dùng chung / hoặc override)
    const au = line.match(audioRe);
    if (au) {
      const normalizedAudioPath = au[1].replace(/\s*\/\s*/g, "/").trim();
      // set audio global cho các câu sau
      currentAudioPath = normalizedAudioPath;
      // nếu đang trong 1 block thì gán cho block hiện tại luôn (trường hợp audio riêng)
      if (!block) startNew("");
      block.audioPath = normalizedAudioPath;
      continue;
    }

    // 3) BẮT ĐẦU CÂU HỎI MỚI? (ưu tiên trước option)
    if (qStartRe.test(line)) {
      const cleaned = line.replace(/^Q?\s*\d+[:.)]\s*/i, "");
      startNew(cleaned);
      continue;
    }

    // 4) OPTION line?
    if (
      optLetterRe.test(line) ||
      bulletRe.test(line) ||
      tfInlineRe.test(line)
    ) {
      if (!block) startNew("");
      block.optLines.push(line);
      continue;
    }

    // 5) Văn bản thường
    if (!block) startNew(line);
    else if (isBlank(block.qText)) block.qText = line;
    else block.qText += " " + line;
  }

  if (
    block &&
    (!isBlank(block.qText) || block.optLines.length || block.answerRaw)
  ) {
    flushBlock(block, out);
  }

  return out;
}
