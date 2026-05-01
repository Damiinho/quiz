import { useContext, useRef, useState } from "react";
import { Button, Typography } from "@mui/material";
import { AppContext } from "../contexts/AppContext";
import { readQuizFile } from "../utils/quizStorage";
import { validateQuiz } from "../utils/quizValidation";

const ChooseType = () => {
  const { resetSavedGame, setEditingQuiz, setScreen } = useContext(AppContext);
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
      setScreen("createNew");
    } catch {
      setImportMessage("Nie udało się odczytać pliku JSON.");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <>
      <div className="menu-button">
        <button onClick={() => setScreen("readySet")}>Wybierz gotowy zestaw</button>
      </div>
      <div className="menu-button">
        <button onClick={() => setScreen("composeSet")}>Skomponuj zestaw</button>
      </div>
      <div className="menu-button">
        <button onClick={() => fileInputRef.current?.click()}>
          Wczytaj JSON do edycji
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleImport}
        style={{ display: "none" }}
      />
      <div style={{ width: "100%", textAlign: "center" }}>
        <Button variant="outlined" onClick={resetSavedGame}>
          Wyczyść zapisaną rozgrywkę
        </Button>
        {importMessage && (
          <Typography sx={{ mt: 2 }} variant="body1">
            {importMessage}
          </Typography>
        )}
      </div>
    </>
  );
};

export default ChooseType;
