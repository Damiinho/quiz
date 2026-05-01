import { useContext } from "react";
import { Button, Paper, Typography } from "@mui/material";
import { AppContext } from "../contexts/AppContext";

const Ranking = () => {
  const { gameSettings, resetSavedGame, setScreen } = useContext(AppContext);
  const ranking = [...(gameSettings.players || [])].sort(
    (a, b) => b.points - a.points
  );

  return (
    <div style={{ maxWidth: 720, margin: "120px auto 40px", padding: 24 }}>
      <Typography variant="h3" sx={{ mb: 2, textAlign: "center" }}>
        Ranking końcowy
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        {ranking.length === 0 ? (
          <Typography>Brak graczy do wyświetlenia.</Typography>
        ) : (
          ranking.map((player, index) => (
            <div
              key={`${player.name}-${index}`}
              style={{
                display: "grid",
                gridTemplateColumns: "60px 1fr 100px",
                gap: 12,
                alignItems: "center",
                padding: "10px 0",
                borderBottom: index === ranking.length - 1 ? "none" : "1px solid #ddd",
              }}
            >
              <Typography variant="h5">{index + 1}.</Typography>
              <Typography variant="h5">{player.name}</Typography>
              <Typography variant="h5" sx={{ textAlign: "right" }}>
                {player.points}
              </Typography>
            </div>
          ))
        )}
      </Paper>

      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <Button variant="contained" onClick={() => setScreen("game")}>
          Wróć do gry
        </Button>
        <Button variant="outlined" color="error" onClick={resetSavedGame}>
          Zakończ i wyczyść zapis
        </Button>
      </div>
    </div>
  );
};

export default Ranking;
