import { useState, useContext, useEffect, useRef } from "react";
import { Button, Typography, Paper, IconButton } from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import { AppContext } from "../../contexts/AppContext";

const Results = () => {
  const { gameSettings, setGameSettings } = useContext(AppContext);
  const [isOpen, setIsOpen] = useState(false); // Stan rozwinięcia panelu wyników
  const containerRef = useRef(null);

  const handleAddPoints = (playerIndex) => {
    const updatedPlayers = [...gameSettings.players];
    updatedPlayers[playerIndex].points += 1;
    setGameSettings((prevState) => ({
      ...prevState,
      players: updatedPlayers,
    }));
  };

  const handleSubtractPoints = (playerIndex) => {
    const updatedPlayers = [...gameSettings.players];
    updatedPlayers[playerIndex].points -= 1;
    setGameSettings((prevState) => ({
      ...prevState,
      players: updatedPlayers,
    }));
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!isOpen) return;
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick, true);
    return () => document.removeEventListener("pointerdown", handleOutsideClick, true);
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: "20px",
        left: "20px",
        width: "300px",
        backgroundColor: "white",
        boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
        borderRadius: "8px",
        padding: "16px",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Typography variant="h6">Wyniki</Typography>
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
        >
          {isOpen ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
        </IconButton>
      </div>

      {isOpen && (
        <div style={{ marginTop: "16px" }}>
          {gameSettings.players.map((player, index) => (
            <Paper key={index} style={{ padding: "8px", marginBottom: "8px" }}>
              <Typography variant="body1">
                {player.name}: {player.points} punktów
              </Typography>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleAddPoints(index)}
                >
                  Dodaj punkt
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleSubtractPoints(index)}
                >
                  Odejmij punkt
                </Button>
              </div>
            </Paper>
          ))}
        </div>
      )}
    </div>
  );
};

export default Results;
