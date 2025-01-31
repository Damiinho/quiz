import { useState, useContext } from "react";
import { Button, Typography, Paper } from "@mui/material";
import { AppContext } from "../contexts/AppContext";
import Question from "./Game/Question";
import Results from "./Game/Results"; // Importujemy nasz nowy komponent

const Game = () => {
  const { gameSettings } = useContext(AppContext);
  const [isQuestionActive, setIsQuestionActive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const getUnusedQuestionsCount = (category) => {
    return category.list.filter((question) => !question.done).length;
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setIsQuestionActive(true); // Przełączamy na widok pytania
  };

  const handleGoBack = () => {
    setIsQuestionActive(false); // Wracamy do listy kategorii
    setSelectedCategory(null);
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      {/* Wyświetlamy wyniki zawsze, bez względu na to, czy wyświetlamy pytanie czy kategorię */}
      <Results />

      {/* Jeśli pytanie aktywne, wyświetlamy komponent Question */}
      {isQuestionActive && selectedCategory ? (
        <Question category={selectedCategory} handleGoBack={handleGoBack} />
      ) : (
        <>
          <Typography variant="h5" gutterBottom>
            Wybierz kategorię
          </Typography>
          {gameSettings.quiz?.categories?.map((category, index) => {
            const unusedQuestionsCount = getUnusedQuestionsCount(category);

            return (
              <Paper key={index} sx={{ marginBottom: "16px", padding: "10px" }}>
                <Button
                  variant="contained"
                  fullWidth
                  disabled={unusedQuestionsCount === 0}
                  onClick={() => handleCategorySelect(category)}
                >
                  {category.name} ({unusedQuestionsCount})
                </Button>
              </Paper>
            );
          })}
        </>
      )}
    </div>
  );
};

export default Game;
