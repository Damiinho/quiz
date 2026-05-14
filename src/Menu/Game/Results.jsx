import { useState, useContext, useEffect, useRef } from "react";
import { Button, Typography, Paper, IconButton } from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import UndoIcon from "@mui/icons-material/Undo";
import { AppContext } from "../../contexts/AppContext";

import PushPinIcon from "@mui/icons-material/PushPin";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";

const Results = () => {
  const { gameSettings, setGameSettings, addToLog, isResultsPinned, setIsResultsPinned } = useContext(AppContext);
  const [isOpen, setIsOpen] = useState(false); // Stan rozwinięcia panelu wyników
  const [flashPlayer, setFlashPlayer] = useState({ index: null, type: null });
  const containerRef = useRef(null);
  const audioSuccessRef = useRef(null);
  const audioErrorRef = useRef(null);

  const triggerFlash = (index, type) => {
    setFlashPlayer({ index, type });
    setTimeout(() => setFlashPlayer({ index: null, type: null }), 500);
  };

  const playSound = (type) => {
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

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: "20px",
        left: "20px",
        width: "280px",
        backgroundColor: "rgba(30, 41, 59, 0.7)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
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
            
            return (
              <div 
                key={index} 
                style={{ 
                  padding: "12px", 
                  borderRadius: "12px",
                  background: isFlashing 
                    ? (flashPlayer.type === "positive" ? "rgba(46, 204, 113, 0.2)" : "rgba(239, 68, 68, 0.2)")
                    : "rgba(0,0,0,0.2)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  transition: "all 0.3s ease"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <Typography variant="body2" sx={{ fontWeight: "700", color: isFlashing ? "#fff" : "rgba(255,255,255,0.9)" }}>
                    {player.name}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: "800", color: "#2ecc71" }}>
                    {player.points} pkt
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
                    onMouseOver={(e) => e.target.style.background = "rgba(46, 204, 113, 0.2)"}
                    onMouseOut={(e) => e.target.style.background = "rgba(46, 204, 113, 0.1)"}
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
                    onMouseOver={(e) => e.target.style.background = "rgba(239, 68, 68, 0.2)"}
                    onMouseOut={(e) => e.target.style.background = "rgba(239, 68, 68, 0.1)"}
                  >
                    -1
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Results;
