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
} from "../utils/quizStorage";
import { syncStateToCloud, listenForBuzzers, clearBuzzers } from "../utils/cloudSync";

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

  const dashboardBg = useMemo(() => {
    const colors = [
      "rgba(16, 185, 129, 0.4)", // Emerald
      "rgba(59, 130, 246, 0.4)", // Blue
      "rgba(139, 92, 246, 0.4)", // Purple
      "rgba(236, 72, 153, 0.4)", // Pink
      "rgba(245, 158, 11, 0.4)",  // Amber
      "rgba(6, 182, 212, 0.4)",  // Cyan
      "rgba(132, 204, 22, 0.4)", // Lime
      "rgba(99, 102, 241, 0.4)", // Indigo
      "rgba(244, 63, 94, 0.4)",  // Rose
      "rgba(255, 120, 0, 0.4)",  // Orange
    ];
    
    return {
      background: `
        radial-gradient(circle at 5% 5%, ${colors[0]} 0%, transparent 45%),
        radial-gradient(circle at 95% 5%, ${colors[1]} 0%, transparent 45%),
        radial-gradient(circle at 50% 15%, ${colors[2]} 0%, transparent 50%),
        radial-gradient(circle at 10% 90%, ${colors[3]} 0%, transparent 45%),
        radial-gradient(circle at 90% 85%, ${colors[4]} 0%, transparent 45%),
        radial-gradient(circle at 20% 40%, ${colors[5]} 0%, transparent 40%),
        radial-gradient(circle at 80% 45%, ${colors[6]} 0%, transparent 40%),
        radial-gradient(circle at 35% 70%, ${colors[7]} 0%, transparent 45%),
        radial-gradient(circle at 65% 75%, ${colors[8]} 0%, transparent 45%),
        radial-gradient(circle at 50% 95%, ${colors[9]} 0%, transparent 40%)
      `
    };
  }, []);

  const startNewQuiz = useCallback((quiz) => {
    setQuizLog([]);
    setUndoPointer(-1);
    setGameSettings({
      players: [],
      quiz: quiz,
    });
    
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

  // Generowanie kodu gry dla Cloud Mode
  const generateGameCode = useCallback(() => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGameCode(code);
    return code;
  }, []);

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
      eventSource = listenForBuzzers(gameCode, (data) => {
        if (data.lastHit) {
          setLastBuzzer(data.lastHit);
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
    dashboardBg,
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
    dashboardBg
    ]);
  return (
    <AppContext.Provider value={providerValue}>{children}</AppContext.Provider>
  );
};

AppProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AppProvider;
