import { createContext, useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { defaultQuizzes } from "../data/defaultQuizzes";
import {
  clearSavedGameState,
  loadCustomQuizzes,
  loadGameState,
  saveCustomQuizzes,
  saveGameState,
  readJson,
  writeJson,
} from "../utils/quizStorage";
import { syncStateToCloud, listenForEvents, clearBuzzers } from "../utils/cloudSync";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const navigate = useNavigate();
  const savedGameState = loadGameState();
  const [isQuestionActive, setIsQuestionActive] = useState(
    savedGameState?.isQuestionActive || false
  );
  const [selectedCategoryName, setSelectedCategoryName] = useState(
    savedGameState?.selectedCategoryName || null
  );
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [customQuizzes, setCustomQuizzes] = useState(loadCustomQuizzes);
  const [gameSettings, setGameSettings] = useState(
    savedGameState?.gameSettings || {
      players: [],
      quiz: {},
    }
  );
  const [scoreHistory, setScoreHistory] = useState(savedGameState?.scoreHistory || []);
  const [quizLog, setQuizLog] = useState(savedGameState?.quizLog || []);
  const [undoPointer, setUndoPointer] = useState(savedGameState?.quizLog?.length ? savedGameState.quizLog.length - 1 : -1);
  const [gameCode, setGameCode] = useState(savedGameState?.gameCode || null);
  const [lastBuzzer, setLastBuzzer] = useState(null);

  // Globalne stany aktywnego pytania dla undo/redo
  const [showAnswer, setShowAnswer] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isResultsPinned, setIsResultsPinned] = useState(false);
  const [isLogsPinned, setIsLogsPinned] = useState(false);

  // Ustawienia wizualne
  const [appSettings, setAppSettings] = useState(
    readJson("super-zgadywanka:app-settings", {
      themeMode: "colorful", // "colorful" lub "simple"
      fontSize: 100, // procentowo
      focusMode: false,
      soundEffects: true,
      boardScale: "normal",
      logVisibility: "normal",
      scoreFormat: "total",
    })
  );

  useEffect(() => {
    writeJson("super-zgadywanka:app-settings", appSettings);
    // Aplikowanie rozmiaru czcionki na zmienną CSS
    document.documentElement.style.setProperty('--app-font-size', `${(appSettings.fontSize / 100) * 16}px`);
  }, [appSettings]);

  const removeCustomQuiz = useCallback((quizName) => {
    setCustomQuizzes((prev) => prev.filter(q => q.name !== quizName));
  }, []);

  // Generowanie kodu gry dla Cloud Mode
  const generateGameCode = useCallback(() => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGameCode(code);
    return code;
  }, []);

  const startNewQuiz = useCallback((quiz) => {
    setQuizLog([]);
    setUndoPointer(-1);
    setGameSettings({
      players: [],
      quiz: quiz,
    });
    
    // Nie generujemy już kodu od razu - user zrobi to na liście kategorii
    setGameCode(null);

    // Rozpoczynamy nowy log od razu
    const startAction = {
      type: "START_QUIZ",
      description: `Rozpoczęto quiz: ${quiz.name}`,
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      undone: false
    };
    setQuizLog([startAction]);
    setUndoPointer(0);
  }, []);

  const addToLog = useCallback((action) => {
    setQuizLog((prev) => {
      const baseLog = prev.slice(0, undoPointer + 1);
      const newLog = [
        ...baseLog,
        { ...action, id: Date.now(), timestamp: new Date().toLocaleTimeString(), undone: false }
      ];
      return newLog.slice(-100);
    });
    setUndoPointer((prev) => (prev < 99 ? prev + 1 : 99));
  }, [undoPointer]);

  const performAction = useCallback((action, isUndo) => {
    if (action.type === "POINTS_CHANGE") {
      setGameSettings((prev) => {
        const updatedPlayers = [...prev.players];
        updatedPlayers[action.playerIndex].points += (isUndo ? -action.change : action.change);
        return { ...prev, players: updatedPlayers };
      });
    } else if (action.type === "QUESTION_DONE") {
      setGameSettings((prev) => {
        const newQuiz = {
          ...prev.quiz,
          categories: prev.quiz.categories.map(cat => {
            if (cat.name !== action.categoryName) return cat;
            return {
              ...cat,
              list: cat.list.map(q => {
                if (q.no === action.questionNo && q.question === action.questionText) {
                  return { ...q, done: !isUndo };
                }
                return q;
              })
            };
          })
        };
        
        if (isUndo) {
          setSelectedCategoryName(action.categoryName);
          setIsQuestionActive(true);
        } else {
          setIsQuestionActive(false);
          setSelectedCategoryName(null);
        }
        
        return { ...prev, quiz: newQuiz };
      });
    } else if (action.type === "QUESTION_OPENED" || action.type === "QUESTION_CLOSED") {
      const shouldBeActive = (action.type === "QUESTION_OPENED" && !isUndo) || (action.type === "QUESTION_CLOSED" && isUndo);
      if (shouldBeActive) {
        setSelectedCategoryName(action.categoryName);
        setIsQuestionActive(true);
      } else {
        setIsQuestionActive(false);
        setSelectedCategoryName(null);
      }
    } else if (action.type === "SHOW_ANSWER") {
      setShowAnswer(!isUndo);
    } else if (action.type === "SOUND_PLAY") {
      setIsAudioPlaying(!isUndo);
    } else if (action.type === "START_QUIZ") {
      navigate(isUndo ? "/kategorie" : "/gracze");
    }
  }, [setIsQuestionActive, setShowAnswer, setIsAudioPlaying, navigate]);

  const undoAction = useCallback(() => {
    if (undoPointer < 0) return;
    const action = quizLog[undoPointer];
    performAction(action, true);
    setQuizLog(prev => prev.map((item, i) => i === undoPointer ? { ...item, undone: true } : item));
    setUndoPointer(prev => prev - 1);
  }, [undoPointer, quizLog, performAction]);

  const redoAction = useCallback(() => {
    if (undoPointer >= quizLog.length - 1) return;
    const nextPointer = undoPointer + 1;
    const action = quizLog[nextPointer];
    performAction(action, false);
    setQuizLog(prev => prev.map((item, i) => i === nextPointer ? { ...item, undone: false } : item));
    setUndoPointer(nextPointer);
  }, [undoPointer, quizLog, performAction]);

  const jumpToLogIndex = useCallback((targetIndex) => {
    if (targetIndex === undoPointer) return;

    if (targetIndex < undoPointer) {
      for (let i = undoPointer; i > targetIndex; i--) {
        performAction(quizLog[i], true);
      }
      setQuizLog(prev => prev.map((item, i) => (i > targetIndex ? { ...item, undone: true } : { ...item, undone: false })));
    } else {
      for (let i = undoPointer + 1; i <= targetIndex; i++) {
        performAction(quizLog[i], false);
      }
      setQuizLog(prev => prev.map((item, i) => (i <= targetIndex ? { ...item, undone: false } : item)));
    }
    setUndoPointer(targetIndex);
  }, [undoPointer, quizLog, performAction]);

  const quizList = useMemo(
    () => [...defaultQuizzes, ...customQuizzes],
    [customQuizzes]
  );

  const addCustomQuiz = useCallback((quiz) => {
    setCustomQuizzes((prevQuizzes) => [...prevQuizzes, quiz]);
  }, []);

  const updateCustomQuiz = useCallback((quizIndex, quiz) => {
    setCustomQuizzes((prevQuizzes) =>
      prevQuizzes.map((currentQuiz, index) => (index === quizIndex ? quiz : currentQuiz))
    );
  }, []);

  const resetSavedGame = useCallback(() => {
    if (gameCode) clearBuzzers(gameCode);
    clearSavedGameState();
    setIsQuestionActive(false);
    setSelectedCategoryName(null);
    setGameSettings({ players: [], quiz: {} });
    setQuizLog([]);
    setUndoPointer(-1);
    setGameCode(null);
    setLastBuzzer(null);
  }, [gameCode]);

  useEffect(() => {
    saveCustomQuizzes(customQuizzes);
  }, [customQuizzes]);

  useEffect(() => {
    saveGameState({
      isQuestionActive,
      gameSettings,
      scoreHistory,
      quizLog,
      gameCode,
      selectedCategoryName,
    });

    if (gameCode) {
      const timeoutId = setTimeout(() => {
        syncStateToCloud(gameCode, {
          isQuestionActive,
          players: gameSettings.players,
          currentQuestion: isQuestionActive ? selectedCategoryName : null
        });
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [isQuestionActive, gameSettings, scoreHistory, gameCode, selectedCategoryName, quizLog]);

  useEffect(() => {
    let eventSource = null;
    if (gameCode) {
      eventSource = listenForEvents(gameCode, (eventData) => {
        if (eventData.type === "BUZZER") {
          setLastBuzzer(eventData);
        } else if (eventData.type === "JOIN") {
          // Automatyczne dopisanie lub powiązanie gracza (niezależnie od wielkości liter)
          setGameSettings(prev => {
            const playerIndex = prev.players.findIndex(p => p.name.toLowerCase() === eventData.player.toLowerCase());
            if (playerIndex === -1) {
              const newPlayer = { name: eventData.player, points: 0, connected: true };
              return { ...prev, players: [...prev.players, newPlayer] };
            } else {
              // Powiązanie z istniejącym (zachowujemy oryginalną nazwę hosta, ale oznaczamy jako połączony)
              return {
                ...prev,
                players: prev.players.map((p, i) => 
                  i === playerIndex 
                    ? { ...p, connected: true } 
                    : p
                )
              };
            }
          });
        }
      });
    }
    return () => {
      if (eventSource) eventSource.close();
    };
  }, [gameCode]);

  const providerValue = useMemo(() => ({
    gameSettings,
    setGameSettings,
    scoreHistory,
    setScoreHistory,
    gameCode,
    setGameCode,
    generateGameCode,
    lastBuzzer,
    setLastBuzzer,
    quizList,
    customQuizzes,
    setCustomQuizzes,
    addCustomQuiz,
    updateCustomQuiz,
    editingQuiz,
    setEditingQuiz,
    resetSavedGame,
    startNewQuiz,
    isQuestionActive,
    setIsQuestionActive,
    selectedCategoryName,
    setSelectedCategoryName,
    quizLog,
    undoAction,
    redoAction,
    jumpToLogIndex,
    undoPointer,
    addToLog,
    showAnswer,
    setShowAnswer,
    isAudioPlaying,
    setIsAudioPlaying,
    isResultsPinned,
    setIsResultsPinned,
    isLogsPinned,
    setIsLogsPinned,
    appSettings,
    setAppSettings,
    removeCustomQuiz,
    loadDownloadedState: (state) => {
      setIsQuestionActive(state.isQuestionActive || false);
      setGameSettings(state.gameSettings || { players: [], quiz: {} });
      setScoreHistory(state.scoreHistory || []);
      setQuizLog(state.quizLog || []);
      setGameCode(state.gameCode || null);
      setSelectedCategoryName(state.selectedCategoryName || null);
      setUndoPointer(state.undoPointer ?? (state.quizLog?.length ? state.quizLog.length - 1 : -1));
      navigate("/gra");
    },
    getDownloadableState: () => ({
      isQuestionActive,
      gameSettings,
      scoreHistory,
      quizLog,
      gameCode,
      selectedCategoryName,
      undoPointer,
      timestamp: new Date().toISOString()
    }),
    }), [
    gameSettings, 
    scoreHistory, 
    gameCode, 
    generateGameCode, 
    lastBuzzer, 
    quizList, 
    customQuizzes, 
    addCustomQuiz, 
    updateCustomQuiz, 
    editingQuiz, 
    resetSavedGame, 
    startNewQuiz, 
    isQuestionActive, 
    selectedCategoryName,
    quizLog,
    undoAction,
    redoAction,
    jumpToLogIndex,
    undoPointer,
    addToLog,
    showAnswer,
    isAudioPlaying,
    isResultsPinned,
    isLogsPinned,
    appSettings,
    removeCustomQuiz,
    navigate
    ]);
  return (
    <AppContext.Provider value={providerValue}>{children}</AppContext.Provider>
  );
};

AppProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AppProvider;
