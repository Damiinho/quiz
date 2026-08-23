import { useState, useEffect, useCallback, useContext, useRef, useMemo } from "react";
import { Typography, Paper, Modal, IconButton, Box } from "@mui/material";
import PropTypes from "prop-types";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import GavelIcon from "@mui/icons-material/Gavel";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { AppContext } from "../../contexts/AppContext";

const getAnswerFontSize = (text = "") => {
  const len = String(text).length;
  if (len > 120) return "clamp(0.75rem, 1.1vw, 0.95rem)";
  if (len > 70) return "clamp(0.85rem, 1.3vw, 1.1rem)";
  if (len > 40) return "clamp(0.95rem, 1.5vw, 1.25rem)";
  return "clamp(1.1rem, 1.8vw, 1.45rem)";
};

const getQuestionFontSize = (text = "") => {
  const len = String(text).length;
  if (len > 250) return "clamp(1.1rem, 2.2vw, 1.6rem)";
  if (len > 140) return "clamp(1.3rem, 2.8vw, 2.1rem)";
  if (len > 70) return "clamp(1.5rem, 3.4vw, 2.6rem)";
  return "clamp(1.8rem, 4vw, 3.25rem)";
};

const Question = ({ category }) => {
  const { 
    gameSettings, 
    showAnswer, 
    isAudioPlaying, 
    setIsAudioPlaying,
    appSettings,
    auctionBids,
    auctionStage,
    isQuestionActive,
    playerAnswers,
    closeCategory,
    finishQuestion,
    toggleAnswer,
    changeAuctionBid,
    advanceAuctionStageGame
  } = useContext(AppContext);

  const [wiemLepiejNotify, setWiemLepiejNotify] = useState(null);
  const [isContextOpen, setIsContextOpen] = useState(false);
  const prevWiemLepiejRef = useRef({});

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

  const questionContext = selectedQuestion?.context?.trim();

  useEffect(() => {
    setIsContextOpen(false);
  }, [selectedQuestion?.no, selectedQuestion?.question, category?.name]);

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

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState(null);
  const audioRef = useRef(null);
  const audioTickRef = useRef(null);
  const audioRevealRef = useRef(null);

  const questionTimerSeconds = selectedQuestion?.timerSeconds || category?.timerSeconds || 30;
  const shouldShowTimer = category?.type === "auction" || category?.type === "openAnswer";
  const [timer, setTimer] = useState(questionTimerSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [crackType, setCrackType] = useState("crack-h");
  const [bgTheme, setBgTheme] = useState(null);
  const timerRef = useRef(null);

  const allAlbumImages = useMemo(() => selectedQuestion?.images || [], [selectedQuestion]);
  const albumAnswerImage = useMemo(() => {
    if (selectedQuestion?.correctAnswerImage) return selectedQuestion.correctAnswerImage;
    if (allAlbumImages.length > 1) return allAlbumImages[allAlbumImages.length - 1];
    return null;
  }, [selectedQuestion, allAlbumImages]);
  const albumRiddleImages = useMemo(() => {
    if (albumAnswerImage && allAlbumImages.length > 1 && allAlbumImages[allAlbumImages.length - 1] === albumAnswerImage) {
      return allAlbumImages.slice(0, -1);
    }
    return allAlbumImages;
  }, [allAlbumImages, albumAnswerImage]);

  const hasMultipleRiddleImages = albumRiddleImages.length > 1;
  const hasCorrectAnswer = Array.isArray(selectedQuestion?.correctAnswer) && selectedQuestion.correctAnswer.some(answer => String(answer).trim());
  const shouldShowAnswerButton = (hasCorrectAnswer || category?.type === "openAnswer" || (category?.type === "album" && !!albumAnswerImage)) && category?.type !== "duel";

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
    closeCategory(category.name);
  }, [category.name, closeCategory]);

  const handleShowAnswerToggle = useCallback(() => {
    toggleAnswer();
  }, [toggleAnswer]);

  const handleGoBackAndUpdate = useCallback(() => {
    if (!selectedQuestion) return;
    finishQuestion(category.name, selectedQuestion);
  }, [selectedQuestion, category.name, finishQuestion]);

  useEffect(() => {
    if (!selectedQuestion) return;
    setSelectedAnswerIndex(null);
    setCurrentImageIndex(0);
    setIsAudioPlaying(false);
    setTimer(questionTimerSeconds);
    setIsTimerRunning(false);
    if (category?.type === "album" && albumRiddleImages.length > 0) {
      setEnlargedImage(albumRiddleImages[0]);
    }
  }, [selectedQuestion, category.type, questionTimerSeconds, setIsAudioPlaying, albumRiddleImages]);

  useEffect(() => {
    if (isTimerRunning && timerRef.current == null) {
      timerRef.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            setIsTimerRunning(false);
            playEffect("reveal");
            return 0;
          }
          if (t <= 6) playEffect("tick");
          return t - 1;
        });
      }, 1000);
    } 
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [isTimerRunning, playEffect]);

  useEffect(() => { if (showAnswer) playEffect("reveal"); }, [showAnswer, playEffect]);
  useEffect(() => { if (!isAudioPlaying && audioRef.current) audioRef.current.pause(); }, [isAudioPlaying]);

  useEffect(() => {
    if (category?.type === "album" && enlargedImage) {
      if (showAnswer && albumAnswerImage) {
        setEnlargedImage(albumAnswerImage);
      } else if (!showAnswer && albumRiddleImages.length > 0) {
        setEnlargedImage(albumRiddleImages[currentImageIndex] || albumRiddleImages[0]);
      }
    }
  }, [showAnswer, category?.type, albumAnswerImage, albumRiddleImages, currentImageIndex, enlargedImage]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (enlargedImage) setEnlargedImage(null);
        else handleGoBackWithLog();
      } else if (e.key === " " && e.target.tagName !== "BUTTON" && e.target.tagName !== "INPUT") {
        e.preventDefault();
        if (shouldShowAnswerButton) handleShowAnswerToggle();
      } else if (e.key === "ArrowRight") {
        if (category.type === "album" && hasMultipleRiddleImages && !showAnswer) {
          setCurrentImageIndex(p => {
            const nextIdx = p === albumRiddleImages.length - 1 ? 0 : p + 1;
            if (enlargedImage) setEnlargedImage(albumRiddleImages[nextIdx]);
            return nextIdx;
          });
        } else if (shouldShowTimer && !isTimerRunning && timer > 0) {
          setIsTimerRunning(true);
        }
      } else if (e.key === "ArrowLeft" && category.type === "album" && hasMultipleRiddleImages && !showAnswer) {
        setCurrentImageIndex(p => {
          const prevIdx = p === 0 ? albumRiddleImages.length - 1 : p - 1;
          if (enlargedImage) setEnlargedImage(albumRiddleImages[prevIdx]);
          return prevIdx;
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [category.type, albumRiddleImages, hasMultipleRiddleImages, showAnswer, isTimerRunning, timer, shouldShowAnswerButton, handleGoBackWithLog, handleShowAnswerToggle, enlargedImage, shouldShowTimer]);

  const playSound = (path) => {
    if (appSettings?.soundEffects === false) return;
    if (audioRef.current) {
      audioRef.current.src = getAssetPath(path);
      audioRef.current.play().catch(console.error);
      setIsAudioPlaying(true);
    }
  };

  const isTimeUp = shouldShowTimer && timer === 0;
  const isCracked = category?.type === "auction" && timer <= 1 && !showAnswer;
  const isUrgent = (shouldShowTimer && isTimerRunning && timer <= 10 && timer > 0) || isTimeUp;
  const isDanger = (shouldShowTimer && isTimerRunning && timer <= 5 && timer > 0) || isTimeUp;

  if (!selectedQuestion) {
    return (
      <div className="question-view">
        <Typography variant="h4" color="#fff" textAlign="center" mt={10}>
          Brak pytań w tej kategorii!
        </Typography>
        <button onClick={handleGoBackWithLog} className="question-view__btn" style={{ margin: "20px auto", display: "block" }}>
          Wróć
        </button>
      </div>
    );
  }

  const hasAnswers = Array.isArray(selectedQuestion.answers) && selectedQuestion.answers.length > 0;
  const shouldShowGenericAnswers = hasAnswers && category?.type !== "forehead" && category?.type !== "auction" && category?.type !== "duel";
  const shouldShowPlayerAnswers = showAnswer || appSettings?.alwaysShowPlayerAnswers;

  const getWinner = () => {
    const bids = Object.entries(auctionBids).filter(([, bid]) => bid > 0);
    if (bids.length === 0) return null;
    bids.sort((a, b) => b[1] - a[1]);
    return bids[0];
  };

  const winner = getWinner();

  return (
    <>
      <audio ref={audioRef} />
      <audio ref={audioTickRef} src="/sounds/tick.mp3" />
      <audio ref={audioRevealRef} src="/sounds/reveal.mp3" />

      {wiemLepiejNotify && (
        <div style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "linear-gradient(135deg, #a855f7, #ec4899)",
            color: "#fff",
            padding: "16px 32px",
            borderRadius: "50px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            zIndex: 10000,
            boxShadow: "0 10px 40px rgba(168, 85, 247, 0.6)",
            animation: "slideDown 0.5s ease-out",
            border: "2px solid rgba(255,255,255,0.4)"
        }}>
            <AutoAwesomeIcon sx={{ fontSize: "28px" }} />
            <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: "-0.5px" }}>
                {wiemLepiejNotify} używa &quot;WIEM LEPIEJ!&quot;
            </Typography>
        </div>
      )}

      <div 
        className={`question-view ${category?.type === "auction" ? `auction-mode ${isCracked ? 'is-cracked' : ''}` : ''}`}
        style={bgTheme ? {
            backgroundImage: bgTheme,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
            transition: "all 0.5s ease"
        } : {}}
      >
        <div className="question-view__header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Typography variant="h6" color="rgba(255,255,255,0.4)" fontWeight="800">
              {category.name?.toUpperCase()}
            </Typography>
            <Typography variant="h6" color="#2ecc71" fontWeight="800">
              #{selectedQuestion.no}
            </Typography>
          </div>
          {shouldShowTimer && (
            <div 
              className={`question-view__timer ${isUrgent ? 'urgent' : ''} ${isDanger ? 'danger' : ''}`}
              onClick={() => {
                if (timer === 0) setTimer(questionTimerSeconds);
                else setIsTimerRunning(!isTimerRunning);
              }}
              style={{
                cursor: "pointer",
                border: isDanger ? "4px solid #ef4444" : isUrgent ? "4px solid #f59e0b" : "4px solid #2ecc71",
                color: isDanger ? "#ef4444" : isUrgent ? "#f59e0b" : "#2ecc71",
                animation: isDanger ? "pulse 0.5s infinite" : "none"
              }}
            >
              {timer}
            </div>
          )}
          {selectedQuestion.sound && (
            <button 
              className="question-view__audio-btn" 
              onClick={() => {
                if (isAudioPlaying) setIsAudioPlaying(false);
                else playSound(selectedQuestion.sound);
              }}
            >
              {isAudioPlaying ? <PauseIcon fontSize="large" /> : <PlayArrowIcon fontSize="large" />}
            </button>
          )}
          {questionContext && (
            <button
              type="button"
              onClick={() => setIsContextOpen((prev) => !prev)}
              style={{
                border: "1px solid rgba(192, 132, 252, 0.7)",
                background: isContextOpen ? "rgba(192, 132, 252, 0.2)" : "rgba(255,255,255,0.05)",
                color: "#f5d0fe",
                borderRadius: "999px",
                padding: "8px 16px",
                fontWeight: 800,
                letterSpacing: "0.06em",
                cursor: "pointer",
                textTransform: "uppercase",
                fontSize: "0.72rem"
              }}
            >
              {isContextOpen ? "Ukryj kontekst" : "Pokaż kontekst"}
            </button>
          )}
        </div>

        <div className="question-view__content">
          {shouldShowTimer && isTimerRunning && (
            <Box sx={{ width: "100%", maxWidth: "800px", height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden", mb: 3 }}>
                <Box sx={{ 
                    width: `${(timer / questionTimerSeconds) * 100}%`, 
                    height: "100%", 
                    background: isDanger ? "#ef4444" : isUrgent ? "#f59e0b" : (category?.type === "auction" ? "#eab308" : "#2ecc71"), 
                    transition: "width 1s linear, background-color 0.3s" 
                }} />
            </Box>
          )}

          {category?.type === "forehead" && !showAnswer && (
            <div style={{ textAlign: "center", marginBottom: "30px", animation: "pulse 1.5s infinite" }}>
              <style>
                {`
                  @keyframes pulse {
                    0% { transform: scale(1); opacity: 0.9; }
                    50% { transform: scale(1.05); opacity: 1; text-shadow: 0 0 20px rgba(239, 68, 68, 0.8); }
                    100% { transform: scale(1); opacity: 0.9; }
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
                        onClick={() => advanceAuctionStageGame()}
                        style={{ 
                            background: auctionStage > 0 ? "#eab308" : "rgba(234, 179, 8, 0.2)", 
                            border: "2px solid #eab308", 
                            color: auctionStage > 0 ? "#000" : "#eab308", 
                            padding: "14px 40px", 
                            borderRadius: "16px", 
                            fontWeight: "900", 
                            fontSize: "1.1rem",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            boxShadow: auctionStage > 0 ? "0 0 20px rgba(234, 179, 8, 0.3)" : "none"
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
                                    onClick={() => changeAuctionBid(player.name, 1)}
                                    style={{ flex: 1, background: "rgba(234, 179, 8, 0.2)", border: "none", color: "#eab308", padding: "8px", borderRadius: "10px", fontWeight: "900", cursor: "pointer" }}
                                >
                                    +1
                                </button>
                                <button 
                                    onClick={() => changeAuctionBid(player.name, -1)}
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
                            onClick={() => advanceAuctionStageGame()}
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
              <div 
                className="question-view__box original"
                style={{
                  fontSize: getQuestionFontSize(selectedQuestion.question),
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                  lineHeight: 1.2
                }}
              >
                {selectedQuestion.question}
              </div>
              {isCracked && (
                <>
                  <div 
                    className="question-view__box part-1"
                    style={{
                      fontSize: getQuestionFontSize(selectedQuestion.question),
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                      lineHeight: 1.2
                    }}
                  >
                    {selectedQuestion.question}
                  </div>
                  <div 
                    className="question-view__box part-2"
                    style={{
                      fontSize: getQuestionFontSize(selectedQuestion.question),
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                      lineHeight: 1.2
                    }}
                  >
                    {selectedQuestion.question}
                  </div>
                </>
              )}
            </div>
          )}

          {questionContext && isContextOpen && (
            <Paper sx={{
              p: 2.5,
              mt: 2,
              background: "rgba(168, 85, 247, 0.08)",
              border: "1px solid rgba(168, 85, 247, 0.35)",
              borderRadius: "18px",
              width: "100%",
              maxWidth: "900px",
              mx: "auto"
            }}>
              <Typography variant="overline" sx={{ color: "#c084fc", fontWeight: 900, letterSpacing: "2px", display: "block", mb: 1 }}>
                KONTEKST / CIEKAWOSTKA
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.9)", fontSize: "1rem", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word", overflowWrap: "anywhere" }}>
                {questionContext}
              </Typography>
            </Paper>
          )}

          {(category?.type === "illustrated" || category?.type === "forehead" || category?.type === "openAnswer") && selectedQuestion.image && (
            <div style={{ textAlign: "center", width: "100%", marginBottom: "20px" }}>
              <img src={getAssetPath(selectedQuestion.image)} alt="Pytanie" style={{ maxWidth: "100%", maxHeight: hasAnswers ? "30vh" : "45vh", borderRadius: "20px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", cursor: "pointer", objectFit: "contain" }} onClick={() => setEnlargedImage(selectedQuestion.image)} />
            </div>
          )}

          {category?.type === "album" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", width: "100%" }}>
              {showAnswer && albumAnswerImage ? (
                <Paper sx={{ 
                  p: 3, 
                  textAlign: "center", 
                  background: "rgba(46, 204, 113, 0.1)", 
                  border: "3px solid #2ecc71", 
                  borderRadius: "24px",
                  boxShadow: "0 0 35px rgba(46, 204, 113, 0.35)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center"
                }}>
                  <Typography variant="overline" sx={{ color: "#2ecc71", fontWeight: "900", letterSpacing: "2px", fontSize: "14px", mb: 1.5 }}>
                    ROZWIĄZANIE / ODPOWIEDŹ
                  </Typography>
                  <img 
                    src={getAssetPath(albumAnswerImage)} 
                    alt="Rozwiązanie" 
                    style={{ maxWidth: "100%", maxHeight: "50vh", borderRadius: "16px", cursor: "pointer", objectFit: "contain" }} 
                    onClick={() => setEnlargedImage(albumAnswerImage)} 
                  />
                </Paper>
              ) : (
                albumRiddleImages.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "24px" }}>
                    {hasMultipleRiddleImages && (
                      <IconButton 
                        onClick={() => setCurrentImageIndex(p => (p === 0 ? albumRiddleImages.length - 1 : p - 1))} 
                        sx={{ color: "#fff", background: "rgba(255,255,255,0.08)", p: 2, '&:hover': { background: "rgba(255,255,255,0.2)" } }}
                      >
                        <ChevronLeftIcon fontSize="large" />
                      </IconButton>
                    )}
                    <img 
                      src={getAssetPath(albumRiddleImages[currentImageIndex] || albumRiddleImages[0])} 
                      alt="Album" 
                      style={{ maxWidth: "100%", maxHeight: "50vh", borderRadius: "20px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", cursor: "pointer", objectFit: "contain" }} 
                      onClick={() => setEnlargedImage(albumRiddleImages[currentImageIndex] || albumRiddleImages[0])} 
                    />
                    {hasMultipleRiddleImages && (
                      <IconButton 
                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(p => (p === albumRiddleImages.length - 1 ? 0 : p + 1)); }} 
                        sx={{ color: "#fff", background: "rgba(255,255,255,0.08)", p: 2, '&:hover': { background: "rgba(255,255,255,0.2)" } }}
                      >
                        <ChevronRightIcon fontSize="large" />
                      </IconButton>
                    )}
                  </div>
                )
              )}
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
                    onClick={() => { if (!showAnswer) setSelectedAnswerIndex(index); }}
                    style={{ 
                      border: isSelected ? "3px solid #3b82f6" : "1px solid rgba(255, 255, 255, 0.05)", 
                      background: isWrong ? "rgba(239, 68, 68, 0.1)" : isCorrect ? "rgba(46, 204, 113, 0.1)" : isSelected ? "rgba(59, 130, 246, 0.1)" : "rgba(30, 41, 59, 0.5)",
                      minHeight: (hasAnswers && selectedQuestion.image) ? "60px" : "80px",
                      padding: (hasAnswers && selectedQuestion.image) ? "12px 20px" : "16px 24px",
                      fontSize: getAnswerFontSize(answer),
                      lineHeight: 1.35,
                      wordBreak: "break-word",
                      overflowWrap: "anywhere"
                    }}
                  >
                    <div className="question-view__answer-letter">{String.fromCharCode(65 + index)}</div>
                    <div>{answer}</div>
                  </div>
                );
              })}
            </div>
          )}

          {showAnswer && !shouldShowGenericAnswers && category?.type !== "album" && (selectedQuestion.correctAnswer?.[0] || selectedQuestion.correctAnswerImage) && (
            <Paper sx={{ 
              p: 4, 
              textAlign: "center", 
              background: "rgba(46, 204, 113, 0.1)", 
              border: "2px solid #2ecc71", 
              borderRadius: "20px",
              mb: 4,
              width: "100%",
              maxWidth: "800px",
              margin: "0 auto 30px auto"
            }}>
              <Typography variant="overline" sx={{ color: "#2ecc71", fontWeight: "800", letterSpacing: "2px" }}>POPRAWNA ODPOWIEDŹ</Typography>
              {selectedQuestion.correctAnswer?.[0] && (
                <Typography 
                  variant="h3" 
                  color="#fff" 
                  fontWeight="800" 
                  sx={{ 
                    mt: 1,
                    fontSize: (selectedQuestion.correctAnswer[0]?.length > 100) 
                      ? "1.4rem" 
                      : (selectedQuestion.correctAnswer[0]?.length > 50) 
                        ? "1.8rem" 
                        : "2.5rem",
                    wordBreak: "break-word",
                    overflowWrap: "anywhere"
                  }}
                >
                  {selectedQuestion.correctAnswer[0]}
                </Typography>
              )}
              {selectedQuestion.correctAnswerImage && (
                <Box sx={{ mt: 2 }}>
                  <img 
                    src={getAssetPath(selectedQuestion.correctAnswerImage)} 
                    alt="Poprawna odpowiedź" 
                    style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "12px", border: "2px solid rgba(255,255,255,0.1)" }} 
                  />
                </Box>
              )}
            </Paper>
          )}

          {category?.type === "openAnswer" && (
            <Box sx={{ width: "100%", mt: 4 }}>
               <Typography variant="h5" fontWeight="900" sx={{ mb: 3, textAlign: "center", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "2px" }}>
                Odpowiedzi graczy:
              </Typography>
              <Box sx={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", 
                gap: 3,
                width: "100%"
              }}>
                {gameSettings.players.map((player, idx) => {
                  const playerAns = Object.entries(playerAnswers).find(([name]) => name.toLowerCase() === player.name.toLowerCase())?.[1];
                  return (
                    <Paper key={idx} sx={{ 
                      p: 2, 
                      background: playerAns?.isConfirmed ? "rgba(46, 204, 113, 0.05)" : "rgba(255,255,255,0.02)",
                      border: playerAns?.isConfirmed ? "2px solid #2ecc71" : "1px solid rgba(255,255,255,0.05)",
                      borderRadius: "20px",
                      position: "relative",
                      overflow: "hidden",
                      minHeight: "120px",
                      display: "flex",
                      flexDirection: "column"
                    }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                        <Typography variant="subtitle1" fontWeight="900" sx={{ color: playerAns?.isConfirmed ? "#2ecc71" : "#fff", opacity: playerAns?.isConfirmed ? 1 : 0.6 }}>
                          {player.name}
                        </Typography>
                        {playerAns?.isConfirmed && (
                          <Box sx={{ background: "#2ecc71", color: "#000", px: 1, py: 0.5, borderRadius: "6px", fontSize: "10px", fontWeight: "900" }}>ZATWIERDZONE</Box>
                        )}
                      </Box>
                      
                      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {playerAns?.answer ? (
                          shouldShowPlayerAnswers ? (
                            (playerAns.answer.startsWith("data:image") || playerAns.answer.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) || playerAns.answer.startsWith("http")) ? (
                              <img 
                                  src={playerAns.answer.startsWith("data:image") ? playerAns.answer : getAssetPath(playerAns.answer)} 
                                  alt={`Odpowiedź ${player.name}`} 
                                  style={{ maxWidth: "100%", maxHeight: "150px", borderRadius: "8px", objectFit: "contain", cursor: "pointer" }} 
                                  onClick={() => setEnlargedImage(playerAns.answer)}
                              />
                            ) : (
                              <Typography 
                                variant="h6" 
                                fontWeight="700" 
                                sx={{ 
                                  textAlign: "center", 
                                  wordBreak: "break-word", 
                                  overflowWrap: "anywhere",
                                  fontSize: (playerAns.answer?.length > 80) ? "0.95rem" : (playerAns.answer?.length > 40) ? "1.1rem" : "1.25rem",
                                  cursor: "pointer" 
                                }}
                                onClick={() => setEnlargedImage(null)}
                              >
                                {playerAns.answer}
                              </Typography>
                            )
                          ) : (
                            <Typography variant="body2" sx={{ opacity: 0.5, fontWeight: "800", color: "#f39c12" }}>ODPOWIEDŹ UKRYTA</Typography>
                          )
                        ) : (
                          <Typography variant="body2" sx={{ opacity: 0.3, fontStyle: "italic" }}>Oczekiwanie...</Typography>
                        )}
                      </Box>
                    </Paper>
                  );
                })}
              </Box>
            </Box>
          )}
        </div>

        <div className="question-view__footer">
          <button onClick={handleGoBackWithLog} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "#fff", padding: "16px 32px", borderRadius: "12px", cursor: "pointer", fontWeight: "700" }}>← Wróć (Esc)</button>
          <div style={{ display: "flex", gap: "16px" }}>
            <button disabled={!shouldShowAnswerButton} onClick={handleShowAnswerToggle} style={{ background: shouldShowAnswerButton ? (showAnswer ? "#ef4444" : "#2ecc71") : "#4b5563", border: "none", color: "#fff", padding: "16px 40px", borderRadius: "12px", cursor: shouldShowAnswerButton ? "pointer" : "not-allowed", fontWeight: "800", fontSize: "16px" }}>
              {showAnswer ? "UKRYJ" : "POKAŻ ODPOWIEDŹ"}
            </button>
            <button onClick={handleGoBackAndUpdate} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "#fff", padding: "16px 32px", borderRadius: "12px", cursor: "pointer", fontWeight: "700" }}>NASTĘPNE →</button>
          </div>
        </div>
      </div>

      <Modal open={!!enlargedImage} onClose={() => setEnlargedImage(null)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Paper sx={{ p: 1, background: 'transparent !important', border: 'none !important', boxShadow: 'none !important', outline: 'none', position: 'relative' }}>
          {category?.type === "album" && hasMultipleRiddleImages && !showAnswer && (
            <IconButton 
              onClick={(e) => { 
                e.stopPropagation(); 
                const n = currentImageIndex === 0 ? albumRiddleImages.length - 1 : currentImageIndex - 1; 
                setCurrentImageIndex(n); 
                setEnlargedImage(albumRiddleImages[n]); 
              }} 
              sx={{ position: 'absolute', left: '-60px', top: '50%', color: '#fff', background: 'rgba(0,0,0,0.5)', '&:hover': { background: 'rgba(0,0,0,0.8)' } }}
            >
              <ChevronLeftIcon fontSize="large" />
            </IconButton>
          )}
          <img 
            src={getAssetPath(enlargedImage)} 
            alt="Zoom" 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '92vh', 
              borderRadius: '12px',
              border: (category?.type === "album" && showAnswer) ? "3px solid #2ecc71" : "none",
              boxShadow: (category?.type === "album" && showAnswer) ? "0 0 35px rgba(46, 204, 113, 0.5)" : "0 20px 60px rgba(0,0,0,0.8)"
            }} 
            onClick={() => setEnlargedImage(null)} 
          />
          {category?.type === "album" && hasMultipleRiddleImages && !showAnswer && (
            <IconButton 
              onClick={(e) => { 
                e.stopPropagation(); 
                const n = currentImageIndex === albumRiddleImages.length - 1 ? 0 : currentImageIndex + 1; 
                setCurrentImageIndex(n); 
                setEnlargedImage(albumRiddleImages[n]); 
              }} 
              sx={{ position: 'absolute', right: '-60px', top: '50%', color: '#fff', background: 'rgba(0,0,0,0.5)', '&:hover': { background: 'rgba(0,0,0,0.8)' } }}
            >
              <ChevronRightIcon fontSize="large" />
            </IconButton>
          )}
          {category?.type === "album" && albumAnswerImage && (
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                handleShowAnswerToggle();
              }}
              style={{
                position: 'absolute',
                bottom: '16px',
                right: '16px',
                background: showAnswer ? '#ef4444' : '#2ecc71',
                color: '#fff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                fontWeight: '800',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 8px 30px rgba(0,0,0,0.8)',
                zIndex: 10002,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              {showAnswer ? "UKRYJ ODPOWIEDŹ" : "POKAŻ ODPOWIEDŹ"}
            </button>
          )}
        </Paper>
      </Modal>
    </>
  );
};

Question.propTypes = {
  category: PropTypes.object.isRequired,
};

export default Question;
