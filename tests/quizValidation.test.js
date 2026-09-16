import test from "node:test";
import assert from "node:assert/strict";
import { isQuizValid, validateQuiz } from "../src/utils/quizValidation.js";

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
