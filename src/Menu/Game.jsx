import { useContext } from "react";
import { AppContext } from "../contexts/AppContext";
import Question from "./Game/Question";
import Results from "./Game/Results"; // Importujemy nasz nowy komponent

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
    if (length <= minLen) return max; // short names -> largest font
    if (length >= maxLen) return min; // long names -> smallest font
    const ratio = (length - minLen) / (maxLen - minLen); // 0..1
    const size = Math.round(max - ratio * (max - min)); // decrease from max to min
    return size;
  };

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
      )}
    </div>
  );
};

export default Game;
