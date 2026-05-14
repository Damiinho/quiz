import { useContext, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Typography } from "@mui/material";
import { AppContext } from "../contexts/AppContext";
import { readQuizFile } from "../utils/quizStorage";
import { validateQuiz } from "../utils/quizValidation";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

const ChooseType = () => {
  const navigate = useNavigate();
  const { resetSavedGame, setEditingQuiz } = useContext(AppContext);
  const [importMessage, setImportMessage] = useState("");
  const fileInputRef = useRef(null);

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const quiz = await readQuizFile(file);
      const issues = validateQuiz(quiz);

      if (issues.length > 0) {
        setImportMessage(`Nie wczytano quizu: ${issues[0]}`);
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
      <button className="choice-screen__btn" onClick={() => navigate("/kategorie")}>
        Wybierz gotowy zestaw <ChevronRightIcon />
      </button>
      <button className="choice-screen__btn" onClick={() => navigate("/zloz")}>
        Skomponuj zestaw <ChevronRightIcon />
      </button>
      <button className="choice-screen__btn" onClick={() => fileInputRef.current?.click()}>
        Wczytaj JSON do edycji <ChevronRightIcon />
      </button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleImport}
        style={{ display: "none" }}
      />

      <div style={{ marginTop: "40px", textAlign: "center" }}>
        <button 
          onClick={() => {
            resetSavedGame();
            navigate("/");
          }}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "12px", textDecoration: "underline" }}
        >
          Wyczyść zapisaną rozgrywkę
        </button>
        {importMessage && (
          <Typography sx={{ mt: 2, color: "#ef4444" }} variant="body2">
            {importMessage}
          </Typography>
        )}
      </div>
    </div>
  );
};

export default ChooseType;
