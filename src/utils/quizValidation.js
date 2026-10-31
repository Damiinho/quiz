const SUPPORTED_CATEGORY_TYPES = [
  "standard",
  "illustrated",
  "forehead",
  "auction",
  "duel",
  "album",
  "openAnswer",
  "wheel",
];

const hasText = (value) => typeof value === "string" && value.trim().length > 0;
const hasList = (value) => Array.isArray(value) && value.length > 0;
const isWheelValue = (value) => {
  const segmentValue = value && typeof value === "object" ? value.value : value;
  const weight = value && typeof value === "object" ? Number(value.weight) : 1;
  return weight > 0 && (
    (Number.isInteger(segmentValue) && segmentValue >= 0)
    || segmentValue === "bankrupt"
    || segmentValue === "freeVowel"
  );
};

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
    if (!category || typeof category !== "object" || Array.isArray(category)) {
      issues.push(`Kategoria ${categoryIndex + 1}: nieprawidłowy format.`);
      return;
    }

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

      if (!question || typeof question !== "object" || Array.isArray(question)) {
        issues.push(`${questionLabel}: nieprawidłowy format pytania.`);
        return;
      }

      if (!Number.isFinite(Number(question.no))) {
        issues.push(`${questionLabel}: brakuje numeru pytania.`);
      }

      if (type === "album") {
        if (!hasList(question.images)) {
          issues.push(`${questionLabel}: album wymaga listy obrazków.`);
        }
        return;
      }

      if (type === "wheel") {
        if (!hasList(question.correctAnswer) || !hasText(question.correctAnswer[0])) {
          issues.push(`${questionLabel}: koło fortuny wymaga poprawnego hasła.`);
        }
        if (!hasList(question.wheelValues) || !question.wheelValues.every(isWheelValue)) {
          issues.push(`${questionLabel}: koło fortuny musi mieć poprawną listę wartości.`);
        }
        if (!Number.isInteger(Number(question.vowelCost)) || Number(question.vowelCost) <= 0) {
          issues.push(`${questionLabel}: koszt samogłoski musi być większy od zera.`);
        }
        if (question.timerSeconds != null && Number(question.timerSeconds) <= 0) {
          issues.push(`${questionLabel}: czas koła fortuny musi być większy od zera.`);
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
