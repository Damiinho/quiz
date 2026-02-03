import { useContext } from "react";
import { Button } from "@mui/material";
import { AppContext } from "../contexts/AppContext";
import Question from "./Game/Question";
import Results from "./Game/Results"; // Importujemy nasz nowy komponent

const Game = () => {
  const {
    gameSettings,
    isQuestionActive,
    setIsQuestionActive,
    selectedCategory,
    setSelectedCategory,
  } = useContext(AppContext);

  const getUnusedQuestionsCount = (category) => {
    return (
      category.list?.filter((question) => question && !question.done).length ||
      0
    );
  };

  const handleCategorySelect = (category) => {
    if (!category.list || category.list.length === 0) return;
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
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
              justifyContent: "center",
            }}
          >
            {gameSettings.quiz?.categories?.map((category, index) => {
              const unusedQuestionsCount = getUnusedQuestionsCount(category);

              return (
                <Button
                  key={index}
                  variant="contained"
                  disabled={unusedQuestionsCount === 0}
                  onClick={() => handleCategorySelect(category)}
                  style={{
                    flex: "1 1 calc(33.333% - 16px)",
                    minWidth: "200px",
                  }}
                >
                  {category.name} ({unusedQuestionsCount})
                </Button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Game;
