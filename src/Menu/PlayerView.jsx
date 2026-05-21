import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Paper, TextField, Button, IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SensorsIcon from "@mui/icons-material/Sensors";
import { listenForGameState, hitBuzzer } from "../utils/cloudSync";

const PlayerView = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [joined, setJoined] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [playerName, setPlayerName] = useState("");

  useEffect(() => {
    let eventSource = null;
    if (joined && code) {
      eventSource = listenForGameState(code.toUpperCase(), (data) => {
        setGameState(data);
      });
    }
    return () => {
      if (eventSource) eventSource.close();
    };
  }, [joined, code]);

  const handleJoin = () => {
    if (code.length === 6) {
      setJoined(true);
    }
  };

  const handleBuzzer = () => {
    if (joined && code && playerName) {
      hitBuzzer(code.toUpperCase(), playerName);
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
                    Kategoria: {gameState.currentQuestion}
                </Typography>
            )}
          </Paper>

          {/* Buzzer Button */}
          <button
            onClick={handleBuzzer}
            style={{
                width: '100%',
                height: '150px',
                borderRadius: '50% / 20%',
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                boxShadow: '0 10px 0 #b91c1c, 0 20px 30px rgba(0,0,0,0.5)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.1s',
                marginTop: '20px',
                marginBottom: '40px'
            }}
            onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translateY(5px)';
                e.currentTarget.style.boxShadow = '0 5px 0 #b91c1c, 0 10px 20px rgba(0,0,0,0.5)';
            }}
            onMouseUp={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 0 #b91c1c, 0 20px 30px rgba(0,0,0,0.5)';
            }}
          >
            <Typography variant="h3" fontWeight="900">BUZZ</Typography>
            <Typography variant="caption" sx={{ fontWeight: '700', opacity: 0.7 }}>KLIKNIJ ABY SIĘ ZGŁOSIĆ</Typography>
          </button>

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
