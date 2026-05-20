import { useContext, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Typography } from "@mui/material";
import { AppContext } from "../contexts/AppContext";
import { readQuizFile } from "../utils/quizStorage";
import { validateQuiz } from "../utils/quizValidation";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AddIcon from "@mui/icons-material/Add";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";

const CreateMenu = () => {
  const navigate = useNavigate();
  const { setEditingQuiz } = useContext(AppContext);
  const [importMessage, setImportMessage] = useState("");
  const fileInputRef = useRef(null);

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const quiz = await readQuizFile(file);
      const issues = validateQuiz(quiz);

      if (issues.length > 0) {
        setImportMessage(`Błąd: ${issues[0]}`);
        return;
      }

      setEditingQuiz({ index: null, quiz });
      navigate("/stworz");
    } catch {
      setImportMessage("Nie udało się odczytać pliku JSON.");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="choice-screen">
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 style={{ fontSize: "3rem", fontWeight: "900", textTransform: "uppercase", letterSpacing: "-2px" }}>KREATOR</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontWeight: "600" }}>Wybierz jak chcesz przygotować swój quiz</p>
      </div>

      <button className="choice-screen__btn" onClick={() => { setEditingQuiz(null); navigate("/stworz"); }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ background: 'rgba(46, 204, 113, 0.2)', padding: '12px', borderRadius: '12px', color: '#2ecc71' }}>
                <AddIcon />
            </div>
            <span>Stwórz nowy</span>
        </div>
        <ChevronRightIcon />
      </button>

      <button className="choice-screen__btn" onClick={() => navigate("/zloz")}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '12px', borderRadius: '12px', color: '#3b82f6' }}>
                <AutoFixHighIcon />
            </div>
            <span>Skomponuj z gotowych pytań</span>
        </div>
        <ChevronRightIcon />
      </button>

      <button className="choice-screen__btn" onClick={() => fileInputRef.current?.click()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ background: 'rgba(168, 85, 247, 0.2)', padding: '12px', borderRadius: '12px', color: '#a855f7' }}>
                <FileUploadIcon />
            </div>
            <span>Wczytaj plik JSON</span>
        </div>
        <ChevronRightIcon />
      </button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleImport}
        style={{ display: "none" }}
      />

      {importMessage && (
        <Typography sx={{ mt: 3, color: "#ef4444", textAlign: "center", fontWeight: "700" }}>
          {importMessage}
        </Typography>
      )}

      <div style={{ marginTop: "40px", textAlign: "center" }}>
        <button 
          onClick={() => navigate("/")}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "14px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}
        >
          Wróć do menu
        </button>
      </div>
    </div>
  );
};

export default CreateMenu;
