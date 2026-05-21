import { useState, useContext, useRef, useEffect } from "react";
import { Typography, IconButton } from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import { AppContext } from "../../contexts/AppContext";
import PushPinIcon from "@mui/icons-material/PushPin";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import DownloadIcon from "@mui/icons-material/Download";
import { downloadJson } from "../../utils/quizStorage";

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
    const fileName = `quiz-state-${gameSettings.quiz.name}-${new Date().toLocaleDateString().replace(/\./g, '-')}.json`;
    downloadJson(state, fileName);
  };

  useEffect(() => {
    if (scrollRef.current && undoPointer !== -1) {
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

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: "20px",
        left: "380px",
        width: "280px",
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
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Typography variant="h6" sx={{ fontWeight: "800", fontSize: "16px", letterSpacing: "-0.5px" }}>LOGI</Typography>
          <div style={{ display: "flex", gap: "4px" }}>
            <IconButton 
              size="small" 
              onClick={(e) => { e.stopPropagation(); undoAction(); }}
              disabled={undoPointer < 0}
              sx={{ 
                color: undoPointer < 0 ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.5)", 
                "&:hover": { color: undoPointer < 0 ? "rgba(255,255,255,0.1)" : "#fff" },
                cursor: undoPointer < 0 ? "default" : "pointer"
              }}
            >
              <UndoIcon fontSize="small" />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={(e) => { e.stopPropagation(); redoAction(); }}
              disabled={undoPointer >= quizLog.length - 1}
              sx={{ 
                color: undoPointer >= quizLog.length - 1 ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.5)", 
                "&:hover": { color: undoPointer >= quizLog.length - 1 ? "rgba(255,255,255,0.1)" : "#fff" },
                cursor: undoPointer >= quizLog.length - 1 ? "default" : "pointer"
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
            title="Pobierz stan gry"
          >
            <DownloadIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); setIsLogsPinned(!isLogsPinned); }}
            sx={{ color: isLogsPinned ? "#2ecc71" : "rgba(255,255,255,0.5)" }}
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
            maxHeight: "400px", 
            overflowY: "auto", 
            display: "flex", 
            flexDirection: "column", 
            gap: "8px",
            paddingRight: "4px"
          }}
        >
          {quizLog.length === 0 && (
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.4)", textAlign: "center", py: 2 }}>
              Brak historii działań
            </Typography>
          )}
          {[...quizLog].reverse().map((log, revIdx) => {
            const originalIndex = quizLog.length - 1 - revIdx;
            const isCurrent = originalIndex === undoPointer;

            return (
              <div 
                key={log.id} 
                onClick={() => jumpToLogIndex(originalIndex)}
                style={{ 
                  padding: "8px 12px", 
                  borderRadius: "8px",
                  background: isCurrent ? "rgba(46, 204, 113, 0.2)" : (log.undone ? "transparent" : "rgba(0,0,0,0.2)"),
                  border: isCurrent ? "1px solid #2ecc71" : "1px solid rgba(255,255,255,0.05)",
                  fontSize: "11px",
                  opacity: log.undone ? 0.3 : 1,
                  filter: log.undone ? "grayscale(1)" : "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.4)", marginBottom: "4px" }}>
                  <span>{log.timestamp}</span>
                  <span style={{ fontWeight: "700", color: log.undone ? "inherit" : (log.type === "POINTS_CHANGE" ? "#2ecc71" : "#3b82f6") }}>
                    {log.type}
                  </span>
                </div>
                <div style={{ fontWeight: "500", color: "rgba(255,255,255,0.9)" }}>
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
