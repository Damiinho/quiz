import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../contexts/AppContext";
import { IconButton } from "@mui/material";
import { Delete, Edit, Save, Person, Add, Remove } from "@mui/icons-material";

const Players = () => {
  const navigate = useNavigate();
  const { gameSettings, setGameSettings } = useContext(AppContext);
  const [playerName, setPlayerName] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [startingScore, setStartingScore] = useState(0);

  const handleAddPlayer = () => {
    if (playerName.trim() === "") return;

    const newPlayer = { name: playerName, points: startingScore };

    setGameSettings((prevSettings) => ({
      ...prevSettings,
      players: [...prevSettings.players, newPlayer],
    }));

    setPlayerName("");
  };

  const changeStartingScore = (newScore) => {
    const normalized = Math.max(0, Math.floor(newScore));
    setStartingScore(normalized);
  };

  const adjustPlayerScore = (index, delta) => {
    setGameSettings((prevSettings) => {
      const updatedPlayers = [...prevSettings.players];
      updatedPlayers[index] = {
        ...updatedPlayers[index],
        points: Math.max(0, updatedPlayers[index].points + delta),
      };
      return { ...prevSettings, players: updatedPlayers };
    });
  };

  const handleDeletePlayer = (index) => {
    setGameSettings((prevSettings) => ({
      ...prevSettings,
      players: prevSettings.players.filter((_, i) => i !== index),
    }));
  };

  const handleEditPlayer = (index) => {
    setEditingIndex(index);
    setEditedName(gameSettings.players[index].name);
  };

  const handleSaveEdit = (index) => {
    if (editedName.trim() === "") return;

    setGameSettings((prevSettings) => {
      const updatedPlayers = [...prevSettings.players];
      updatedPlayers[index].name = editedName;
      return { ...prevSettings, players: updatedPlayers };
    });

    setEditingIndex(null);
  };

  const handleFinish = () => {
    navigate("/gra");
  };

  return (
    <div className="players-view">
      <div className="players-view__header">
        <h2>Zarządzaj graczami</h2>
      </div>

      <div className="players-view__input-row">
        <input
          type="text"
          placeholder="Nazwa gracza"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddPlayer()}
        />
        <button onClick={handleAddPlayer} disabled={!playerName.trim()}>
          DODAJ
        </button>
      </div>

      <div className="players-view__score-setting">
        <div>Punktacja początkowa</div>
        <div className="players-view__score-setting-controls">
          <button onClick={() => changeStartingScore(startingScore - 1)}>-</button>
          <span>{startingScore}</span>
          <button onClick={() => changeStartingScore(startingScore + 1)}>+</button>
        </div>
      </div>

      <div className="players-view__score-setting" style={{ marginTop: "12px", justifyContent: "space-between" }}>
        <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 800 }}>Opcja "Wiem Lepiej!"</div>
            <div style={{ fontSize: '12px', opacity: 0.6 }}>Pozwala graczom raz na grę zgłosić chęć odpowiedzi poza kolejką.</div>
        </div>
        <div className="players-view__score-setting-controls">
          <input 
            type="checkbox" 
            checked={(gameSettings.wiemLepiejLimit || 0) > 0} 
            onChange={(e) => setGameSettings(prev => ({ ...prev, wiemLepiejLimit: e.target.checked ? 1 : 0 }))}
            style={{ width: '24px', height: '24px', cursor: 'pointer', accentColor: '#a855f7' }}
          />
        </div>
      </div>

      <div className="players-view__list">
        {gameSettings.players.map((player, index) => (
          <div key={index} className="players-view__item">
            <div className="players-view__item-info">
              <div className="players-view__item-avatar">
                <Person />
              </div>
              <div style={{ flex: 1 }}>
                {editingIndex === index ? (
                   <input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(index)}
                    autoFocus
                    style={{ background: "none", border: "1px solid #2ecc71", color: "#fff", padding: "4px", width: "100%" }}
                  />
                ) : (
                  <>
                    <div className="players-view__item-name">{player.name}</div>
                    <div className="players-view__item-score">{player.points} pkt</div>
                  </>
                )}
              </div>
              <div style={{ display: "flex", gap: "4px", alignItems: "center", marginRight: "10px" }}>
                  <IconButton onClick={() => adjustPlayerScore(index, -1)} size="small" sx={{ color: "rgba(255,255,255,0.3)" }}>
                    <Remove fontSize="small" />
                  </IconButton>
                  <IconButton onClick={() => adjustPlayerScore(index, 1)} size="small" sx={{ color: "#2ecc71" }}>
                    <Add fontSize="small" />
                  </IconButton>
              </div>
            </div>
            <div className="players-view__item-actions">
               {editingIndex === index ? (
                  <IconButton onClick={() => handleSaveEdit(index)} size="small">
                    <Save fontSize="small" style={{ color: "#2ecc71" }} />
                  </IconButton>
                ) : (
                  <IconButton onClick={() => handleEditPlayer(index)} size="small">
                    <Edit fontSize="small" style={{ color: "rgba(255,255,255,0.3)" }} />
                  </IconButton>
                )}
                <IconButton onClick={() => handleDeletePlayer(index)} size="small" className="delete">
                  <Delete fontSize="small" />
                </IconButton>
            </div>
          </div>
        ))}
      </div>

      {gameSettings.players.length > 0 && (
        <button
          onClick={handleFinish}
          style={{ width: "100%", background: "#2ecc71", color: "#000", border: "none", padding: "16px", borderRadius: "12px", fontWeight: "700", cursor: "pointer", fontSize: "16px" }}
        >
          GOTOWE
        </button>
      )}
    </div>
  );
};

export default Players;
