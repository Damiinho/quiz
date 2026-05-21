import { useContext } from "react";
import { AppContext } from "../contexts/AppContext";
import { IconButton, Slider, Switch, FormControlLabel, Box, Typography, Paper, Select, MenuItem } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const navigate = useNavigate();
  const { appSettings, setAppSettings } = useContext(AppContext);

  const handleThemeChange = (event) => {
    setAppSettings(prev => ({ ...prev, themeMode: event.target.checked ? "colorful" : "simple" }));
  };

  const handleFontSizeChange = (event, newValue) => {
    setAppSettings(prev => ({ ...prev, fontSize: newValue }));
  };

  const handleFocusModeChange = (event) => {
    setAppSettings(prev => ({ ...prev, focusMode: event.target.checked }));
  };

  const handleSoundEffectsChange = (event) => {
    setAppSettings(prev => ({ ...prev, soundEffects: event.target.checked }));
  };

  const handleBoardScaleChange = (event) => {
    setAppSettings(prev => ({ ...prev, boardScale: event.target.value }));
  };

  const handleLogVisibilityChange = (event) => {
    setAppSettings(prev => ({ ...prev, logVisibility: event.target.value }));
  };

  const handleScoreFormatChange = (event) => {
    setAppSettings(prev => ({ ...prev, scoreFormat: event.target.value }));
  };

  return (
    <Box sx={{ width: "100%", maxWidth: "600px", margin: "0 auto" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 4 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ color: "#fff", background: "rgba(255,255,255,0.05)" }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" fontWeight="800">Ustawienia</Typography>
      </Box>

      <Paper sx={{ p: 4, display: "flex", flexDirection: "column", gap: 4 }}>
        <Box>
            <Typography variant="h6" fontWeight="700" gutterBottom>Wygląd aplikacji</Typography>
            <FormControlLabel
            control={
                <Switch 
                checked={appSettings.themeMode === "colorful"} 
                onChange={handleThemeChange}
                color="primary"
                />
            }
            label={appSettings.themeMode === "colorful" ? "Tryb Pstrokaty (Gradienty)" : "Tryb Prosty (Ciemny)"}
            />
        </Box>

        <Box>
            <Typography variant="h6" fontWeight="700" gutterBottom>Wielkość liter ({appSettings.fontSize}%)</Typography>
            <Slider
                value={appSettings.fontSize}
                onChange={handleFontSizeChange}
                min={70}
                max={150}
                step={5}
                valueLabelDisplay="auto"
                sx={{ color: "#2ecc71" }}
            />
            <Box sx={{ display: "flex", justifyContent: "space-between", marginTop: 1 }}>
                <Typography variant="caption" color="rgba(255,255,255,0.5)">Małe</Typography>
                <Typography variant="caption" color="rgba(255,255,255,0.5)">Duże</Typography>
            </Box>
        </Box>

        <Box>
            <Typography variant="h6" fontWeight="700" gutterBottom>Rozgrywka</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={Boolean(appSettings.focusMode)}
                            onChange={handleFocusModeChange}
                            color="primary"
                        />
                    }
                    label="Tryb skupienia: ukryj wyniki i logi po wejĹ›ciu w pytanie"
                />
                <FormControlLabel
                    control={
                        <Switch
                            checked={appSettings.soundEffects !== false}
                            onChange={handleSoundEffectsChange}
                            color="primary"
                        />
                    }
                    label="Efekty audio"
                />
                <Box>
                    <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mb: 1, mt: 1 }}>Skala planszy</Typography>
                    <Select
                        fullWidth
                        size="small"
                        value={appSettings.boardScale || "normal"}
                        onChange={handleBoardScaleChange}
                        sx={{ color: "#fff", background: "rgba(0,0,0,0.18)" }}
                    >
                        <MenuItem value="compact">Kompaktowa</MenuItem>
                        <MenuItem value="normal">Normalna</MenuItem>
                        <MenuItem value="large">Duża</MenuItem>
                        <MenuItem value="extraLarge">Bardzo duża</MenuItem>
                    </Select>
                </Box>
                <Box>
                    <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mb: 1, mt: 1 }}>Widoczność logu</Typography>
                    <Select
                        fullWidth
                        size="small"
                        value={appSettings.logVisibility || "normal"}
                        onChange={handleLogVisibilityChange}
                        sx={{ color: "#fff", background: "rgba(0,0,0,0.18)" }}
                    >
                        <MenuItem value="normal">Pokaż log</MenuItem>
                        <MenuItem value="hidden">Ukryj log</MenuItem>
                    </Select>
                </Box>
                <Box>
                    <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mb: 1, mt: 1 }}>Format punktów</Typography>
                    <Select
                        fullWidth
                        size="small"
                        value={appSettings.scoreFormat || "total"}
                        onChange={handleScoreFormatChange}
                        sx={{ color: "#fff", background: "rgba(0,0,0,0.18)" }}
                    >
                        <MenuItem value="total">Tylko suma</MenuItem>
                        <MenuItem value="withLastChange">Suma + ostatnia zmiana</MenuItem>
                    </Select>
                </Box>
            </Box>
        </Box>

        <Box sx={{ marginTop: 2, padding: 2, background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <Typography variant="body2" color="rgba(255,255,255,0.6)">
                Wszystkie ustawienia są zapisywane automatycznie w Twojej przeglądarce.
            </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Settings;
