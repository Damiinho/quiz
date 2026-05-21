import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "./contexts/AppContext";
import { Menu, MenuItem, Switch, FormControlLabel, Slider, Box, Typography, Divider, IconButton, Select } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import HomeIcon from "@mui/icons-material/Home";

const Header = () => {
  const navigate = useNavigate();
  const { 
    isQuestionActive, 
    setIsQuestionActive, 
    appSettings, 
    setAppSettings, 
    gameCode, 
    generateGameCode 
  } = useContext(AppContext);

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleHeaderClick = () => {
    if (isQuestionActive) {
      setIsQuestionActive(false);
    }
    navigate("/");
  };

  const handleSettingsClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleThemeChange = (event) => {
    setAppSettings(prev => ({ ...prev, themeMode: event.target.checked ? "colorful" : "simple" }));
  };

  const handleFontSizeChange = (event, newValue) => {
    setAppSettings(prev => ({ ...prev, fontSize: newValue }));
  };

  const handleQuickSettingChange = (key, value) => {
    setAppSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="header">
      <div style={{ position: 'absolute', left: '20px', top: '20px' }}>
        <IconButton 
          onClick={handleHeaderClick}
          sx={{ 
            color: '#fff', 
            background: 'rgba(255,255,255,0.05)', 
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            width: '56px',
            height: '56px',
            '&:hover': { background: 'rgba(255,255,255,0.1)' }
          }}
        >
          <HomeIcon fontSize="large" />
        </IconButton>
      </div>

      {gameCode && (
        <div style={{ 
          position: 'absolute',
          left: '20px',
          top: '90px',
          background: 'rgba(0,0,0,0.4)', 
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)', 
          padding: '8px 16px', 
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000
        }}>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', textTransform: 'uppercase' }}>KOD GRY</span>
          <span style={{ fontSize: '18px', color: '#2ecc71', fontWeight: '900', letterSpacing: '1px' }}>{gameCode}</span>
        </div>
      )}


      <div style={{ position: 'absolute', right: '20px', top: '20px' }}>
        <IconButton 
          onClick={handleSettingsClick}
          sx={{ 
            color: '#fff', 
            background: 'rgba(255,255,255,0.05)', 
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            width: '56px',
            height: '56px',
            '&:hover': { background: 'rgba(255,255,255,0.1)' }
          }}
        >
          <SettingsIcon fontSize="large" />
        </IconButton>
      </div>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          style: {
            background: "#1e293b",
            color: "#fff",
            padding: "10px",
            width: "250px",
            border: "1px solid rgba(255,255,255,0.1)"
          }
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" fontWeight="700" color="rgba(255,255,255,0.5)" gutterBottom>
            WYGLĄD
          </Typography>
          <FormControlLabel
            control={
                <Switch 
                size="small"
                checked={appSettings.themeMode === "colorful"} 
                onChange={handleThemeChange}
                />
            }
            label={appSettings.themeMode === "colorful" ? "Pstrokaty" : "Prosty"}
            sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.8rem' } }}
          />
        </Box>
        <Divider sx={{ background: "rgba(255,255,255,0.05)", my: 1 }} />
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" fontWeight="700" color="rgba(255,255,255,0.5)" gutterBottom>
            WIELKOŚĆ LITER ({appSettings.fontSize}%)
          </Typography>
          <Slider
            value={appSettings.fontSize}
            onChange={handleFontSizeChange}
            min={70}
            max={150}
            step={5}
            size="small"
            sx={{ color: "#2ecc71" }}
          />
        </Box>
        <Divider sx={{ background: "rgba(255,255,255,0.05)", my: 1 }} />
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" fontWeight="700" color="rgba(255,255,255,0.5)" gutterBottom>
            ROZGRYWKA
          </Typography>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={Boolean(appSettings.focusMode)}
                onChange={(event) => handleQuickSettingChange("focusMode", event.target.checked)}
              />
            }
            label="Tryb skupienia"
            sx={{ display: "block", '& .MuiFormControlLabel-label': { fontSize: '0.8rem' } }}
          />
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={appSettings.soundEffects !== false}
                onChange={(event) => handleQuickSettingChange("soundEffects", event.target.checked)}
              />
            }
            label="Efekty audio"
            sx={{ display: "block", '& .MuiFormControlLabel-label': { fontSize: '0.8rem' } }}
          />
          <Select
            size="small"
            fullWidth
            value={appSettings.boardScale || "normal"}
            onChange={(event) => handleQuickSettingChange("boardScale", event.target.value)}
            sx={{ mt: 1, color: "#fff", fontSize: "0.75rem", background: "rgba(0,0,0,0.18)" }}
          >
            <MenuItem value="compact">Skala: kompaktowa</MenuItem>
            <MenuItem value="normal">Skala: normalna</MenuItem>
            <MenuItem value="large">Skala: duża</MenuItem>
            <MenuItem value="extraLarge">Skala: bardzo duża</MenuItem>
          </Select>
          <Select
            size="small"
            fullWidth
            value={appSettings.logVisibility || "normal"}
            onChange={(event) => handleQuickSettingChange("logVisibility", event.target.value)}
            sx={{ mt: 1, color: "#fff", fontSize: "0.75rem", background: "rgba(0,0,0,0.18)" }}
          >
            <MenuItem value="normal">Log: pokaż</MenuItem>
            <MenuItem value="hidden">Log: ukryj</MenuItem>
          </Select>

          {!gameCode && (
            <button
              onClick={() => { generateGameCode(); handleClose(); }}
              style={{
                width: '100%',
                marginTop: '12px',
                background: 'rgba(46, 204, 113, 0.1)',
                border: '1px solid #2ecc71',
                color: '#2ecc71',
                padding: '8px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '800',
                cursor: 'pointer',
                textTransform: 'uppercase'
              }}
            >
              Uaktywnij tryb Cloud (Kod)
            </button>
          )}
        </Box>
        <Divider sx={{ background: "rgba(255,255,255,0.05)", my: 1 }} />
        <MenuItem onClick={() => { navigate("/ustawienia"); handleClose(); }} sx={{ fontSize: '0.8rem', justifyContent: 'center', color: '#2ecc71', fontWeight: '700' }}>
            PEŁNE USTAWIENIA
        </MenuItem>
      </Menu>
    </div>
  );
};

export default Header;
