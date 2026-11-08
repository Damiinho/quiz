import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PropTypes from "prop-types";
import { Box, Typography, Paper, TextField, Button, IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SensorsIcon from "@mui/icons-material/Sensors";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SendIcon from "@mui/icons-material/Send";
import DeleteIcon from "@mui/icons-material/Delete";
import { listenForEvents, listenForGameState, hitBuzzer, joinGame, submitBid, hitWiemLepiej, submitAnswer, sendWheelControl } from "../utils/cloudSync";
import { isAnswerWindowOpen } from "../utils/answerWindow";

const DrawingCanvas = ({ onUpdate, initialValue, disabled = false }) => {
  const canvasRef = useRef(null);
  const initialValueRef = useRef(initialValue);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (initialValueRef.current) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        img.src = initialValueRef.current;
    }
  }, []);

  const getCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height
    };
  };

  const startDrawing = (e) => {
    if (disabled) return;
    setIsDrawing(true);
    const { x, y } = getCoords(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDrawing = () => {
    if (disabled) return;
    if (!isDrawing) return;
    setIsDrawing(false);
    
    // Optymalizacja rozmiaru danych dla ntfy.sh (bardzo rygorystyczny limit 4KB)
    const canvas = canvasRef.current;
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    // Skalujemy do bardzo małego rozmiaru (host i tak widzi to w małym okienku)
    tempCanvas.width = 120;
    tempCanvas.height = 90;
    
    // Wypełniamy tłem
    tempCtx.fillStyle = '#0f172a';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // Rysujemy pomniejszony obraz
    tempCtx.drawImage(canvas, 0, 0, 400, 300, 0, 0, 120, 90);
    
    // JPEG 0.3 to ok. 1.5-2.5KB dla takich wymiarów - powinno przejść przez ntfy
    const compressedData = tempCanvas.toDataURL('image/jpeg', 0.3);
    onUpdate(compressedData);
  };

  const draw = (e) => {
    if (disabled || !isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoords(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onUpdate("");
  };

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Box sx={{ 
        width: '100%', 
        aspectRatio: '4/3', 
        background: '#0f172a', 
        borderRadius: '16px', 
        border: '2px solid rgba(255,255,255,0.1)',
        overflow: 'hidden',
        touchAction: 'none'
      }}>
        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
        />
      </Box>
      <Button 
        startIcon={<DeleteIcon />} 
        onClick={clear} 
        disabled={disabled}
        sx={{ color: '#ef4444', alignSelf: 'flex-end', fontWeight: '800' }}
      >
        WYCZYŚĆ
      </Button>
    </Box>
  );
};

DrawingCanvas.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  initialValue: PropTypes.string,
  disabled: PropTypes.bool,
};

DrawingCanvas.defaultProps = {
  initialValue: "",
};

const PlayerView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState("");
  const [joined, setJoined] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("idle");
  const [playerName, setPlayerName] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [answer, setAnswer] = useState("");
  const [isAnswerConfirmed, setIsAnswerConfirmed] = useState(false);
  const [isAnswerSending, setIsAnswerSending] = useState(false);
  const [answerDeliveryStatus, setAnswerDeliveryStatus] = useState("idle");
  const pendingAnswerIdRef = useRef(null);
  const answerAckTimeoutRef = useRef(null);
  const answerTimeoutRef = useRef(null);
  const answerWindowOpen = isAnswerWindowOpen(gameState);
  const answerWindowOpenRef = useRef(answerWindowOpen);
  answerWindowOpenRef.current = answerWindowOpen;

  useEffect(() => {
    const invitedCode = searchParams.get("code")?.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, "").slice(0, 7);
    if (invitedCode?.length === 6 || invitedCode?.length === 7) setCode(invitedCode);
  }, [searchParams]);

  useEffect(() => {
    if (!gameState?.isQuestionActive) {
        setAnswer("");
        setIsAnswerConfirmed(false);
      setIsAnswerSending(false);
      setAnswerDeliveryStatus("idle");
      pendingAnswerIdRef.current = null;
      clearTimeout(answerAckTimeoutRef.current);
    }
  }, [gameState?.isQuestionActive]);

  useEffect(() => {
    if (!answerWindowOpen && answerTimeoutRef.current) {
      clearTimeout(answerTimeoutRef.current);
      answerTimeoutRef.current = null;
    }
  }, [answerWindowOpen]);

  useEffect(() => {
    let eventSource = null;
    if (joined && code) {
      setConnectionStatus("connecting");
      eventSource = listenForGameState(code.toUpperCase(), (data) => {
        setGameState(data);
        
        // Sprawdź czy gracz nadal istnieje w liście u hosta
        if (playerName && data.players) {
            const stillExists = data.players.some(p => p.name.toLowerCase() === playerName.toLowerCase());
            if (!stillExists) {
                setJoined(false);
                setGameState(null);
                alert("Zostałeś usunięty z gry przez hosta.");
            }
        }
      }, (isConnected) => setConnectionStatus(isConnected ? "connected" : "reconnecting"));
    }
    return () => {
      if (eventSource) eventSource.close();
    };
  }, [joined, code, playerName]);

  useEffect(() => {
    if (!joined || !code || !playerName) return undefined;
    const eventSource = listenForEvents(code.toUpperCase(), (eventData) => {
      if (
        eventData.type === "ANSWER_ACK"
        && eventData.player?.toLowerCase() === playerName.toLowerCase()
        && eventData.eventId === pendingAnswerIdRef.current
      ) {
        clearTimeout(answerAckTimeoutRef.current);
        pendingAnswerIdRef.current = null;
        setIsAnswerConfirmed(true);
        setIsAnswerSending(false);
        setAnswerDeliveryStatus("received");
      }
    });
    return () => eventSource?.close();
  }, [joined, code, playerName]);

  const handleJoin = () => {
    if ((code.length === 6 || code.length === 7) && playerName) {
      setConnectionStatus("connecting");
      setJoined(true);
      joinGame(code.toUpperCase(), playerName);
    }
  };

  const getCurrentBid = () => {
    if (!gameState?.auctionBids || !playerName) return 0;
    return gameState.auctionBids[playerName] || 0;
  };

  const getWinner = () => {
    if (!gameState?.auctionBids) return null;
    const playersWithBids = Object.entries(gameState.auctionBids).filter(([, amount]) => amount > 0);
    if (playersWithBids.length === 0) return null;
    return playersWithBids.reduce((prev, current) => (prev[1] > current[1] ? prev : current));
  };

  const handleBuzzer = () => {
    if (joined && code && playerName && !gameState?.isBiddingClosed) {
      if (gameState?.isAuction) {
          const currentAcceptedBid = getCurrentBid();
          const currentLocalBid = parseInt(bidAmount || 0, 10);
          const baseBid = Math.max(currentAcceptedBid, currentLocalBid);
          const nextBid = baseBid + 1;

          setBidAmount(nextBid.toString());
          submitBid(code.toUpperCase(), playerName, nextBid);
      } else {
          hitBuzzer(code.toUpperCase(), playerName);
      }
    }
  };

  const handleWiemLepiej = () => {
    if (joined && code && playerName && canUseWiemLepiej) {
      hitWiemLepiej(code.toUpperCase(), playerName);
    }
  };

  const handleWheelControl = (action) => {
    if (joined && code && playerName && gameState?.isWheel) {
      sendWheelControl(code.toUpperCase(), playerName, action);
    }
  };

  const getWiemLepiejUsed = () => {
    if (!gameState?.players || !playerName) return 0;
    const p = gameState.players.find(p => p.name === playerName);
    return p?.wiemLepiejUsed || 0;
  };

  const canUseWiemLepiej = gameState?.isQuestionActive && getWiemLepiejUsed() < (gameState?.wiemLepiejLimit || 1);

  const handleSendBid = () => {
    if (joined && code && playerName && bidAmount && !gameState?.isBiddingClosed) {
        const currentAcceptedBid = getCurrentBid();
        const newBid = parseInt(bidAmount, 10);

        if (newBid > currentAcceptedBid) {
            submitBid(code.toUpperCase(), playerName, bidAmount);
        }
    }
  };

  const handleAnswerUpdate = (val) => {
    if (!answerWindowOpenRef.current || isAnswerConfirmed || isAnswerSending) return;
    setAnswer(val);
    setAnswerDeliveryStatus("idle");
    
    // Debounce dla tekstu, żeby nie wysyłać każdej literki
    if (answerTimeoutRef.current) clearTimeout(answerTimeoutRef.current);
    
    // Jeśli to obrazek (rysunek), wysyłamy od razu po podniesieniu pędzla
    if (val.startsWith("data:image")) {
        submitAnswer(code.toUpperCase(), playerName, val, false);
    } else {
        // Jeśli to tekst, czekamy 400ms na koniec pisania
        answerTimeoutRef.current = setTimeout(() => {
          if (!answerWindowOpenRef.current) return;
            submitAnswer(code.toUpperCase(), playerName, val, false);
        }, 400);
    }
  };

  const handleConfirmAnswer = () => {
    if (!answerWindowOpenRef.current || isAnswerSending || isAnswerConfirmed || !answer) return;
    const eventId = globalThis.crypto?.randomUUID?.()
      || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    pendingAnswerIdRef.current = eventId;
    setIsAnswerSending(true);
    setAnswerDeliveryStatus("sending");

    submitAnswer(code.toUpperCase(), playerName, answer, true, eventId).then((published) => {
      if (pendingAnswerIdRef.current !== eventId) return;
      setIsAnswerSending(false);
      if (!published) {
        pendingAnswerIdRef.current = null;
        setAnswerDeliveryStatus("error");
        return;
      }

      setAnswerDeliveryStatus("waiting");
      answerAckTimeoutRef.current = window.setTimeout(() => {
        if (pendingAnswerIdRef.current !== eventId) return;
        pendingAnswerIdRef.current = null;
        setAnswerDeliveryStatus("error");
      }, 10000);
    });
  };

  if (!joined) {
    return (
      <Box sx={{ width: "100%", maxWidth: "400px", margin: "0 auto", textAlign: "center" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 4 }}>
          <IconButton onClick={() => navigate("/")} sx={{ color: "#fff", background: "rgba(255,255,255,0.05)" }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" fontWeight="800">Dołącz do gry</Typography>
        </Box>

        <Paper sx={{ p: 4, display: "flex", flexDirection: "column", gap: 3 }}>
          <TextField
            label="KOD GRY"
            variant="outlined"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, "").slice(0, 7))}
            inputProps={{ maxLength: 7, style: { textAlign: 'center', fontSize: '24px', fontWeight: '900', letterSpacing: '4px' } }}
            fullWidth
          />
          <TextField
            label="TWOJA NAZWA (DLA BUZZERA)"
            variant="outlined"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            fullWidth
          />
          <Button 
            variant="contained" 
            size="large" 
            onClick={handleJoin}
            disabled={(code.length !== 6 && code.length !== 7) || !playerName}
            sx={{ background: "#2ecc71", color: "#000", fontWeight: "800", "&:hover": { background: "#27ae60" } }}
          >
            DOŁĄCZ
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box className="player-view" sx={{ width: "100%", maxWidth: "500px", margin: "0 auto" }}>
      <Box className="player-view__topbar" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton className="player-view__back" aria-label="Opuść grę" onClick={() => setJoined(false)} sx={{ color: "#fff", background: "rgba(255,255,255,0.05)" }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography className="player-view__title" variant="h5" fontWeight="800">Tryb Gracza</Typography>
        </Box>
        <Box
          className={`player-view__connection player-view__connection--${connectionStatus}`}
          title={connectionStatus === "connected" ? "Połączono z grą" : connectionStatus === "reconnecting" ? "Ponawianie połączenia" : "Łączenie z grą"}
          aria-label={connectionStatus === "connected" ? "Połączono z grą" : connectionStatus === "reconnecting" ? "Ponawianie połączenia" : "Łączenie z grą"}
        >
          <span className="player-view__connection-dot" />
          <Typography component="span">{code.toUpperCase()}</Typography>
        </Box>
      </Box>

      {!gameState ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color={connectionStatus === "reconnecting" ? "#fbbf24" : "rgba(255,255,255,0.5)"}>
            {connectionStatus === "reconnecting" ? "Połączenie przerwane. Ponawiam próbę..." : "Łączenie z grą i oczekiwanie na dane z hosta..."}
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Sekcja Aktywnego Pytania */}
          {gameState.isQuestionActive && (
          <Paper className="player-question-card" sx={{ p: 2, textAlign: 'left', border: '1px solid rgba(46, 204, 113, 0.28)' }}>
            <Typography variant="subtitle2" fontWeight="900" sx={{ color: '#2ecc71', mb: 0.75 }}>
              {gameState.questionData?.categoryName || gameState.currentQuestion}
            </Typography>
            {gameState.isWriting && gameState.isQuestionActive && Number.isFinite(gameState.questionData?.remainingSeconds) && (
              <span className={`player-question-card__timer ${answerWindowOpen ? "" : "player-question-card__timer--closed"}`}>
                {gameState.questionData.remainingSeconds}s
              </span>
            )}
            {gameState.questionData?.question && (
              <Typography className="player-question-card__prompt" variant="body1" fontWeight="700">
                {gameState.questionData.question}
              </Typography>
            )}
            {gameState.questionData?.image && (
              <img
                className="player-question-card__image"
                src={gameState.questionData.image.startsWith("http") || gameState.questionData.image.startsWith("data:") || gameState.questionData.image.startsWith("/")
                  ? gameState.questionData.image
                  : `/${gameState.questionData.image}`}
                alt={gameState.questionData.imageIsAnswer ? "Obraz rozwiązania" : "Ilustracja pytania"}
                loading="eager"
                decoding="async"
              />
            )}
            {gameState.questionData?.answers?.length > 0 && (
              <ol className="player-question-card__answers">
                {gameState.questionData.answers.map((option, index) => (
                  <li key={`${index}-${option}`}><span>{String.fromCharCode(65 + index)}</span>{option}</li>
                ))}
              </ol>
            )}
          </Paper>
          )}

          {/* Interface: Buzzer, Auction or Writing */}
          {gameState.isWriting ? (
             <Paper sx={{ p: 4, textAlign: 'center', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(46, 204, 113, 0.2)', borderRadius: '24px' }}>
                <Typography variant="h6" fontWeight="900" sx={{ mb: 2, color: isAnswerConfirmed ? '#2ecc71' : '#fff' }}>
                    {isAnswerConfirmed ? "ODPOWIEDŹ ODEBRANA" : "TWOJA ODPOWIEDŹ"}
                </Typography>

                {!answerWindowOpen && !isAnswerConfirmed && answerDeliveryStatus !== "waiting" && answerDeliveryStatus !== "sending" && (
                  <Typography className="player-answer-closed" role="status" aria-live="polite">
                    {!gameState.isQuestionActive
                      ? "Prowadzący nie otworzył jeszcze rundy odpowiedzi."
                      : Number(gameState.questionData?.remainingSeconds) === 0
                        ? "Czas minął. Odpowiedzi są zamknięte."
                        : "Odpowiedzi są wstrzymane. Czekaj na uruchomienie licznika przez prowadzącego."}
                  </Typography>
                )}

                {gameState.inputMethod === 'drawing' ? (
                    <DrawingCanvas onUpdate={handleAnswerUpdate} initialValue={answer} disabled={!answerWindowOpen || isAnswerConfirmed || isAnswerSending} />
                ) : (
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        value={answer}
                        onChange={(e) => handleAnswerUpdate(e.target.value)}
                        disabled={!answerWindowOpen || isAnswerConfirmed || isAnswerSending}
                        placeholder="Wpisz swoją odpowiedź tutaj..."
                        variant="outlined"
                        sx={{ mb: 3 }}
                    />
                )}

                <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={!answer || !answerWindowOpen || isAnswerConfirmed || isAnswerSending || answerDeliveryStatus === "waiting"}
                    onClick={handleConfirmAnswer}
                    startIcon={isAnswerConfirmed ? null : <SendIcon />}
                    sx={{ 
                        mt: 2,
                        height: '64px',
                        background: isAnswerConfirmed ? 'rgba(46, 204, 113, 0.2)' : '#2ecc71', 
                        color: isAnswerConfirmed ? '#2ecc71' : '#000', 
                        fontWeight: '900', 
                        borderRadius: '16px',
                        '&:hover': { background: isAnswerConfirmed ? 'rgba(46, 204, 113, 0.2)' : '#27ae60' }
                    }}
                >
                    {isAnswerConfirmed ? "ODEBRANO PRZEZ PROWADZĄCEGO" : isAnswerSending ? "WYSYŁANIE..." : answerDeliveryStatus === "waiting" ? "OCZEKIWANIE NA POTWIERDZENIE..." : !answerWindowOpen ? "ODPOWIEDZI ZAMKNIĘTE" : answerDeliveryStatus === "error" ? "SPRÓBUJ PONOWNIE" : "ZATWIERDŹ ODPOWIEDŹ"}
                </Button>
                {answerDeliveryStatus !== "idle" && (
                  <Typography
                    role="status"
                    aria-live="polite"
                    sx={{ mt: 1.5, color: answerDeliveryStatus === "error" ? "#fca5a5" : answerDeliveryStatus === "received" ? "#86efac" : "rgba(255,255,255,0.62)", fontWeight: 700 }}
                  >
                    {answerDeliveryStatus === "sending" && "Wysyłam odpowiedź..."}
                    {answerDeliveryStatus === "waiting" && "Odpowiedź wysłana. Czekam na odbiór przez prowadzącego."}
                    {answerDeliveryStatus === "received" && "Prowadzący odebrał Twoją odpowiedź."}
                    {answerDeliveryStatus === "error" && "Nie otrzymano potwierdzenia. Możesz wysłać odpowiedź ponownie."}
                  </Typography>
                )}
             </Paper>
          ) : gameState.isWheel ? (
             <Paper sx={{ p: 4, textAlign: 'center', background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.35)', borderRadius: '24px' }}>
                <Typography variant="h6" fontWeight="900" sx={{ mb: 1, color: '#eab308' }}>
                    KOŁO FORTUNY
                </Typography>
                <Typography sx={{ mb: 3, color: 'rgba(255,255,255,0.65)' }}>
                    Sterowanie zostanie wykonane na ekranie mistrza gry.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button variant="contained" onClick={() => handleWheelControl('start')} sx={{ background: '#eab308', color: '#111827', fontWeight: 900 }}>
                    START
                  </Button>
                  <Button variant="contained" onClick={() => handleWheelControl('stop')} sx={{ background: '#ef4444', color: '#fff', fontWeight: 900 }}>
                    STOP
                  </Button>
                </Box>
             </Paper>
          ) : gameState.isAuction ? (
             <Paper sx={{ p: 4, textAlign: 'center', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(46, 204, 113, 0.2)', borderRadius: '24px', opacity: gameState.isBiddingClosed ? 0.6 : 1 }}>
                {gameState.auctionStage === 3 ? (
                    <Box sx={{ py: 2 }}>
                        <Typography variant="h6" fontWeight="900" sx={{ color: '#eab308', mb: 1 }}>WYGRYWA:</Typography>
                        {getWinner() ? (
                            <>
                                <Typography variant="h4" fontWeight="900" sx={{ color: '#fff' }}>{getWinner()[0]}</Typography>
                                <Typography variant="h5" fontWeight="900" sx={{ color: '#eab308' }}>{getWinner()[1]}</Typography>
                            </>
                        ) : (
                            <Typography variant="h5" fontWeight="900" sx={{ color: '#fff' }}>BRAK OFERT</Typography>
                        )}
                    </Box>
                ) : (
                    <>
                        <Typography variant="h6" fontWeight="900" sx={{ mb: 1, opacity: 0.8, color: '#2ecc71' }}>
                            {gameState.isBiddingClosed ? "LICYTACJA ZAKOŃCZONA" : "TWOJA LICYTACJA"}
                        </Typography>
                        <Typography variant="h4" sx={{ display: 'block', mb: 3, fontWeight: '900', color: '#fff' }}>
                            {getCurrentBid()}
                        </Typography>
                        
                        {!gameState.isBiddingClosed && (
                            <>
                                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                                    <TextField
                                        type="number"
                                        fullWidth
                                        value={bidAmount}
                                        onChange={(e) => setBidAmount(e.target.value)}
                                        placeholder="Ile dajesz?"
                                        sx={{ 
                                            '& .MuiInputBase-input': { textAlign: 'center', fontSize: '24px', fontWeight: '900', color: '#fff' },
                                            '& .MuiOutlinedInput-root': { borderRadius: '16px' }
                                        }}
                                    />
                                    <Button 
                                        variant="contained" 
                                        onClick={handleSendBid}
                                        disabled={!bidAmount || parseInt(bidAmount, 10) <= getCurrentBid()}
                                        sx={{ background: '#2ecc71', color: '#000', fontWeight: '900', px: 4, borderRadius: '16px', '&:hover': { background: '#27ae60' } }}
                                    >
                                        DAJĘ!
                                    </Button>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    {[1, 5, 10, 50].map(val => {
                                        const currentAcceptedBid = getCurrentBid();
                                        return (
                                            <Button 
                                                key={val}
                                                variant="outlined" 
                                                fullWidth 
                                                onClick={() => {
                                                    const next = (currentAcceptedBid + val).toString();
                                                    setBidAmount(next);
                                                    submitBid(code.toUpperCase(), playerName, next);
                                                }}
                                                sx={{ color: '#2ecc71', borderColor: 'rgba(46, 204, 113, 0.3)', fontWeight: '800', borderRadius: '12px' }}
                                            >
                                                +{val}
                                            </Button>
                                        );
                                    })}
                                </Box>
                            </>
                        )}
                    </>
                )}
             </Paper>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleBuzzer}
                  className="player-buzzer"
                  disabled={!gameState.isQuestionActive || gameState.isBiddingClosed}
                  aria-label={gameState.isAuction ? "Zgłoś ofertę w licytacji" : "Zgłoś się do odpowiedzi"}
                >
                  <SensorsIcon aria-hidden="true" />
                  <span>{gameState.isAuction ? "LICYTUJ" : "ZGŁOŚ SIĘ"}</span>
                  <small>{gameState.isAuction ? "dotknij, aby podbić" : "naciśnij buzzer"}</small>
                </button>

                {canUseWiemLepiej && (
                  <Button
                    className="player-wiem-lepiej"
                    startIcon={<AutoAwesomeIcon />}
                    onClick={handleWiemLepiej}
                    variant="outlined"
                  >
                    WIEM LEPIEJ
                  </Button>
                )}
            </Box>
          )}

          {/* Wyniki Graczy */}
          <Typography variant="subtitle2" fontWeight="800" sx={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>AKTUALNE WYNIKI</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            {gameState.players?.map((player, i) => (
                <Paper key={i} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
                    <Typography variant="body2" fontWeight="700">{player.name}</Typography>
                    <Typography variant="body2" fontWeight="900" color="#2ecc71">{player.points}</Typography>
                </Paper>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default PlayerView;
