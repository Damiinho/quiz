import test from "node:test";
import assert from "node:assert/strict";
import { isQuizValid, validateQuiz } from "../src/utils/quizValidation.js";
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
