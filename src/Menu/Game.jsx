import { useContext, useCallback, useMemo, useState } from "react";
import { AppContext } from "../contexts/AppContext";
import Question from "./Game/Question";
import Results from "./Game/Results";
import QuizLog from "./Game/QuizLog";
import Ranking from "./Ranking";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

const stringToHslColor = (str, s = 70, l = 60) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, ${s}%, ${l}%)`;
};

const Game = () => {
  const [isRankingOpen, setIsRankingOpen] = useState(false);
  const {
    gameSettings,
    isQuestionActive,
    setIsQuestionActive,
    selectedCategoryName,
    setSelectedCategoryName,
    addToLog,
    dashboardBg,
  } = useContext(AppContext);

  const getUnusedQuestionsCount = (category) =>
    category.list?.filter((question) => question && !question.done).length || 0;

  const handleCategorySelect = useCallback((category) => {
    if (!category.list || category.list.length === 0) return;
    setSelectedCategoryName(category.name);
    setIsQuestionActive(true);
    addToLog({ 
      type: "QUESTION_OPENED", 
      categoryName: category.name,
      description: `Otwarto kategorię: ${category.name}` 
    });
  }, [setSelectedCategoryName, setIsQuestionActive, addToLog]);

  const handleGoBack = useCallback(() => {
    setIsQuestionActive(false);
    setSelectedCategoryName(null);
  }, [setIsQuestionActive, setSelectedCategoryName]);

  const currentCategory = useMemo(() => {
    if (!selectedCategoryName || !gameSettings.quiz?.categories) return null;
    return gameSettings.quiz.categories.find(c => c.name === selectedCategoryName);
  }, [gameSettings.quiz?.categories, selectedCategoryName]);

  return (
    <div style={{ width: "100%", maxWidth: "1200px" }}>
      <Ranking open={isRankingOpen} onClose={() => setIsRankingOpen(false)} />
      
      {/* Warstwa "napaćkanego" tła */}
      {!isQuestionActive && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 0,
            pointerEvents: "none",
            ...dashboardBg
          }} 
        />
      )}

      <Results />
      <QuizLog />

      {isQuestionActive && currentCategory ? (
        <Question category={currentCategory} handleGoBack={handleGoBack} />
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "800" }}>Wybierz kategorię</h2>
            <button 
              onClick={() => setIsRankingOpen(true)}
              style={{ background: "#2ecc71", color: "#000", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "13px" }}
            >
              RANKING KOŃCOWY
            </button>
          </div>
          
          <div className="quiz-grid">
            {gameSettings.quiz?.categories?.map((category, index) => {
              const unusedQuestionsCount = getUnusedQuestionsCount(category);
              const isActive = unusedQuestionsCount > 0;
              const bg = stringToHslColor(category.name || String(index), 60, 50);

              return (
                <div 
                  key={index} 
                  className="quiz-card" 
                  onClick={() => isActive && handleCategorySelect(category)}
                  style={{ 
                    opacity: isActive ? 1 : 0.4, 
                    cursor: isActive ? "pointer" : "not-allowed",
                    border: isActive ? "1px solid rgba(255,255,255,0.05)" : "none"
                  }}
                >
                  <div className="quiz-card__icon" style={{ background: bg }}>
                    {category.name?.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="quiz-card__title">{category.name}</h3>
                  <p className="quiz-card__info">
                    Pozostało pytań: {unusedQuestionsCount}
                  </p>
                  <div className="quiz-card__dots" style={{ top: "auto", bottom: "20px" }}>
                    <ChevronRightIcon />
                  </div>
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
