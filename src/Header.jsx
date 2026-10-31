import { useContext, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AppContext } from "./contexts/AppContext";
import { Menu, Switch, Box, Typography, IconButton } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import HomeIcon from "@mui/icons-material/Home";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloudOffIcon from "@mui/icons-material/CloudOff";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    isQuestionActive, 
    setIsQuestionActive, 
    appSettings, 
    setAppSettings, 
    gameCode, 
    setGameCode,
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

  const handleQuickSettingChange = (key, value) => {
    setAppSettings(prev => ({ ...prev, [key]: value }));
  };

  const isGameRoute = location.pathname === "/gra";

  return (
    <div className="header">
      <div style={{ position: 'absolute', left: '20px', top: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

        {(gameCode && isGameRoute) && (
          <div style={{ 
            background: 'rgba(0,0,0,0.4)', 
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(46, 204, 113, 0.3)', 
            padding: '8px 16px', 
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            zIndex: 1000,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            animation: 'fadeInDown 0.3s ease-out'
          }}>
            <style>
              {`
                @keyframes fadeInDown {
                  from { opacity: 0; transform: translateY(-10px); }
                  to { opacity: 1; transform: translateY(0); }
                }
              `}
            </style>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '900', textTransform: 'uppercase' }}>KOD GRY:</span>
              <span style={{ fontSize: '20px', color: '#2ecc71', fontWeight: '900', letterSpacing: '2px' }}>{gameCode}</span>
            </div>
            <div style={{ display: 'flex', gap: '4px', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '8px' }}>
              <IconButton 
                size="small" 
                onClick={generateGameCode}
                sx={{ color: '#2ecc71', padding: '4px' }}
                title="Zmień kod"
              >
                <RefreshIcon sx={{ fontSize: '18px' }} />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={() => setGameCode(null)}
                sx={{ color: 'rgba(255,255,255,0.3)', padding: '4px', '&:hover': { color: '#ef4444' } }}
                title="Wyłącz online"
              >
                <CloudOffIcon sx={{ fontSize: '18px' }} />
              </IconButton>
            </div>
          </div>
        )}
      </div>

      <div style={{ position: 'absolute', right: '20px', top: '20px' }}>
        <IconButton 
          onClick={handleSettingsClick}
          aria-label="Otwórz szybkie ustawienia"
          aria-haspopup="true"
          aria-expanded={open}
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
            background: "linear-gradient(145deg, #1e293b 0%, #0f172a 100%)",
            color: "#fff",
            padding: "8px",
            width: "280px",
            borderRadius: "20px",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 900, mb: 2, letterSpacing: "-0.5px", color: "#2ecc71" }}>
            SZYBKIE USTAWIENIA
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "4px 12px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>Motyw kolorowy</Typography>
                <Switch size="small" checked={appSettings.themeMode === "colorful"} onChange={handleThemeChange} />
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "4px 12px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>Tryb skupienia</Typography>
                <Switch
                  size="small"
                  checked={Boolean(appSettings.focusMode)}
                  onChange={(event) => handleQuickSettingChange("focusMode", event.target.checked)}
                />
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "4px 12px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>Dźwięki</Typography>
                <Switch
                  size="small"
                  checked={appSettings.soundEffects !== false}
                  onChange={(event) => handleQuickSettingChange("soundEffects", event.target.checked)}
                />
              </div>
          </Box>
        </Box>
        
        <Box sx={{ p: 2, pt: 0 }}>
          <button 
            onClick={() => { navigate("/ustawienia"); handleClose(); }} 
            style={{ 
              width: "100%", 
              background: "#2ecc71", 
              color: "#000", 
              border: "none", 
              padding: "12px", 
              borderRadius: "12px", 
              fontWeight: "900", 
              cursor: "pointer", 
              fontSize: "0.85rem",
              boxShadow: "0 4px 15px rgba(46, 204, 113, 0.3)"
            }}
          >
            PEŁNE USTAWIENIA
          </button>
        </Box>
      </Menu>
    </div>
  );
};

export default Header;
