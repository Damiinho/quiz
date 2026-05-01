const GAME_STATE_KEY = "super-zgadywanka:game-state";
const CUSTOM_QUIZZES_KEY = "super-zgadywanka:custom-quizzes";

const canUseStorage = () => typeof window !== "undefined" && window.localStorage;

const readJson = (key, fallback) => {
  if (!canUseStorage()) return fallback;

  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Browser storage can be disabled or full. The app should keep working.
  }
};

const reactNodeToText = (node) => {
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
  writeJson(GAME_STATE_KEY, {
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

export const loadCustomQuizzes = () => readJson(CUSTOM_QUIZZES_KEY, []);

export const saveCustomQuizzes = (quizzes) => {
  writeJson(CUSTOM_QUIZZES_KEY, quizzes.map(makeSerializableQuiz));
};

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
