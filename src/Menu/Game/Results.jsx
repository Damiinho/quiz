import { useState, useContext, useEffect, useRef } from "react";
import { Typography, IconButton, TextField, InputAdornment, Box } from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import { AppContext } from "../../contexts/AppContext";
import PushPinIcon from "@mui/icons-material/PushPin";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

export const Results = () => {
  const { 
    gameSettings, 
    setGameSettings, 
    addToLog, 
    quizLog, 
    isResultsPinned, 
    setIsResultsPinned, 
    appSettings,
    toggleWiemLepiej
  } = useContext(AppContext);

  const [isOpen, setIsOpen] = useState(false);
  const [flashPlayer, setFlashPlayer] = useState({ index: null, type: null });
  const [newPlayerName, setNewPlayerName] = useState("");
  const containerRef = useRef(null);
  const audioSuccessRef = useRef(null);
  const audioErrorRef = useRef(null);

  const triggerFlash = (index, type) => {
    setFlashPlayer({ index, type });
    setTimeout(() => setFlashPlayer({ index: null, type: null }), 500);
  };

  const playSound = (type) => {
    if (appSettings?.soundEffects === false) return;
    if (type === "success" && audioSuccessRef.current) {
      audioSuccessRef.current.currentTime = 0;
      audioSuccessRef.current.play().catch(() => {});
    } else if (type === "error" && audioErrorRef.current) {
      audioErrorRef.current.currentTime = 0;
      audioErrorRef.current.play().catch(() => {});
    }
  };

  const handleAddPoints = (playerIndex) => {
    const updatedPlayers = [...gameSettings.players];
    updatedPlayers[playerIndex].points += 1;
    
    addToLog({ 
      type: "POINTS_CHANGE", 
      playerIndex, 
      change: 1, 
      description: `+1 pkt dla ${updatedPlayers[playerIndex].name}` 
    });
    setGameSettings((prevState) => ({ ...prevState, players: updatedPlayers }));
    
    playSound("success");
    triggerFlash(playerIndex, "positive");
  };

  const handleSubtractPoints = (playerIndex) => {
    const updatedPlayers = [...gameSettings.players];
    updatedPlayers[playerIndex].points -= 1;

    addToLog({ 
      type: "POINTS_CHANGE", 
      playerIndex, 
      change: -1, 
      description: `-1 pkt dla ${updatedPlayers[playerIndex].name}` 
    });
    setGameSettings((prevState) => ({ ...prevState, players: updatedPlayers }));
    
    playSound("error");
    triggerFlash(playerIndex, "negative");
  };

  const handleToggleWiemLepiej = (playerIndex) => {
    toggleWiemLepiej(playerIndex);
  };

  const handleDeletePlayer = (index) => {
    const playerToDelete = gameSettings.players[index];
    setGameSettings(prev => ({
      ...prev,
      players: prev.players.filter((_, i) => i !== index)
    }));
    addToLog({ 
      type: "PLAYER_REMOVED", 
      description: `Usunięto gracza: ${playerToDelete.name}` 
    });
  };

  const handleAddNewPlayer = () => {
    if (!newPlayerName.trim()) return;
    setGameSettings(prev => ({
      ...prev,
      players: [...prev.players, { name: newPlayerName, points: 0, wiemLepiejUsed: 0 }]
    }));
    addToLog({ 
      type: "PLAYER_ADDED", 
      description: `Dodano gracza: ${newPlayerName}` 
    });
    setNewPlayerName("");
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (isResultsPinned || !isOpen) return;
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick, true);
    return () => document.removeEventListener("pointerdown", handleOutsideClick, true);
  }, [isOpen, isResultsPinned]);

  const showContent = isOpen || isResultsPinned;
  
  const lastPointChanges = quizLog.reduce((acc, log) => {
    if (log.type === "POINTS_CHANGE") {
      acc[log.playerIndex] = log.change;
    }
    return acc;
  }, {});

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: "20px",
        left: "90px",
        width: "280px",
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        borderRadius: "16px",
        padding: "16px",
        zIndex: 9999,
        color: "#fff",
        transition: "all 0.3s ease"
      }}
    >
      <audio ref={audioSuccessRef} src="/sounds/correct.mp3" />
      <audio ref={audioErrorRef} src="/sounds/wrong.mp3" />
      
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Typography variant="h6" sx={{ fontWeight: "800", fontSize: "16px", letterSpacing: "-0.5px" }}>WYNIKI</Typography>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); setIsResultsPinned(!isResultsPinned); }}
            sx={{ color: isResultsPinned ? "#2ecc71" : "rgba(255,255,255,0.5)" }}
          >
            {isResultsPinned ? <PushPinIcon fontSize="small" /> : <PushPinOutlinedIcon fontSize="small" />}
          </IconButton>
          <IconButton
            size="small"
            sx={{ color: "#fff" }}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
          >
            {showContent ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
          </IconButton>
        </div>
      </div>

      {showContent && (
        <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {gameSettings.players.map((player, index) => {
            const isFlashing = flashPlayer.index === index;
            const isWiemLepiejUsed = (player.wiemLepiejUsed || 0) >= (gameSettings.wiemLepiejLimit || 1);
            
            return (
              <div 
                key={index} 
                style={{ 
                  padding: "12px", 
                  borderRadius: "12px",
                  background: isFlashing 
                    ? (flashPlayer.type === "positive" ? "rgba(46, 204, 113, 0.2)" : "rgba(239, 68, 68, 0.2)")
                    : "rgba(0,0,0,0.2)",
                  border: isWiemLepiejUsed ? "2px solid #a855f7" : "1px solid rgba(255,255,255,0.05)",
                  transition: "all 0.3s ease",
                  position: "relative",
                  boxShadow: isWiemLepiejUsed ? "0 0 15px rgba(168, 85, 247, 0.2)" : "none"
                }}
              >
                <IconButton 
                  onClick={() => handleDeletePlayer(index)}
                  size="small"
                  sx={{ 
                    position: "absolute", 
                    top: "2px", 
                    right: "2px", 
                    color: "rgba(239, 68, 68, 0.4)",
                    "&:hover": { color: "#ef4444" }
                  }}
                >
                  <DeleteIcon sx={{ fontSize: "14px" }} />
                </IconButton>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", marginRight: "20px" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: "900", color: isFlashing ? "#fff" : (isWiemLepiejUsed ? "#d8b4fe" : "rgba(255,255,255,0.9)") }}>
                        {player.name}
                    </Typography>
                    {gameSettings.wiemLepiejLimit > 0 && (
                        <IconButton 
                            size="small" 
                            onClick={() => handleToggleWiemLepiej(index)}
                            sx={{ 
                                p: "4px",
                                color: isWiemLepiejUsed ? "#fff" : "rgba(255,255,255,0.1)",
                                background: isWiemLepiejUsed ? "#a855f7" : "rgba(255,255,255,0.05)",
                                border: isWiemLepiejUsed ? "none" : "1px solid rgba(255,255,255,0.1)",
                                "&:hover": { background: isWiemLepiejUsed ? "#9333ea" : "rgba(255,255,255,0.2)" },
                                boxShadow: isWiemLepiejUsed ? "0 0 10px rgba(168, 85, 247, 0.5)" : "none"
                            }}
                            title={isWiemLepiejUsed ? "Wykorzystano 'Wiem Lepiej!' (Kliknij by przywrócić)" : "Oznacz użycie 'Wiem Lepiej!'"}
                        >
                            <AutoAwesomeIcon sx={{ fontSize: "16px" }} />
                        </IconButton>
                    )}
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: "800", color: "#2ecc71" }}>
                    {player.points} pkt
                    {appSettings?.scoreFormat === "withLastChange" && lastPointChanges[index] && (
                      <span style={{ color: lastPointChanges[index] > 0 ? "#2ecc71" : "#ef4444", marginLeft: "6px" }}>
                        ({lastPointChanges[index] > 0 ? "+" : ""}{lastPointChanges[index]})
                      </span>
                    )}
                  </Typography>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={() => handleAddPoints(index)}
                    style={{ 
                      flex: 1,
                      background: "rgba(46, 204, 113, 0.1)",
                      border: "1px solid rgba(46, 204, 113, 0.2)",
                      color: "#2ecc71",
                      borderRadius: "6px",
                      padding: "4px 0",
                      cursor: "pointer",
                      fontWeight: "800",
                      fontSize: "12px",
                      transition: "all 0.2s"
                    }}
                  >
                    +1
                  </button>
                  <button
                    onClick={() => handleSubtractPoints(index)}
                    style={{ 
                      flex: 1,
                      background: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      color: "#ef4444",
                      borderRadius: "6px",
                      padding: "4px 0",
                      cursor: "pointer",
                      fontWeight: "800",
                      fontSize: "12px",
                      transition: "all 0.2s"
                    }}
                  >
                    -1
                  </button>
                </div>
              </div>
            );
          })}

          <div style={{ marginTop: "8px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "12px" }}>
            <TextField
              size="small"
              placeholder="Dodaj gracza..."
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddNewPlayer()}
              variant="standard"
              sx={{ 
                width: "100%",
                "& .MuiInput-root": { color: "#fff", fontSize: "12px" },
                "& .MuiInput-underline:before": { borderBottomColor: "rgba(255,255,255,0.2)" }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleAddNewPlayer} size="small" sx={{ color: "#2ecc71" }}>
                      <AddCircleIcon sx={{ fontSize: "18px" }} />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;
