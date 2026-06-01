import { useContext, useCallback, useMemo, useState } from "react";
import { AppContext } from "../contexts/AppContext";
import { Typography, Box } from "@mui/material";
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
    buzzerQueue,
    setBuzzerQueue,
    gameCode,
    generateGameCode
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

  const firstBuzzer = buzzerQueue.length > 0 ? buzzerQueue[0] : null;
  const otherBuzzers = buzzerQueue.length > 1 ? buzzerQueue.slice(1) : [];

  return (
    <div style={{ width: "100%", maxWidth: boardScale.maxWidth, margin: "0 auto" }}>
      <Ranking open={isRankingOpen} onClose={() => setIsRankingOpen(false)} />
      
      {/* Buzzer Notification Overlay */}
      {firstBuzzer && (
        <div style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10001,
          background: "rgba(15, 23, 42, 0.98)",
          backdropFilter: "blur(25px)",
          color: "#fff",
          padding: "40px",
          borderRadius: "40px",
          border: "4px solid #ef4444",
          boxShadow: "0 0 100px rgba(239, 68, 68, 0.4), 0 40px 80px rgba(0,0,0,0.9)",
          textAlign: "center",
          animation: "buzzerPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          width: "auto",
          minWidth: "450px",
          maxWidth: "90vw",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          <style>
            {`
              @keyframes buzzerPop {
                0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
                100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
              }
              @keyframes pulseRed {
                0% { box-shadow: 0 0 40px rgba(239, 68, 68, 0.3); }
                50% { box-shadow: 0 0 70px rgba(239, 68, 68, 0.6); }
                100% { box-shadow: 0 0 40px rgba(239, 68, 68, 0.3); }
              }
            `}
          </style>
          <div style={{ 
            animation: "pulseRed 2s infinite ease-in-out", 
            position: "absolute", 
            top: 0, left: 0, right: 0, bottom: 0, 
            borderRadius: "36px", 
            pointerEvents: "none" 
          }} />
          
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
            <Typography variant="overline" sx={{ color: "#ef4444", fontWeight: "1000", letterSpacing: "4px", fontSize: "1.2rem" }}>
                {otherBuzzers.length > 0 ? "KOLEJKA ZGŁOSZEŃ" : "ZGŁOSZENIE!"}
            </Typography>
            {buzzerQueue.length > 1 && (
                <Box sx={{ background: "#ef4444", color: "#fff", px: 1.5, py: 0.5, borderRadius: "10px", fontWeight: "900", fontSize: "1rem" }}>
                    {buzzerQueue.length}
                </Box>
            )}
          </Box>

          <Typography variant="h2" sx={{ 
            fontWeight: "900", 
            mb: 2, 
            mt: 1,
            textTransform: "uppercase", 
            letterSpacing: "-2px",
            textShadow: "0 0 20px rgba(239, 68, 68, 0.5)",
            lineHeight: 1.1
          }}>
            {firstBuzzer.player}
          </Typography>

          {/* Kolejne osoby w kolejce - Sekcja rozszerzająca się */}
          {otherBuzzers.length > 0 && (
            <Box sx={{ 
              mt: 1, 
              mb: 4, 
              width: "100%",
              background: "rgba(0,0,0,0.3)",
              borderRadius: "24px",
              border: "1px solid rgba(255,255,255,0.05)",
              overflow: "hidden"
            }}>
              <Box sx={{ p: 2, borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
                 <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)", fontWeight: "900", textTransform: "uppercase", letterSpacing: "1px" }}>
                    Następni w kolejce:
                 </Typography>
              </Box>
              <Box sx={{ 
                maxHeight: "200px", 
                overflowY: "auto", 
                p: 2,
                display: "flex",
                flexDirection: "column",
                gap: 1.5
              }}>
                {otherBuzzers.map((buzzer, idx) => (
                  <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 2, justifyContent: "center" }}>
                    <Typography sx={{ color: "rgba(255,255,255,0.3)", fontWeight: "900", fontSize: "1.1rem" }}>{idx + 2}.</Typography>
                    <Typography variant="h5" sx={{ fontWeight: "800", color: "rgba(255,255,255,0.9)" }}>
                        {buzzer.player}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
          
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: "100%", mt: otherBuzzers.length === 0 ? 2 : 0 }}>
            <button
                onClick={() => setBuzzerQueue(prev => prev.slice(1))}
                style={{
                background: "#ef4444",
                color: "#fff",
                border: "none",
                padding: "18px 60px",
                borderRadius: "24px",
                fontWeight: "900",
                cursor: "pointer",
                fontSize: "1.5rem",
                textTransform: "uppercase",
                transition: "all 0.2s",
                boxShadow: "0 8px 0 #b91c1c",
                width: "100%"
                }}
                onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'translateY(4px)';
                    e.currentTarget.style.boxShadow = '0 4px 0 #b91c1c';
                }}
                onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 0 #b91c1c';
                }}
            >
                {otherBuzzers.length > 0 ? "NASTĘPNY" : "ROZUMIEM"}
            </button>

            {otherBuzzers.length > 0 && (
                <button 
                    onClick={() => setBuzzerQueue([])}
                    style={{ 
                        background: "transparent",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "rgba(255,255,255,0.4)",
                        padding: "10px",
                        borderRadius: "16px",
                        cursor: "pointer",
                        fontWeight: "800",
                        fontSize: "0.8rem",
                        textTransform: "uppercase"
                    }}
                >
                    Wyczyść wszystkich
                </button>
            )}
          </Box>
        </div>
      )}

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
            
            {/* Online Game Code Section */}
            <div style={{ marginTop: "20px", display: "flex", justifyContent: "center", gap: "10px", alignItems: "center" }}>
              {!gameCode && (
                <button
                  onClick={generateGameCode}
                  style={{
                    background: "#2ecc71",
                    color: "#000",
                    border: "none",
                    padding: "8px 24px",
                    borderRadius: "12px",
                    fontWeight: "900",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    textTransform: "uppercase"
                  }}
                >
                  Generuj kod gry online
                </button>
              )}
            </div>
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
