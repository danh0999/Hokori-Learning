// src/utils/parseQuizExcel.js
import * as XLSX from "xlsx";

const norm = (v) => String(v ?? "").trim();

const normalizeHeader = (h) =>
  norm(h).toLowerCase().replace(/\s+/g, "").replace(/[_-]/g, "");

const pick = (row, map, ...keys) => {
  for (const k of keys) {
    const key = map[normalizeHeader(k)];
    if (key && row[key] !== undefined && row[key] !== null) return row[key];
  }
  return undefined;
};

const uid = () =>
  crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const parseCorrect = (v) => {
  const s = norm(v).toUpperCase();
  if (!s) return null;

  // A..Z
  if (/^[A-Z]$/.test(s)) return s.charCodeAt(0) - 65;

  // 1..99
  if (/^\d{1,2}$/.test(s)) return parseInt(s, 10) - 1;

  const tk = s.split(/[,; ]+/).filter(Boolean)[0];
  if (!tk) return null;

  if (/^[A-Z]$/.test(tk)) return tk.charCodeAt(0) - 65;
  if (/^\d{1,2}$/.test(tk)) return parseInt(tk, 10) - 1;

  return null;
};

function buildHeaderMap(firstRow) {
  const headerMap = {};
  Object.keys(firstRow || {}).forEach((h) => {
    headerMap[normalizeHeader(h)] = h;
  });
  return headerMap;
}

function getOptionSlotsFromRow(row, headerMap) {
  const slots = [];
  for (let i = 0; i < 26; i++) {
    const letter = String.fromCharCode(65 + i); // A..Z
    const lower = letter.toLowerCase();

    // Support: A, a, OptionA, optionA...
    const val = pick(
      row,
      headerMap,
      letter,
      lower,
      `option${letter}`,
      `option${lower}`
    );
    slots.push({ key: letter, text: norm(val) }); // text may be empty
  }
  return slots;
}

function validateRowToQuestion(row, headerMap, idx, opts = {}) {
  const { defaultQuestionType = "", mode = "QUIZ" } = opts;
  const rowNo = idx + 2;

  // ✅ Only read these columns
  const content = norm(
    pick(
      row,
      headerMap,
      "question",
      "content",
      "text",
      "noidung",
      "cauhoi",
      "câuhỏi"
    )
  );
  const explanation = norm(
    pick(row, headerMap, "explanation", "giaithich", "giảithích", "hint")
  );

  const correctVal = pick(
    row,
    headerMap,
    "correct",
    "answer",
    "dapandung",
    "đápánđúng"
  );
  const correctIdx = parseCorrect(correctVal); // 0-based

  // --- OPTIONS A..Z
  const slots = getOptionSlotsFromRow(row, headerMap);

  // last non-empty option
  let last = -1;
  for (let i = 0; i < slots.length; i++) {
    if (slots[i].text) last = i;
  }

  const correctIdxSafe = Number.isFinite(correctIdx) ? correctIdx : -1;
  const draftEnd = Math.max(last, correctIdxSafe);

  // draft options: keep slots up to max(last, correct)
  const draftSlots = draftEnd >= 0 ? slots.slice(0, draftEnd + 1) : [];

  // final options: only A..last
  const finalSlots = last >= 0 ? slots.slice(0, last + 1) : [];
  const optionsRaw = finalSlots.map((x) => x.text);

  // ✅ IMPORTANT: questionType always from tab when JLPT
  const finalType = mode === "JLPT" ? norm(defaultQuestionType) : "";

  // ===== draft for "needs fix" =====
  const draft = {
    rowNo,
    // keep field for UI consistency if your old code expects it,
    // but do NOT take from Excel. In JLPT it comes from active tab.
    questionType: finalType,
    content,
    explanation,
    options: draftSlots.map((x) => ({
      id: uid(),
      key: x.key,
      text: x.text,
    })),
    correctIndex: Number.isFinite(correctIdx) ? correctIdx : null,
    correct: norm(correctVal),
  };

  const issues = [];

  // --- VALIDATE
  if (!content) issues.push("Thiếu nội dung câu hỏi (question).");

  if (last < 0) {
    issues.push("Cần ít nhất 2 đáp án (A/B/...).");
  } else {
    // No gaps A..last
    for (let i = 0; i <= last; i++) {
      if (!slots[i].text) issues.push(`Thiếu đáp án ở cột ${slots[i].key}.`);
    }

    const filledCount = finalSlots.filter((x) => x.text).length;
    if (filledCount < 2) issues.push("Cần ít nhất 2 đáp án (A/B/...).");
  }

  if (correctIdx === null) {
    issues.push("Thiếu/không hợp lệ cột correct (nhập A-Z hoặc 1-99).");
  } else if (last >= 0 && (correctIdx < 0 || correctIdx > last)) {
    issues.push(
      `Correct đang trỏ ra ngoài đáp án hiện có (A-${String.fromCharCode(
        65 + last
      )}).`
    );
  } else if (last >= 0 && slots[correctIdx] && !slots[correctIdx].text) {
    issues.push(
      `Correct đang trỏ vào đáp án trống ở cột ${String.fromCharCode(
        65 + correctIdx
      )}.`
    );
  }

  // JLPT: must have active tab type
  if (mode === "JLPT" && !finalType) {
    issues.push(
      "Thiếu loại câu hỏi (tab hiện tại chưa set: VOCAB/GRAMMAR/READING/LISTENING)."
    );
  }

  if (issues.length) return { rowNo, issues, draft };

  // --- BUILD QUESTION
  const finalOptions = optionsRaw.map((t, i) => ({
    id: uid(),
    text: t,
    correct: i === correctIdx,
    isCorrect: i === correctIdx,
  }));

  const q = {
    id: uid(),
    text: content,
    explanation,
    // ✅ keep these fields empty so old builder code won’t crash if it expects them
    audioPath: "",
    imagePath: "",
    imageAltText: "",
    options: finalOptions,
  };

  if (mode === "JLPT") q.questionType = finalType;

  return { rowNo, issues: [], draft, question: q };
}

export function parseQuestionsFromExcelArrayBuffer(arrayBuffer, opts = {}) {
  const { defaultQuestionType = "", mode = "QUIZ" } = opts;

  const wb = XLSX.read(arrayBuffer, { type: "array" });
  const sheetName = wb.SheetNames?.[0];
  if (!sheetName) {
    return {
      readyQuestions: [],
      needsFix: [{ rowNo: 1, issues: ["File không có sheet nào."], draft: {} }],
    };
  }

  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

  if (!rows.length) {
    return {
      readyQuestions: [],
      needsFix: [{ rowNo: 1, issues: ["Sheet trống."], draft: {} }],
    };
  }

  const headerMap = buildHeaderMap(rows[0]);

  const readyQuestions = [];
  const needsFix = [];

  rows.forEach((row, idx) => {
    const res = validateRowToQuestion(row, headerMap, idx, {
      defaultQuestionType,
      mode,
    });

    if (res.question) readyQuestions.push(res.question);
    else
      needsFix.push({ rowNo: res.rowNo, issues: res.issues, draft: res.draft });
  });

  return { readyQuestions, needsFix };
}

// ✅ Template download: Vietnamese headers + only required columns
export function downloadExcelTemplate(filename = "bulk-import-template.xlsx") {
  const headers = ["Câu hỏi", "Giải thích", "A", "B", "C", "D", "Đáp án đúng"];

  const example = [
    {
      "Câu hỏi": "Từ 'いぬ' có nghĩa là gì?",
      "Giải thích": "犬 = dog",
      A: "Mèo",
      B: "Chó",
      C: "Cá",
      D: "Chim",
      "Đáp án đúng": "B", // or 2
    },
  ];

  const ws = XLSX.utils.json_to_sheet(example, { header: headers });
  XLSX.utils.sheet_add_aoa(ws, [headers], { origin: "A1" });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Questions");
  XLSX.writeFile(wb, filename);
}

/**
 * Re-validate draft after user fixes in UI
 */
export function validateDraftToQuestion(draft, opts = {}) {
  const { mode = "QUIZ", defaultQuestionType = "" } = opts;

  const content = norm(draft?.content);
  const explanation = norm(draft?.explanation);

  // ✅ Keep slots order (A/B/C/D...), don’t filter first
  const optionsArr = Array.isArray(draft?.options) ? draft.options : [];
  const slots = optionsArr.map((o) => ({
    ...o,
    text: norm(o?.text),
  }));

  const filledCount = slots.filter((o) => o.text.length > 0).length;

  // correctIndex is slot index
  const correctIdx = Number.isFinite(draft?.correctIndex)
    ? Number(draft.correctIndex)
    : parseCorrect(draft?.correct);

  const issues = [];
  if (!content) issues.push("Thiếu nội dung câu hỏi.");
  if (filledCount < 2) issues.push("Cần ít nhất 2 đáp án.");

  // gap rule A..last
  let last = -1;
  for (let i = 0; i < slots.length; i++) {
    if (slots[i].text) last = i;
  }
  if (last >= 0) {
    for (let i = 0; i <= last; i++) {
      if (!slots[i].text)
        issues.push(`Thiếu đáp án ở option ${String.fromCharCode(65 + i)}.`);
    }
  }

  if (correctIdx === null || !Number.isFinite(correctIdx)) {
    issues.push("Correct không hợp lệ (A-Z hoặc 1-99).");
  } else if (correctIdx < 0 || correctIdx >= slots.length) {
    issues.push(`Correct đang trỏ ngoài số option (hiện có ${slots.length}).`);
  } else if (!slots[correctIdx]?.text) {
    issues.push(
      `Correct đang trỏ vào đáp án trống (option ${String.fromCharCode(
        65 + correctIdx
      )}).`
    );
  }

  const finalType = mode === "JLPT" ? norm(defaultQuestionType) : "";
  if (mode === "JLPT" && !finalType)
    issues.push("Thiếu loại câu hỏi (tab JLPT).");

  if (issues.length) return { ok: false, issues };

  // ✅ Build options only A..last
  const finalSlots = last >= 0 ? slots.slice(0, last + 1) : slots;

  const options = finalSlots.map((o, i) => ({
    id: uid(),
    text: o.text,
    correct: i === correctIdx,
    isCorrect: i === correctIdx,
  }));

  const q = {
    id: uid(),
    text: content,
    explanation,
    audioPath: "",
    imagePath: "",
    imageAltText: "",
    options,
  };

  if (mode === "JLPT") q.questionType = finalType;

  return { ok: true, question: q };
}
