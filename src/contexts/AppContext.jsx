import { createContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { defaultQuizzes } from "../data/defaultQuizzes";
import { ensureQuizIdentity } from "../utils/quizIdentity";
import { compactGameSnapshot, compactQuizLog, restoreQuizProgress } from "../utils/gameHistory";
import { isAnswerWindowOpen } from "../utils/answerWindow";
import { 
  acknowledgeAnswer,
  syncStateToCloud, 
  listenForEvents,
  isSupabaseConfigured,
} from "../utils/cloudSync";

import { 
  saveGameState, 
  loadGameState, 
  saveCustomQuizzes, 
  loadCustomQuizzes,
  loadAppSettings,
  saveAppSettings
} from "../utils/quizStorage";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const navigate = useNavigate();

  // Core State
  const [customQuizzes, setCustomQuizzes] = useState(loadCustomQuizzes);
  const quizList = useMemo(() => [
    ...defaultQuizzes.map((quiz, index) => ensureQuizIdentity({ ...quiz, id: quiz.id || `default-${index + 1}` }, `default-${index + 1}`)),
    ...customQuizzes,
  ], [customQuizzes]);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [storageWarning, setStorageWarning] = useState(null);
  
  const [savedState] = useState(() => loadGameState() || {});
  const [gameSettings, setGameSettings] = useState(() => ({
    ...(savedState.gameSettings || {
    players: [],
    quiz: null,
    wiemLepiejLimit: 1
    }),
    quiz: savedState.gameSettings?.quiz
      ? ensureQuizIdentity(savedState.gameSettings.quiz, "saved-game")
      : null,
  }));
  const [scoreHistory, setScoreHistory] = useState(savedState.scoreHistory || []);
  const [quizLog, setQuizLog] = useState(() => compactQuizLog(savedState.quizLog, gameSettings.quiz));
  const [gameCode, setGameCode] = useState(null);
  const [onlineBackend, setOnlineBackend] = useState(() => (
    savedState.onlineBackend === "ntfy" ? "ntfy" : isSupabaseConfigured() ? "supabase" : "ntfy"
  ));
  const [isQuestionActive, setIsQuestionActive] = useState(savedState.isQuestionActive || false);
  const [selectedCategoryName, setSelectedCategoryName] = useState(savedState.selectedCategoryName || null);
  const [wheelRoundState, setWheelRoundState] = useState(savedState.wheelRoundState || null);
  const [undoPointer, setUndoPointer] = useState(savedState.undoPointer ?? (savedState.quizLog?.length ? savedState.quizLog.length - 1 : -1));

  // Volatile State
  const [buzzerQueue, setBuzzerQueue] = useState(savedState.buzzerQueue || []);
  const [auctionBids, setAuctionBids] = useState(savedState.auctionBids || {});
  const [playerAnswers, setPlayerAnswers] = useState(savedState.playerAnswers || {});
  const [auctionStage, setAuctionStage] = useState(savedState.auctionStage || 0);
  const [isAuctionTimerRunning, setIsAuctionTimerRunning] = useState(savedState.isAuctionTimerRunning || false);
  const [showAnswer, setShowAnswer] = useState(savedState.showAnswer || false);
  const [currentQuestionData, setCurrentQuestionData] = useState(null);
  const currentQuestionDataRef = useRef(currentQuestionData);
  currentQuestionDataRef.current = currentQuestionData;
  const cloudStateRef = useRef(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isResultsPinned, setIsResultsPinned] = useState(false);
  const [isLogsPinned, setIsLogsPinned] = useState(false);
  const [wheelControlEvent, setWheelControlEvent] = useState(null);

  const defaultAppSettings = {
    themeMode: "colorful", // colorful | simple
    fontSize: 100,
    soundEffects: true,
    focusMode: false,
    boardScale: "normal", // compact | normal | large | extraLarge
    logVisibility: "normal" // normal | hidden
  };
  const [appSettings, setAppSettings] = useState(() => ({
    ...defaultAppSettings,
    ...loadAppSettings()
  }));

  const generateGameCode = useCallback((backend = onlineBackend) => {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const randomBytes = new Uint8Array(6);
    if (globalThis.crypto?.getRandomValues) {
      globalThis.crypto.getRandomValues(randomBytes);
    } else {
      randomBytes.forEach((_, index) => { randomBytes[index] = Math.floor(Math.random() * 256); });
    }
    const backendPrefix = backend === "supabase" ? "S" : "N";
    const code = `${backendPrefix}${[...randomBytes].map((value) => alphabet[value % alphabet.length]).join("")}`;
    setGameCode(code);
    return code;
  }, [onlineBackend]);

  const toggleWiemLepiej = useCallback(() => {
    setGameSettings(prev => ({ ...prev, wiemLepiejLimit: prev.wiemLepiejLimit > 0 ? 0 : 1 }));
  }, []);

  useEffect(() => {
    const saved = saveCustomQuizzes(customQuizzes);
    setStorageWarning((current) => saved
      ? (current?.key === "custom-quizzes" ? null : current)
      : { key: "custom-quizzes", message: "Nie udało się zapisać biblioteki quizów w tej przeglądarce." });
  }, [customQuizzes]);

  useEffect(() => {
    const saved = saveAppSettings(appSettings);
    setStorageWarning((current) => saved
      ? (current?.key === "settings" ? null : current)
      : { key: "settings", message: "Nie udało się zapisać ustawień w tej przeglądarce." });
    document.documentElement.style.setProperty("--app-font-size", `${appSettings.fontSize}%`);
  }, [appSettings]);

  useEffect(() => {
    const saved = saveGameState({
      isQuestionActive,
      gameSettings,
      scoreHistory,
      quizLog,
      gameCode,
      onlineBackend,
      selectedCategoryName,
      wheelRoundState,
      undoPointer,
      buzzerQueue,
      auctionBids,
      playerAnswers,
      auctionStage,
      isAuctionTimerRunning,
      showAnswer,
    });
    setStorageWarning((current) => saved
      ? (current?.key === "game-state" ? null : current)
      : { key: "game-state", message: "Nie udało się zapisać stanu gry. Wyeksportuj kopię, zanim zamkniesz stronę." });

    if (gameCode) {
      const activeCategory = gameSettings.quiz?.categories?.find(c => c.name === selectedCategoryName);
      const activeQuestion = activeCategory?.list?.find(q => !q.done);

      // Zwiększony debounce do 500ms i wysyłanie tylko niezbędnych danych
      const timeoutId = setTimeout(() => {
        const state = {
          isQuestionActive,
          players: gameSettings.players.map(p => ({ name: p.name, points: p.points, wiemLepiejUsed: p.wiemLepiejUsed })),
          wiemLepiejLimit: gameSettings.wiemLepiejLimit,
          isAuction: activeCategory?.type === "auction",
          isWheel: activeCategory?.type === "wheel",
          isWriting: activeCategory?.type === "openAnswer",
          inputMethod: activeQuestion?.inputMethod || "typing",
          isBiddingClosed: isAuctionTimerRunning || auctionStage === 3,
          auctionBids: auctionBids,
          auctionStage: auctionStage,
          currentQuestion: isQuestionActive ? selectedCategoryName : null,
          questionData: isQuestionActive ? currentQuestionData : null,
        };
        cloudStateRef.current = state;
        syncStateToCloud(gameCode, state, onlineBackend);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [isQuestionActive, gameSettings, scoreHistory, quizLog, gameCode, onlineBackend, selectedCategoryName, currentQuestionData, wheelRoundState, undoPointer, buzzerQueue, auctionBids, playerAnswers, auctionStage, isAuctionTimerRunning, showAnswer]);

  useEffect(() => {
    let eventSource = null;
    if (gameCode) {
      const subscribedAt = Date.now();
      eventSource = listenForEvents(gameCode, (eventData) => {
        const eventTime = Number(eventData?.time);
        if (Number.isFinite(eventTime) && eventTime < subscribedAt) return;

        if (eventData.type === "STATE_REQUEST") {
          if (cloudStateRef.current) syncStateToCloud(gameCode, cloudStateRef.current, onlineBackend);
        } else if (eventData.type === "BUZZER") {
          setBuzzerQueue(prev => {
            if (prev.some(b => b.player.toLowerCase() === eventData.player.toLowerCase())) return prev;
            return [...prev, eventData];
          });
        } else if (eventData.type === "BID") {
          setAuctionBids(prev => ({ ...prev, [eventData.player]: eventData.amount }));
          setAuctionStage(0);
        } else if (eventData.type === "ANSWER") {
          const canAcceptAnswer = isAnswerWindowOpen({
            isQuestionActive,
            isWriting: gameSettings.quiz?.categories?.find(category => category.name === selectedCategoryName)?.type === "openAnswer",
            questionData: currentQuestionDataRef.current,
          });
          if (eventData.isConfirmed && !canAcceptAnswer) return;
          setPlayerAnswers(prev => ({ 
            ...prev, 
            [eventData.player]: {
              answer: eventData.answer,
              isConfirmed: eventData.isConfirmed,
              eventId: eventData.eventId || null,
              receivedAt: eventData.isConfirmed ? Date.now() : null,
            }
          }));
          if (eventData.isConfirmed && eventData.eventId && canAcceptAnswer) {
            acknowledgeAnswer(gameCode, eventData.player, eventData.eventId, onlineBackend);
          }
        } else if (eventData.type === "WHEEL_CONTROL") {
          setWheelControlEvent({ ...eventData, id: `${eventData.player}-${eventData.action}-${eventData.time}` });
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
      }, undefined, onlineBackend);
    }
    return () => { if (eventSource) eventSource.close(); };
  }, [gameCode, onlineBackend, gameSettings.quiz, isQuestionActive, selectedCategoryName]);

  const cloneSnapshot = useCallback((state) => {
    return compactGameSnapshot(state);
  }, []);

  const getGameSnapshot = useCallback((overrides = {}) => {
    const base = {
      gameSettings,
      scoreHistory,
      isQuestionActive,
      selectedCategoryName,
      wheelRoundState,
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
    wheelRoundState,
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
    const snapshotSettings = snapshot.gameSettings || { players: [], quiz: null, wiemLepiejLimit: 1 };
    const snapshotQuiz = snapshotSettings.quiz || gameSettings.quiz;
    const completedIds = new Set(snapshot.completedQuestionIds || []);
    const restoredQuiz = snapshotQuiz && snapshot.completedQuestionIds
      ? restoreQuizProgress(snapshotQuiz, [...completedIds])
      : snapshotQuiz;
    setGameSettings({ ...snapshotSettings, quiz: restoredQuiz || null });
    setScoreHistory(snapshot.scoreHistory || []);
    setIsQuestionActive(Boolean(snapshot.isQuestionActive));
    setSelectedCategoryName(snapshot.selectedCategoryName || null);
    setWheelRoundState(snapshot.wheelRoundState || null);
    setShowAnswer(Boolean(snapshot.showAnswer));
    setIsAudioPlaying(false);
    setBuzzerQueue(snapshot.buzzerQueue || []);
    setAuctionBids(snapshot.auctionBids || {});
    setPlayerAnswers(snapshot.playerAnswers || {});
    setAuctionStage(snapshot.auctionStage || 0);
    setIsAuctionTimerRunning(Boolean(snapshot.isAuctionTimerRunning));
  }, [gameSettings.quiz]);

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

  const recordWheelRoundAction = useCallback((nextWheelRoundState, description, pointsChange = null) => {
    const before = getGameSnapshot();
    const nextGameSettings = pointsChange && gameSettings.players[pointsChange.playerIndex]
      ? {
        ...gameSettings,
        players: gameSettings.players.map((player, index) => index === pointsChange.playerIndex
          ? { ...player, points: player.points + pointsChange.delta }
          : player),
      }
      : gameSettings;
    const after = getGameSnapshot({ wheelRoundState: nextWheelRoundState, gameSettings: nextGameSettings });
    if (nextGameSettings !== gameSettings) setGameSettings(nextGameSettings);
    setWheelRoundState(nextWheelRoundState);
    addToLog({ type: "WHEEL_ROUND_ACTION", description }, { before, after });
  }, [addToLog, gameSettings, getGameSnapshot]);

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
    setCurrentQuestionData(null);
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
    setCurrentQuestionData(null);
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
            const isMatch = selectedQuestion.id
              ? q.id === selectedQuestion.id
              : (q.no != null && q.no === selectedQuestion.no) || q.question === selectedQuestion.question;
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
      wheelRoundState: null,
      showAnswer: false,
      playerAnswers: {}
    });
    setGameSettings(nextGameSettings);
    setIsQuestionActive(false);
    setSelectedCategoryName(null);
    setWheelRoundState(null);
    setShowAnswer(false);
    setPlayerAnswers({});
    setCurrentQuestionData(null);
    addToLog({
      type: "QUESTION_DONE",
      categoryName,
      questionNo: selectedQuestion.no,
      questionId: selectedQuestion.id,
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
    setWheelRoundState(null);
    setUndoPointer(-1);
    setBuzzerQueue([]);
    setAuctionBids({});
    setPlayerAnswers({});
    setAuctionStage(0);
    setIsAuctionTimerRunning(false);
    setShowAnswer(false);
  }, []);

  const startNewQuiz = useCallback((quiz) => {
    const identifiedQuiz = ensureQuizIdentity(quiz, "game");
    setGameSettings(prev => ({
      ...prev,
      quiz: identifiedQuiz,
      players: prev.players.map((player) => ({ ...player, wiemLepiejUsed: 0 })),
    }));
    setScoreHistory([]);
    setQuizLog([]);
    setIsQuestionActive(false);
    setSelectedCategoryName(null);
    setWheelRoundState(null);
    setUndoPointer(-1);
    setBuzzerQueue([]);
    setAuctionBids({});
    setPlayerAnswers({});
    setAuctionStage(0);
    setIsAuctionTimerRunning(false);
    setShowAnswer(false);
  }, []);

  const addCustomQuiz = useCallback((quiz) => {
    setCustomQuizzes(prev => {
      const identifiedQuiz = ensureQuizIdentity(quiz, "custom");
      const hasDuplicateId = prev.some((item) => item.id === identifiedQuiz.id)
        || defaultQuizzes.some((item, index) => (item.id || `default-${index + 1}`) === identifiedQuiz.id);
      return [...prev, hasDuplicateId
        ? ensureQuizIdentity({ ...identifiedQuiz, id: undefined }, "custom")
        : identifiedQuiz];
    });
  }, []);

  const removeCustomQuiz = useCallback((quizIdOrName) => {
    setCustomQuizzes(prev => prev.filter(q => q.id !== quizIdOrName && q.name !== quizIdOrName));
  }, []);

  const updateCustomQuiz = useCallback((index, updatedQuiz) => {
    setCustomQuizzes(prev => {
      const newQuizzes = [...prev];
      newQuizzes[index] = ensureQuizIdentity(updatedQuiz, "custom");
      return newQuizzes;
    });
  }, []);

  const loadDownloadedState = useCallback((state) => {
    const identifiedQuiz = state.gameSettings?.quiz
      ? ensureQuizIdentity(state.gameSettings.quiz, "imported-game")
      : null;
    setGameSettings({ ...state.gameSettings, quiz: identifiedQuiz });
    setScoreHistory(state.scoreHistory || []);
    setQuizLog(compactQuizLog(state.quizLog, identifiedQuiz));
    setGameCode(state.gameCode || null);
    setOnlineBackend(state.onlineBackend === "ntfy" || !isSupabaseConfigured() ? "ntfy" : "supabase");
    setIsQuestionActive(state.isQuestionActive || false);
    setSelectedCategoryName(state.selectedCategoryName || null);
    setWheelRoundState(state.wheelRoundState || null);
    setUndoPointer(state.undoPointer ?? (state.quizLog?.length ? state.quizLog.length - 1 : -1));
    setBuzzerQueue(state.buzzerQueue || []);
    setAuctionBids(state.auctionBids || {});
    setPlayerAnswers(state.playerAnswers || {});
    setAuctionStage(state.auctionStage || 0);
    setIsAuctionTimerRunning(Boolean(state.isAuctionTimerRunning));
    setShowAnswer(Boolean(state.showAnswer));
    navigate("/gra");
  }, [navigate]);

  const providerValue = useMemo(() => ({
    gameSettings,
    setGameSettings,
    scoreHistory,
    setScoreHistory,
    gameCode,
    setGameCode,
    onlineBackend,
    setOnlineBackend,
    generateGameCode,
    toggleWiemLepiej,
    buzzerQueue,
    setBuzzerQueue,
    auctionBids,
    setAuctionBids,
    playerAnswers,
    setPlayerAnswers,
    storageWarning,
    dismissStorageWarning: () => setStorageWarning(null),
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
    wheelRoundState,
    setWheelRoundState,
    currentQuestionData,
    setCurrentQuestionData,
    quizLog,
    setQuizLog,
    addToLog,
    recordWheelRoundAction,
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
    wheelControlEvent,
    appSettings,
    setAppSettings,
    loadGameFromState: loadDownloadedState,
    getDownloadableState: () => ({
      isQuestionActive,
      gameSettings,
      scoreHistory,
      quizLog,
      gameCode,
      onlineBackend,
      selectedCategoryName,
      wheelRoundState,
      undoPointer,
      buzzerQueue,
      auctionBids,
      playerAnswers,
      auctionStage,
      isAuctionTimerRunning,
      showAnswer,
      timestamp: new Date().toISOString()
    }),
  }), [
    gameSettings, scoreHistory, gameCode, onlineBackend, setOnlineBackend, generateGameCode, toggleWiemLepiej, buzzerQueue, storageWarning,
    auctionBids, auctionStage, isAuctionTimerRunning, quizList, customQuizzes, 
    editingQuiz, isQuestionActive, selectedCategoryName, quizLog, undoAction, 
    redoAction, jumpToLogIndex, undoPointer, addToLog, showAnswer, isAudioPlaying, 
    isResultsPinned, isLogsPinned, wheelControlEvent, appSettings, playerAnswers, wheelRoundState, currentQuestionData, recordWheelRoundAction,
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
