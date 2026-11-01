const randomToken = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};

export const createId = (prefix = "id") => `${prefix}-${randomToken()}`;

export const ensureCategoryIdentity = (category, categoryIndex = 0, prefix = "category") => ({
  ...category,
  id: category.id || `${prefix}-${categoryIndex + 1}`,
  list: (category.list || []).map((question, questionIndex) => ({
    ...question,
    id: question.id || `${prefix}-${categoryIndex + 1}-question-${questionIndex + 1}`,
  })),
});

export const createFreshCategoryIdentity = (category) => ({
  ...category,
  id: createId("category"),
  list: (category.list || []).map((question) => ({ ...question, id: createId("question") })),
});

export const ensureQuizIdentity = (quiz, prefix = "quiz") => {
  const quizId = quiz.id || `${prefix}-${randomToken()}`;
  const usedCategoryIds = new Set();
  const usedQuestionIds = new Set();
  return {
    ...quiz,
    id: quizId,
    categories: (quiz.categories || []).map((category, categoryIndex) => {
      let categoryId = category.id || `${quizId}-${categoryIndex + 1}`;
      if (usedCategoryIds.has(categoryId)) categoryId = createId("category");
      usedCategoryIds.add(categoryId);
      return {
        ...category,
        id: categoryId,
        list: (category.list || []).map((question, questionIndex) => {
          let questionId = question.id || `${categoryId}-question-${questionIndex + 1}`;
          if (usedQuestionIds.has(questionId)) questionId = createId("question");
          usedQuestionIds.add(questionId);
          return { ...question, id: questionId };
        }),
      };
    }),
  };
};