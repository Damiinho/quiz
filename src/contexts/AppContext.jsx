import { createContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
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
      wiemLepiejLimit: 1
    }
  );
  const [scoreHistory, setScoreHistory] = useState(savedGameState?.scoreHistory || []);
  const [quizLog, setQuizLog] = useState(savedGameState?.quizLog || []);
  const [undoPointer, setUndoPointer] = useState(savedGameState?.quizLog?.length ? savedGameState.quizLog.length - 1 : -1);
  const [gameCode, setGameCode] = useState(savedGameState?.gameCode || null);
  const [buzzerQueue, setBuzzerQueue] = useState([]);
  const [auctionBids, setAuctionBids] = useState({}); // { playerName: amount }
  const [auctionStage, setAuctionStage] = useState(0); // 0: brak, 1: po raz pierwszy, 2: po raz drugi, 3: po raz trzeci

  // Globalne stany aktywnego pytania dla undo/redo
  const [showAnswer, setShowAnswer] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isResultsPinned, setIsResultsPinned] = useState(false);
  const [isLogsPinned, setIsLogsPinned] = useState(false);
  const [isAuctionTimerRunning, setIsAuctionTimerRunning] = useState(false);

  // Ustawienia wizualne
  const [appSettings, setAppSettings] = useState(
    readJson("super-zgadywanka:app-settings", {
      themeMode: "colorful", 
      fontSize: 100, 
      focusMode: false,
      soundEffects: true,
      boardScale: "normal",
      logVisibility: "normal",
      scoreFormat: "total",
    })
  );

  useEffect(() => {
    writeJson("super-zgadywanka:app-settings", appSettings);
    document.documentElement.style.setProperty('--app-font-size', `${(appSettings.fontSize / 100) * 16}px`);
  }, [appSettings]);

  const removeCustomQuiz = useCallback((quizName) => {
    setCustomQuizzes((prev) => prev.filter(q => q.name !== quizName));
  }, []);

  const generateGameCode = useCallback(() => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGameCode(code);
    return code;
  }, []);

  // Ref to track undoPointer without triggering re-renders of stable functions
  const undoPointerRef = useRef(undoPointer);
  useEffect(() => {
    undoPointerRef.current = undoPointer;
  }, [undoPointer]);

  const addToLog = useCallback((action) => {
    setQuizLog((prev) => {
      const baseLog = prev.slice(0, undoPointerRef.current + 1);
      const newLog = [
        ...baseLog,
        { ...action, id: Date.now(), timestamp: new Date().toLocaleTimeString(), undone: false }
      ];
      return newLog.slice(-100);
    });
    setUndoPointer((prev) => (prev < 99 ? prev + 1 : 99));
  }, []); // Stable!

  const toggleWiemLepiej = useCallback((playerIndex) => {
    setGameSettings((prev) => {
      const updatedPlayers = [...prev.players];
      const player = updatedPlayers[playerIndex];
      if (!player) return prev;
      
      const nextUsed = (player.wiemLepiejUsed || 0) > 0 ? 0 : 1;
      updatedPlayers[playerIndex] = { ...player, wiemLepiejUsed: nextUsed };

      // We handle logging in a separate effect or after update
      return { ...prev, players: updatedPlayers };
    });
  }, []);

  // Sync toggleWiemLepiej with logs
  const prevGameSettingsRef = useRef(gameSettings);
  useEffect(() => {
    gameSettings.players.forEach((player, idx) => {
        const prevPlayer = prevGameSettingsRef.current.players?.[idx];
        if (player.wiemLepiejUsed !== prevPlayer?.wiemLepiejUsed) {
            addToLog({
                type: "WIEM_LEPIEJ_USE",
                playerIndex: idx,
                playerName: player.name,
                description: player.wiemLepiejUsed > 0 ? `${player.name} używa "Wiem Lepiej!"` : `Cofnięto użycie "Wiem Lepiej!" dla ${player.name}`
            });
        }
    });
    prevGameSettingsRef.current = gameSettings;
  }, [gameSettings, addToLog]);

  const startNewQuiz = useCallback((quiz) => {
    setQuizLog([]);
    setUndoPointer(-1);
    setGameSettings(prev => ({
      ...prev,
      quiz: quiz,
      players: prev.players.map(p => ({ ...p, points: 0, wiemLepiejUsed: 0 })),
      wiemLepiejLimit: prev.wiemLepiejLimit || 1
    }));
    
    setGameCode(null);

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

  const performAction = useCallback((action, isUndo) => {
    if (action.type === "POINTS_CHANGE") {
      setGameSettings((prev) => {
        const updatedPlayers = [...prev.players];
        if (updatedPlayers[action.playerIndex]) {
            updatedPlayers[action.playerIndex].points += (isUndo ? -action.change : action.change);
        }
        return { ...prev, players: updatedPlayers };
      });
    } else if (action.type === "WIEM_LEPIEJ_USE") {
      setGameSettings((prev) => {
        const updatedPlayers = [...prev.players];
        if (updatedPlayers[action.playerIndex]) {
          updatedPlayers[action.playerIndex].wiemLepiejUsed = (updatedPlayers[action.playerIndex].wiemLepiejUsed || 0) + (isUndo ? -1 : 1);
        }
        return { ...prev, players: updatedPlayers };
      });
    } else if (action.type === "QUESTION_DONE") {
      setGameSettings((prev) => {
        const newQuiz = {
          ...prev.quiz,
          categories: prev.quiz.categories?.map(cat => {
            if (cat.name !== action.categoryName) return cat;
            return {
              ...cat,
              list: cat.list?.map(q => {
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
  }, [navigate]);

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

  const quizList = useMemo(() => [...defaultQuizzes, ...customQuizzes], [customQuizzes]);

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
    setBuzzerQueue([]);
    setAuctionBids({});
  }, [gameCode]);

  useEffect(() => {
    if (!isQuestionActive) {
        setBuzzerQueue([]);
        setAuctionBids({});
        setAuctionStage(0);
        setIsAuctionTimerRunning(false);
    }
  }, [isQuestionActive]);

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
          wiemLepiejLimit: gameSettings.wiemLepiejLimit,
          isAuction: gameSettings.quiz?.categories?.find(c => c.name === selectedCategoryName)?.type === "auction",
          isBiddingClosed: isAuctionTimerRunning || auctionStage === 3,
          auctionBids: auctionBids,
          auctionStage: auctionStage,
          currentQuestion: isQuestionActive ? selectedCategoryName : null
        });
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [isQuestionActive, gameSettings, scoreHistory, gameCode, selectedCategoryName, quizLog, auctionBids, isAuctionTimerRunning, auctionStage]);

  useEffect(() => {
    let eventSource = null;
    if (gameCode) {
      eventSource = listenForEvents(gameCode, (eventData) => {
        if (eventData.type === "BUZZER") {
          setBuzzerQueue(prev => {
            if (prev.some(b => b.player.toLowerCase() === eventData.player.toLowerCase())) return prev;
            return [...prev, eventData];
          });
        } else if (eventData.type === "BID") {
          setAuctionBids(prev => ({ ...prev, [eventData.player]: eventData.amount }));
          setAuctionStage(0);
        } else if (eventData.type === "WIEM_LEPIEJ") {
          setGameSettings(prev => {
            const playerIndex = prev.players.findIndex(p => p.name.toLowerCase() === eventData.player.toLowerCase());
            if (playerIndex !== -1) {
              const updatedPlayers = [...prev.players];
              const currentUsed = updatedPlayers[playerIndex].wiemLepiejUsed || 0;
              if (currentUsed < (prev.wiemLepiejLimit || 1)) {
                  updatedPlayers[playerIndex] = { ...updatedPlayers[playerIndex], wiemLepiejUsed: currentUsed + 1 };
                  return { ...prev, players: updatedPlayers };
              }
            }
            return prev;
          });
        } else if (eventData.type === "JOIN") {
          setGameSettings(prev => {
            const playerIndex = prev.players.findIndex(p => p.name.toLowerCase() === eventData.player.toLowerCase());
            if (playerIndex === -1) {
              return { ...prev, players: [...prev.players, { name: eventData.player, points: 0, connected: true }] };
            } else {
              return {
                ...prev,
                players: prev.players.map((p, i) => i === playerIndex ? { ...p, connected: true } : p)
              };
            }
          });
        }
      });
    }
    return () => { if (eventSource) eventSource.close(); };
  }, [gameCode]);

  const providerValue = useMemo(() => ({
    gameSettings,
    setGameSettings,
    scoreHistory,
    setScoreHistory,
    gameCode,
    setGameCode,
    generateGameCode,
    toggleWiemLepiej,
    buzzerQueue,
    setBuzzerQueue,
    auctionBids,
    setAuctionBids,
    auctionStage,
    setAuctionStage,
    isAuctionTimerRunning,
    setIsAuctionTimerRunning,
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
    gameSettings, scoreHistory, gameCode, generateGameCode, toggleWiemLepiej, buzzerQueue, 
    auctionBids, auctionStage, isAuctionTimerRunning, quizList, customQuizzes, 
    editingQuiz, isQuestionActive, selectedCategoryName, quizLog, undoAction, 
    redoAction, jumpToLogIndex, undoPointer, addToLog, showAnswer, isAudioPlaying, 
    isResultsPinned, isLogsPinned, appSettings, navigate
  ]);

  return (
    <AppContext.Provider value={providerValue}>{children}</AppContext.Provider>
  );
};

AppProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AppProvider;
