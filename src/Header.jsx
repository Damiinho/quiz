import { useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AppContext } from "./contexts/AppContext";
import { Alert, Dialog, DialogContent, DialogTitle, Menu, Snackbar, Switch, Slider, Box, Typography, IconButton } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import HomeIcon from "@mui/icons-material/Home";
import CloudIcon from "@mui/icons-material/Cloud";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
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
    onlineBackend,
    setOnlineBackend,
    generateGameCode,
    storageWarning,
    dismissStorageWarning,
  } = useContext(AppContext);

  const [anchorEl, setAnchorEl] = useState(null);
  const [isGameCodeCopied, setIsGameCodeCopied] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const open = Boolean(anchorEl);
  const joinUrl = gameCode ? `${window.location.origin}/gracz?code=${encodeURIComponent(gameCode)}&backend=${encodeURIComponent(onlineBackend)}` : "";

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

  const handleQuickSettingChange = (key, value) => {
    setAppSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerateOnlineGame = () => {
    const backend = appSettings.emergencyOnlineCode ? "ntfy" : "supabase";
    setOnlineBackend(backend);
    generateGameCode(backend);
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
  const isImmersiveFocus = isGameRoute && appSettings?.focusMode && isQuestionActive;

  return (
    <div className={`header ${location.pathname === "/gracz" ? "header--player" : ""} ${isImmersiveFocus ? "header--focus-hidden" : ""}`}>
      <div className={`header__left-controls ${location.pathname === "/gracz" ? "header__left-controls--player" : ""}`}>
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

      <div className={`header__right-controls ${location.pathname === "/gracz" ? "header__right-controls--player" : ""}`}>
        {isGameRoute && (
          gameCode ? (
            <div className="header__game-code-bar" aria-label={`Gra online, kod ${gameCode}`}>
              <button className="header__game-code-value" onClick={() => setIsQrOpen(true)} aria-label={`Pokaż kod QR gry ${gameCode}`} title="Pokaż kod QR">{gameCode}<QrCode2Icon className="header__game-code-qr-icon" /></button>
              <IconButton onClick={handleCopyGameCode} title="Kopiuj kod" aria-label="Kopiuj kod gry" className="header__game-code-action">{isGameCodeCopied ? <CheckIcon /> : <ContentCopyIcon />}</IconButton>
              <IconButton onClick={generateGameCode} title="Zmień kod" aria-label="Zmień kod gry" className="header__game-code-action"><RefreshIcon /></IconButton>
              <IconButton onClick={() => setGameCode(null)} title="Wyłącz online" aria-label="Wyłącz grę online" className="header__game-code-action header__game-code-cloud-action"><CloudIcon className="header__bar-cloud-icon header__bar-cloud-icon--normal" /><CloudOffIcon className="header__bar-cloud-icon header__bar-cloud-icon--hover" /></IconButton>
            </div>
          ) : (
            <IconButton
              onClick={handleGenerateOnlineGame}
              aria-label="Utwórz grę online"
              title="Utwórz grę online"
              className={`header__cloud-trigger ${gameCode ? "header__cloud-trigger--online" : "header__cloud-trigger--offline"}`}
              sx={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", width: "56px", height: "56px", '&:hover': { background: "rgba(255,255,255,0.1)" } }}
            >
              {gameCode ? <><CloudIcon className="header__cloud-icon header__cloud-icon--normal" fontSize="large" /><CloudOffIcon className="header__cloud-icon header__cloud-icon--hover" fontSize="large" /></> : <><CloudOffIcon className="header__cloud-icon header__cloud-icon--normal" fontSize="large" /><CloudIcon className="header__cloud-icon header__cloud-icon--hover" fontSize="large" /></>}
            </IconButton>
          )
        )}
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
        <DialogTitle id="game-qr-title" sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2 }}>
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
            width: "320px",
            maxHeight: "calc(100vh - 40px)",
            overflowY: "auto",
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
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>Dźwięki</Typography>
                <Switch
                  size="small"
                  checked={appSettings.soundEffects !== false}
                  onChange={(event) => handleQuickSettingChange("soundEffects", event.target.checked)}
                />
              </div>
              <div style={{ background: "rgba(59,130,246,0.08)", borderRadius: "12px", padding: "4px 12px", border: "1px solid rgba(96,165,250,0.18)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>Tryb skupienia</Typography>
                <Switch
                  size="small"
                  checked={Boolean(appSettings.focusMode)}
                  onChange={(event) => {
                    handleQuickSettingChange("focusMode", event.target.checked);
                    handleClose();
                  }}
                  inputProps={{ "aria-label": "Tryb skupienia" }}
                  sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#60a5fa' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#60a5fa' } }}
                />
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "10px 12px 4px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>Rozmiar tekstu</Typography>
                  <Typography sx={{ fontSize: "0.8rem", opacity: 0.7 }}>{appSettings.fontSize}%</Typography>
                </div>
                <Slider
                  size="small"
                  aria-label="Rozmiar tekstu"
                  value={appSettings.fontSize}
                  onChange={(_, value) => handleQuickSettingChange("fontSize", value)}
                  min={70}
                  max={150}
                  step={5}
                  sx={{ color: "#38bdf8", mt: 0.5 }}
                />
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "4px 12px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>Awaryjny kod online (ntfy)</Typography>
                <Switch
                  size="small"
                  checked={Boolean(appSettings.emergencyOnlineCode)}
                  onChange={(event) => handleQuickSettingChange("emergencyOnlineCode", event.target.checked)}
                  inputProps={{ "aria-label": "Awaryjny kod online przez ntfy" }}
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
