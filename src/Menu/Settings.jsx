import { useContext } from "react";
import { AppContext } from "../contexts/AppContext";
import { IconButton, Slider, Switch, Box, Typography, Paper, Select, MenuItem } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import PaletteIcon from "@mui/icons-material/Palette";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VisibilityIcon from "@mui/icons-material/Visibility";

const Settings = () => {
  const navigate = useNavigate();
  const { appSettings, setAppSettings } = useContext(AppContext);

  const handleQuickSettingChange = (key, value) => {
    setAppSettings(prev => ({ ...prev, [key]: value }));
  };

  const SettingCard = ({ title, icon, children }) => (
    <Paper sx={{ 
      p: 3, 
      background: "rgba(255, 255, 255, 0.03)", 
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255, 255, 255, 0.05)",
      borderRadius: "24px",
      display: "flex",
      flexDirection: "column",
      gap: 2,
      transition: "all 0.2s",
      "&:hover": { 
        transform: "translateY(-4px)",
        background: "rgba(255, 255, 255, 0.05)",
        borderColor: "rgba(255, 255, 255, 0.1)"
      }
    }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
        {icon}
        <Typography variant="h6" fontWeight="900" sx={{ letterSpacing: "-0.5px" }}>{title}</Typography>
      </Box>
      {children}
    </Paper>
  );

  return (
    <Box sx={{ width: "100%", maxWidth: "900px", margin: "0 auto", pb: 8 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 6 }}>
        <IconButton 
          onClick={() => navigate(-1)} 
          sx={{ 
            color: "#fff", 
            background: "rgba(255,255,255,0.05)",
            width: "64px",
            height: "64px",
            borderRadius: "20px",
            border: "1px solid rgba(255,255,255,0.1)",
            "&:hover": { background: "rgba(255,255,255,0.1)" }
          }}
        >
          <ArrowBackIcon sx={{ fontSize: "32px" }} />
        </IconButton>
        <Typography variant="h2" fontWeight="900" sx={{ letterSpacing: "-3px" }}>USTAWIENIA</Typography>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
        <SettingCard title="MOTYW" icon={<PaletteIcon sx={{ color: "#a855f7" }} />}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography sx={{ fontWeight: 700, opacity: 0.8 }}>Tryb kolorowy</Typography>
            <Switch 
              checked={appSettings.themeMode === "colorful"} 
              onChange={(e) => handleQuickSettingChange("themeMode", e.target.checked ? "colorful" : "simple")}
              sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#a855f7' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#a855f7' } }}
            />
          </div>
          <Typography variant="caption" sx={{ opacity: 0.5 }}>
            Zmienia styl tła i elementów interfejsu na bardziej żywy i pełen gradientów.
          </Typography>
        </SettingCard>

        <SettingCard title="TEKST" icon={<TextFieldsIcon sx={{ color: "#3b82f6" }} />}>
          <Box>
            <Typography sx={{ fontWeight: 700, opacity: 0.8, mb: 1 }}>Rozmiar interfejsu: {appSettings.fontSize}%</Typography>
            <Slider
              value={appSettings.fontSize}
              onChange={(e, v) => handleQuickSettingChange("fontSize", v)}
              min={70}
              max={150}
              step={5}
              sx={{ color: "#3b82f6" }}
            />
          </Box>
        </SettingCard>

        <SettingCard title="DŹWIĘK" icon={<VolumeUpIcon sx={{ color: "#ef4444" }} />}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography sx={{ fontWeight: 700, opacity: 0.8 }}>Efekty audio</Typography>
            <Switch 
              checked={appSettings.soundEffects !== false} 
              onChange={(e) => handleQuickSettingChange("soundEffects", e.target.checked)}
              sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#ef4444' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#ef4444' } }}
            />
          </div>
          <Typography variant="caption" sx={{ opacity: 0.5 }}>
            Dźwięki przy poprawnych/błędnych odpowiedziach oraz interakcjach.
          </Typography>
        </SettingCard>

        <SettingCard title="WIDOK" icon={<VisibilityIcon sx={{ color: "#eab308" }} />}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, mb: 0.5, opacity: 0.6 }}>SKALA PLANSZY</Typography>
                <Select
                    fullWidth
                    size="small"
                    value={appSettings.boardScale || "normal"}
                    onChange={(e) => handleQuickSettingChange("boardScale", e.target.value)}
                    sx={{ color: "#fff", background: "rgba(255,255,255,0.05)", borderRadius: "12px", "& .MuiOutlinedInput-notchedOutline": { border: "none" } }}
                >
                    <MenuItem value="compact">Kompaktowa</MenuItem>
                    <MenuItem value="normal">Normalna</MenuItem>
                    <MenuItem value="large">Duża</MenuItem>
                    <MenuItem value="extraLarge">Bardzo duża</MenuItem>
                </Select>
            </Box>
            <Box>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, mb: 0.5, opacity: 0.6 }}>FORMAT PUNKTÓW</Typography>
                <Select
                    fullWidth
                    size="small"
                    value={appSettings.scoreFormat || "total"}
                    onChange={(e) => handleQuickSettingChange("scoreFormat", e.target.value)}
                    sx={{ color: "#fff", background: "rgba(255,255,255,0.05)", borderRadius: "12px", "& .MuiOutlinedInput-notchedOutline": { border: "none" } }}
                >
                    <MenuItem value="total">Tylko suma punktów</MenuItem>
                    <MenuItem value="withLastChange">Suma + ostatnia zmiana</MenuItem>
                </Select>
            </Box>
          </Box>
        </SettingCard>

        <SettingCard title="ROZGRYWKA" icon={<SportsEsportsIcon sx={{ color: "#2ecc71" }} />}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography sx={{ fontWeight: 700, opacity: 0.8 }}>Tryb skupienia</Typography>
              <Switch 
                checked={Boolean(appSettings.focusMode)} 
                onChange={(e) => handleQuickSettingChange("focusMode", e.target.checked)}
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#2ecc71' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#2ecc71' } }}
              />
            </div>
            <Typography variant="caption" sx={{ opacity: 0.5, mb: 1 }}>
              Automatycznie ukrywa wyniki i logi podczas aktywnego pytania.
            </Typography>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography sx={{ fontWeight: 700, opacity: 0.8 }}>Widoczność logów</Typography>
              <Switch 
                checked={appSettings.logVisibility !== "hidden"} 
                onChange={(e) => handleQuickSettingChange("logVisibility", e.target.checked ? "normal" : "hidden")}
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#2ecc71' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#2ecc71' } }}
              />
            </div>
          </Box>
        </SettingCard>
      </Box>

      <Box sx={{ marginTop: 6, padding: 4, background: "rgba(46, 204, 113, 0.05)", borderRadius: "32px", border: "1px solid rgba(46, 204, 113, 0.1)", textAlign: "center" }}>
          <Typography variant="body1" sx={{ color: "#2ecc71", fontWeight: 800, letterSpacing: "-0.5px" }}>
              Wszystkie zmiany są zapisywane w czasie rzeczywistym.
          </Typography>
      </Box>
    </Box>
  );
};

export default Settings;
