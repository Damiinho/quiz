import test from "node:test";
import assert from "node:assert/strict";
import { isQuizValid, validateQuiz } from "../src/utils/quizValidation.js";
import { buildScoreReportRows, compactGameSnapshot, compactQuizLog, getScoreTimeline, restoreQuizProgress } from "../src/utils/gameHistory.js";
import { serializeCsv } from "../src/utils/quizStorage.js";
import { createFreshCategoryIdentity, ensureQuizIdentity } from "../src/utils/quizIdentity.js";
import { parseQuizSpreadsheet } from "../src/utils/spreadsheetImport.js";
import { isAnswerWindowOpen } from "../src/utils/answerWindow.js";
import {
  applyWheelBankrupt,
  canBuyWheelVowel,
  countWheelLetter,
  isWheelPhraseSolved,
  revealWheelPhrase,
  pickWeightedWheelValue,
  pickWeightedWheelIndex,
} from "../src/utils/wheelGame.js";

const validQuiz = {
  name: "Testowy quiz",
  categories: [
    {
      name: "Kategoria",
      type: "standard",
      list: [
        {
          no: 1,
          question: "Ile to jest 2 + 2?",
          answers: ["3", "4"],
          correctAnswer: ["4"],
        },
      ],
    },
  ],
};

test("akceptuje poprawny quiz standardowy", () => {
  assert.equal(isQuizValid(validQuiz), true);
  assert.deepEqual(validateQuiz(validQuiz), []);
});

test("odrzuca quiz bez nazwy kategorii", () => {
  const quiz = structuredClone(validQuiz);
  quiz.categories[0].name = "";

  assert.equal(isQuizValid(quiz), false);
  assert.match(validateQuiz(quiz)[0], /brakuje nazwy kategorii/);
});

test("odrzuca kategorie i pytania o nieprawidłowym formacie bez wyjątku", () => {
  const quizWithInvalidCategory = { name: "Test", categories: [null] };
  const quizWithInvalidQuestion = {
    name: "Test",
    categories: [{ name: "Kategoria", list: [null] }],
  };

  assert.match(validateQuiz(quizWithInvalidCategory)[0], /nieprawidłowy format/);
  assert.match(validateQuiz(quizWithInvalidQuestion)[0], /nieprawidłowy format pytania/);
});

test("odrzuca odpowiedz, ktorej nie ma na liscie", () => {
  const quiz = structuredClone(validQuiz);
  quiz.categories[0].list[0].correctAnswer = ["5"];

  assert.equal(isQuizValid(quiz), false);
  assert.match(validateQuiz(quiz)[0], /poprawna odpowied/);
});

test("wymaga obrazkow dla kategorii album", () => {
  const quiz = {
    name: "Album",
    categories: [{ name: "Obrazki", type: "album", list: [{ no: 1, images: [] }] }],
  };

  assert.equal(isQuizValid(quiz), false);
  assert.match(validateQuiz(quiz)[0], /album wymaga listy obraz/);
});

test("akceptuje poprawnie skonfigurowane koło fortuny", () => {
  const quiz = {
    name: "Koło",
    categories: [{
      name: "Hasła",
      type: "wheel",
      list: [{ no: 1, correctAnswer: ["SUPER HASŁO"], wheelValues: [1, 2, 5, 0, "bankrupt", "freeVowel"], vowelCost: 2, timerSeconds: 30 }],
    }],
  };

  assert.equal(isQuizValid(quiz), true);
});

test("odrzuca koło fortuny bez hasła i wartości", () => {
  const quiz = {
    name: "Koło",
    categories: [{
      name: "Hasła",
      type: "wheel",
      list: [{ no: 1, correctAnswer: [""], wheelValues: ["bankrupt", -1], vowelCost: 0 }],
    }],
  };

  const issues = validateQuiz(quiz);
  assert.match(issues.join(" "), /poprawną listę wartości/);
  assert.match(issues.join(" "), /koszt samogłoski/);
  assert.match(issues.join(" "), /poprawnego hasła/);
});

test("odsłania litery i rozpoznaje rozwiązane hasło", () => {
  assert.deepEqual(revealWheelPhrase("KÓŁO A", ["o"]), ["_", "_", "_", "O", " ", "_"]);
  assert.equal(countWheelLetter("KÓŁO A", "ó"), 1);
  assert.equal(isWheelPhraseSolved("KÓŁO A", ["K", "Ó", "Ł", "O", "A"]), true);
});

test("samogłoska korzysta najpierw z punktów rundy i ostrzega przy punktach całkowitych", () => {
  assert.deepEqual(canBuyWheelVowel({ roundPoints: 4, totalPoints: 20, cost: 3 }), { source: "round", warning: false });
  assert.deepEqual(canBuyWheelVowel({ roundPoints: 1, totalPoints: 20, cost: 3 }), { source: "total", warning: true });
  assert.deepEqual(canBuyWheelVowel({ roundPoints: 1, totalPoints: 2, cost: 3 }), { source: null, warning: false });
});

test("bankrut zeruje dodatni wynik, ale nie pogarsza wyniku ujemnego", () => {
  assert.equal(applyWheelBankrupt(12), 0);
  assert.equal(applyWheelBankrupt(0), 0);
  assert.equal(applyWheelBankrupt(-4), -4);
});

test("losuje segment kola zgodnie z jego wagami", () => {
  const segments = [
    { value: 1, weight: 80 },
    { value: "bankrupt", weight: 1 },
  ];

  assert.equal(pickWeightedWheelValue(segments, 0.2), 1);
  assert.equal(pickWeightedWheelValue(segments, 0.99), "bankrupt");
  assert.equal(pickWeightedWheelIndex(segments, 0.2), 0);
});

test("kompaktowa migawka nie duplikuje quizu i odtwarza zużyte pytania", () => {
  const quiz = structuredClone(validQuiz);
  quiz.id = "quiz-1";
  quiz.categories[0].id = "category-1";
  quiz.categories[0].list[0].id = "question-1";
  quiz.categories[0].list[0].done = true;

  const snapshot = compactGameSnapshot({ gameSettings: { players: [], quiz } });
  const compactedAgain = compactGameSnapshot(snapshot);

  assert.equal(snapshot.gameSettings.quiz, undefined);
  assert.deepEqual(snapshot.completedQuestionIds, ["question-1"]);
  assert.deepEqual(compactedAgain.completedQuestionIds, ["question-1"]);
  assert.equal(compactedAgain.quizId, "quiz-1");
  assert.equal(JSON.stringify(snapshot).includes("Ile to jest 2 + 2?"), false);
  assert.equal(restoreQuizProgress(quiz, snapshot.completedQuestionIds).categories[0].list[0].done, true);
  assert.equal(restoreQuizProgress(quiz, []).categories[0].list[0].done, false);
});

test("migruje stare migawki historii do ID quizu bez treści pytań", () => {
  const quiz = structuredClone(validQuiz);
  quiz.categories[0].id = "category-1";
  quiz.categories[0].list[0].id = "question-1";
  const oldSnapshot = {
    gameSettings: {
      players: [],
      quiz: { ...quiz, categories: [{ ...quiz.categories[0], list: [{ ...quiz.categories[0].list[0], done: true }] }] },
    },
  };

  const [entry] = compactQuizLog([{ before: oldSnapshot, after: oldSnapshot }], quiz);

  assert.equal(entry.after.gameSettings.quiz, undefined);
  assert.deepEqual(entry.after.completedQuestionIds, ["question-1"]);
});

test("CSV zachowuje polskie znaki, escapuje separator i chroni nazwy przed formułami", () => {
  const csv = serializeCsv([{ Miejsce: 1, Gracz: '=2+2;"Ada"', Punkty: -3 }]);

  assert.match(csv, /^\uFEFF/);
  assert.match(csv, /"Miejsce";"Gracz";"Punkty"/);
  assert.ok(csv.includes("\"'=2+2;\"\"Ada\"\"\""));
  assert.ok(csv.endsWith(";-3"));
});

test("ID quizu, kategorii i pytań są trwałe, a kopiowana kategoria dostaje nowe ID", () => {
  const identified = ensureQuizIdentity({
    name: "Quiz",
    categories: [{ name: "Kategoria", list: [{ no: 1, question: "Pytanie" }] }],
  }, "test");
  const reloaded = ensureQuizIdentity(identified, "other-prefix");
  const copiedCategory = createFreshCategoryIdentity(identified.categories[0]);

  assert.equal(reloaded.id, identified.id);
  assert.equal(reloaded.categories[0].id, identified.categories[0].id);
  assert.equal(reloaded.categories[0].list[0].id, identified.categories[0].list[0].id);
  assert.notEqual(copiedCategory.id, identified.categories[0].id);
  assert.notEqual(copiedCategory.list[0].id, identified.categories[0].list[0].id);
});

test("importowane duplikaty ID są naprawiane bez zmiany poprawnych identyfikatorów", () => {
  const quiz = ensureQuizIdentity({
    id: "quiz-x",
    name: "Zduplikowane ID",
    categories: [
      { id: "category-x", name: "A", list: [{ id: "question-x", no: 1 }] },
      { id: "category-x", name: "B", list: [{ id: "question-x", no: 1 }] },
    ],
  });

  assert.equal(quiz.categories[0].id, "category-x");
  assert.notEqual(quiz.categories[0].id, quiz.categories[1].id);
  assert.equal(quiz.categories[0].list[0].id, "question-x");
  assert.notEqual(quiz.categories[0].list[0].id, quiz.categories[1].list[0].id);
});

test("oś czasu punktów uwzględnia aktywne akcje i pomija przyszłość po cofnięciu", () => {
  const players = [{ name: "Ala", points: 2 }];
  const quizLog = [
    {
      timestamp: "10:00:00",
      description: "Dodano punkt",
      before: { gameSettings: { players: [{ name: "Ala", points: 0 }] } },
      after: { gameSettings: { players: [{ name: "Ala", points: 1 }] } },
    },
    {
      timestamp: "10:01:00",
      description: "Odjęto punkt",
      before: { gameSettings: { players: [{ name: "Ala", points: 1 }] } },
      after: { gameSettings: { players: [{ name: "Ala", points: 0 }] } },
    },
  ];

  const timeline = getScoreTimeline(quizLog, 0, players);
  const rows = buildScoreReportRows(players, timeline);

  assert.deepEqual(timeline.labels, ["Start", "10:00:00"]);
  assert.deepEqual(timeline.series, [{ name: "Ala", values: [0, 1] }]);
  assert.equal(timeline.changes.length, 1);
  assert.equal(rows[0].Typ, "RANKING KOŃCOWY");
  assert.equal(rows[1].Typ, "HISTORIA PUNKTÓW");
  assert.equal(rows[1].Zmiana, 1);
});

test("import CSV rozpoznaje polskie nagłówki, separator średnikowy i grupuje kategorie", () => {
  const csv = [
    "Kategoria;Pytanie;Odpowiedź A;Odpowiedź B;Poprawna odpowiedź;Kontekst",
    'Geografia;"Jak nazywa się ""czerwona planeta""?";Mars;Wenus;A;Czwarta planeta od Słońca',
    "Geografia;Ile planet jest w Układzie Słonecznym?;7;8;8;",
    "Historia;Kto był pierwszym królem Polski?;;;Bolesław Chrobry;",
  ].join("\n");

  const quiz = parseQuizSpreadsheet(csv, "Import z arkusza.csv");

  assert.equal(quiz.name, "Import z arkusza");
  assert.equal(quiz.categories.length, 2);
  assert.equal(quiz.categories[0].list.length, 2);
  assert.equal(quiz.categories[0].list[0].question, 'Jak nazywa się "czerwona planeta"?');
  assert.deepEqual(quiz.categories[0].list[0].correctAnswer, ["Mars"]);
  assert.deepEqual(quiz.categories[0].list[1].correctAnswer, ["8"]);
  assert.deepEqual(quiz.categories[1].list[0].correctAnswer, ["Bolesław Chrobry"]);
  assert.equal(validateQuiz(quiz).length, 0);
});

test("import CSV zwraca numer wiersza dla poprawnej odpowiedzi spoza wariantów", () => {
  const csv = [
    "Pytanie,Poprawna odpowiedź,Odpowiedź A,Odpowiedź B",
    "Pytanie kontrolne,Odpowiedź C,A,B",
  ].join("\n");

  assert.throws(() => parseQuizSpreadsheet(csv), /Wiersz 2/);
});

test("okno odpowiedzi jest otwarte tylko podczas aktywnego timera rundy pisania", () => {
  const active = { isQuestionActive: true, isWriting: true, questionData: { acceptingAnswers: true, remainingSeconds: 1 } };
  assert.equal(isAnswerWindowOpen(active), true);
  assert.equal(isAnswerWindowOpen({ ...active, questionData: { acceptingAnswers: false, remainingSeconds: 8 } }), false);
  assert.equal(isAnswerWindowOpen({ ...active, questionData: { acceptingAnswers: true, remainingSeconds: 0 } }), false);
  assert.equal(isAnswerWindowOpen({ ...active, isQuestionActive: false }), false);
  assert.equal(isAnswerWindowOpen({ ...active, isWriting: false }), false);
});
