import Papa from "papaparse";
import { ensureQuizIdentity } from "./quizIdentity.js";

const normalizeHeader = (value) => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const headerAliases = {
  category: ["kategoria", "category", "temat", "dzial"],
  question: ["pytanie", "question", "tresc pytania", "question text"],
  correct: ["poprawna", "poprawna odpowiedz", "prawidlowa odpowiedz", "correct", "correct answer", "odpowiedz poprawna"],
  answerA: ["a", "odpowiedz a", "wariant a", "answer a", "option a"],
  answerB: ["b", "odpowiedz b", "wariant b", "answer b", "option b"],
  answerC: ["c", "odpowiedz c", "wariant c", "answer c", "option c"],
  answerD: ["d", "odpowiedz d", "wariant d", "answer d", "option d"],
  context: ["wyjasnienie", "kontekst", "ciekawostka", "explanation", "context"],
};

const findColumn = (headers, aliases) => headers.find((header) => aliases.includes(normalizeHeader(header)));

export const parseQuizSpreadsheet = (csvText, quizName = "Importowany quiz") => {
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim(),
  });
  const headers = parsed.meta.fields || [];
  const columns = Object.fromEntries(Object.entries(headerAliases).map(([key, aliases]) => [key, findColumn(headers, aliases)]));

  if (!columns.question || !columns.correct) {
    throw new Error("Arkusz musi zawierać kolumny „Pytanie” i „Poprawna odpowiedź”.");
  }

  const rowsWithErrors = parsed.errors.filter((error) => error.code !== "TooFewFields");
  if (rowsWithErrors.length > 0) {
    throw new Error(`Nie udało się odczytać arkusza (wiersz ${rowsWithErrors[0].row + 2}).`);
  }

  const categoriesByName = new Map();
  const rowIssues = [];
  parsed.data.forEach((row, index) => {
    const rowNumber = index + 2;
    const questionText = String(row[columns.question] || "").trim();
    const correctValue = String(row[columns.correct] || "").trim();
    if (!questionText || !correctValue) {
      rowIssues.push(`Wiersz ${rowNumber}: wpisz pytanie i poprawną odpowiedź.`);
      return;
    }

    const categoryName = String((columns.category && row[columns.category]) || "Ogólne").trim() || "Ogólne";
    const answerValues = ["answerA", "answerB", "answerC", "answerD"]
      .map((key) => columns[key] ? String(row[columns[key]] || "").trim() : "")
      .filter(Boolean);
    const letterMatch = correctValue.match(/^(?:odpowiedz\s*)?([a-d])$/i);
    const correctAnswer = letterMatch
      ? String(row[columns[`answer${letterMatch[1].toUpperCase()}`]] || "").trim()
      : correctValue;

    if (!correctAnswer) {
      rowIssues.push(`Wiersz ${rowNumber}: oznaczona poprawna odpowiedź nie ma treści w kolumnie odpowiedzi.`);
      return;
    }
    if (answerValues.length > 0 && !answerValues.includes(correctAnswer)) {
      rowIssues.push(`Wiersz ${rowNumber}: poprawna odpowiedź nie występuje w kolumnach A–D.`);
      return;
    }

    if (!categoriesByName.has(categoryName)) {
      categoriesByName.set(categoryName, { name: categoryName, type: "standard", list: [] });
    }
    const category = categoriesByName.get(categoryName);
    category.list.push({
      no: category.list.length + 1,
      question: questionText,
      correctAnswer: [correctAnswer],
      ...(answerValues.length > 0 ? { answers: answerValues } : {}),
      ...(columns.context && String(row[columns.context] || "").trim()
        ? { context: String(row[columns.context]).trim() }
        : {}),
    });
  });

  if (rowIssues.length > 0) {
    throw new Error(rowIssues.slice(0, 5).join(" "));
  }
  if (categoriesByName.size === 0) {
    throw new Error("Arkusz nie zawiera żadnych pytań do importu.");
  }

  return ensureQuizIdentity({
    name: String(quizName).replace(/\.[^.]+$/, "").trim() || "Importowany quiz",
    description: "",
    categories: [...categoriesByName.values()],
  }, "spreadsheet");
};