import { useState, useContext } from "react";
import { AppContext } from "../contexts/AppContext";
import {
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import { Delete, Edit, Save } from "@mui/icons-material";

const Players = () => {
  const { gameSettings, setGameSettings, setScreen } = useContext(AppContext);
  const [playerName, setPlayerName] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedName, setEditedName] = useState("");

  const handleAddPlayer = () => {
    if (playerName.trim() === "") return;

    const newPlayer = { name: playerName, points: 10 };

    setGameSettings((prevSettings) => ({
      ...prevSettings,
      players: [...prevSettings.players, newPlayer],
    }));

    setPlayerName("");
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
    // Możesz dodać logikę, np. przejście do kolejnego ekranu
    setScreen("game"); // Załóżmy, że "game" to kolejny ekran
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: "16px" }}>
      <Typography variant="h6" gutterBottom>
        Zarządzaj graczami
      </Typography>

      <TextField
        label="Nazwa gracza"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
      />
      <Button
        variant="contained"
        onClick={handleAddPlayer}
        disabled={!playerName.trim()}
        fullWidth
      >
        Dodaj gracza
      </Button>

      {gameSettings.players.length > 0 && (
        <Paper elevation={3} sx={{ mt: 2, p: 2 }}>
          <List>
            {gameSettings.players.map((player, index) => (
              <ListItem
                key={index}
                secondaryAction={
                  <>
                    {editingIndex === index ? (
                      <IconButton onClick={() => handleSaveEdit(index)}>
                        <Save />
                      </IconButton>
                    ) : (
                      <IconButton onClick={() => handleEditPlayer(index)}>
                        <Edit />
                      </IconButton>
                    )}
                    <IconButton onClick={() => handleDeletePlayer(index)}>
                      <Delete />
                    </IconButton>
                  </>
                }
              >
                {editingIndex === index ? (
                  <TextField
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    fullWidth
                  />
                ) : (
                  <ListItemText
                    primary={`${player.name} (Punkty: ${player.points})`}
                  />
                )}
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Przycisk "Gotowe" */}
      {gameSettings.players.length > 0 && (
        <Button
          variant="contained"
          color="success"
          onClick={handleFinish}
          fullWidth
          sx={{ mt: 2 }}
        >
          Gotowe
        </Button>
      )}
    </div>
  );
};

export default Players;
