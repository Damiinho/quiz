import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Paper, TextField, Button, IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SensorsIcon from "@mui/icons-material/Sensors";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { listenForGameState, hitBuzzer, joinGame, submitBid, hitWiemLepiej } from "../utils/cloudSync";

const PlayerView = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [joined, setJoined] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [bidAmount, setBidAmount] = useState("");

  useEffect(() => {
    let eventSource = null;
    if (joined && code) {
      eventSource = listenForGameState(code.toUpperCase(), (data) => {
        setGameState(data);
        
        // Jeśli host usunął nas z listy - rozłączamy się
        if (data && data.players && playerName) {
            const stillInGame = data.players.some(p => p.name.toLowerCase() === playerName.toLowerCase());
            if (!stillInGame) {
                setJoined(false);
                setGameState(null);
            }
        }
      });
    }
    return () => {
      if (eventSource) eventSource.close();
    };
  }, [joined, code, playerName]);

  const handleJoin = () => {
    if (code.length === 6 && playerName) {
      setJoined(true);
      joinGame(code.toUpperCase(), playerName);
    }
  };

  const getCurrentBid = () => {
    if (!gameState?.auctionBids || !playerName) return 0;
    const key = Object.keys(gameState.auctionBids).find(k => k.toLowerCase() === playerName.toLowerCase());
    return key ? gameState.auctionBids[key] : 0;
  };

  const getWinner = () => {
    if (!gameState?.auctionBids) return null;
    const playersWithBids = Object.entries(gameState.auctionBids).filter(([_, amount]) => amount > 0);
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

  const getWiemLepiejUsed = () => {
    if (!gameState?.players || !playerName) return 0;
    const p = gameState.players.find(p => p.name.toLowerCase() === playerName.toLowerCase());
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
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            inputProps={{ maxLength: 6, style: { textAlign: 'center', fontSize: '24px', fontWeight: '900', letterSpacing: '4px' } }}
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
            disabled={code.length !== 6 || !playerName}
            sx={{ background: "#2ecc71", color: "#000", fontWeight: "800", "&:hover": { background: "#27ae60" } }}
          >
            DOŁĄCZ
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", maxWidth: "500px", margin: "0 auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton onClick={() => setJoined(false)} sx={{ color: "#fff", background: "rgba(255,255,255,0.05)" }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" fontWeight="800">Tryb Gracza</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, background: 'rgba(46, 204, 113, 0.1)', px: 2, py: 1, borderRadius: '12px', border: '1px solid rgba(46, 204, 113, 0.2)' }}>
          <SensorsIcon sx={{ color: '#2ecc71', fontSize: '18px' }} />
          <Typography sx={{ color: '#2ecc71', fontWeight: '800', fontSize: '14px' }}>{code.toUpperCase()}</Typography>
        </Box>
      </Box>

      {!gameState ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="rgba(255,255,255,0.5)">Oczekiwanie na dane z hosta...</Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Sekcja Aktywnego Pytania */}
          <Paper sx={{ p: 3, textAlign: 'center', border: gameState.isQuestionActive ? '2px solid #2ecc71' : '1px solid rgba(255,255,255,0.05)' }}>
            <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: '800' }}>STATUS</Typography>
            <Typography variant="h6" fontWeight="900" sx={{ color: gameState.isQuestionActive ? '#2ecc71' : '#fff', mb: 1 }}>
              {gameState.isQuestionActive ? "TRWA PYTANIE" : "OCZEKIWANIE NA WYBÓR"}
            </Typography>
            {gameState.isQuestionActive && (
                <Typography sx={{ fontWeight: '700', background: 'rgba(255,255,255,0.05)', py: 1, borderRadius: '8px' }}>
                    {gameState.isAuction ? "Licytacja:" : "Kategoria:"} {gameState.currentQuestion}
                </Typography>
            )}
          </Paper>

          {/* Interface: Buzzer or Auction */}
          {gameState.isAuction ? (
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
                <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                perspective: '1000px'
                }}>
                    {/* 3D Buzzer Button Code */}
                    <button
                        onClick={handleBuzzer}
                        className="buzzer-3d"
                        style={{
                            position: 'relative',
                            width: '240px',
                            height: '240px',
                            borderRadius: '50%',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            outline: 'none',
                            padding: 0,
                            appearance: 'none',
                            WebkitTapHighlightColor: 'transparent'
                        }}
                    >
                        <style>
                            {`
                                .buzzer-3d {
                                    transition: filter 250ms;
                                }
                                .buzzer-3d:hover {
                                    filter: brightness(110%);
                                }
                                .buzzer-3d:active .buzzer-3d__front {
                                    transform: translateY(-4px);
                                    transition: transform 34ms;
                                }
                                .buzzer-3d:hover .buzzer-3d__front {
                                    transform: translateY(-10px);
                                    transition: transform 250ms cubic-bezier(.3, .7, .4, 1.5);
                                }
                                .buzzer-3d:active .buzzer-3d__shadow {
                                    transform: translateY(2px);
                                    transition: transform 34ms;
                                }
                                .buzzer-3d:hover .buzzer-3d__shadow {
                                    transform: translateY(8px);
                                    transition: transform 250ms cubic-bezier(.3, .7, .4, 1.5);
                                }

                                .buzzer-3d__shadow {
                                    position: absolute;
                                    top: 0;
                                    left: 0;
                                    width: 100%;
                                    height: 100%;
                                    border-radius: 50%;
                                    background: hsl(0deg 0% 0% / 0.25);
                                    will-change: transform;
                                    transform: translateY(4px);
                                    transition: transform 600ms cubic-bezier(.3, .7, .4, 1);
                                }

                                .buzzer-3d__edge {
                                    position: absolute;
                                    top: 0;
                                    left: 0;
                                    width: 100%;
                                    height: 100%;
                                    border-radius: 50%;
                                    background: linear-gradient(
                                        to left,
                                        hsl(0deg 100% 16%) 0%,
                                        hsl(0deg 100% 32%) 8%,
                                        hsl(0deg 100% 32%) 92%,
                                        hsl(0deg 100% 16%) 100%
                                    );
                                }

                                .buzzer-3d__front {
                                    display: block;
                                    position: relative;
                                    padding: 12px 42px;
                                    border-radius: 50%;
                                    width: 100%;
                                    height: 100%;
                                    background: hsl(0deg 100% 47%);
                                    color: white;
                                    transform: translateY(-8px);
                                    will-change: transform;
                                    transition: transform 600ms cubic-bezier(.3, .7, .4, 1);
                                    display: flex;
                                    flex-direction: column;
                                    alignItems: center;
                                    justifyContent: center;
                                    box-shadow: inset 0 4px 10px rgba(255,255,255,0.3), inset 0 -4px 10px rgba(0,0,0,0.3);
                                }
                            `}
                        </style>
                        <span className="buzzer-3d__shadow"></span>
                        <span className="buzzer-3d__edge"></span>
                        <span className="buzzer-3d__front">
                            <Typography variant="h3" fontWeight="900" sx={{ textShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>BUZZ</Typography>
                            <Typography variant="caption" sx={{ fontWeight: '700', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>KLIKNIJ!</Typography>
                        </span>
                    </button>
                </div>

                {canUseWiemLepiej && (
                    <button
                        onClick={handleWiemLepiej}
                        className="wiem-lepiej-3d"
                        style={{
                            position: 'relative',
                            width: '240px',
                            height: '80px',
                            borderRadius: '20px',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            outline: 'none',
                            padding: 0,
                            appearance: 'none',
                            WebkitTapHighlightColor: 'transparent'
                        }}
                    >
                        <style>
                            {`
                                .wiem-lepiej-3d {
                                    transition: filter 250ms;
                                }
                                .wiem-lepiej-3d:hover {
                                    filter: brightness(110%);
                                }
                                .wiem-lepiej-3d:active .wiem-lepiej-3d__front {
                                    transform: translateY(-2px);
                                    transition: transform 34ms;
                                }
                                .wiem-lepiej-3d:hover .wiem-lepiej-3d__front {
                                    transform: translateY(-6px);
                                    transition: transform 250ms cubic-bezier(.3, .7, .4, 1.5);
                                }
                                .wiem-lepiej-3d:active .wiem-lepiej-3d__shadow {
                                    transform: translateY(1px);
                                    transition: transform 34ms;
                                }
                                .wiem-lepiej-3d:hover .wiem-lepiej-3d__shadow {
                                    transform: translateY(4px);
                                    transition: transform 250ms cubic-bezier(.3, .7, .4, 1.5);
                                }

                                .wiem-lepiej-3d__shadow {
                                    position: absolute;
                                    top: 0;
                                    left: 0;
                                    width: 100%;
                                    height: 100%;
                                    border-radius: 20px;
                                    background: hsl(0deg 0% 0% / 0.25);
                                    will-change: transform;
                                    transform: translateY(2px);
                                    transition: transform 600ms cubic-bezier(.3, .7, .4, 1);
                                }

                                .wiem-lepiej-3d__edge {
                                    position: absolute;
                                    top: 0;
                                    left: 0;
                                    width: 100%;
                                    height: 100%;
                                    border-radius: 20px;
                                    background: linear-gradient(
                                        to left,
                                        hsl(270deg 100% 16%) 0%,
                                        hsl(270deg 100% 32%) 8%,
                                        hsl(270deg 100% 32%) 92%,
                                        hsl(270deg 100% 16%) 100%
                                    );
                                }

                                .wiem-lepiej-3d__front {
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    gap: 12px;
                                    position: relative;
                                    width: 100%;
                                    height: 100%;
                                    border-radius: 20px;
                                    background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%);
                                    color: white;
                                    font-size: 1.5rem;
                                    font-weight: 900;
                                    will-change: transform;
                                    transform: translateY(-4px);
                                    transition: transform 600ms cubic-bezier(.3, .7, .4, 1);
                                }
                            `}
                        </style>
                        <span className="wiem-lepiej-3d__shadow"></span>
                        <span className="wiem-lepiej-3d__edge"></span>
                        <span className="wiem-lepiej-3d__front">
                            <AutoAwesomeIcon /> WIEM LEPIEJ!
                        </span>
                    </button>
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
