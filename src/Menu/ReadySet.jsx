import { useContext } from "react";
import { AppContext } from "../contexts/AppContext";
import { downloadJson, makeSerializableQuiz } from "../utils/quizStorage";
import { validateQuiz } from "../utils/quizValidation";

const ReadySet = () => {
  const {
    customQuizzes,
    quizList,
    setEditingQuiz,
    setGameSettings,
    setScreen,
  } = useContext(AppContext);

  const handleSelectQuiz = (quiz) => {
    setGameSettings((prevSettings) => ({
      ...prevSettings,
      quiz: structuredClone(makeSerializableQuiz(quiz)),
    }));
  };

  const handleValidate = (quiz) => {
    const issues = validateQuiz(makeSerializableQuiz(quiz));
    if (issues.length === 0) {
      window.alert(`Quiz "${quiz.name}" wygląda poprawnie.`);
      return;
    }

    window.alert(`Walidator znalazł problemy:\n\n${issues.join("\n")}`);
  };

  const handleDownload = (quiz) => {
    const filename = `${quiz.name || "quiz"}.json`
      .toLowerCase()
      .replace(/[^a-z0-9ąćęłńóśźż]+/gi, "-")
      .replace(/^-|-$/g, "");
    downloadJson(makeSerializableQuiz(quiz), `${filename || "quiz"}.json`);
  };

  const handleEdit = (quiz) => {
    const customIndex = customQuizzes.indexOf(quiz);
    setEditingQuiz({
      index: customIndex >= 0 ? customIndex : null,
      quiz: structuredClone(makeSerializableQuiz(quiz)),
    });
    setScreen("createNew");
  };

  return (
    <>
      {quizList.map((quiz, index) => (
        <div key={`${quiz.name}-${index}`} className="menu-button" style={{ flexDirection: "column", gap: 8 }}>
          <button
            onClick={() => {
              handleSelectQuiz(quiz);
              setScreen("players");
            }}
          >
            {quiz.name}
          </button>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <button style={{ padding: "8px 12px", fontSize: 16 }} onClick={() => handleEdit(quiz)}>
              Edytuj
            </button>
            <button style={{ padding: "8px 12px", fontSize: 16 }} onClick={() => handleDownload(quiz)}>
              Pobierz JSON
            </button>
            <button style={{ padding: "8px 12px", fontSize: 16 }} onClick={() => handleValidate(quiz)}>
              Waliduj
            </button>
          </div>
        </div>
      ))}
    </>
  );
};

export default ReadySet;
