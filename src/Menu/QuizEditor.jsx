import { useContext, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { IconButton, Modal, Box, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { AppContext } from "../contexts/AppContext";
import { downloadJson, makeSerializableQuiz } from "../utils/quizStorage";
import Question from "./Game/Question";

const categoryTypes = [
  { value: "standard", label: "Standard" },
  { value: "illustrated", label: "Obrazek" },
  { value: "forehead", label: "Czółko" },
  { value: "auction", label: "Licytacja" },
  { value: "duel", label: "Pojedynek" },
  { value: "album", label: "Album" },
];

const emptyQuestionForm = {
  question: "",
  answerMode: "choices",
  answers: ["", "", "", ""],
  correctAnswerIndex: 0,
  correctAnswer: "",
  image: "",
  sound: "",
  images: "",
  timerSeconds: 30,
};

const getFilledAnswers = (answers = []) => answers.filter(answer => answer.trim());

const stringToHslColor = (str, s = 70, l = 60) => {
  let hash = 0;
  if (!str) return "hsl(0, 0%, 50%)";
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, ${s}%, ${l}%)`;
};

const QuizEditor = ({ initialQuiz, editingIndex, title }) => {
  const navigate = useNavigate();
  const { addCustomQuiz, updateCustomQuiz, setEditingQuiz } = useContext(AppContext);
  const [activeStep, setActiveStep] = useState(0); 
  const [quizName, setQuizName] = useState(initialQuiz?.name || "Nowy quiz");
  const [randomizeQuestions, setRandomizeQuestions] = useState(initialQuiz?.randomizeQuestions || false);
  const [categories, setCategories] = useState(
    () => initialQuiz?.categories?.map(category => ({ type: "standard", ...category })) || []
  );
  const [categoryForm, setCategoryForm] = useState({ name: "", type: "standard" });
  const [editingCategoryIndex, setEditingCategoryIndex] = useState(null);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [questionForm, setQuestionForm] = useState(emptyQuestionForm);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  const [quizImage, setQuizImage] = useState(initialQuiz?.image || null);
  const [isLivePreviewOpen, setIsLivePreviewOpen] = useState(false);
  
  const fileInputRef = useRef(null);
  const steps = ["1. Informacje", "2. Kategorie", "3. Pytania", "4. Podgląd"];

  const selectedCategory = categories[selectedCategoryIndex];
  const selectedType = selectedCategory?.type || "standard";

  const handleDeleteCategory = (index) => {
    setCategories(prev => {
        const newList = prev.filter((_, idx) => idx !== index);
        if (selectedCategoryIndex >= newList.length) {
            setSelectedCategoryIndex(Math.max(0, newList.length - 1));
        }
        return newList;
    });
  };

  const previewQuestion = useMemo(() => {
    const q = { ...questionForm, no: 99, done: false };
    if (selectedType === "album") {
      q.images = typeof questionForm.images === 'string' ? questionForm.images.split('\n').filter(s => s.trim()) : [];
    }
    if (questionForm.answerMode === "choices" && (selectedType === "standard" || selectedType === "illustrated")) {
      const filledAnswers = getFilledAnswers(questionForm.answers);
      q.answers = filledAnswers;
      q.correctAnswer = [questionForm.answers[questionForm.correctAnswerIndex] || filledAnswers[0] || ""];
    } else {
      delete q.answers;
      q.correctAnswer = [questionForm.correctAnswer];
    }
    return q;
  }, [questionForm, selectedType]);

  const draftQuiz = useMemo(() => ({
    ...makeSerializableQuiz({ name: quizName.trim(), categories }),
    image: quizImage,
    randomizeQuestions
  }), [categories, quizName, quizImage, randomizeQuestions]);

  const handleSaveCategory = () => {
    if (!categoryForm.name.trim()) return;
    const newCategory = {
      type: "standard",
      ...categoryForm,
      list: editingCategoryIndex !== null ? categories[editingCategoryIndex].list : []
    };
    if (editingCategoryIndex !== null) {
      setCategories(prev => prev.map((c, i) => i === editingCategoryIndex ? newCategory : c));
      setEditingCategoryIndex(null);
    } else {
      setCategories(prev => [...prev, newCategory]);
    }
    setCategoryForm({ name: "", type: "standard" });
  };

  const handleSaveQuestion = () => {
    if (selectedCategoryIndex === null || !selectedCategory) return;
    
    const newQuestion = { 
        ...questionForm, 
        no: editingQuestionIndex !== null ? selectedCategory.list[editingQuestionIndex].no : selectedCategory.list.length + 1 
    };

    if (selectedType === "album") {
        newQuestion.images = typeof questionForm.images === 'string' ? questionForm.images.split('\n').filter(s => s.trim()) : [];
    }

    if (selectedType === "forehead") {
        newQuestion.question = "";
    }
    if (selectedType !== "auction") {
        delete newQuestion.timerSeconds;
    }

    if (questionForm.answerMode === "choices" && (selectedType === "standard" || selectedType === "illustrated")) {
        const filledAnswers = getFilledAnswers(questionForm.answers);
        newQuestion.answers = filledAnswers;
        newQuestion.correctAnswer = [questionForm.answers[questionForm.correctAnswerIndex] || filledAnswers[0] || ""];
    } else {
        newQuestion.correctAnswer = [questionForm.correctAnswer];
        delete newQuestion.answers;
    }
    
    const newList = editingQuestionIndex !== null 
        ? selectedCategory.list.map((q, i) => i === editingQuestionIndex ? newQuestion : q)
        : [...selectedCategory.list, newQuestion];

    setCategories(prev => prev.map((c, i) => i === selectedCategoryIndex ? { ...c, list: newList } : c));
    setQuestionForm(emptyQuestionForm);
    setEditingQuestionIndex(null);
  };

  const handleFinish = (shouldDownload = false) => {
    if (editingIndex == null) {
      addCustomQuiz(draftQuiz);
    } else {
      updateCustomQuiz(editingIndex, draftQuiz);
    }
    if (shouldDownload) downloadJson(draftQuiz, `${quizName}.json`);
    setEditingQuiz(null);
    navigate("/kategorie");
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => setQuizImage(reader.result);
        reader.readAsDataURL(file);
    }
  };

  return (
    <div className="editor-view">
      <Modal open={isLivePreviewOpen} onClose={() => setIsLivePreviewOpen(false)}>
        <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0f172a', display: 'flex', flexDirection: 'column', p: 2, zIndex: 9999 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px' }}>
                <IconButton onClick={() => setIsLivePreviewOpen(false)} sx={{ color: '#fff', background: 'rgba(255,255,255,0.1)', '&:hover': { background: 'rgba(255,255,255,0.2)' } }}>
                    <CloseIcon />
                </IconButton>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {selectedCategory ? (
                    <Question 
                        category={{ ...selectedCategory, list: [previewQuestion] }} 
                        handleGoBack={() => setIsLivePreviewOpen(false)} 
                    />
                ) : (
                    <Typography color="#fff">Najpierw dodaj kategorię!</Typography>
                )}
            </div>
        </Box>
      </Modal>

      <div className="editor-view__steps">
        {steps.map((step, index) => (
          <div 
            key={index} 
            className={`editor-view__step ${activeStep === index ? 'editor-view__step--active' : ''}`}
            onClick={() => setActiveStep(index)}
          >
            <span>{index + 1}</span> {step.split(". ")[1]}
          </div>
        ))}
      </div>

      <div className="editor-view__content">
        {activeStep === 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "40px" }}>
            <div>
                <Typography variant="h5" fontWeight="800" sx={{ mb: 3 }}>{title}</Typography>
                <div className="editor-view__input-group">
                <label>Nazwa quizu</label>
                <input value={quizName} onChange={e => setQuizName(e.target.value)} placeholder="Wpisz nazwę quizu..." style={{ fontSize: "20px", fontWeight: "700" }} />
                </div>
                <div className="editor-view__input-group">
                <label>Opis (opcjonalnie)</label>
                <textarea rows={5} placeholder="O czym jest ten quiz?" style={{ resize: 'none' }} />
                </div>
                <div style={{ marginTop: "20px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(0,0,0,0.16)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "14px 16px", color: "#fff", fontWeight: 700 }}>
                    <input
                      type="checkbox"
                      checked={randomizeQuestions}
                      onChange={e => setRandomizeQuestions(e.target.checked)}
                      style={{ width: "20px", height: "20px", accentColor: "#2ecc71" }}
                    />
                    Losowa kolejność pytań w kategoriach
                  </label>
                </div>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#94a3b8" }}>Grafika okładkowa</label>
                <div style={{ width: "100%", aspectRatio: "16/9", background: "rgba(0,0,0,0.2)", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", border: "2px dashed rgba(255,255,255,0.1)", overflow: "hidden", position: "relative" }}>
                    {quizImage ? (
                        <>
                            <img src={quizImage} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            <IconButton 
                                onClick={(e) => { e.stopPropagation(); setQuizImage(null); }} 
                                sx={{ position: "absolute", top: 10, right: 10, background: "rgba(239, 68, 68, 0.8)", color: "#fff", '&:hover': { background: "#ef4444" } }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </>
                    ) : (
                        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.2)" }}>
                            <VisibilityIcon sx={{ fontSize: 40, mb: 1 }} />
                            <div style={{ fontSize: "12px" }}>Brak grafiki</div>
                        </div>
                    )}
                </div>
                <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleImageUpload} accept="image/*" />
                <button className="editor-view__btn editor-view__btn--outline" style={{ width: "100%", justifyContent: "center" }} onClick={() => fileInputRef.current.click()}>
                    {quizImage ? 'ZMIEŃ ZDJĘCIE' : 'WYBIERZ ZDJĘCIE'}
                </button>
            </div>
          </div>
        )}

        {activeStep === 1 && (
          <div>
            <div className="editor-view__input-row" style={{ display: "flex", gap: "12px", marginBottom: "32px" }}>
               <input 
                style={{ flex: 1, background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "16px", color: "#fff", fontSize: "16px" }}
                value={categoryForm.name} 
                onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} 
                placeholder="Nazwa kategorii..." 
              />
              <select 
                style={{ background: "#1e293b", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "0 20px" }}
                value={categoryForm.type || "standard"} 
                onChange={e => {
                  const nextType = e.target.value;
                  setCategoryForm({
                    ...categoryForm,
                    type: nextType
                  });
                }}
              >
                {categoryTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <button className="editor-view__btn" style={{ padding: "0 40px" }} onClick={handleSaveCategory}>{editingCategoryIndex !== null ? 'ZAPISZ' : 'DODAJ'}</button>
            </div>

            <div className="players-view__list">
                {categories.map((cat, i) => (
                    <div key={i} className="players-view__item" onClick={() => setSelectedCategoryIndex(i)} style={{ border: selectedCategoryIndex === i ? '2px solid #2ecc71' : '1px solid rgba(255,255,255,0.05)', background: selectedCategoryIndex === i ? 'rgba(46, 204, 113, 0.05)' : 'rgba(0,0,0,0.15)' }}>
                        <div className="players-view__item-info">
                            <div className="players-view__item-avatar" style={{ background: stringToHslColor(cat.name) }}>{cat.name.charAt(0)}</div>
                            <div>
                                <div className="players-view__item-name">{cat.name}</div>
                                <div className="players-view__item-score">{cat.list?.length || 0} pytań • {(cat.type || "standard").toUpperCase()}</div>
                            </div>
                        </div>
                        <div className="players-view__item-actions">
                             <IconButton onClick={(e) => { e.stopPropagation(); setCategoryForm({ type: "standard", ...cat }); setEditingCategoryIndex(i); }} size="small" sx={{ color: "rgba(255,255,255,0.3)" }}><EditIcon fontSize="small" /></IconButton>
                             <IconButton onClick={(e) => { e.stopPropagation(); handleDeleteCategory(i); }} size="small" sx={{ color: "#ef4444" }}><DeleteIcon fontSize="small" /></IconButton>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        )}

        {activeStep === 2 && (
            <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "40px" }}>
                <div>
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#94a3b8", display: "block", marginBottom: "12px" }}>Kategorie</label>
                    <div className="players-view__list">
                        {categories.map((cat, i) => (
                            <div key={i} className={`players-view__item ${selectedCategoryIndex === i ? 'players-view__item--active' : ''}`} onClick={() => { setSelectedCategoryIndex(i); setEditingQuestionIndex(null); setQuestionForm(emptyQuestionForm); }} style={{ border: selectedCategoryIndex === i ? '2px solid #2ecc71' : '1px solid rgba(255,255,255,0.05)', padding: "14px", cursor: "pointer" }}>
                                <div className="players-view__item-name" style={{ fontSize: "14px" }}>{cat.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    {selectedCategoryIndex !== null && selectedCategory && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            {selectedType !== "album" && selectedType !== "forehead" && (
                                <div className="editor-view__input-group">
                                    <label>Treść pytania</label>
                                    <textarea rows={3} value={questionForm.question} onChange={e => setQuestionForm({...questionForm, question: e.target.value})} placeholder="Wpisz treść pytania..." style={{ fontSize: "18px" }} />
                                </div>
                            )}

                            {(selectedType === "standard" || selectedType === "illustrated") && (
                                <div className="editor-view__input-group">
                                    <label>Tryb odpowiedzi</label>
                                    <select value={questionForm.answerMode} onChange={e => setQuestionForm({...questionForm, answerMode: e.target.value})} style={{ maxWidth: "300px" }}>
                                        <option value="choices">Wielokrotny wybór (A, B, C, D)</option>
                                        <option value="open">Pytanie otwarte</option>
                                    </select>
                                </div>
                            )}

                            {questionForm.answerMode === "choices" && (selectedType === "standard" || selectedType === "illustrated") && (
                                <div className="editor-view__input-group">
                                    <label>Odpowiedzi (zaznacz poprawną z lewej strony)</label>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                        {questionForm.answers.map((ans, i) => (
                                            <div key={i} style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                                                <input 
                                                    type="radio" 
                                                    name="correct" 
                                                    checked={questionForm.correctAnswerIndex === i} 
                                                    onChange={() => setQuestionForm({...questionForm, correctAnswerIndex: i})} 
                                                    style={{ width: "22px", height: "22px", cursor: "pointer", accentColor: "#2ecc71" }}
                                                />
                                                <input 
                                                    style={{ flex: 1, padding: "14px 20px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff", fontSize: "16px" }} 
                                                    value={ans} 
                                                    onChange={e => {
                                                        const newAns = [...questionForm.answers];
                                                        newAns[i] = e.target.value;
                                                        setQuestionForm({...questionForm, answers: newAns});
                                                    }} 
                                                    placeholder={`Wpisz treść odpowiedzi ${String.fromCharCode(65 + i)}...`} 
                                                />
                                                {questionForm.answers.length > 2 && (
                                                    <IconButton onClick={() => setQuestionForm({...questionForm, answers: questionForm.answers.filter((_, idx) => idx !== i)})} sx={{ color: "#ef4444" }}>
                                                        <DeleteIcon />
                                                    </IconButton>
                                                )}
                                            </div>
                                        ))}
                                        <button className="editor-view__btn editor-view__btn--outline" style={{ width: "fit-content", padding: "10px 20px", marginTop: "10px" }} onClick={() => setQuestionForm({...questionForm, answers: [...questionForm.answers, ""]})}>
                                            <AddIcon fontSize="small" /> DODAJ KOLEJNĄ OPCJĘ
                                        </button>
                                    </div>
                                </div>
                            )}

                            {(questionForm.answerMode === "open" || selectedType === "forehead" || selectedType === "auction" || selectedType === "duel") && (
                                <div className="editor-view__input-group">
                                    <label>Poprawna odpowiedź</label>
                                    <input value={questionForm.correctAnswer} onChange={e => setQuestionForm({...questionForm, correctAnswer: e.target.value})} placeholder="Wpisz treść poprawnej odpowiedzi..." />
                                </div>
                            )}

                            {selectedType === "auction" && (
                                <div className="editor-view__input-group">
                                    <label>Czas licytacji (sekundy)</label>
                                    <input
                                        type="number"
                                        min="5"
                                        step="5"
                                        value={questionForm.timerSeconds}
                                        onChange={e => setQuestionForm({...questionForm, timerSeconds: Math.max(5, Number(e.target.value) || 30)})}
                                    />
                                </div>
                            )}

                            {(selectedType === "illustrated" || selectedType === "forehead") && (
                                <div className="editor-view__input-group">
                                    <label>Ścieżka do obrazka lub link z internetu (np. images/pytanie1.jpg lub https://...)</label>
                                    <input value={questionForm.image} onChange={e => setQuestionForm({...questionForm, image: e.target.value})} placeholder="images/... lub https://..." />
                                </div>
                            )}

                            {selectedType === "album" && (
                                <div className="editor-view__input-group">
                                    <label>Ścieżki do obrazków lub linki (jeden adres w nowej linii)</label>
                                    <textarea rows={6} value={questionForm.images} onChange={e => setQuestionForm({...questionForm, images: e.target.value})} placeholder="images/find/1.jpg&#10;https://example.com/image.png" />
                                </div>
                            )}

                            <div className="editor-view__input-group">
                                <label>Dźwięk (opcjonalnie - ścieżka do pliku lub link)</label>
                                <input value={questionForm.sound} onChange={e => setQuestionForm({...questionForm, sound: e.target.value})} placeholder="sounds/... lub https://..." />
                            </div>

                            <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
                                <button className="editor-view__btn" onClick={handleSaveQuestion} style={{ flex: 1, height: "56px", fontSize: "16px" }}>
                                    {editingQuestionIndex !== null ? 'ZAKTUALIZUJ PYTANIE' : 'DODAJ DO KATEGORII'}
                                </button>
                                <button className="editor-view__btn editor-view__btn--outline" onClick={() => setIsLivePreviewOpen(true)} style={{ width: "200px" }}>
                                    <VisibilityIcon /> PODGLĄD LIVE
                                </button>
                            </div>

                            <div className="players-view__list" style={{ marginTop: "32px", maxHeight: "300px", overflowY: "auto", paddingRight: "10px" }}>
                                {selectedCategory.list?.map((q, i) => (
                                    <div key={i} className="players-view__item" style={{ background: "rgba(255,255,255,0.02)" }}>
                                        <div className="players-view__item-name" style={{ fontSize: "14px", flex: 1 }}>{i+1}. {q.question || (selectedType === "album" ? "Album zdjęć" : "Pytanie")}</div>
                                        <div className="players-view__item-actions">
                                            <IconButton onClick={() => { 
                                                setQuestionForm({
                                                    ...emptyQuestionForm,
                                                    ...q,
                                                    images: q.images?.join('\n') || "",
                                                    correctAnswer: q.correctAnswer?.[0] || "",
                                                    correctAnswerIndex: q.answers?.findIndex(a => a === q.correctAnswer?.[0]) ?? 0,
                                                    answerMode: selectedType !== "forehead" && q.answers?.length ? "choices" : "open"
                                                }); 
                                                setEditingQuestionIndex(i); 
                                            }} size="small" sx={{ color: "rgba(255,255,255,0.3)" }}><EditIcon fontSize="small" /></IconButton>
                                            <IconButton onClick={() => {
                                                const newList = selectedCategory.list.filter((_, idx) => idx !== i);
                                                setCategories(prev => prev.map((c, idx) => idx === selectedCategoryIndex ? { ...c, list: newList } : c));
                                            }} size="small" sx={{ color: "#ef4444" }}><DeleteIcon fontSize="small" /></IconButton>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {activeStep === 3 && (
            <div style={{ textAlign: "center" }}>
                <h3 style={{ marginBottom: "32px", fontSize: "24px" }}>Gotowe! Sprawdź podsumowanie: {quizName}</h3>
                <div className="quiz-grid">
                    {categories.map((cat, i) => (
                        <div key={i} className="quiz-card">
                            <div className="quiz-card__icon" style={{ background: stringToHslColor(cat.name) }}>{cat.name.charAt(0)}</div>
                            <h4 className="quiz-card__title">{cat.name}</h4>
                            <p className="quiz-card__info">{cat.list?.length || 0} pytań • {(cat.type || "standard").toUpperCase()}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>

      <div className="editor-view__footer">
        <button className="editor-view__btn editor-view__btn--secondary" onClick={() => navigate("/wybor")}>ANULUJ</button>
        <div style={{ display: "flex", gap: "12px" }}>
          {activeStep > 0 && <button className="editor-view__btn editor-view__btn--secondary" onClick={() => setActiveStep(activeStep - 1)}><ChevronLeftIcon /> WSTECZ</button>}
          {activeStep < 3 ? (
            <button className="editor-view__btn" style={{ padding: "0 40px" }} onClick={() => setActiveStep(activeStep + 1)}>DALEJ <ChevronRightIcon /></button>
          ) : (
            <>
                 <button className="editor-view__btn editor-view__btn--outline" onClick={() => handleFinish(true)}><SaveIcon /> POBIERZ JSON</button>
                 <button className="editor-view__btn" style={{ padding: "0 40px" }} onClick={() => handleFinish(false)}>ZAPISZ QUIZ</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

QuizEditor.propTypes = {
  initialQuiz: PropTypes.object,
  editingIndex: PropTypes.number,
  title: PropTypes.string,
};

export default QuizEditor;
