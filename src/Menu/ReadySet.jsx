import { useContext, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../contexts/AppContext";
import SearchIcon from "@mui/icons-material/Search";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import AddIcon from "@mui/icons-material/Add";
import { MenuItem, IconButton, Select, Modal, Box, Typography, Paper } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

const ReadySet = () => {
  const navigate = useNavigate();
  const { 
    quizList, 
    startNewQuiz, 
    setEditingQuiz, 
    customQuizzes, 
    removeCustomQuiz, 
    addCustomQuiz, 
    updateCustomQuiz, 
    gameSettings, 
    resetSavedGame,
    loadDownloadedState
  } = useContext(AppContext);
  const [tab, setTab] = useState("quizzes"); 
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState(null);
  const [selectedQuizDetail, setSelectedQuizDetail] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  
  const fileInputRef = useRef(null);

  const hasSavedGame = gameSettings?.quiz?.name && gameSettings?.players?.length > 0;

  const handleQuizSelect = (quiz) => {
    setSelectedQuizDetail(quiz);
  };

  const handleStartGame = (quiz) => {
    startNewQuiz(quiz);
    navigate("/gracze");
  };

  const handleEditQuiz = (quiz) => {
    const targetQuiz = quiz || selectedQuizDetail;
    if (targetQuiz) {
      const customIndex = customQuizzes.findIndex(q => q.name === targetQuiz.name);
      setEditingQuiz({ quiz: targetQuiz, index: customIndex >= 0 ? customIndex : null });
      navigate("/stworz");
    }
  };

  const handleCreateQuiz = () => {
    setEditingQuiz(null);
    navigate("/stworz");
  };

  const handleDeleteQuiz = (quiz) => {
    const targetQuiz = quiz || selectedQuizDetail;
    if (targetQuiz) {
      if (window.confirm(`Czy na pewno chcesz usunąć quiz "${targetQuiz.name}"?`)) {
        removeCustomQuiz(targetQuiz.name);
        setSelectedQuizDetail(null);
      }
    }
  };

  const handleDownloadQuiz = (quiz) => {
    const targetQuiz = quiz || selectedQuizDetail;
    if (targetQuiz) {
      import("../utils/quizStorage").then(m => m.downloadJson(targetQuiz, `${targetQuiz.name}.json`));
    }
  };

  const handleSaveQuestionEdit = (updatedQuestion) => {
    if (!selectedCategoryDetail) return;
    
    const parentQuiz = selectedCategoryDetail.parentQuiz;
    const questionToSave = selectedCategoryDetail.type === "forehead"
        ? { ...updatedQuestion, question: "", answers: undefined }
        : updatedQuestion;
    const updatedCategories = parentQuiz.categories.map(cat => {
        if (cat.name !== selectedCategoryDetail.name) return cat;
        return {
            ...cat,
            list: cat.list.map((q, index) => index === editingQuestionIndex ? questionToSave : q)
        };
    });

    const updatedQuiz = { ...parentQuiz, categories: updatedCategories };
    const customIndex = customQuizzes.findIndex(q => q.name === parentQuiz.name);
    
    if (customIndex >= 0) {
        updateCustomQuiz(customIndex, updatedQuiz);
    } else {
        addCustomQuiz(updatedQuiz);
    }

    setSelectedCategoryDetail(prev => ({
        ...prev,
        list: prev.list.map((q, index) => index === editingQuestionIndex ? questionToSave : q),
        parentQuiz: updatedQuiz
    }));
    setEditingQuestion(null);
    setEditingQuestionIndex(null);
  };

  const getCorrectAnswerValue = (question) => (
    Array.isArray(question.correctAnswer) ? question.correctAnswer[0] || "" : question.correctAnswer || ""
  );

  const getCorrectAnswerIndex = (question) => {
    if (!Array.isArray(question.answers)) return -1;
    return question.answers.findIndex(answer => answer === getCorrectAnswerValue(question));
  };

  const updateEditingAnswer = (answerIndex, value) => {
    setEditingQuestion(prev => {
      const answers = [...(prev.answers || [])];
      const previousValue = answers[answerIndex];
      answers[answerIndex] = value;
      const nextQuestion = { ...prev, answers };

      if (getCorrectAnswerValue(prev) === previousValue) {
        nextQuestion.correctAnswer = [value];
      }

      return nextQuestion;
    });
  };

  const removeEditingAnswer = (answerIndex) => {
    setEditingQuestion(prev => {
      const removedValue = prev.answers?.[answerIndex];
      const answers = (prev.answers || []).filter((_, index) => index !== answerIndex);
      const nextQuestion = { ...prev, answers };

      if (getCorrectAnswerValue(prev) === removedValue) {
        nextQuestion.correctAnswer = [answers[0] || ""];
      }

      return nextQuestion;
    });
  };

  const addEditingAnswer = () => {
    setEditingQuestion(prev => ({
      ...prev,
      answers: [...(prev.answers || []), ""]
    }));
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    import("../utils/quizStorage").then(m => {
        m.readQuizFile(file).then(data => {
            if (data.quizLog && data.gameSettings) {
                loadDownloadedState(data);
                alert(`Pomyślnie wczytano stan rozgrywki dla: ${data.gameSettings.quiz.name}`);
            } else if (data.categories) {
                addCustomQuiz(data);
                alert(`Pomyślnie zaimportowano quiz: ${data.name}`);
            } else {
                alert("Nieprawidłowy format pliku JSON.");
            }
        }).catch(err => alert("Błąd podczas wczytywania pliku: " + err.message));
    });
    // Reset input value to allow uploading same file again
    event.target.value = '';
  };

  const getIcon = (index) => {
    const icons = ["📝", "🎂", "🎬", "🎮", "🧠", "🏆"];
    return icons[index % icons.length];
  };

  const getBgColor = (index) => {
    const colors = ["#2ecc71", "#a855f7", "#3b82f6", "#ef4444", "#eab308", "#6366f1"];
    return colors[index % colors.length];
  };

  const filteredQuizzes = useMemo(() => {
    return quizList.filter(q => {
        const matchesSearch = q.name.toLowerCase().includes(searchTerm.toLowerCase());
        const isCustom = customQuizzes.some(cq => cq.name === q.name);
        if (filterType === "custom") return matchesSearch && isCustom;
        if (filterType === "default") return matchesSearch && !isCustom;
        return matchesSearch;
    });
  }, [quizList, searchTerm, filterType, customQuizzes]);

  const filteredCategories = useMemo(() => {
    const cats = [];
    quizList.forEach(quiz => {
        quiz.categories?.forEach(cat => {
            if (cat.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                cats.push({ ...cat, quizName: quiz.name, parentQuiz: quiz });
            }
        });
    });
    return cats;
  }, [quizList, searchTerm]);

  return (
    <div style={{ width: "100%", maxWidth: "1200px" }}>
      {hasSavedGame && (
        <div style={{ 
          background: "rgba(46, 204, 113, 0.05)", 
          border: "1px solid rgba(46, 204, 113, 0.15)", 
          borderRadius: "24px", 
          padding: "20px 30px", 
          marginBottom: "48px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backdropFilter: "blur(15px)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)"
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ background: 'rgba(46, 204, 113, 0.2)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2ecc71' }}>
                <PlayArrowIcon />
            </div>
            <div style={{ textAlign: 'left' }}>
                <Typography variant="subtitle2" fontWeight="900" sx={{ color: "#2ecc71", textTransform: "uppercase", letterSpacing: "1px", mb: 0.2 }}>MASZ ROZPOCZĘTĄ GRĘ</Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontWeight: "700" }}>{gameSettings.quiz.name.toUpperCase()}</Typography>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button 
              onClick={() => navigate("/gra")}
              style={{ background: "#2ecc71", color: "#000", border: "none", padding: "10px 30px", borderRadius: "10px", fontWeight: "800", cursor: "pointer", fontSize: "13px", transition: 'all 0.2s' }}
            >
              KONTYNUUJ
            </button>
            <button 
              onClick={() => { if(window.confirm("Czy na pewno chcesz wyczyścić zapisaną grę?")) resetSavedGame(); }}
              style={{ background: "rgba(255, 255, 255, 0.05)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255, 255, 255, 0.1)", padding: "10px 20px", borderRadius: "10px", fontWeight: "700", cursor: "pointer", fontSize: "12px" }}
            >
              WYCZYŚĆ
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <div style={{ display: "flex", gap: "24px" }}>
          <h2 
            onClick={() => { setTab("quizzes"); setSearchTerm(""); }}
            style={{ 
                fontSize: "1.125rem", 
                fontWeight: "700",
                cursor: "pointer",
                color: tab === "quizzes" ? "#2ecc71" : "rgba(255,255,255,0.4)",
                borderBottom: tab === "quizzes" ? "2px solid #2ecc71" : "none",
                paddingBottom: "0.5rem",
                transition: "all 0.2s"
            }}
          >
            Quizy
          </h2>
          <h2 
            onClick={() => { setTab("categories"); setSearchTerm(""); }}
            style={{ 
                fontSize: "1.125rem", 
                fontWeight: "700",
                cursor: "pointer",
                color: tab === "categories" ? "#2ecc71" : "rgba(255,255,255,0.4)",
                borderBottom: tab === "categories" ? "2px solid #2ecc71" : "none",
                paddingBottom: "0.5rem",
                transition: "all 0.2s"
            }}
          >
            Kategorie
          </h2>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <SearchIcon style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", fontSize: "1.125rem" }} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Szukaj ${tab === "quizzes" ? 'quizów' : 'kategorii'}...`} 
              style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px", padding: "12px 12px 12px 40px", color: "#fff", width: "220px", fontSize: "0.8125rem" }}
            />
          </div>
          
          {tab === "quizzes" && (
            <Select
              size="small"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              sx={{ 
                background: "#1e293b", 
                color: "#fff", 
                fontSize: "0.7rem", 
                borderRadius: "10px",
                '& .MuiSelect-select': { py: 1.5 },
                '& fieldset': { borderColor: 'rgba(255,255,255,0.05)' }
              }}
            >
                <MenuItem value="all">WSZYSTKIE</MenuItem>
                <MenuItem value="default">GOTOWE</MenuItem>
                <MenuItem value="custom">MOJE</MenuItem>
            </Select>
          )}

          {tab === "quizzes" && (
            <>
                <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileUpload} accept=".json" />
                <button onClick={() => fileInputRef.current.click()} style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px", padding: "12px 16px", color: "#fff", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.6875rem", fontWeight: "700" }}>
                    <FileUploadIcon fontSize="small" /> WCZYTAJ ROZPOCZĘTĄ ROZGRYWKĘ
                </button>
                <button onClick={() => fileInputRef.current.click()} style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px", padding: "12px 16px", color: "#fff", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.6875rem", fontWeight: "700" }}>
                    <FileUploadIcon fontSize="small" /> WCZYTAJ ZESTAW
                </button>
            </>
          )}
          <button onClick={handleCreateQuiz} style={{ background: "#2ecc71", border: "none", borderRadius: "10px", padding: "12px 20px", color: "#000", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.6875rem" }}>
            <AddIcon fontSize="small" /> DODAJ
          </button>
        </div>
      </div>

      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", marginBottom: "24px", fontWeight: "600" }}>
        Kliknij w kartę, aby podejrzeć szczegóły, edytować lub rozpocząć grę.
      </div>

      <div className="quiz-grid">
        {tab === "quizzes" ? (
            filteredQuizzes.map((quiz, index) => (
            <div key={index} className="quiz-card" onClick={() => handleQuizSelect(quiz)}>
                {quiz.image ? (
                  <div className="quiz-card__icon" style={{ padding: 0, overflow: 'hidden' }}>
                    <img src={quiz.image} alt={quiz.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div className="quiz-card__icon" style={{ background: getBgColor(index) }}>
                    {getIcon(index)}
                  </div>
                )}
                <h3 className="quiz-card__title">{quiz.name}</h3>
                <p className="quiz-card__info">
                {quiz.categories?.length || 0} kategorie • {quiz.categories?.reduce((acc, cat) => acc + (cat.list?.length || 0), 0)} pytań
                </p>
            </div>
            ))
        ) : (
            filteredCategories.map((category, index) => (
                <div key={index} className="quiz-card" onClick={() => setSelectedCategoryDetail(category)}>
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

      {/* Quiz Detail Modal */}
      <Modal
        open={!!selectedQuizDetail}
        onClose={() => setSelectedQuizDetail(null)}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}
      >
        <Paper sx={{ width: '100%', maxWidth: '600px', p: 4, textAlign: 'center' }}>
            <Typography variant="h4" fontWeight="800" gutterBottom>{selectedQuizDetail?.name}</Typography>
            <Typography color="rgba(255,255,255,0.5)" sx={{ mb: 4 }}>
                {selectedQuizDetail?.categories?.length || 0} kategorie • {selectedQuizDetail?.categories?.reduce((acc, cat) => acc + (cat.list?.length || 0), 0)} pytań
            </Typography>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button 
                    onClick={() => handleStartGame(selectedQuizDetail)}
                    className="hero__main-btn"
                    style={{ width: '100%', gridColumn: 'span 2', margin: '0 0 12px 0' }}
                >
                    ROZPOCZNIJ GRĘ
                </button>
                <button 
                    onClick={() => handleEditQuiz(selectedQuizDetail)}
                    className="editor-view__btn editor-view__btn--outline"
                >
                    <EditIcon fontSize="small" /> EDYTUJ QUIZ
                </button>
                <button 
                    onClick={() => handleDownloadQuiz(selectedQuizDetail)}
                    className="editor-view__btn editor-view__btn--outline"
                >
                    <FileUploadIcon fontSize="small" sx={{ transform: 'rotate(180deg)' }} /> POBIERZ JSON
                </button>
                {customQuizzes.some(q => q.name === selectedQuizDetail?.name) && (
                    <button 
                        onClick={() => handleDeleteQuiz(selectedQuizDetail)}
                        className="editor-view__btn"
                        style={{ gridColumn: 'span 2', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                    >
                        <DeleteIcon fontSize="small" /> USUŃ QUIZ
                    </button>
                )}
            </div>
        </Paper>
      </Modal>

      {/* Category Detail Modal */}
      <Modal
        open={!!selectedCategoryDetail}
        onClose={() => { setSelectedCategoryDetail(null); setEditingQuestion(null); setEditingQuestionIndex(null); }}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}
      >
        <Paper sx={{ width: '100%', maxWidth: '800px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', p: 0 }}>
            <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h5" fontWeight="800">{selectedCategoryDetail?.name}</Typography>
                    <Typography variant="caption" color="rgba(255,255,255,0.5)">Quiz: {selectedCategoryDetail?.quizName}</Typography>
                </Box>
                <IconButton onClick={() => { setSelectedCategoryDetail(null); setEditingQuestion(null); setEditingQuestionIndex(null); }} sx={{ color: '#fff' }}><CloseIcon /></IconButton>
            </Box>
            <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
                {editingQuestion ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <Typography variant="h6" fontWeight="700">Edytuj pytanie #{editingQuestion.no}</Typography>
                        {selectedCategoryDetail?.type !== "forehead" && (
                        <div className="editor-view__input-group">
                            <label>Treść pytania</label>
                            <textarea 
                                rows={3} 
                                value={editingQuestion.question} 
                                onChange={e => setEditingQuestion({...editingQuestion, question: e.target.value})}
                            />
                        </div>
                        )}
                        {(selectedCategoryDetail?.type === "forehead" || !Array.isArray(editingQuestion.answers)) && (
                        <div className="editor-view__input-group">
                            <label>Poprawna odpowiedź</label>
                            <input 
                                value={Array.isArray(editingQuestion.correctAnswer) ? editingQuestion.correctAnswer[0] : editingQuestion.correctAnswer} 
                                onChange={e => setEditingQuestion({...editingQuestion, correctAnswer: [e.target.value]})}
                            />
                        </div>
                        )}
                        {selectedCategoryDetail?.type === "forehead" && (
                            <div className="editor-view__input-group">
                                <label>Obrazek</label>
                                <input
                                    value={editingQuestion.image || ""}
                                    onChange={e => setEditingQuestion({...editingQuestion, image: e.target.value})}
                                    placeholder="images/... lub https://..."
                                />
                            </div>
                        )}
                        {selectedCategoryDetail?.type === "auction" && (
                            <div className="editor-view__input-group">
                                <label>Czas licytacji (sekundy)</label>
                                <input
                                    type="number"
                                    min="5"
                                    step="5"
                                    value={editingQuestion.timerSeconds || 30}
                                    onChange={e => setEditingQuestion({...editingQuestion, timerSeconds: Math.max(5, Number(e.target.value) || 30)})}
                                />
                            </div>
                        )}
                        {selectedCategoryDetail?.type !== "forehead" && Array.isArray(editingQuestion.answers) && (
                            <div className="editor-view__input-group">
                                <label>Warianty odpowiedzi</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {editingQuestion.answers.map((answer, answerIndex) => (
                                        <div key={answerIndex} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <input
                                                type="radio"
                                                name="category-question-correct-answer"
                                                checked={getCorrectAnswerIndex(editingQuestion) === answerIndex}
                                                onChange={() => setEditingQuestion({ ...editingQuestion, correctAnswer: [answer] })}
                                                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#2ecc71' }}
                                            />
                                            <input
                                                value={answer}
                                                onChange={e => updateEditingAnswer(answerIndex, e.target.value)}
                                                placeholder={`Wariant ${String.fromCharCode(65 + answerIndex)}`}
                                                style={{ flex: 1 }}
                                            />
                                            {editingQuestion.answers.length > 2 && (
                                                <IconButton onClick={() => removeEditingAnswer(answerIndex)} size="small" sx={{ color: '#ef4444' }}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        className="editor-view__btn editor-view__btn--outline"
                                        onClick={addEditingAnswer}
                                        style={{ width: 'fit-content', height: '40px', padding: '0 16px' }}
                                    >
                                        <AddIcon fontSize="small" /> DODAJ WARIANT
                                    </button>
                                </div>
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="editor-view__btn" onClick={() => handleSaveQuestionEdit(editingQuestion)}>ZAPISZ ZMIANY</button>
                            <button className="editor-view__btn editor-view__btn--secondary" onClick={() => { setEditingQuestion(null); setEditingQuestionIndex(null); }}>ANULUJ</button>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {selectedCategoryDetail?.list?.map((q, i) => (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ flex: 1 }}>
                                    <Typography variant="body1" fontWeight="600">{q.question || `Pytanie ${i + 1}`}</Typography>
                                    {Array.isArray(q.answers) && q.answers.length > 0 && (
                                        <Typography variant="caption" color="rgba(255,255,255,0.45)">
                                            {q.answers.length} warianty odpowiedzi
                                        </Typography>
                                    )}
                                </div>
                                <IconButton onClick={() => { setEditingQuestion(q); setEditingQuestionIndex(i); }} sx={{ color: '#2ecc71', background: 'rgba(46, 204, 113, 0.1)', '&:hover': { background: 'rgba(46, 204, 113, 0.2)' } }}>
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </div>
                        ))}
                    </div>
                )}
            </Box>
        </Paper>
      </Modal>
    </div>
  );
};

export default ReadySet;
