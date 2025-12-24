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

    // Hỗ trợ header: A, a, OptionA, optionA
    const val = pick(
      row,
      headerMap,
      letter,
      lower,
      `option${letter}`,
      `option${lower}`
    );
    slots.push({ key: letter, text: norm(val) }); // text có thể rỗng
  }
  return slots; // [{key:"A", text:"..."}, {key:"B", text:""}, ...]
}

function validateRowToQuestion(row, headerMap, idx, opts = {}) {
  const { defaultQuestionType = "", mode = "QUIZ" } = opts;

  const rowNo = idx + 2;

  const content = norm(
    pick(row, headerMap, "question", "content", "text", "noidung", "cauhoi")
  );
  const explanation = norm(
    pick(row, headerMap, "explanation", "giaithich", "hint")
  );

  const audioPath = norm(pick(row, headerMap, "audiopath", "audio"));
  const imagePath = norm(pick(row, headerMap, "imagepath", "image"));
  const imageAltText = norm(pick(row, headerMap, "imagealttext", "alt"));

  const questionType = norm(
    pick(row, headerMap, "questiontype", "type", "skill")
  );

  const correctVal = pick(row, headerMap, "correct", "answer", "dapandung");
  const correctIdx = parseCorrect(correctVal); // 0-based index, A->0, B->1,...

  // --- OPTIONS: lấy slot A..Z, giữ vị trí để bắt GAP
  const slots = getOptionSlotsFromRow(row, headerMap);

  // tìm option cuối cùng (last non-empty)
  let last = -1;
  for (let i = 0; i < slots.length; i++) {
    if (slots[i].text) last = i;
  }

  // options "liên tục" từ A..last
  const finalSlots = last >= 0 ? slots.slice(0, last + 1) : [];
  const optionsRaw = finalSlots.map((x) => x.text);

  // draft để NeedsFix sửa thủ công
  const draft = {
    rowNo,
    questionType: questionType || defaultQuestionType || "",
    content,
    explanation,
    // giữ y nguyên slot A..last, kể cả rỗng, để UI hiển thị đúng chỗ thiếu
    options: finalSlots.map((x) => ({
      id: crypto.randomUUID(),
      key: x.key,
      text: x.text,
    })),
    correctIndex: Number.isFinite(correctIdx) ? correctIdx : null,
    correct: norm(correctVal),
    audioPath,
    imagePath,
    imageAltText,
  };

  const issues = [];

  // --- VALIDATE
  if (!content) issues.push("Thiếu nội dung câu hỏi (question/content).");

  // không có đáp án
  if (last < 0) {
    issues.push("Cần ít nhất 2 đáp án (A/B/...).");
  } else {
    // bắt GAP: từ A..last không được rỗng
    for (let i = 0; i <= last; i++) {
      if (!slots[i].text) {
        issues.push(`Thiếu đáp án ở cột ${slots[i].key}.`);
      }
    }

    // yêu cầu tối thiểu 2 đáp án (trong đoạn liên tục)
    const filledCount = finalSlots.filter((x) => x.text).length;
    if (filledCount < 2) issues.push("Cần ít nhất 2 đáp án (A/B/...).");
  }

  // correct
  if (correctIdx === null) {
    issues.push("Thiếu/không hợp lệ cột correct (nhập A-Z hoặc 1-99).");
  } else if (last >= 0 && (correctIdx < 0 || correctIdx > last)) {
    issues.push(
      `Correct đang trỏ ra ngoài đáp án hiện có (A-${String.fromCharCode(
        65 + last
      )}).`
    );
  } else if (last >= 0 && slots[correctIdx] && !slots[correctIdx].text) {
    // correct trỏ đúng index nhưng option tại đó đang rỗng
    issues.push(
      `Correct đang trỏ vào đáp án trống ở cột ${String.fromCharCode(
        65 + correctIdx
      )}.`
    );
  }

  // JLPT: questionType có thể lấy từ default (tab), nên chỉ lỗi nếu mode=JLPT mà vẫn trống
  if (mode === "JLPT") {
    const finalType = questionType || defaultQuestionType;
    if (!finalType) {
      issues.push("Thiếu questionType (VOCAB/GRAMMAR/READING/LISTENING).");
    }
  }

  if (issues.length) return { rowNo, issues, draft };

  // --- BUILD QUESTION (đảm bảo lúc này không có gap, optionsRaw đều có text)
  const finalOptions = optionsRaw.map((t, i) => ({
    id: crypto.randomUUID(),
    text: t,
    correct: i === correctIdx,
    isCorrect: i === correctIdx,
  }));

  const q = {
    id: crypto.randomUUID(),
    text: content,
    explanation,
    audioPath,
    imagePath,
    imageAltText,
    options: finalOptions,
  };

  const finalType = questionType || defaultQuestionType;
  if (mode === "JLPT" && finalType) q.questionType = finalType;

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

// Template download (giữ nguyên, bạn có thể thêm mode nếu muốn)
export function downloadExcelTemplate(filename = "bulk-import-template.xlsx") {
  const headers = [
    "questionType",
    "question",
    "explanation",
    "A",
    "B",
    "C",
    "D",
    "correct",
    "audioPath",
    "imagePath",
    "imageAltText",
  ];

  const example = [
    {
      questionType: "VOCAB",
      question: "Từ 'いぬ' có nghĩa là gì?",
      explanation: "犬 = dog",
      A: "Mèo",
      B: "Chó",
      C: "Cá",
      D: "Chim",
      correct: "B",
      audioPath: "",
      imagePath: "",
      imageAltText: "",
    },
  ];

  const ws = XLSX.utils.json_to_sheet(example, { header: headers });
  XLSX.utils.sheet_add_aoa(ws, [headers], { origin: "A1" });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Questions");
  XLSX.writeFile(wb, filename);
}

/**
 * Dùng khi user sửa draft trong UI rồi muốn "re-validate" 1 dòng.
 */
export function validateDraftToQuestion(draft, opts = {}) {
  const { mode = "QUIZ", defaultQuestionType = "" } = opts;

  const content = norm(draft?.content);
  const explanation = norm(draft?.explanation);

  const audioPath = norm(draft?.audioPath);
  const imagePath = norm(draft?.imagePath);
  const imageAltText = norm(draft?.imageAltText);

  const questionType = norm(draft?.questionType) || defaultQuestionType;

  // ✅ GIỮ SLOT OPTIONS (không filter trước để giữ index A/B/C/D...)
  const optionsArr = Array.isArray(draft?.options) ? draft.options : [];
  const slots = optionsArr.map((o) => ({
    ...o,
    text: norm(o?.text),
  }));

  const filledCount = slots.filter((o) => o.text.length > 0).length;

  // ✅ correctIndex luôn là index theo slot
  const correctIndexNum =
    draft?.correctIndex === null || draft?.correctIndex === undefined
      ? null
      : Number(draft.correctIndex);

  const correctIdx = Number.isFinite(correctIndexNum)
    ? correctIndexNum
    : parseCorrect(draft?.correct);

  const issues = [];
  if (!content) issues.push("Thiếu nội dung câu hỏi.");
  if (filledCount < 2) issues.push("Cần ít nhất 2 đáp án.");

  // ✅ bắt gap: không cho option trống xen kẽ (nếu bạn muốn rule này khi sửa UI)
  // Nếu bạn muốn user được phép xóa option => bỏ đoạn này.
  // Ở đây giữ đúng rule: phải liên tục từ A..last
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

  if (mode === "JLPT" && !questionType) issues.push("Thiếu questionType.");

  if (issues.length) return { ok: false, issues };

  // ✅ Build options: chỉ lấy từ A..last (liên tục)
  const finalSlots = last >= 0 ? slots.slice(0, last + 1) : slots;

  const options = finalSlots.map((o, i) => ({
    id: crypto.randomUUID(),
    text: o.text,
    correct: i === correctIdx,
    isCorrect: i === correctIdx,
  }));

  const q = {
    id: crypto.randomUUID(),
    text: content,
    explanation,
    audioPath,
    imagePath,
    imageAltText,
    options,
  };

  if (mode === "JLPT" && questionType) q.questionType = questionType;

  return { ok: true, question: q };
}
