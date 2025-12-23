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

const parseCorrect = (v) => {
  const s = norm(v).toUpperCase();
  if (!s) return null;

  if (/^[A-D]$/.test(s)) return s.charCodeAt(0) - 65;
  if (/^[1-4]$/.test(s)) return parseInt(s, 10) - 1;

  const tokens = s.split(/[,; ]+/).filter(Boolean);
  const idxs = [];
  for (const tk of tokens) {
    if (/^[A-D]$/.test(tk)) idxs.push(tk.charCodeAt(0) - 65);
    else if (/^[1-4]$/.test(tk)) idxs.push(parseInt(tk, 10) - 1);
  }
  if (idxs.length) return idxs[0]; // single-choice
  return null;
};

function buildHeaderMap(firstRow) {
  const headerMap = {};
  Object.keys(firstRow || {}).forEach((h) => {
    headerMap[normalizeHeader(h)] = h;
  });
  return headerMap;
}

/**
 * Validate 1 row -> return { question?, issues, draft }
 * draft: object form-ready để user sửa ngay trong UI
 */
function validateRowToQuestion(row, headerMap, idx, opts = {}) {
  const { defaultQuestionType = "", mode = "QUIZ" } = opts;

  const rowNo = idx + 2;

  const content = norm(
    pick(row, headerMap, "question", "content", "text", "noidung", "cauhoi")
  );
  const explanation = norm(
    pick(row, headerMap, "explanation", "giaithich", "hint")
  );

  const A = norm(pick(row, headerMap, "a", "optiona", "dapana", "daa"));
  const B = norm(pick(row, headerMap, "b", "optionb", "dapanb", "dab"));
  const C = norm(pick(row, headerMap, "c", "optionc", "dapanc", "dac"));
  const D = norm(pick(row, headerMap, "d", "optiond", "dapand", "dad"));

  const correctVal = pick(row, headerMap, "correct", "answer", "dapandung");
  const correctIdx = parseCorrect(correctVal);

  const audioPath = norm(pick(row, headerMap, "audiopath", "audio"));
  const imagePath = norm(pick(row, headerMap, "imagepath", "image"));
  const imageAltText = norm(pick(row, headerMap, "imagealttext", "alt"));

  const questionType = norm(
    pick(row, headerMap, "questiontype", "type", "skill")
  );

  const draft = {
    rowNo,
    questionType: questionType || defaultQuestionType || "",
    content,
    explanation,
    A,
    B,
    C,
    D,
    correct: norm(correctVal),
    audioPath,
    imagePath,
    imageAltText,
  };

  const issues = [];

  if (!content) issues.push("Thiếu nội dung câu hỏi (question/content).");

  const optionsRaw = [A, B, C, D].filter((x) => x.length > 0);
  if (optionsRaw.length < 2) issues.push("Cần ít nhất 2 đáp án (A/B/C/D).");

  if (correctIdx === null) {
    issues.push("Thiếu/không hợp lệ cột correct (nhập A-D hoặc 1-4).");
  } else if (
    optionsRaw.length > 0 &&
    (correctIdx < 0 || correctIdx >= optionsRaw.length)
  ) {
    issues.push(
      `Correct đang trỏ ra ngoài số đáp án hiện có (đang có ${optionsRaw.length} đáp án).`
    );
  }

  // JLPT: questionType có thể lấy từ default (tab), nên chỉ lỗi nếu mode=JLPT mà vẫn trống
  if (mode === "JLPT") {
    const finalType = questionType || defaultQuestionType;
    if (!finalType)
      issues.push("Thiếu questionType (VOCAB/GRAMMAR/READING/LISTENING).");
  }

  if (issues.length) return { rowNo, issues, draft };

  const finalOptions = [A, B, C, D]
    .filter((x) => x.length > 0)
    .map((t, i) => ({
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

  const A = norm(draft?.A);
  const B = norm(draft?.B);
  const C = norm(draft?.C);
  const D = norm(draft?.D);

  const correctIdx = parseCorrect(draft?.correct);

  const audioPath = norm(draft?.audioPath);
  const imagePath = norm(draft?.imagePath);
  const imageAltText = norm(draft?.imageAltText);

  const questionType = norm(draft?.questionType) || defaultQuestionType;

  const issues = [];
  if (!content) issues.push("Thiếu nội dung câu hỏi.");
  const optionsRaw = [A, B, C, D].filter((x) => x.length > 0);
  if (optionsRaw.length < 2) issues.push("Cần ít nhất 2 đáp án.");

  if (correctIdx === null) issues.push("Correct không hợp lệ (A-D hoặc 1-4).");
  else if (
    optionsRaw.length > 0 &&
    (correctIdx < 0 || correctIdx >= optionsRaw.length)
  ) {
    issues.push(
      `Correct đang trỏ ngoài số đáp án (hiện có ${optionsRaw.length}).`
    );
  }

  if (mode === "JLPT" && !questionType) issues.push("Thiếu questionType.");

  if (issues.length) return { ok: false, issues };

  const options = optionsRaw.map((t, i) => ({
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
    options,
  };
  if (mode === "JLPT" && questionType) q.questionType = questionType;

  return { ok: true, question: q };
}
