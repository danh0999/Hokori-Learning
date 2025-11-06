// src/pages/Teacher/ManageDocument/Quiz/_shared/quizUtils.js

export const newOption = () => ({
  id: crypto.randomUUID(),
  text: "",
  correct: false,
});

export const newQuestion = (type = "single") => ({
  id: crypto.randomUUID(),
  type, // 'single' | 'multiple' | 'truefalse' | 'fill'
  text: "",
  points: 1,
  options:
    type === "truefalse"
      ? [
          { id: crypto.randomUUID(), text: "True", correct: true },
          { id: crypto.randomUUID(), text: "False", correct: false },
        ]
      : type === "fill"
      ? []
      : [newOption(), newOption()],
  answers: type === "fill" ? [""] : [],
  explanation: "",
});
