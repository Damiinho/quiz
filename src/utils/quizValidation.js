const SUPPORTED_CATEGORY_TYPES = [
  "standard",
  "illustrated",
  "forehead",
  "auction",
  "duel",
  "album",
];

const hasText = (value) => typeof value === "string" && value.trim().length > 0;
const hasList = (value) => Array.isArray(value) && value.length > 0;

export const validateQuiz = (quiz) => {
  const issues = [];

  if (!quiz || typeof quiz !== "object") {
    return ["Plik nie zawiera obiektu quizu."];
  }

  if (!hasText(quiz.name)) {
    issues.push("Quiz musi mieć nazwę.");
  }

  if (!hasList(quiz.categories)) {
    issues.push("Quiz musi mieć co najmniej jedną kategorię.");
    return issues;
  }

  quiz.categories.forEach((category, categoryIndex) => {
    const categoryLabel = category.name || `Kategoria ${categoryIndex + 1}`;
    const type = category.type || "standard";

    if (!hasText(category.name)) {
      issues.push(`${categoryLabel}: brakuje nazwy kategorii.`);
    }

    if (!SUPPORTED_CATEGORY_TYPES.includes(type)) {
      issues.push(`${categoryLabel}: nieznany typ "${type}".`);
    }

    if (type === "auction" && category.timerSeconds != null && Number(category.timerSeconds) <= 0) {
      issues.push(`${categoryLabel}: czas licytacji musi być większy od zera.`);
    }

    if (!hasList(category.list)) {
      issues.push(`${categoryLabel}: kategoria nie ma pytań.`);
      return;
    }

    category.list.forEach((question, questionIndex) => {
      const questionLabel = `${categoryLabel}, pytanie ${questionIndex + 1}`;

      if (!Number.isFinite(Number(question.no))) {
        issues.push(`${questionLabel}: brakuje numeru pytania.`);
      }

      if (type === "album") {
        if (!hasList(question.images)) {
          issues.push(`${questionLabel}: album wymaga listy obrazków.`);
        }
        return;
      }

      if (type !== "forehead" && !hasText(question.question)) {
        issues.push(`${questionLabel}: brakuje treści pytania.`);
      }

      if (["standard", "illustrated"].includes(type)) {
        if (!hasList(question.correctAnswer)) {
          issues.push(`${questionLabel}: brakuje poprawnej odpowiedzi.`);
        }

        if (question.answers && !question.answers.includes(question.correctAnswer?.[0])) {
          issues.push(`${questionLabel}: poprawna odpowiedź nie występuje na liście odpowiedzi.`);
        }
      }

      if (type === "illustrated" && !hasText(question.image)) {
        issues.push(`${questionLabel}: pytanie obrazkowe wymaga ścieżki do obrazka.`);
      }

      if (type === "forehead" && !hasList(question.correctAnswer)) {
        issues.push(`${questionLabel}: czółko wymaga hasła w poprawnej odpowiedzi.`);
      }
    });
  });

  return issues;
};

export const isQuizValid = (quiz) => validateQuiz(quiz).length === 0;
