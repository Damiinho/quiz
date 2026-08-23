import { createContext, useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { defaultQuizzes } from "../data/defaultQuizzes";
import { 
  syncStateToCloud, 
  listenForEvents 
} from "../utils/cloudSync";

import { 
  saveGameState, 
  loadGameState, 
  saveCustomQuizzes, 
  loadCustomQuizzes 
} from "../utils/quizStorage";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const navigate = useNavigate();

  // Core State
  const [customQuizzes, setCustomQuizzes] = useState(loadCustomQuizzes());
  const quizList = useMemo(() => [...defaultQuizzes, ...customQuizzes], [customQuizzes]);
  const [editingQuiz, setEditingQuiz] = useState(null);
  
  const savedState = loadGameState() || {};
  const [gameSettings, setGameSettings] = useState(savedState.gameSettings || {
    players: [],
    quiz: null,
    wiemLepiejLimit: 1
  });
  const [scoreHistory, setScoreHistory] = useState(savedState.scoreHistory || []);
  const [quizLog, setQuizLog] = useState(savedState.quizLog || []);
  const [gameCode, setGameCode] = useState(savedState.gameCode || null);
  const [isQuestionActive, setIsQuestionActive] = useState(savedState.isQuestionActive || false);
  const [selectedCategoryName, setSelectedCategoryName] = useState(savedState.selectedCategoryName || null);
  const [undoPointer, setUndoPointer] = useState(savedState.undoPointer ?? (savedState.quizLog?.length ? savedState.quizLog.length - 1 : -1));

  // Volatile State
  const [buzzerQueue, setBuzzerQueue] = useState([]);
  const [auctionBids, setAuctionBids] = useState({});
  const [playerAnswers, setPlayerAnswers] = useState({});
  const [auctionStage, setAuctionStage] = useState(0);
  const [isAuctionTimerRunning, setIsAuctionTimerRunning] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isResultsPinned, setIsResultsPinned] = useState(false);
  const [isLogsPinned, setIsLogsPinned] = useState(false);

  const [appSettings, setAppSettings] = useState({
    themeMode: "colorful", // colorful | simple
    fontSize: 100,
    soundEffects: true,
    focusMode: false,
    boardScale: "normal", // compact | normal | large | extraLarge
    logVisibility: "normal" // normal | hidden
  });

  const generateGameCode = useCallback(() => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGameCode(code);
    return code;
  }, []);

  const toggleWiemLepiej = useCallback(() => {
    setGameSettings(prev => ({ ...prev, wiemLepiejLimit: prev.wiemLepiejLimit > 0 ? 0 : 1 }));
  }, []);

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
      undoPointer,
    });

    if (gameCode) {
      const activeCategory = gameSettings.quiz?.categories?.find(c => c.name === selectedCategoryName);
      const activeQuestion = activeCategory?.list?.find(q => !q.done);

      // Zwiększony debounce do 500ms i wysyłanie tylko niezbędnych danych
      const timeoutId = setTimeout(() => {
        syncStateToCloud(gameCode, {
          isQuestionActive,
          players: gameSettings.players.map(p => ({ name: p.name, points: p.points, wiemLepiejUsed: p.wiemLepiejUsed })),
          wiemLepiejLimit: gameSettings.wiemLepiejLimit,
          isAuction: activeCategory?.type === "auction",
          isWriting: activeCategory?.type === "openAnswer",
          inputMethod: activeQuestion?.inputMethod || "typing",
          isBiddingClosed: isAuctionTimerRunning || auctionStage === 3,
          auctionBids: auctionBids,
          auctionStage: auctionStage,
          currentQuestion: isQuestionActive ? selectedCategoryName : null
        });
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [isQuestionActive, gameSettings, scoreHistory, quizLog, gameCode, selectedCategoryName, undoPointer, auctionBids, isAuctionTimerRunning, auctionStage]);

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
        } else if (eventData.type === "ANSWER") {
          setPlayerAnswers(prev => ({ 
            ...prev, 
            [eventData.player]: { answer: eventData.answer, isConfirmed: eventData.isConfirmed } 
          }));
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

  const cloneSnapshot = useCallback((state) => {
    if (!state) return null;
    return {
      gameSettings: JSON.parse(JSON.stringify(state.gameSettings || { players: [], quiz: null, wiemLepiejLimit: 1 })),
      scoreHistory: JSON.parse(JSON.stringify(state.scoreHistory || [])),
      isQuestionActive: Boolean(state.isQuestionActive),
      selectedCategoryName: state.selectedCategoryName || null,
      showAnswer: Boolean(state.showAnswer),
      isAudioPlaying: false,
      buzzerQueue: JSON.parse(JSON.stringify(state.buzzerQueue || [])),
      auctionBids: JSON.parse(JSON.stringify(state.auctionBids || {})),
      playerAnswers: JSON.parse(JSON.stringify(state.playerAnswers || {})),
      auctionStage: state.auctionStage || 0,
      isAuctionTimerRunning: Boolean(state.isAuctionTimerRunning),
    };
  }, []);

  const getGameSnapshot = useCallback((overrides = {}) => {
    const base = {
      gameSettings,
      scoreHistory,
      isQuestionActive,
      selectedCategoryName,
      showAnswer,
      isAudioPlaying: false,
      buzzerQueue,
      auctionBids,
      playerAnswers,
      auctionStage,
      isAuctionTimerRunning,
      ...overrides,
    };
    return cloneSnapshot(base);
  }, [
    gameSettings,
    scoreHistory,
    isQuestionActive,
    selectedCategoryName,
    showAnswer,
    buzzerQueue,
    auctionBids,
    playerAnswers,
    auctionStage,
    isAuctionTimerRunning,
    cloneSnapshot
  ]);

  const applyGameSnapshot = useCallback((snapshot) => {
    if (!snapshot) return;
    setGameSettings(snapshot.gameSettings || { players: [], quiz: null, wiemLepiejLimit: 1 });
    setScoreHistory(snapshot.scoreHistory || []);
    setIsQuestionActive(Boolean(snapshot.isQuestionActive));
    setSelectedCategoryName(snapshot.selectedCategoryName || null);
    setShowAnswer(Boolean(snapshot.showAnswer));
    setIsAudioPlaying(false);
    setBuzzerQueue(snapshot.buzzerQueue || []);
    setAuctionBids(snapshot.auctionBids || {});
    setPlayerAnswers(snapshot.playerAnswers || {});
    setAuctionStage(snapshot.auctionStage || 0);
    setIsAuctionTimerRunning(Boolean(snapshot.isAuctionTimerRunning));
  }, []);

  const addToLog = useCallback((entry, snapshots = {}) => {
    const before = cloneSnapshot(snapshots.before || getGameSnapshot());
    const after = cloneSnapshot(snapshots.after || getGameSnapshot());
    const newEntry = {
      ...entry,
      before,
      after,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setQuizLog(prev => {
      const newLog = prev.slice(0, undoPointer + 1);
      return [...newLog, newEntry];
    });
    setUndoPointer(prev => prev + 1);
  }, [cloneSnapshot, getGameSnapshot, undoPointer]);

  // Atomowe akcje gry z automatycznym i pewnym zapisem migawek
  const openCategory = useCallback((categoryName) => {
    const before = getGameSnapshot();
    const after = getGameSnapshot({
      isQuestionActive: true,
      selectedCategoryName: categoryName,
      showAnswer: false,
      playerAnswers: {}
    });
    setIsQuestionActive(true);
    setSelectedCategoryName(categoryName);
    setShowAnswer(false);
    setPlayerAnswers({});
    addToLog({ 
      type: "QUESTION_OPENED", 
      categoryName,
      description: `Otwarto kategorię: ${categoryName}` 
    }, { before, after });
  }, [getGameSnapshot, addToLog]);

  const closeCategory = useCallback((categoryName) => {
    const catName = categoryName || selectedCategoryName;
    const before = getGameSnapshot();
    const after = getGameSnapshot({
      isQuestionActive: false,
      selectedCategoryName: null,
      showAnswer: false,
      playerAnswers: {}
    });
    setIsQuestionActive(false);
    setSelectedCategoryName(null);
    setShowAnswer(false);
    setPlayerAnswers({});
    addToLog({
      type: "QUESTION_CLOSED",
      categoryName: catName,
      description: `Zamknięto kategorię: ${catName || 'pytanie'}`
    }, { before, after });
  }, [getGameSnapshot, selectedCategoryName, addToLog]);

  const finishQuestion = useCallback((categoryName, selectedQuestion) => {
    if (!selectedQuestion) return;
    const before = getGameSnapshot();
    const updatedQuiz = {
      ...gameSettings.quiz,
      categories: (gameSettings.quiz?.categories || []).map((c) => {
        if (c.name !== categoryName) return c;
        return {
          ...c,
          list: (c.list || []).map((q) => {
            const isMatch = (q.no != null && q.no === selectedQuestion.no) || q.question === selectedQuestion.question;
            return isMatch ? { ...q, done: true } : q;
          })
        };
      })
    };
    const nextGameSettings = { ...gameSettings, quiz: updatedQuiz };
    const after = getGameSnapshot({
      gameSettings: nextGameSettings,
      isQuestionActive: false,
      selectedCategoryName: null,
      showAnswer: false,
      playerAnswers: {}
    });
    setGameSettings(nextGameSettings);
    setIsQuestionActive(false);
    setSelectedCategoryName(null);
    setShowAnswer(false);
    setPlayerAnswers({});
    addToLog({
      type: "QUESTION_DONE",
      categoryName,
      questionNo: selectedQuestion.no,
      questionText: selectedQuestion.question,
      description: `Zużyto: ${selectedQuestion.question || 'Pytanie ' + selectedQuestion.no}`
    }, { before, after });
  }, [getGameSnapshot, gameSettings, addToLog]);

  const toggleAnswer = useCallback(() => {
    const nextShow = !showAnswer;
    const before = getGameSnapshot();
    const after = getGameSnapshot({ showAnswer: nextShow });
    setShowAnswer(nextShow);
    addToLog({
      type: "SHOW_ANSWER",
      description: nextShow ? "Pokazano odpowiedź" : "Ukryto odpowiedź"
    }, { before, after });
  }, [getGameSnapshot, showAnswer, addToLog]);

  const changePlayerPoints = useCallback((playerIndex, delta) => {
    if (!gameSettings.players[playerIndex]) return;
    const before = getGameSnapshot();
    const updatedPlayers = gameSettings.players.map((p, idx) =>
      idx === playerIndex ? { ...p, points: p.points + delta } : p
    );
    const nextGameSettings = { ...gameSettings, players: updatedPlayers };
    const after = getGameSnapshot({ gameSettings: nextGameSettings });
    setGameSettings(nextGameSettings);
    addToLog({
      type: "POINTS_CHANGE",
      playerIndex,
      change: delta,
      description: `${delta > 0 ? '+' : ''}${delta} pkt dla ${updatedPlayers[playerIndex].name}`
    }, { before, after });
  }, [getGameSnapshot, gameSettings, addToLog]);

  const togglePlayerWiemLepiej = useCallback((playerIndex) => {
    if (!gameSettings.players[playerIndex]) return;
    const before = getGameSnapshot();
    const player = gameSettings.players[playerIndex];
    const currentlyUsed = (player.wiemLepiejUsed || 0) >= (gameSettings.wiemLepiejLimit || 1);
    const updatedPlayers = gameSettings.players.map((p, idx) =>
      idx === playerIndex ? { ...p, wiemLepiejUsed: currentlyUsed ? 0 : (gameSettings.wiemLepiejLimit || 1) } : p
    );
    const nextGameSettings = { ...gameSettings, players: updatedPlayers };
    const after = getGameSnapshot({ gameSettings: nextGameSettings });
    setGameSettings(nextGameSettings);
    addToLog({
      type: "WIEM_LEPIEJ",
      playerIndex,
      description: `${player.name} - ${currentlyUsed ? "przywrócono" : "użyto"} 'Wiem Lepiej!'`
    }, { before, after });
  }, [getGameSnapshot, gameSettings, addToLog]);

  const addPlayerInGame = useCallback((name) => {
    if (!name.trim()) return;
    const before = getGameSnapshot();
    const nextGameSettings = {
      ...gameSettings,
      players: [...gameSettings.players, { name: name.trim(), points: 0, wiemLepiejUsed: 0 }]
    };
    const after = getGameSnapshot({ gameSettings: nextGameSettings });
    setGameSettings(nextGameSettings);
    addToLog({
      type: "PLAYER_ADDED",
      description: `Dodano gracza: ${name.trim()}`
    }, { before, after });
  }, [getGameSnapshot, gameSettings, addToLog]);

  const removePlayerInGame = useCallback((playerIndex) => {
    const player = gameSettings.players[playerIndex];
    if (!player) return;
    const before = getGameSnapshot();
    const nextGameSettings = {
      ...gameSettings,
      players: gameSettings.players.filter((_, i) => i !== playerIndex)
    };
    const after = getGameSnapshot({ gameSettings: nextGameSettings });
    setGameSettings(nextGameSettings);
    addToLog({
      type: "PLAYER_REMOVED",
      description: `Usunięto gracza: ${player.name}`
    }, { before, after });
  }, [getGameSnapshot, gameSettings, addToLog]);

  const changeAuctionBid = useCallback((playerName, delta) => {
    const before = getGameSnapshot();
    const newBid = Math.max(0, (auctionBids[playerName] || 0) + delta);
    const nextBids = { ...auctionBids, [playerName]: newBid };
    const after = getGameSnapshot({ auctionBids: nextBids, auctionStage: 0 });
    setAuctionBids(nextBids);
    setAuctionStage(0);
    addToLog({
      type: "AUCTION_BID",
      description: `Oferta ${playerName}: ${newBid}`
    }, { before, after });
  }, [getGameSnapshot, auctionBids, addToLog]);

  const advanceAuctionStageGame = useCallback(() => {
    const nextStage = auctionStage < 3 ? auctionStage + 1 : 0;
    const before = getGameSnapshot();
    const after = getGameSnapshot({ auctionStage: nextStage });
    setAuctionStage(nextStage);
    const stageLabels = ["Reset etapu", "Po raz pierwszy...", "Po raz drugi...", "Po raz trzeci (koniec)!"];
    addToLog({
      type: "AUCTION_STAGE",
      description: `Licytacja: ${stageLabels[nextStage]}`
    }, { before, after });
  }, [getGameSnapshot, auctionStage, addToLog]);

  const undoAction = useCallback(() => {
    if (undoPointer >= 0 && quizLog[undoPointer]) {
      applyGameSnapshot(quizLog[undoPointer].before);
      setUndoPointer(prev => prev - 1);
    }
  }, [applyGameSnapshot, quizLog, undoPointer]);

  const redoAction = useCallback(() => {
    if (undoPointer < quizLog.length - 1 && quizLog[undoPointer + 1]) {
      applyGameSnapshot(quizLog[undoPointer + 1].after);
      setUndoPointer(prev => prev + 1);
    }
  }, [applyGameSnapshot, quizLog, undoPointer]);

  const jumpToLogIndex = useCallback((index) => {
    if (index >= -1 && index < quizLog.length) {
      const snapshot = index === -1 ? quizLog[0]?.before : quizLog[index]?.after;
      if (snapshot) {
        applyGameSnapshot(snapshot);
        setUndoPointer(index);
      }
    }
  }, [applyGameSnapshot, quizLog]);

  const resetSavedGame = useCallback(() => {
    setGameSettings({ players: [], quiz: null, wiemLepiejLimit: 1 });
    setScoreHistory([]);
    setQuizLog([]);
    setGameCode(null);
    setIsQuestionActive(false);
    setSelectedCategoryName(null);
    setUndoPointer(-1);
    setBuzzerQueue([]);
    setAuctionBids({});
    setPlayerAnswers({});
    setAuctionStage(0);
    setIsAuctionTimerRunning(false);
    setShowAnswer(false);
  }, []);

  const startNewQuiz = useCallback((quiz) => {
    setGameSettings(prev => ({ ...prev, quiz }));
    setScoreHistory([]);
    setQuizLog([]);
    setIsQuestionActive(false);
    setSelectedCategoryName(null);
    setUndoPointer(-1);
    setBuzzerQueue([]);
    setAuctionBids({});
    setPlayerAnswers({});
    setAuctionStage(0);
    setIsAuctionTimerRunning(false);
    setShowAnswer(false);
  }, []);

  const addCustomQuiz = useCallback((quiz) => {
    setCustomQuizzes(prev => [...prev, quiz]);
  }, []);

  const removeCustomQuiz = useCallback((quizName) => {
    setCustomQuizzes(prev => prev.filter(q => q.name !== quizName));
  }, []);

  const updateCustomQuiz = useCallback((index, updatedQuiz) => {
    setCustomQuizzes(prev => {
      const newQuizzes = [...prev];
      newQuizzes[index] = updatedQuiz;
      return newQuizzes;
    });
  }, []);

  const loadDownloadedState = useCallback((state) => {
    setGameSettings(state.gameSettings || { players: [], quiz: null, wiemLepiejLimit: 1 });
    setScoreHistory(state.scoreHistory || []);
    setQuizLog(state.quizLog || []);
    setGameCode(state.gameCode || null);
    setIsQuestionActive(state.isQuestionActive || false);
    setSelectedCategoryName(state.selectedCategoryName || null);
    setUndoPointer(state.undoPointer ?? (state.quizLog?.length ? state.quizLog.length - 1 : -1));
    navigate("/gra");
  }, [navigate]);

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
    playerAnswers,
    setPlayerAnswers,
    auctionStage,
    setAuctionStage,
    isAuctionTimerRunning,
    setIsAuctionTimerRunning,
    quizList,
    customQuizzes,
    setCustomQuizzes,
    editingQuiz,
    setEditingQuiz,
    isQuestionActive,
    setIsQuestionActive,
    selectedCategoryName,
    setSelectedCategoryName,
    quizLog,
    setQuizLog,
    addToLog,
    getGameSnapshot,
    openCategory,
    closeCategory,
    finishQuestion,
    toggleAnswer,
    changePlayerPoints,
    togglePlayerWiemLepiej,
    addPlayerInGame,
    removePlayerInGame,
    changeAuctionBid,
    advanceAuctionStageGame,
    undoAction,
    redoAction,
    jumpToLogIndex,
    undoPointer,
    resetSavedGame,
    startNewQuiz,
    addCustomQuiz,
    removeCustomQuiz,
    updateCustomQuiz,
    loadDownloadedState,
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
    loadGameFromState: (state) => {
      setGameSettings(state.gameSettings || { players: [], quiz: null, wiemLepiejLimit: 1 });
      setScoreHistory(state.scoreHistory || []);
      setQuizLog(state.quizLog || []);
      setGameCode(state.gameCode || null);
      setIsQuestionActive(state.isQuestionActive || false);
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
    isResultsPinned, isLogsPinned, appSettings, navigate, playerAnswers,
    resetSavedGame, startNewQuiz, addCustomQuiz, removeCustomQuiz, updateCustomQuiz, 
    loadDownloadedState, setPlayerAnswers, getGameSnapshot,
    openCategory, closeCategory, finishQuestion, toggleAnswer, changePlayerPoints,
    togglePlayerWiemLepiej, addPlayerInGame, removePlayerInGame, changeAuctionBid,
    advanceAuctionStageGame
  ]);

  return (
    <AppContext.Provider value={providerValue}>{children}</AppContext.Provider>
  );
};

AppProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AppProvider;
