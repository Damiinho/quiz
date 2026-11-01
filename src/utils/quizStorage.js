import { ensureQuizIdentity } from "./quizIdentity.js";

const GAME_STATE_KEY = "super-zgadywanka:game-state";
const CUSTOM_QUIZZES_KEY = "super-zgadywanka:custom-quizzes";
const APP_SETTINGS_KEY = "super-zgadywanka:app-settings";
const QUIZ_DRAFT_PREFIX = "super-zgadywanka:quiz-draft:";

const canUseStorage = () => {
  try {
    return typeof window !== "undefined" && Boolean(window.localStorage);
  } catch {
    return false;
  }
};

export const readJson = (key, fallback) => {
  if (!canUseStorage()) return fallback;

  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export const writeJson = (key, value) => {
  if (!canUseStorage()) return false;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

export const loadQuizDraft = (sourceId) => {
  const draft = readJson(`${QUIZ_DRAFT_PREFIX}${sourceId || "new"}`, null);
  if (!draft || draft.version !== 1 || draft.sourceId !== (sourceId || "new")) return null;
  return draft;
};

export const saveQuizDraft = (sourceId, draft) => writeJson(`${QUIZ_DRAFT_PREFIX}${sourceId || "new"}`, {
  ...draft,
  version: 1,
  sourceId: sourceId || "new",
  savedAt: new Date().toISOString(),
});

export const removeQuizDraft = (sourceId) => {
  try {
    if (!canUseStorage()) return false;
    window.localStorage.removeItem(`${QUIZ_DRAFT_PREFIX}${sourceId || "new"}`);
    return true;
  } catch {
    return false;
  }
};

export const reactNodeToText = (node) => {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(reactNodeToText).filter(Boolean).join(" ");
  if (typeof node === "object" && node.props?.children) {
    return reactNodeToText(node.props.children);
  }

  return "";
};

export const makeSerializableQuiz = (quiz) => ({
  ...quiz,
  categories: quiz.categories?.map((category) => ({
    ...category,
    list: category.list?.map((question) => ({
      ...question,
      question:
        typeof question.question === "string"
          ? question.question
          : reactNodeToText(question.question),
    })),
  })),
});

export const loadGameState = () => readJson(GAME_STATE_KEY, null);

export const saveGameState = (state) => {
  return writeJson(GAME_STATE_KEY, {
    ...state,
    gameSettings: {
      ...state.gameSettings,
      quiz: state.gameSettings?.quiz?.name
        ? makeSerializableQuiz(state.gameSettings.quiz)
        : state.gameSettings?.quiz,
    },
  });
};

export const clearSavedGameState = () => {
  if (canUseStorage()) window.localStorage.removeItem(GAME_STATE_KEY);
};

export const loadCustomQuizzes = () => {
  const quizzes = readJson(CUSTOM_QUIZZES_KEY, []);
  return Array.isArray(quizzes)
    ? quizzes.map((quiz, index) => ensureQuizIdentity(quiz, `custom-${index + 1}`))
    : [];
};

export const saveCustomQuizzes = (quizzes) => {
  return writeJson(CUSTOM_QUIZZES_KEY, quizzes.map(makeSerializableQuiz));
};

export const loadAppSettings = () => readJson(APP_SETTINGS_KEY, {});

export const saveAppSettings = (settings) => writeJson(APP_SETTINGS_KEY, settings);

export const downloadJson = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const serializeCsv = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escapeCell = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    const text = String(value ?? "");
    const safeText = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
    return `"${safeText.replace(/"/g, '""')}"`;
  };
  const csv = [headers, ...rows.map((row) => headers.map((header) => row[header]))]
    .map((row) => row.map(escapeCell).join(";"))
    .join("\r\n");
  return `\uFEFF${csv}`;
};

export const downloadCsv = (rows, filename) => {
  const csv = serializeCsv(rows);
  if (!csv) return;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const readQuizFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(reader.result));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
