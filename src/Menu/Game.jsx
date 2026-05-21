import { useContext, useCallback, useMemo, useState } from "react";
import { AppContext } from "../contexts/AppContext";
import Question from "./Game/Question";
import Results from "./Game/Results";
import QuizLog from "./Game/QuizLog";
import Ranking from "./Ranking";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

const getCategoryCardBackground = (index) => {
  const colors = [
    "rgba(46, 204, 113, 0.45)", // Green
    "rgba(168, 85, 247, 0.45)", // Purple
    "rgba(59, 130, 246, 0.45)", // Blue
    "rgba(239, 68, 68, 0.45)",  // Red
    "rgba(234, 179, 8, 0.45)",  // Yellow
    "rgba(99, 102, 241, 0.45)"  // Indigo
  ];
  return colors[index % colors.length];
};

const getDynamicFontSize = (text, baseSize) => {
  const matches = baseSize.match(/([\d.]+)(rem|vw|px)/g);
  let maxVal = 2.4; 
  if (matches && matches.length > 0) {
    maxVal = parseFloat(matches[matches.length - 1]);
  }

  const length = text.length;
  if (length < 8) return `${maxVal * 1.8}rem`;
  if (length < 12) return `${maxVal * 1.3}rem`;
  if (length < 18) return `${maxVal * 1.0}rem`;
  return `${maxVal * 0.8}rem`;
};

const boardScaleSettings = {
  compact: {
    maxWidth: "800px",
    cardMinHeight: "110px",
    cardPadding: "0.75rem",
    titleSize: "1.4rem",
    gridTemplate: "repeat(auto-fill, minmax(220px, 1fr))",
  },
  normal: {
    maxWidth: "980px",
    cardMinHeight: "140px",
    cardPadding: "1rem",
    titleSize: "1.8rem",
    gridTemplate: "repeat(auto-fill, minmax(280px, 1fr))",
  },
  large: {
    maxWidth: "1300px",
    cardMinHeight: "190px",
    cardPadding: "1.5rem",
    titleSize: "2.5rem",
    gridTemplate: "repeat(auto-fill, minmax(360px, 1fr))",
  },
  extraLarge: {
    maxWidth: "1600px",
    cardMinHeight: "240px",
    cardPadding: "2rem",
    titleSize: "3.2rem",
    gridTemplate: "repeat(auto-fill, minmax(460px, 1fr))",
  },
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
    appSettings,
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
    const category = gameSettings.quiz.categories.find(c => c.name === selectedCategoryName);
    return category ? { ...category, randomizeQuestions: gameSettings.quiz?.randomizeQuestions } : null;
  }, [gameSettings.quiz?.categories, gameSettings.quiz?.randomizeQuestions, selectedCategoryName]);

  const shouldHidePanels = appSettings?.focusMode && isQuestionActive;
  const boardScale = boardScaleSettings[appSettings?.boardScale] || boardScaleSettings.normal;
  const shouldShowLog = appSettings?.logVisibility !== "hidden";

  return (
    <div style={{ width: "100%", maxWidth: boardScale.maxWidth, margin: "0 auto" }}>
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

      {!shouldHidePanels && (
        <>
          <Results />
          {shouldShowLog && <QuizLog />}
        </>
      )}

      {isQuestionActive && currentCategory ? (
        <Question category={currentCategory} handleGoBack={handleGoBack} />
      ) : (
        <>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h1 
              style={{ 
                fontSize: "3.5rem", 
                fontWeight: "900", 
                textTransform: "uppercase", 
                letterSpacing: "-2px",
                margin: 0,
                lineHeight: 1
              }}
            >
              KATEGORIE
            </h1>
          </div>
          
          <div 
            className="quiz-grid"
            style={{ 
              display: "grid", 
              gridTemplateColumns: boardScale.gridTemplate,
              gap: "1.5rem"
            }}
          >
            {gameSettings.quiz?.categories?.map((category, index) => {
              const unusedQuestionsCount = getUnusedQuestionsCount(category);
              const isActive = unusedQuestionsCount > 0;
              const cardBg = getCategoryCardBackground(index);
              const dynamicSize = getDynamicFontSize(category.name, boardScale.titleSize);

              return (
                <div 
                  key={index} 
                  className="quiz-card" 
                  onClick={() => isActive && handleCategorySelect(category)}
                  style={{ 
                    opacity: isActive ? 1 : 0.4, 
                    cursor: isActive ? "pointer" : "not-allowed",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: cardBg,
                    backgroundColor: cardBg,
                    backdropFilter: "blur(8px)",
                    minHeight: boardScale.cardMinHeight,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    padding: boardScale.cardPadding,
                    borderRadius: "24px",
                    boxShadow: isActive ? "0 10px 30px rgba(0,0,0,0.3)" : "none",
                    transition: "all 0.3s ease",
                    overflow: "hidden",
                    wordBreak: "normal"
                  }}
                >
                  <h3
                    className="quiz-card__title"
                    style={{
                      fontFamily: "inherit",
                      fontSize: dynamicSize,
                      fontWeight: 900,
                      lineHeight: 1.1,
                      margin: 0,
                      textAlign: "center",
                      width: "100%",
                      color: "#fff",
                      textTransform: "uppercase",
                      letterSpacing: "-1.5px",
                      wordBreak: "normal",
                      overflowWrap: "normal",
                      whiteSpace: "normal",
                      textShadow: "0 2px 10px rgba(0,0,0,0.5)",
                    }}
                  >
                    {category.name}
                  </h3>
                  <div style={{ marginTop: "1rem" }}>
                    <p className="quiz-card__info" style={{ color: "rgba(255,255,255,0.7)", fontWeight: 800, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "1px" }}>
                      POZOSTAŁO: {unusedQuestionsCount}
                    </p>
                  </div>
                  <div className="quiz-card__dots" style={{ top: "auto", bottom: "15px", right: "15px", color: "rgba(255,255,255,0.5)" }}>
                    <ChevronRightIcon />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: "center", marginTop: "60px" }}>
            <button 
              onClick={() => setIsRankingOpen(true)}
              style={{ 
                background: "rgba(255,255,255,0.05)", 
                color: "#fff", 
                border: "1px solid rgba(255,255,255,0.1)", 
                padding: "16px 48px", 
                borderRadius: "12px", 
                fontWeight: "800", 
                cursor: "pointer", 
                fontSize: "1rem",
                textTransform: "uppercase",
                letterSpacing: "1px",
                transition: "all 0.2s"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              RANKING GRACZY
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Game;
