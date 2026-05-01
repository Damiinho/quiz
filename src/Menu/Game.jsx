import { useContext } from "react";
import { Button } from "@mui/material";
import { AppContext } from "../contexts/AppContext";
import Question from "./Game/Question";
import Results from "./Game/Results";

const Game = () => {
  const stringToHslColor = (str, s = 70, l = 60) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, ${s}%, ${l}%)`;
  };

  const stringToFontSize = (str, min = 30, max = 60, minLen = 5, maxLen = 15) => {
    const length = Math.max(0, (str || "").length);
    if (length <= minLen) return max;
    if (length >= maxLen) return min;
    const ratio = (length - minLen) / (maxLen - minLen);
    return Math.round(max - ratio * (max - min));
  };

  const {
    gameSettings,
    isQuestionActive,
    setIsQuestionActive,
    setScreen,
    selectedCategory,
    setSelectedCategory,
  } = useContext(AppContext);

  const getUnusedQuestionsCount = (category) =>
    category.list?.filter((question) => question && !question.done).length || 0;

  const handleCategorySelect = (category) => {
    if (!category.list || category.list.length === 0) return;
    setSelectedCategory(category);
    setIsQuestionActive(true);
  };

  const handleGoBack = () => {
    setIsQuestionActive(false);
    setSelectedCategory(null);
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <Results />

      {isQuestionActive && selectedCategory ? (
        <Question category={selectedCategory} handleGoBack={handleGoBack} />
      ) : (
        <>
          <div style={{ marginBottom: 20 }}>
            <Button variant="contained" color="success" onClick={() => setScreen("ranking")}>
              Pokaż ranking końcowy
            </Button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center" }}>
            {gameSettings.quiz?.categories?.map((category, index) => {
              const unusedQuestionsCount = getUnusedQuestionsCount(category);
              const bg = stringToHslColor(category.name || String(index), 70, 55);
              const fontSize = stringToFontSize(category.name || String(index), 30, 60);

              return (
                <div key={index} className="menu-button">
                  <button
                    disabled={unusedQuestionsCount === 0}
                    onClick={() => handleCategorySelect(category)}
                    className="category"
                    style={{ backgroundColor: bg, color: "#fff", border: "none", fontSize }}
                  >
                    {category.name} ({unusedQuestionsCount})
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Game;
