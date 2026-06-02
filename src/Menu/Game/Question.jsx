import { useState, useEffect, useCallback, useContext, useRef, useMemo } from "react";
import { Typography, Paper, Modal, IconButton, Box } from "@mui/material";
import PropTypes from "prop-types";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import ReplayIcon from "@mui/icons-material/Replay";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import GavelIcon from "@mui/icons-material/Gavel";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { AppContext } from "../../contexts/AppContext";

const Question = ({ category, handleGoBack }) => {
  const { 
    gameSettings,
    setGameSettings, 
    addToLog, 
    showAnswer, 
    setShowAnswer, 
    isAudioPlaying, 
    setIsAudioPlaying,
    appSettings,
    auctionBids,
    setAuctionBids,
    auctionStage,
    setAuctionStage,
    isAuctionTimerRunning,
    setIsAuctionTimerRunning,
    isQuestionActive
  } = useContext(AppContext);

  const [wiemLepiejNotify, setWiemLepiejNotify] = useState(null);
  const prevWiemLepiejRef = useRef({});

  useEffect(() => {
    gameSettings.players.forEach((player) => {
        const prevUsed = prevWiemLepiejRef.current[player.name] || 0;
        const currentUsed = player.wiemLepiejUsed || 0;
        if (currentUsed > prevUsed && isQuestionActive) {
            setWiemLepiejNotify(player.name);
            setTimeout(() => setWiemLepiejNotify(null), 3500);
        }
        prevWiemLepiejRef.current[player.name] = currentUsed;
    });
  }, [gameSettings.players, isQuestionActive]);

  const selectedQuestion = useMemo(() => {
    if (!category?.list) return null;
    const unanswered = category.list.filter((q) => !q.done);
    if (unanswered.length === 0) return null;
    const questionsWithNo = unanswered.filter((q) => q.no != null);
    if (category?.randomizeQuestions) {
      return unanswered[Math.floor(Math.random() * unanswered.length)];
    }
    if (questionsWithNo.length > 0) {
      return [...questionsWithNo].sort((a, b) => a.no - b.no)[0];
    }
    return unanswered[0];
  }, [category]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState(null);
  const audioRef = useRef(null);
  const audioTickRef = useRef(null);
  const audioRevealRef = useRef(null);

  const questionTimerSeconds = selectedQuestion?.timerSeconds || category?.timerSeconds || 30;
  const [timer, setTimer] = useState(questionTimerSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [crackType, setCrackType] = useState("crack-h"); // Stan dla losowego pęknięcia
  const [bgTheme, setBgTheme] = useState(null); // Stan dla losowego tła
  const timerRef = useRef(null);

  const albumImages = useMemo(() => selectedQuestion?.images || [], [selectedQuestion]);
  const hasMultipleImages = albumImages.length > 1;
  const hasCorrectAnswer = Array.isArray(selectedQuestion?.correctAnswer) && selectedQuestion.correctAnswer.some(answer => String(answer).trim());
  const shouldShowAnswerButton = hasCorrectAnswer && category?.type !== "duel";

  const getAssetPath = (path) => {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("data:") || path.startsWith("/")) return path;
    return `/${path}`;
  };

  // Losowanie efektów przy zmianie pytania
  useEffect(() => {
    if (!selectedQuestion) return;

    // Losowanie pęknięcia
    const cracks = ["crack-h", "crack-v", "crack-d1"];
    setCrackType(cracks[Math.floor(Math.random() * cracks.length)]);

    // Losowanie tematu tła (tylko dla pytań nie-licytacyjnych)
    if (category?.type !== "auction") {
        const themes = [
            "radial-gradient(circle at center, rgba(16, 185, 129, 0.6) 0%, rgba(16, 185, 129, 0.3) 50%, rgba(16, 185, 129, 0.15) 100%)", // Emerald
            "radial-gradient(circle at center, rgba(59, 130, 246, 0.6) 0%, rgba(59, 130, 246, 0.3) 50%, rgba(59, 130, 246, 0.15) 100%)", // Blue
            "radial-gradient(circle at center, rgba(139, 92, 246, 0.6) 0%, rgba(139, 92, 246, 0.3) 50%, rgba(139, 92, 246, 0.15) 100%)", // Purple
            "radial-gradient(circle at center, rgba(236, 72, 153, 0.6) 0%, rgba(236, 72, 153, 0.3) 50%, rgba(236, 72, 153, 0.15) 100%)", // Pink
            "radial-gradient(circle at center, rgba(245, 158, 11, 0.6) 0%, rgba(245, 158, 11, 0.3) 50%, rgba(245, 158, 11, 0.15) 100%)", // Amber
            "radial-gradient(circle at center, rgba(6, 182, 212, 0.6) 0%, rgba(6, 182, 212, 0.3) 50%, rgba(6, 182, 212, 0.15) 100%)", // Cyan
            "radial-gradient(circle at center, rgba(132, 204, 22, 0.6) 0%, rgba(132, 204, 22, 0.3) 50%, rgba(132, 204, 22, 0.15) 100%)", // Lime
            "radial-gradient(circle at center, rgba(99, 102, 241, 0.6) 0%, rgba(99, 102, 241, 0.3) 50%, rgba(99, 102, 241, 0.15) 100%)", // Indigo
            "radial-gradient(circle at center, rgba(244, 63, 94, 0.6) 0%, rgba(244, 63, 94, 0.3) 50%, rgba(244, 63, 94, 0.15) 100%)", // Rose
            "radial-gradient(circle at center, rgba(255, 120, 0, 0.6) 0%, rgba(255, 120, 0, 0.3) 50%, rgba(255, 120, 0, 0.15) 100%)", // Orange
        ];
        setBgTheme(themes[Math.floor(Math.random() * themes.length)]);
    } else {
        setBgTheme(null);
    }
  }, [selectedQuestion, category?.type]);

  const playEffect = useCallback((type) => {
    if (appSettings?.soundEffects === false) return;
    if (type === "tick" && audioTickRef.current) {
      audioTickRef.current.currentTime = 0;
      audioTickRef.current.play().catch(() => {});
    } else if (type === "reveal" && audioRevealRef.current) {
      audioRevealRef.current.currentTime = 0;
      audioRevealRef.current.play().catch(() => {});
    }
  }, [appSettings?.soundEffects]);

  const handleGoBackWithLog = useCallback(() => {
    addToLog({
      type: "QUESTION_CLOSED",
      categoryName: category.name,
      description: `Zamknięto kategorię: ${category.name}`
    });
    handleGoBack();
  }, [category.name, handleGoBack, addToLog]);

  const handleShowAnswerToggle = useCallback(() => {
    const nextShow = !showAnswer;
    setShowAnswer(nextShow);
    addToLog({
      type: "SHOW_ANSWER",
      description: nextShow ? "Pokazano odpowiedź" : "Ukryto odpowiedź"
    });
  }, [showAnswer, setShowAnswer, addToLog]);

  const handleGoBackAndUpdate = useCallback(() => {
    if (!selectedQuestion) return;
    addToLog({
      type: "QUESTION_DONE",
      categoryName: category.name,
      questionNo: selectedQuestion.no,
      questionText: selectedQuestion.question,
      description: `Zużyto: ${selectedQuestion.question || 'Pytanie ' + selectedQuestion.no}`
    });
    setGameSettings((prev) => ({
      ...prev,
      quiz: {
        ...prev.quiz,
        categories: prev.quiz.categories.map((c) => {
          if (c.name !== category.name) return c;
          return {
            ...c,
            list: c.list.map((q) => {
              const isMatch = q.no === selectedQuestion.no && q.question === selectedQuestion.question;
              return isMatch ? { ...q, done: true } : q;
            })
          };
        })
      }
    }));
    handleGoBack();
  }, [selectedQuestion, category.name, setGameSettings, handleGoBack, addToLog]);

  useEffect(() => {
    if (!selectedQuestion) return;
    setShowAnswer(false);
    setSelectedAnswerIndex(null);
    setCurrentImageIndex(0);
    setIsAudioPlaying(false);
    setTimer(questionTimerSeconds);
    setIsTimerRunning(false);
    if (category?.type === "album" && selectedQuestion.images?.length > 0) {
      setEnlargedImage(selectedQuestion.images[0]);
    }
  }, [selectedQuestion, category.type, questionTimerSeconds, setShowAnswer, setIsAudioPlaying]);

  useEffect(() => {
    if (isTimerRunning && timerRef.current == null) {
      timerRef.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            setIsTimerRunning(false);
            // Nie pokazujemy odpowiedzi automatycznie, aby było widać pęknięcie
            playEffect("reveal");
            return 0;
          }
          if (t <= 6) playEffect("tick");
          return t - 1;
        });
      }, 1000);
    } 
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [isTimerRunning, playEffect, setShowAnswer]);

  useEffect(() => { if (showAnswer) playEffect("reveal"); }, [showAnswer, playEffect]);
  useEffect(() => { if (!isAudioPlaying && audioRef.current) audioRef.current.pause(); }, [isAudioPlaying]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") handleGoBackWithLog();
      else if (e.key === " " && e.target.tagName !== "BUTTON") {
        e.preventDefault();
        if (shouldShowAnswerButton) handleShowAnswerToggle();
      } else if (e.key === "ArrowRight") {
        if (category.type === "album" && hasMultipleImages) setCurrentImageIndex(p => (p === albumImages.length - 1 ? 0 : p + 1));
        else if (category.type === "auction" && !isTimerRunning && timer > 0) setIsTimerRunning(true);
      } else if (e.key === "ArrowLeft" && category.type === "album" && hasMultipleImages) {
        setCurrentImageIndex(p => (p === 0 ? albumImages.length - 1 : p - 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [category.type, albumImages, hasMultipleImages, isTimerRunning, timer, shouldShowAnswerButton, handleGoBackWithLog, handleShowAnswerToggle]);

  if (!selectedQuestion) return null;

  const playSound = (path) => {
    if (appSettings?.soundEffects === false) return;
    if (audioRef.current) {
      audioRef.current.src = getAssetPath(path);
      audioRef.current.play().catch(console.error);
      setIsAudioPlaying(true);
      addToLog({ type: "SOUND_PLAY", description: `Dźwięk: ${path.split('/').pop()}` });
    }
  };

  const isTimeUp = category?.type === "auction" && timer === 0;
  const isCracked = category?.type === "auction" && timer <= 1 && !showAnswer;
  const isUrgent = (category?.type === "auction" && isTimerRunning && timer <= 10 && timer > 0) || isTimeUp;
  const isDanger = (category?.type === "auction" && isTimerRunning && timer <= 5 && timer > 0) || isTimeUp;
  const isEarly = category?.type === "auction" && isTimerRunning && timer <= 20 && timer > 10;

  const winner = useMemo(() => {
    const playersWithBids = Object.entries(auctionBids).filter(([_, amount]) => amount > 0);
    if (playersWithBids.length === 0) return null;
    return playersWithBids.reduce((prev, current) => (prev[1] > current[1] ? prev : current));
  }, [auctionBids]);

  let shakeClass = "";
  if (isDanger && !isTimeUp) shakeClass = "shake-heavy";
  else if (isUrgent && !isTimeUp) shakeClass = "shake-medium";
  else if (isEarly && !isTimeUp) shakeClass = "shake-tiny";

  const hasAnswers = Array.isArray(selectedQuestion.answers) && selectedQuestion.answers.length > 0;
  const shouldShowGenericAnswers = hasAnswers;

  return (
    <>
      {/* Powiadomienie Wiem Lepiej */}
      {wiemLepiejNotify && (
        <Box sx={{ 
            position: 'fixed', 
            top: '15%', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            zIndex: 10000,
            background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
            color: '#fff',
            px: 8,
            py: 4,
            borderRadius: '32px',
            boxShadow: '0 30px 60px rgba(0,0,0,0.6), 0 0 30px rgba(168, 85, 247, 0.4)',
            border: '3px solid rgba(255,255,255,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            animation: 'wiemLepiejSlideIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}>
            <style>{`
                @keyframes wiemLepiejSlideIn {
                    from { transform: translate(-50%, -150px) scale(0.5); opacity: 0; }
                    to { transform: translate(-50%, 0) scale(1); opacity: 1; }
                }
            `}</style>
            <AutoAwesomeIcon sx={{ fontSize: '3.5rem', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' }} />
            <Box>
                <Typography variant="h3" fontWeight="1000" sx={{ letterSpacing: '-2px', textShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>{wiemLepiejNotify.toUpperCase()}</Typography>
                <Typography variant="h5" fontWeight="800" sx={{ opacity: 0.9, textTransform: 'uppercase', letterSpacing: '2px' }}>używa "Wiem Lepiej!"</Typography>
            </Box>
        </Box>
      )}

      {/* Warstwa tła z pulsowaniem - dla Licytacji */}
      {isUrgent && (
        <div 
          className={isTimeUp ? "" : (isDanger ? "pulse-danger" : "pulse-urgent")}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: isDanger 
              ? "radial-gradient(circle at center, rgba(239, 68, 68, 0.6) 0%, rgba(239, 68, 68, 0.3) 50%, rgba(239, 68, 68, 0.2) 100%)" 
              : "radial-gradient(circle at center, rgba(243, 156, 18, 0.5) 0%, rgba(243, 156, 18, 0.2) 50%, rgba(243, 156, 18, 0.05) 100%)",
            pointerEvents: "none",
            zIndex: 0,
            opacity: isTimeUp ? 1 : undefined
          }} 
        />
      )}

      {/* Warstwa tła z losowym kolorem - dla pozostałych pytań */}
      {!isUrgent && bgTheme && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: bgTheme,
            pointerEvents: "none",
            zIndex: 0,
            opacity: 1
          }} 
        />
      )}

      <div className={`question-view ${shakeClass}`} style={{ position: "relative", zIndex: 10 }}>
        <audio ref={audioTickRef} src="/sounds/tick.mp3" />
        <audio ref={audioRevealRef} src="/sounds/reveal.mp3" />
        <audio ref={audioRef} onEnded={() => setIsAudioPlaying(false)} />

        <div className="question-view__header">
          <div style={{ fontSize: "18px" }}>Kategoria: <span style={{ color: "#fff", fontWeight: "700" }}>{category?.name}</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <div style={{ fontSize: "18px" }}>Pytanie: 1 / {category?.list?.length}</div>
            
            {/* Zunifikowane przyciski AUDIO */}
            {selectedQuestion.sound && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                <div 
                  className="question-view__audio-btn" 
                  onClick={() => isAudioPlaying ? setIsAudioPlaying(false) : playSound(selectedQuestion.sound)}
                  style={{ borderColor: isAudioPlaying ? "#f39c12" : "#2ecc71", color: isAudioPlaying ? "#f39c12" : "#2ecc71" }}
                >
                  {isAudioPlaying ? <PauseIcon fontSize="large" /> : <PlayArrowIcon fontSize="large" />}
                </div>
                <div style={{ display: "flex", gap: "4px" }}>
                   <IconButton size="small" onClick={() => playSound(selectedQuestion.sound)} sx={{ color: "rgba(255,255,255,0.3)", p: 0.5 }}>
                    <ReplayIcon fontSize="small" />
                  </IconButton>
                </div>
              </div>
            )}

            {/* Licznik Licytacji */}
            {category?.type === "auction" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                <div 
                  className="question-view__timer" 
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  style={{ 
                    borderColor: isTimerRunning ? (timer <= 6 ? "#ef4444" : "#f39c12") : (timer === 0 ? "#ef4444" : "#2ecc71"), 
                    color: isTimerRunning ? (timer <= 6 ? "#ef4444" : "#f39c12") : (timer === 0 ? "#ef4444" : "#2ecc71"),
                    transform: isUrgent && !isTimeUp ? "scale(1.1)" : "scale(1)",
                    boxShadow: isUrgent ? `0 0 20px ${timer <= 5 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(243, 156, 18, 0.4)'}` : "none",
                    opacity: isTimeUp ? 1 : (isTimerRunning ? 1 : 0.6)
                  }}
                >
                  {timer}
                </div>
                <div style={{ display: "flex", gap: "4px" }}>
                  <IconButton size="small" onClick={() => setIsTimerRunning(!isTimerRunning)} sx={{ color: isTimerRunning ? "#f39c12" : "#2ecc71", p: 0.5 }}>
                    {isTimerRunning ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
                  </IconButton>
                  <IconButton size="small" onClick={() => { setTimer(questionTimerSeconds); setIsTimerRunning(false); }} sx={{ color: "rgba(255,255,255,0.3)", p: 0.5 }}>
                    <ReplayIcon fontSize="small" />
                  </IconButton>
                </div>
              </div>
            )}
          </div>
        </div>

        {category?.type === "auction" && (
          <div style={{ width: "100%", height: "12px", background: "rgba(255,255,255,0.05)", borderRadius: "6px", marginBottom: "20px", overflow: "hidden" }}>
            <div style={{ width: `${(timer / questionTimerSeconds) * 100}%`, height: "100%", background: timer <= 10 ? (timer <= 5 ? "#ef4444" : "#f39c12") : "#2ecc71", transition: "width 1s linear, background 0.3s ease" }} />
          </div>
        )}

        <div className="question-view__content">
          {category?.type === "forehead" && !showAnswer && (
            <div style={{ 
              width: "100%", 
              textAlign: "center", 
              padding: "40px 20px", 
              background: "rgba(15, 23, 42, 0.9)", 
              backdropFilter: "blur(10px)",
              border: "4px solid #ef4444", 
              borderRadius: "32px", 
              color: "#fff", 
              marginBottom: "30px",
              boxShadow: "0 0 50px rgba(239, 68, 68, 0.3), inset 0 0 20px rgba(239, 68, 68, 0.2)",
              animation: "pulseBorder 2s infinite ease-in-out"
            }}>
              <style>
                {`
                  @keyframes pulseBorder {
                    0% { border-color: #ef4444; box-shadow: 0 0 30px rgba(239, 68, 68, 0.3); }
                    50% { border-color: #f87171; box-shadow: 0 0 60px rgba(239, 68, 68, 0.5); }
                    100% { border-color: #ef4444; box-shadow: 0 0 30px rgba(239, 68, 68, 0.3); }
                  }
                `}
              </style>
              <Typography variant="overline" sx={{ color: "#ef4444", fontWeight: "1000", letterSpacing: "8px", fontSize: "2.5rem", display: "block", mb: 0, lineHeight: 1 }}>
                UWAGA!
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: "900", textTransform: "uppercase", letterSpacing: "-1px" }}>
                ODWRÓĆ SIĘ LUB ZAMKNIJ OCZY!
              </Typography>
            </div>
          )}

          {category?.type === "auction" && (
            <Box sx={{ 
              width: "100%", 
              background: "rgba(15, 23, 42, 0.95)", 
              backdropFilter: "blur(20px)",
              border: "2px solid #eab308", 
              borderRadius: "32px", 
              p: 4,
              mb: 4,
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              textAlign: "center",
              position: "relative",
              zIndex: 1000
            }}>
              {auctionStage < 3 ? (
                <>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 4, flexWrap: "wrap", gap: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <GavelIcon sx={{ color: "#eab308", fontSize: "2rem" }} />
                        <Typography variant="h4" sx={{ fontWeight: 900, color: "#eab308", letterSpacing: "-1px" }}>LICYTACJA</Typography>
                    </Box>

                    <button 
                        onClick={() => setAuctionStage(prev => (prev < 3 ? prev + 1 : 0))}
                        style={{ 
                            background: auctionStage > 0 ? "#eab308" : "rgba(234, 179, 8, 0.2)", 
                            border: "none", 
                            color: auctionStage > 0 ? "#000" : "#eab308", 
                            padding: "14px 40px", 
                            borderRadius: "16px", 
                            fontWeight: "900", 
                            fontSize: "1.1rem",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            boxShadow: auctionStage > 0 ? "0 0 20px rgba(234, 179, 8, 0.3)" : "none",
                            border: "2px solid #eab308"
                        }}
                    >
                        {auctionStage === 0 && "PO RAZ PIERWSZY..."}
                        {auctionStage === 1 && "PO RAZ DRUGI..."}
                        {auctionStage === 2 && "PO RAZ TRZECI!"}
                    </button>
                  </Box>

                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 2 }}>
                    {gameSettings.players.map((player, idx) => {
                      const currentBid = auctionBids[player.name] || 0;
                      return (
                        <Paper key={idx} sx={{ 
                            p: 2, 
                            background: currentBid > 0 ? "rgba(234, 179, 8, 0.1)" : "rgba(255,255,255,0.02)",
                            border: currentBid > 0 ? "2px solid #eab308" : "1px solid rgba(255,255,255,0.05)",
                            borderRadius: "20px",
                            textAlign: "center"
                        }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, opacity: 0.6, mb: 1 }}>{player.name}</Typography>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: currentBid > 0 ? "#eab308" : "#fff", mb: 2 }}>
                                {currentBid}
                            </Typography>
                            <Box sx={{ display: "flex", gap: 1 }}>
                                <button 
                                    onClick={() => {
                                        setAuctionBids(prev => ({ ...prev, [player.name]: (prev[player.name] || 0) + 1 }));
                                        setAuctionStage(0);
                                    }}
                                    style={{ flex: 1, background: "rgba(234, 179, 8, 0.2)", border: "none", color: "#eab308", padding: "8px", borderRadius: "10px", fontWeight: "900", cursor: "pointer" }}
                                >
                                    +1
                                </button>
                                <button 
                                    onClick={() => setAuctionBids(prev => ({ ...prev, [player.name]: Math.max(0, (prev[player.name] || 0) - 1) }))}
                                    style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "none", color: "rgba(255,255,255,0.4)", padding: "8px", borderRadius: "10px", fontWeight: "900", cursor: "pointer" }}
                                >
                                    -1
                                </button>
                            </Box>
                        </Paper>
                      );
                    })}
                  </Box>
                </>
              ) : (
                <Box sx={{ py: 3, background: "rgba(234, 179, 8, 0.05)", borderRadius: "24px", border: "1px solid rgba(234, 179, 8, 0.3)" }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, mb: 1 }}>
                        <GavelIcon sx={{ color: "#eab308", fontSize: "2rem" }} />
                        <Typography variant="h4" sx={{ color: "#eab308", fontWeight: 900, letterSpacing: "-1px" }}>LICYTACJA ZAKOŃCZONA</Typography>
                    </Box>
                    
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        {winner ? (
                            <>
                                <Box sx={{ textAlign: "right" }}>
                                    <Typography variant="overline" sx={{ color: "#eab308", fontWeight: 800, display: "block", mb: -1 }}>ZWYCIĘZCA</Typography>
                                    <Typography variant="h2" sx={{ fontWeight: 900, color: "#fff", letterSpacing: "-2px" }}>{winner[0]}</Typography>
                                </Box>
                                <Box sx={{ width: "2px", height: "40px", background: "rgba(234, 179, 8, 0.3)" }} />
                                <Box sx={{ textAlign: "left" }}>
                                    <Typography variant="h2" sx={{ fontWeight: 900, color: "#eab308", letterSpacing: "-1px" }}>{winner[1]}</Typography>
                                </Box>
                            </>
                        ) : (
                            <Typography variant="h4" sx={{ fontWeight: 900, color: "#fff" }}>BRAK OFERT</Typography>
                        )}
                        <button 
                            onClick={() => setAuctionStage(0)}
                            style={{ marginLeft: "32px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "0.75rem" }}
                        >
                            Resetuj etap
                        </button>
                    </Box>
                </Box>
              )}
            </Box>
          )}

          {selectedQuestion.question && (
            <div className={`question-box-container ${isCracked ? 'is-cracked' : ''} ${crackType}`}>
              <div className="question-view__box original">{selectedQuestion.question}</div>
              {isCracked && (
                <>
                  <div className="question-view__box part-1">{selectedQuestion.question}</div>
                  <div className="question-view__box part-2">{selectedQuestion.question}</div>
                </>
              )}
            </div>
          )}

          {(category?.type === "illustrated" || category?.type === "forehead") && selectedQuestion.image && (
            <div style={{ textAlign: "center", width: "100%" }}>
              <img src={getAssetPath(selectedQuestion.image)} alt="Pytanie" style={{ maxWidth: "100%", maxHeight: hasAnswers ? "30vh" : "45vh", borderRadius: "20px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", cursor: "pointer", objectFit: "contain" }} onClick={() => setEnlargedImage(selectedQuestion.image)} />
            </div>
          )}

          {category?.type === "album" && albumImages.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "30px" }}>
              {hasMultipleImages && <IconButton onClick={() => setCurrentImageIndex(p => (p === 0 ? albumImages.length - 1 : p - 1))} sx={{ color: "#fff", background: "rgba(255,255,255,0.05)", p: 2 }}><ChevronLeftIcon fontSize="large" /></IconButton>}
              <img src={getAssetPath(albumImages[currentImageIndex])} alt="Album" style={{ maxWidth: "100%", maxHeight: "50vh", borderRadius: "20px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", cursor: "pointer" }} onClick={() => setEnlargedImage(albumImages[currentImageIndex])} />
              {hasMultipleImages && <IconButton onClick={() => setCurrentImageIndex(p => (p === albumImages.length - 1 ? 0 : p + 1))} sx={{ color: "#fff", background: "rgba(255,255,255,0.05)", p: 2 }}><ChevronRightIcon fontSize="large" /></IconButton>}
            </div>
          )}

          {shouldShowGenericAnswers && (
            <div className="question-view__answers">
              {selectedQuestion.answers.map((answer, index) => {
                const isCorrect = showAnswer && answer === selectedQuestion.correctAnswer?.[0];
                const isSelected = selectedAnswerIndex === index;
                const isWrong = isSelected && !isCorrect && showAnswer;
                return (
                  <div 
                    key={index} className={`question-view__answer ${isCorrect ? 'question-view__answer--correct' : ''}`}
                    onClick={() => { if(!showAnswer) { setSelectedAnswerIndex(index); if(answer === selectedQuestion.correctAnswer?.[0]) setShowAnswer(true); } }}
                    style={{ 
                      border: isSelected ? "3px solid #3b82f6" : "1px solid rgba(255, 255, 255, 0.05)", 
                      background: isWrong ? "rgba(239, 68, 68, 0.1)" : isCorrect ? "rgba(46, 204, 113, 0.1)" : isSelected ? "rgba(59, 130, 246, 0.1)" : "rgba(30, 41, 59, 0.5)",
                      minHeight: (hasAnswers && selectedQuestion.image) ? "60px" : "80px",
                      padding: (hasAnswers && selectedQuestion.image) ? "12px 24px" : "16px 32px"
                    }}
                  >
                    <div className="question-view__answer-letter">{String.fromCharCode(65 + index)}</div>
                    <div>{answer}</div>
                  </div>
                );
              })}
            </div>
          )}

          {showAnswer && !shouldShowGenericAnswers && selectedQuestion.correctAnswer?.[0] && (
            <Paper sx={{ p: 4, textAlign: "center", background: "rgba(46, 204, 113, 0.1)", border: "2px solid #2ecc71", borderRadius: "20px" }}>
              <Typography variant="h3" color="#2ecc71" fontWeight="800">{selectedQuestion.correctAnswer[0]}</Typography>
            </Paper>
          )}
        </div>

        <div className="question-view__footer">
          <button onClick={handleGoBackWithLog} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "#fff", padding: "16px 32px", borderRadius: "12px", cursor: "pointer", fontWeight: "700" }}>← Wróć (Esc)</button>
          <div style={{ display: "flex", gap: "16px" }}>
            <button disabled={!hasCorrectAnswer} onClick={handleShowAnswerToggle} style={{ background: hasCorrectAnswer ? (showAnswer ? "#ef4444" : "#2ecc71") : "#4b5563", border: "none", color: "#fff", padding: "16px 40px", borderRadius: "12px", cursor: hasCorrectAnswer ? "pointer" : "not-allowed", fontWeight: "800", fontSize: "16px" }}>
              {showAnswer ? "UKRYJ" : "POKAŻ ODPOWIEDŹ"}
            </button>
            <button onClick={handleGoBackAndUpdate} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "#fff", padding: "16px 32px", borderRadius: "12px", cursor: "pointer", fontWeight: "700" }}>NASTĘPNE →</button>
          </div>
        </div>
      </div>

      <Modal open={!!enlargedImage} onClose={() => setEnlargedImage(null)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Paper sx={{ p: 1, background: 'transparent !important', border: 'none !important', boxShadow: 'none !important', outline: 'none', position: 'relative' }}>
          {hasMultipleImages && <IconButton onClick={(e) => { e.stopPropagation(); const n = currentImageIndex === 0 ? albumImages.length - 1 : currentImageIndex - 1; setCurrentImageIndex(n); setEnlargedImage(albumImages[n]); }} sx={{ position: 'absolute', left: '-60px', top: '50%', color: '#fff', background: 'rgba(0,0,0,0.5)' }}><ChevronLeftIcon fontSize="large" /></IconButton>}
          <img src={getAssetPath(enlargedImage)} alt="Zoom" style={{ maxWidth: '100%', maxHeight: '95vh', borderRadius: '8px' }} onClick={() => setEnlargedImage(null)} />
          {hasMultipleImages && <IconButton onClick={(e) => { e.stopPropagation(); const n = currentImageIndex === albumImages.length - 1 ? 0 : currentImageIndex + 1; setCurrentImageIndex(n); setEnlargedImage(albumImages[n]); }} sx={{ position: 'absolute', right: '-60px', top: '50%', color: '#fff', background: 'rgba(0,0,0,0.5)' }}><ChevronRightIcon fontSize="large" /></IconButton>}
        </Paper>
      </Modal>
    </>
  );
};

Question.propTypes = {
  category: PropTypes.object.isRequired,
  handleGoBack: PropTypes.func.isRequired,
};

export default Question;
