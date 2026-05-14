import { useContext, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../contexts/AppContext";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import AddIcon from "@mui/icons-material/Add";

const ReadySet = () => {
  const navigate = useNavigate();
  const { quizList, startNewQuiz } = useContext(AppContext);
  const [tab, setTab] = useState("quizzes"); // "quizzes" lub "categories"

  const handleQuizSelect = (quiz) => {
    startNewQuiz(quiz);
    navigate("/gracze");
  };

  const getIcon = (index) => {
    const icons = ["📝", "🎂", "🎬", "🎮", "🧠", "🏆"];
    return icons[index % icons.length];
  };

  const getBgColor = (index) => {
    const colors = ["#2ecc71", "#a855f7", "#3b82f6", "#ef4444", "#eab308", "#6366f1"];
    return colors[index % colors.length];
  };

  const allCategories = useMemo(() => {
    const cats = [];
    quizList.forEach(quiz => {
        quiz.categories?.forEach(cat => {
            cats.push({ ...cat, quizName: quiz.name });
        });
    });
    return cats;
  }, [quizList]);

  return (
    <div style={{ width: "100%", maxWidth: "1200px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div style={{ display: "flex", gap: "24px" }}>
          <h2 
            onClick={() => setTab("quizzes")}
            style={{ 
                fontSize: "18px", 
                fontWeight: "700",
                cursor: "pointer",
                color: tab === "quizzes" ? "#2ecc71" : "rgba(255,255,255,0.4)",
                borderBottom: tab === "quizzes" ? "2px solid #2ecc71" : "none",
                paddingBottom: "8px",
                transition: "all 0.2s"
            }}
          >
            Quizy
          </h2>
          <h2 
            onClick={() => setTab("categories")}
            style={{ 
                fontSize: "18px", 
                fontWeight: "700",
                cursor: "pointer",
                color: tab === "categories" ? "#2ecc71" : "rgba(255,255,255,0.4)",
                borderBottom: tab === "categories" ? "2px solid #2ecc71" : "none",
                paddingBottom: "8px",
                transition: "all 0.2s"
            }}
          >
            Kategorie
          </h2>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ position: "relative" }}>
            <SearchIcon style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", fontSize: "18px" }} />
            <input 
              type="text" 
              placeholder={`Szukaj ${tab === "quizzes" ? 'quizów' : 'kategorii'}...`} 
              style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px", padding: "12px 12px 12px 40px", color: "#fff", width: "220px", fontSize: "13px" }}
            />
          </div>
          <button style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px", padding: "12px 16px", color: "#fff", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "11px", fontWeight: "700" }}>
            <FilterListIcon fontSize="small" /> FILTRUJ
          </button>
          {tab === "quizzes" && (
            <button style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px", padding: "12px 16px", color: "#fff", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "11px", fontWeight: "700" }}>
                <FileUploadIcon fontSize="small" /> WCZYTAJ Z PLIKU
            </button>
          )}
          <button style={{ background: "#2ecc71", border: "none", borderRadius: "10px", padding: "12px 20px", color: "#000", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "11px" }}>
            <AddIcon fontSize="small" /> DODAJ {tab === "quizzes" ? 'QUIZ' : 'KATEGORIĘ'}
          </button>
        </div>
      </div>

      <div className="quiz-grid">
        {tab === "quizzes" ? (
            quizList.map((quiz, index) => (
            <div key={index} className="quiz-card" onClick={() => handleQuizSelect(quiz)}>
                <div className="quiz-card__dots">
                <MoreVertIcon fontSize="small" />
                </div>
                <div className="quiz-card__icon" style={{ background: getBgColor(index) }}>
                {getIcon(index)}
                </div>
                <h3 className="quiz-card__title">{quiz.name}</h3>
                <p className="quiz-card__info">
                {quiz.categories?.length || 0} kategorie • {quiz.categories?.reduce((acc, cat) => acc + (cat.list?.length || 0), 0)} pytań
                </p>
            </div>
            ))
        ) : (
            allCategories.map((category, index) => (
                <div key={index} className="quiz-card">
                   <div className="quiz-card__dots">
                    <MoreVertIcon fontSize="small" />
                    </div>
                    <div className="quiz-card__icon" style={{ background: getBgColor(index + 2) }}>
                        {getIcon(index + 2)}
                    </div>
                    <h3 className="quiz-card__title">{category.name}</h3>
                    <p className="quiz-card__info">
                        {category.list?.length || 0} pytań • {category.quizName}
                    </p>
                </div>
            ))
        )}
      </div>

      {/* Paginacja (uproszczona) */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: "40px", gap: "8px" }}>
          {[1, 2, 3].map(n => (
              <button key={n} style={{ width: "32px", height: "32px", borderRadius: "6px", background: n === 1 ? "#2ecc71" : "rgba(255,255,255,0.05)", border: "none", color: n === 1 ? "#000" : "#fff", fontWeight: "700", cursor: "pointer", fontSize: "12px" }}>
                  {n}
              </button>
          ))}
          <span style={{ color: "rgba(255,255,255,0.2)" }}>...</span>
          <button style={{ width: "32px", height: "32px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "none", color: "#fff", fontWeight: "700", cursor: "pointer", fontSize: "12px" }}>
              8
          </button>
      </div>
    </div>
  );
};

export default ReadySet;
