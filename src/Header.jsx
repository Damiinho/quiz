import { useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AppContext } from "./contexts/AppContext";
import { Alert, Dialog, DialogContent, DialogTitle, Menu, Snackbar, Switch, Box, Typography, IconButton } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import HomeIcon from "@mui/icons-material/Home";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import CloseIcon from "@mui/icons-material/Close";
import QRCode from "qrcode";

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
    generateGameCode,
    storageWarning,
    dismissStorageWarning,
  } = useContext(AppContext);

  const [anchorEl, setAnchorEl] = useState(null);
  const [isGameCodeCopied, setIsGameCodeCopied] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const open = Boolean(anchorEl);
  const joinUrl = gameCode ? `${window.location.origin}/gracz?code=${encodeURIComponent(gameCode)}` : "";

  useEffect(() => {
    let isCurrent = true;
    if (isQrOpen && joinUrl) {
      QRCode.toDataURL(joinUrl, { width: 280, margin: 2, errorCorrectionLevel: "M" })
        .then((dataUrl) => { if (isCurrent) setQrDataUrl(dataUrl); })
        .catch(() => { if (isCurrent) setQrDataUrl(""); });
    }
    return () => { isCurrent = false; };
  }, [isQrOpen, joinUrl]);

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

  const handleCopyGameCode = async () => {
    const copyWithFallback = () => {
      const input = document.createElement("textarea");
      input.value = gameCode;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      const copied = document.execCommand("copy");
      input.remove();
      if (!copied) throw new Error("Nie udało się skopiować kodu.");
    };

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(gameCode);
      } else {
        copyWithFallback();
      }
      setIsGameCodeCopied(true);
      window.setTimeout(() => setIsGameCodeCopied(false), 1800);
    } catch {
      try {
        copyWithFallback();
        setIsGameCodeCopied(true);
        window.setTimeout(() => setIsGameCodeCopied(false), 1800);
      } catch {
        setIsGameCodeCopied(false);
      }
    }
  };

  const isGameRoute = location.pathname === "/gra";

  return (
    <div className={`header ${location.pathname === "/gracz" ? "header--player" : ""}`}>
      <div className={`header__left-controls ${gameCode && isGameRoute ? "header__left-controls--game" : ""} ${location.pathname === "/gracz" ? "header__left-controls--player" : ""}`}>
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
          <div className="header__game-code">
            <div className="header__game-code-value">
              <span>KOD GRY:</span>
              <strong>{gameCode}</strong>
            </div>
            <div className="header__game-code-actions">
              <IconButton
                size="small"
                onClick={() => setIsQrOpen(true)}
                sx={{ color: 'rgba(255,255,255,0.75)', padding: '4px' }}
                title="Pokaż kod QR do dołączenia"
                aria-label="Pokaż kod QR"
              >
                <QrCode2Icon sx={{ fontSize: '19px' }} />
              </IconButton>
              <IconButton
                size="small"
                onClick={handleCopyGameCode}
                sx={{ color: isGameCodeCopied ? '#2ecc71' : 'rgba(255,255,255,0.75)', padding: '4px' }}
                title={isGameCodeCopied ? "Skopiowano kod" : "Kopiuj kod"}
                aria-label="Kopiuj kod gry"
              >
                {isGameCodeCopied ? <CheckIcon sx={{ fontSize: '18px' }} /> : <ContentCopyIcon sx={{ fontSize: '18px' }} />}
              </IconButton>
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

      <div className={`header__right-controls ${location.pathname === "/gracz" ? "header__right-controls--player" : ""}`}>
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

      <Dialog open={isQrOpen} onClose={() => setIsQrOpen(false)} aria-labelledby="game-qr-title" sx={{ zIndex: "var(--layer-dialog)" }}>
        <DialogTitle id="game-qr-title" sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          Dołącz do gry
          <IconButton onClick={() => setIsQrOpen(false)} aria-label="Zamknij kod QR" size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent className="game-qr-dialog">
          {qrDataUrl ? <img src={qrDataUrl} alt={`Kod QR do gry ${gameCode}`} /> : <Typography role="status">Przygotowuję kod QR...</Typography>}
          <Typography variant="body2">Zeskanuj kod aparatem telefonu</Typography>
          <strong>{gameCode}</strong>
          <Typography variant="caption" className="game-qr-dialog__url">{joinUrl}</Typography>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={Boolean(storageWarning)}
        onClose={dismissStorageWarning}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ zIndex: "var(--layer-game-notice)" }}
      >
        <Alert severity="warning" variant="filled" onClose={dismissStorageWarning}>
          {storageWarning?.message}
        </Alert>
      </Snackbar>

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
