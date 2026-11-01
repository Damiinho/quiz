import { useContext, useEffect, useState } from "react";
import { Alert, Dialog, DialogContent, DialogTitle, IconButton, Snackbar, Typography } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import CloseIcon from "@mui/icons-material/Close";
import QRCode from "qrcode";
import { AppContext } from "../../contexts/AppContext";

const GameOnlineTools = () => {
  const { gameCode, onlineBackend, setGameCode, generateGameCode } = useContext(AppContext);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const joinUrl = gameCode
    ? `${window.location.origin}/gracz?code=${encodeURIComponent(gameCode)}&backend=${encodeURIComponent(onlineBackend)}`
    : "";

  useEffect(() => {
    let active = true;
    if (isQrOpen && joinUrl) {
      QRCode.toDataURL(joinUrl, { width: 280, margin: 2, errorCorrectionLevel: "M" })
        .then((dataUrl) => { if (active) setQrDataUrl(dataUrl); })
        .catch(() => { if (active) setQrDataUrl(""); });
    }
    return () => { active = false; };
  }, [isQrOpen, joinUrl]);

  const copyGameCode = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(gameCode);
      } else {
        const input = document.createElement("textarea");
        input.value = gameCode;
        input.setAttribute("readonly", "");
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        const copied = document.execCommand("copy");
        input.remove();
        if (!copied) throw new Error("copy failed");
      }
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 1800);
    } catch {
      setCopyError(true);
    }
  };

  if (!gameCode) return null;

  return (
    <>
      <div className="game-online-tools game-panel" aria-label="Połączenie online">
        <span className="game-online-tools__label">KOD GRY</span>
        <strong className="game-online-tools__code">{gameCode}</strong>
        <span className="game-online-tools__backend">{onlineBackend === "supabase" ? "SUPABASE" : "NTFY"}</span>
        <IconButton size="small" onClick={() => setIsQrOpen(true)} title="Pokaż kod QR" aria-label="Pokaż kod QR">
          <QrCode2Icon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={copyGameCode} title="Kopiuj kod" aria-label="Kopiuj kod gry">
          {isCopied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
        </IconButton>
        <IconButton size="small" onClick={generateGameCode} title="Zmień kod" aria-label="Zmień kod gry">
          <RefreshIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={() => setGameCode(null)} title="Wyłącz online" aria-label="Wyłącz grę online">
          <CloudOffIcon fontSize="small" />
        </IconButton>
      </div>

      <Dialog open={isQrOpen} onClose={() => setIsQrOpen(false)} aria-labelledby="game-online-qr-title" sx={{ zIndex: "var(--layer-dialog)" }}>
        <DialogTitle id="game-online-qr-title" sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          Dołącz do gry
          <IconButton onClick={() => setIsQrOpen(false)} aria-label="Zamknij kod QR" size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent className="game-qr-dialog">
          {qrDataUrl ? <img src={qrDataUrl} alt={`Kod QR dołączenia do gry ${gameCode}`} /> : <Typography role="status">Przygotowuję kod QR...</Typography>}
          <Typography variant="body2">Zeskanuj kod aparatem telefonu</Typography>
          <strong>{gameCode}</strong>
          <Typography variant="caption" className="game-qr-dialog__url">{joinUrl}</Typography>
        </DialogContent>
      </Dialog>

      <Snackbar open={copyError} autoHideDuration={3000} onClose={() => setCopyError(false)}>
        <Alert severity="error" variant="filled" onClose={() => setCopyError(false)}>Nie udało się skopiować kodu.</Alert>
      </Snackbar>
    </>
  );
};

export default GameOnlineTools;
