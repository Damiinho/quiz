import { useState, useContext, useRef, useEffect } from "react";
import { Typography, IconButton, Box } from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import { AppContext } from "../../contexts/AppContext";
import PushPinIcon from "@mui/icons-material/PushPin";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import DownloadIcon from "@mui/icons-material/Download";
import { downloadJson } from "../../utils/quizStorage";

const getActionBadge = (type) => {
  switch (type) {
    case "POINTS_CHANGE":
      return { label: "PUNKTY", color: "#2ecc71" };
    case "QUESTION_OPENED":
      return { label: "OTWARTO", color: "#3b82f6" };
    case "QUESTION_CLOSED":
      return { label: "ZAMKNIĘTO", color: "#94a3b8" };
    case "QUESTION_DONE":
      return { label: "ZAKOŃCZONO", color: "#10b981" };
    case "SHOW_ANSWER":
      return { label: "ODPOWIEDŹ", color: "#f59e0b" };
    case "PLAYER_ADDED":
      return { label: "NOWY GRACZ", color: "#06b6d4" };
    case "PLAYER_REMOVED":
      return { label: "USUNIĘTO", color: "#f43f5e" };
    case "WIEM_LEPIEJ":
      return { label: "WIEM LEPIEJ", color: "#a855f7" };
    case "AUCTION_BID":
      return { label: "LICYTACJA", color: "#eab308" };
    case "AUCTION_STAGE":
      return { label: "ETAP", color: "#f97316" };
    default:
      return { label: type || "AKCJA", color: "#64748b" };
  }
};

export const QuizLog = () => {
  const { 
    quizLog, 
    undoAction, 
    redoAction, 
    jumpToLogIndex, 
    undoPointer, 
    isLogsPinned, 
    setIsLogsPinned,
    getDownloadableState,
    gameSettings
  } = useContext(AppContext);

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const scrollRef = useRef(null);

  const handleDownloadState = (e) => {
    e.stopPropagation();
    const state = getDownloadableState();
    const fileName = `quiz-state-${gameSettings.quiz?.name || 'gra'}-${new Date().toLocaleDateString().replace(/\./g, '-')}.json`;
    downloadJson(state, fileName);
  };

  useEffect(() => {
    if (scrollRef.current && undoPointer !== -1 && quizLog.length > 0) {
      const activeAction = scrollRef.current.children[quizLog.length - 1 - undoPointer];
      if (activeAction) {
        activeAction.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [undoPointer, quizLog.length]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (isLogsPinned || !isOpen) return;
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("pointerdown", handleOutsideClick, true);
    return () => document.removeEventListener("pointerdown", handleOutsideClick, true);
  }, [isOpen, isLogsPinned]);

  const showContent = isOpen || isLogsPinned;
  const currentStep = undoPointer >= 0 ? undoPointer + 1 : 0;
  const totalSteps = quizLog.length;

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: "20px",
        left: "380px",
        width: "300px",
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        borderRadius: "16px",
        padding: "16px",
        zIndex: 9999,
        color: "#fff",
        transition: "all 0.3s ease"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Typography variant="h6" sx={{ fontWeight: "800", fontSize: "16px", letterSpacing: "-0.5px" }}>
            HISTORIA
          </Typography>
          {totalSteps > 0 && (
            <span style={{ 
              fontSize: "11px", 
              fontWeight: "800", 
              background: "rgba(255,255,255,0.1)", 
              padding: "2px 6px", 
              borderRadius: "6px",
              color: "rgba(255,255,255,0.7)" 
            }}>
              {currentStep}/{totalSteps}
            </span>
          )}
          <div style={{ display: "flex", gap: "2px", marginLeft: "4px" }}>
            <IconButton 
              size="small" 
              onClick={(e) => { e.stopPropagation(); undoAction(); }}
              disabled={undoPointer < 0}
              title="Cofnij (Ctrl+Z)"
              sx={{ 
                color: undoPointer < 0 ? "rgba(255,255,255,0.15)" : "#2ecc71", 
                "&:hover": { color: undoPointer < 0 ? "rgba(255,255,255,0.15)" : "#a7f3d0" },
                cursor: undoPointer < 0 ? "default" : "pointer",
                p: 0.5
              }}
            >
              <UndoIcon fontSize="small" />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={(e) => { e.stopPropagation(); redoAction(); }}
              disabled={undoPointer >= quizLog.length - 1}
              title="Ponów (Ctrl+Y)"
              sx={{ 
                color: undoPointer >= quizLog.length - 1 ? "rgba(255,255,255,0.15)" : "#3b82f6", 
                "&:hover": { color: undoPointer >= quizLog.length - 1 ? "rgba(255,255,255,0.15)" : "#93c5fd" },
                cursor: undoPointer >= quizLog.length - 1 ? "default" : "pointer",
                p: 0.5
              }}
            >
              <RedoIcon fontSize="small" />
            </IconButton>
          </div>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          <IconButton
            size="small"
            onClick={handleDownloadState}
            sx={{ color: "rgba(255,255,255,0.5)", "&:hover": { color: "#fff" } }}
            title="Pobierz stan gry (.json)"
          >
            <DownloadIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); setIsLogsPinned(!isLogsPinned); }}
            sx={{ color: isLogsPinned ? "#2ecc71" : "rgba(255,255,255,0.5)" }}
            title={isLogsPinned ? "Odepnij panel" : "Przypnij panel"}
          >
            {isLogsPinned ? <PushPinIcon fontSize="small" /> : <PushPinOutlinedIcon fontSize="small" />}
          </IconButton>
          <IconButton
            size="small"
            sx={{ color: "#fff" }}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
          >
            {showContent ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
          </IconButton>
        </div>
      </div>

      {showContent && (
        <div 
          ref={scrollRef}
          style={{ 
            marginTop: "16px", 
            maxHeight: "420px", 
            overflowY: "auto", 
            display: "flex", 
            flexDirection: "column", 
            gap: "8px",
            paddingRight: "4px"
          }}
        >
          {quizLog.length === 0 && (
            <Box sx={{ py: 3, px: 2, textAlign: "center" }}>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
                Brak akcji w bieżącej rozgrywce
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.25)", display: "block", mt: 0.5 }}>
                Otwórz kategorię lub zmień punkty, aby rozpocząć rejestrację historii.
              </Typography>
            </Box>
          )}
          {[...quizLog].reverse().map((log, revIdx) => {
            const originalIndex = quizLog.length - 1 - revIdx;
            const isCurrent = originalIndex === undoPointer;
            const isUndone = originalIndex > undoPointer;
            const badge = getActionBadge(log.type);

            return (
              <div 
                key={log.id || originalIndex} 
                onClick={() => jumpToLogIndex(originalIndex)}
                style={{ 
                  padding: "10px 12px", 
                  borderRadius: "10px",
                  background: isCurrent 
                    ? "rgba(46, 204, 113, 0.2)" 
                    : (isUndone ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.25)"),
                  border: isCurrent 
                    ? "2px solid #2ecc71" 
                    : (isUndone ? "1px dashed rgba(255,255,255,0.1)" : "1px solid rgba(255,255,255,0.06)"),
                  fontSize: "11px",
                  opacity: isUndone ? 0.35 : 1,
                  filter: isUndone ? "grayscale(0.8)" : "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: isCurrent ? "0 0 15px rgba(46, 204, 113, 0.2)" : "none"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px" }}>{log.timestamp}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {isCurrent && (
                      <span style={{ 
                        fontSize: "9px", 
                        fontWeight: "900", 
                        background: "#2ecc71", 
                        color: "#000", 
                        padding: "1px 5px", 
                        borderRadius: "4px",
                        letterSpacing: "0.5px"
                      }}>
                        TERAZ
                      </span>
                    )}
                    <span style={{ 
                      fontWeight: "800", 
                      fontSize: "10px",
                      color: isUndone ? "rgba(255,255,255,0.5)" : badge.color,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}>
                      {badge.label}
                    </span>
                  </div>
                </div>
                <div style={{ 
                  fontWeight: "600", 
                  color: isUndone ? "rgba(255,255,255,0.5)" : "#fff",
                  fontSize: "12px",
                  lineHeight: 1.3
                }}>
                  {log.description}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuizLog;
