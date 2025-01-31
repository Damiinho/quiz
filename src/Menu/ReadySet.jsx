import { Button } from "@mui/material";
import { useContext } from "react";
import { AppContext } from "../contexts/AppContext";

const ReadySet = () => {
  const { quizList, setGameSettings, setScreen } = useContext(AppContext);

  const handleSelectQuiz = (quiz) => {
    setGameSettings((prevSettings) => ({
      ...prevSettings,
      quiz: quiz, // Ustawienie wybranego quizu
    }));
  };

  return (
    <>
      {quizList.map((quiz, index) => (
        <div key={index} className="menu-button">
          <Button
            variant="contained"
            onClick={() => {
              handleSelectQuiz(quiz);
              setScreen("players");
            }}
          >
            {quiz.name}
          </Button>
        </div>
      ))}
    </>
  );
};

export default ReadySet;
