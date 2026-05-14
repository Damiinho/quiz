import { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../contexts/AppContext";
import { makeSerializableQuiz } from "../utils/quizStorage";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";

const ComposeSet = () => {
  const navigate = useNavigate();
  const { quizList, setEditingQuiz } = useContext(AppContext);
  const [quizName, setQuizName] = useState("Skomponowany zestaw");
  const [selectedKeys, setSelectedKeys] = useState([]);

  const categoryOptions = useMemo(
    () =>
      quizList.flatMap((quiz, quizIndex) =>
        (quiz.categories || []).map((category, categoryIndex) => ({
          key: `${quizIndex}-${categoryIndex}`,
          quizName: quiz.name,
          category,
        }))
      ),
    [quizList]
  );

  const toggleCategory = (key) => {
    setSelectedKeys((prevKeys) =>
      prevKeys.includes(key)
        ? prevKeys.filter((currentKey) => currentKey !== key)
        : [...prevKeys, key]
    );
  };

  const handleCompose = () => {
    const selectedCategories = categoryOptions
      .filter((option) => selectedKeys.includes(option.key))
      .map((option) => {
        const category = makeSerializableQuiz({
          name: "temp",
          categories: [option.category],
        }).categories[0];

        return {
          ...category,
          name: `${category.name} (${option.quizName})`,
          list: category.list?.map((question, index) => ({
            ...question,
            no: index + 1,
            done: false,
          })),
        };
      });

    setEditingQuiz({
      index: null,
      quiz: {
        name: quizName.trim() || "Skomponowany zestaw",
        categories: selectedCategories,
      },
    });
    navigate("/stworz");
  };

  return (
    <div className="players-view" style={{ maxWidth: "800px" }}>
      <div className="players-view__header">
        <h2>Skomponuj zestaw</h2>
      </div>

      <div className="players-view__input-row" style={{ marginBottom: "32px" }}>
        <input
          type="text"
          placeholder="Nazwa nowego zestawu"
          value={quizName}
          onChange={(event) => setQuizName(event.target.value)}
        />
      </div>

      <div style={{ marginBottom: "16px", fontSize: "14px", color: "rgba(255,255,255,0.5)", fontWeight: "600" }}>
        Wybierz kategorie z biblioteki
      </div>

      <div className="players-view__list" style={{ maxHeight: "400px", overflowY: "auto", paddingRight: "8px" }}>
        {categoryOptions.map((option) => (
          <div 
            key={option.key} 
            className="players-view__item" 
            onClick={() => toggleCategory(option.key)}
            style={{ 
                cursor: "pointer", 
                border: selectedKeys.includes(option.key) ? "1px solid #2ecc71" : "1px solid transparent",
                background: selectedKeys.includes(option.key) ? "rgba(46, 204, 113, 0.05)" : "rgba(0,0,0,0.1)"
            }}
          >
            <div className="players-view__item-info">
              <div className="players-view__item-avatar" style={{ background: "#3b82f6", fontSize: "14px" }}>
                {option.category.type?.charAt(0).toUpperCase() || 'S'}
              </div>
              <div>
                <div className="players-view__item-name">{option.category.name}</div>
                <div className="players-view__item-score">{option.quizName} • {option.category.list?.length || 0} pytań</div>
              </div>
            </div>
            <div style={{ color: selectedKeys.includes(option.key) ? "#2ecc71" : "rgba(255,255,255,0.1)" }}>
               {selectedKeys.includes(option.key) ? "WYBRANO" : "WYBIERZ"}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "32px", display: "flex", gap: "12px" }}>
        <button 
          onClick={() => navigate("/wybor")}
          style={{ flex: 1, background: "rgba(255,255,255,0.05)", color: "#fff", border: "none", padding: "16px", borderRadius: "12px", fontWeight: "700", cursor: "pointer" }}
        >
          <ChevronLeftIcon style={{ verticalAlign: "middle" }} /> WSTECZ
        </button>
        <button
          disabled={selectedKeys.length === 0}
          onClick={handleCompose}
          style={{ 
            flex: 2, 
            background: selectedKeys.length === 0 ? "rgba(255,255,255,0.1)" : "#2ecc71", 
            color: selectedKeys.length === 0 ? "rgba(255,255,255,0.3)" : "#000", 
            border: "none", 
            padding: "16px", 
            borderRadius: "12px", 
            fontWeight: "700", 
            cursor: selectedKeys.length === 0 ? "not-allowed" : "pointer" 
          }}
        >
          UTWÓRZ ZESTAW ({selectedKeys.length})
        </button>
      </div>
    </div>
  );
};

export default ComposeSet;
