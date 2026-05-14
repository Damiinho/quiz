import { useContext, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { AppContext } from "../contexts/AppContext";
import { downloadJson, makeSerializableQuiz } from "../utils/quizStorage";
import { validateQuiz } from "../utils/quizValidation";

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
  correctAnswerImage: "",
  sound: "",
  images: "",
};

const QuizEditor = ({ initialQuiz, editingIndex, title }) => {
  const navigate = useNavigate();
  const { addCustomQuiz, updateCustomQuiz } = useContext(AppContext);
  const [activeStep, setActiveStep] = useState(0); 
  const [quizName, setQuizName] = useState(initialQuiz?.name || "Nowy quiz");
  const [categories, setCategories] = useState(initialQuiz?.categories || []);
  const [categoryForm, setCategoryForm] = useState({ name: "", type: "standard", timerSeconds: 30 });
  const [editingCategoryIndex, setEditingCategoryIndex] = useState(null);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [questionForm, setQuestionForm] = useState(emptyQuestionForm);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  const [quizImage, setQuizImage] = useState(null);
  
  const fileInputRef = useRef(null);
  const steps = ["1. Informacje", "2. Kategorie", "3. Pytania", "4. Podgląd"];
  const draftQuiz = useMemo(() => makeSerializableQuiz({ name: quizName.trim(), categories }), [categories, quizName]);

  const selectedCategory = categories[selectedCategoryIndex];
  const selectedType = selectedCategory?.type || "standard";

  const handleSaveCategory = () => {
    if (!categoryForm.name.trim()) return;
    const newCategory = { ...categoryForm, list: editingCategoryIndex !== null ? categories[editingCategoryIndex].list : [] };
    if (editingCategoryIndex !== null) {
      setCategories(prev => prev.map((c, i) => i === editingCategoryIndex ? newCategory : c));
      setEditingCategoryIndex(null);
    } else {
      setCategories(prev => [...prev, newCategory]);
    }
    setCategoryForm({ name: "", type: "standard", timerSeconds: 30 });
  };

  const handleSaveQuestion = () => {
    if (selectedCategoryIndex === null) return;
    
    // Budowanie obiektu pytania zależnie od typu
    const newQuestion = { 
        ...questionForm, 
        no: editingQuestionIndex !== null ? selectedCategory.list[editingQuestionIndex].no : selectedCategory.list.length + 1 
    };

    if (selectedType === "album") {
        newQuestion.images = questionForm.images.split('\n').filter(s => s.trim());
    }

    if (questionForm.answerMode === "choices") {
        newQuestion.correctAnswer = [questionForm.answers[questionForm.correctAnswerIndex]];
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
          <div>
            <div className="editor-view__input-group">
              <label>Nazwa quizu</label>
              <input value={quizName} onChange={e => setQuizName(e.target.value)} placeholder="Wpisz nazwę quizu..." />
            </div>
            <div className="editor-view__input-group">
              <label>Opis (opcjonalnie)</label>
              <textarea rows={3} placeholder="O czym jest ten quiz?" />
            </div>
            <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                <div style={{ width: "200px", height: "150px", background: "rgba(0,0,0,0.2)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", border: "2px dashed rgba(255,255,255,0.1)", overflow: "hidden" }}>
                    {quizImage ? <img src={quizImage} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>Brak grafiki</span>}
                </div>
                <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleImageUpload} accept="image/*" />
                <button className="editor-view__btn editor-view__btn--outline" onClick={() => fileInputRef.current.click()}>DODAJ GRAFIKĘ</button>
            </div>
          </div>
        )}

        {activeStep === 1 && (
          <div>
            <div className="editor-view__input-row" style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
               <input 
                style={{ flex: 1, background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "12px", color: "#fff" }}
                value={categoryForm.name} 
                onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} 
                placeholder="Nazwa kategorii..." 
              />
              <select 
                style={{ background: "#1e293b", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0 12px" }}
                value={categoryForm.type} 
                onChange={e => setCategoryForm({...categoryForm, type: e.target.value})}
              >
                {categoryTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <button className="editor-view__btn" onClick={handleSaveCategory}>{editingCategoryIndex !== null ? 'ZAPISZ' : 'DODAJ'}</button>
            </div>

            <div className="players-view__list">
                {categories.map((cat, i) => (
                    <div key={i} className="players-view__item" onClick={() => setSelectedCategoryIndex(i)} style={{ border: selectedCategoryIndex === i ? '1px solid #2ecc71' : '1px solid transparent' }}>
                        <div className="players-view__item-info">
                            <div className="players-view__item-avatar" style={{ background: "#a855f7" }}>{cat.name.charAt(0)}</div>
                            <div>
                                <div className="players-view__item-name">{cat.name}</div>
                                <div className="players-view__item-score">{cat.list?.length || 0} pytań • {cat.type}</div>
                            </div>
                        </div>
                        <div className="players-view__item-actions">
                             <IconButton onClick={() => { setCategoryForm(cat); setEditingCategoryIndex(i); }} size="small"><EditIcon fontSize="small" /></IconButton>
                             <IconButton onClick={() => setCategories(prev => prev.filter((_, idx) => idx !== i))} size="small" className="delete"><DeleteIcon fontSize="small" /></IconButton>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        )}

        {activeStep === 2 && (
            <div style={{ display: "grid", gridTemplateColumns: "250px 1fr", gap: "32px" }}>
                <div>
                    <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "8px" }}>Wybierz kategorię</label>
                    <div className="players-view__list">
                        {categories.map((cat, i) => (
                            <div key={i} className={`players-view__item ${selectedCategoryIndex === i ? 'players-view__item--active' : ''}`} onClick={() => { setSelectedCategoryIndex(i); setEditingQuestionIndex(null); setQuestionForm(emptyQuestionForm); }} style={{ border: selectedCategoryIndex === i ? '1px solid #2ecc71' : 'none', cursor: "pointer", padding: "10px" }}>
                                <div className="players-view__item-name" style={{ fontSize: "13px" }}>{cat.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    {selectedCategoryIndex !== null && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {selectedType !== "album" && (
                                <div className="editor-view__input-group">
                                    <label>Treść pytania</label>
                                    <textarea rows={2} value={questionForm.question} onChange={e => setQuestionForm({...questionForm, question: e.target.value})} placeholder="Wpisz treść pytania..." />
                                </div>
                            )}

                            {(selectedType === "standard" || selectedType === "illustrated") && (
                                <div className="editor-view__input-group">
                                    <label>Tryb odpowiedzi</label>
                                    <select value={questionForm.answerMode} onChange={e => setQuestionForm({...questionForm, answerMode: e.target.value})}>
                                        <option value="choices">Wielokrotny wybór</option>
                                        <option value="open">Otwarta</option>
                                    </select>
                                </div>
                            )}

                            {questionForm.answerMode === "choices" && (selectedType === "standard" || selectedType === "illustrated") && (
                                <div className="editor-view__input-group">
                                    <label>Odpowiedzi (zaznacz poprawną)</label>
                                    {questionForm.answers.map((ans, i) => (
                                        <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                                            <input type="radio" checked={questionForm.correctAnswerIndex === i} onChange={() => setQuestionForm({...questionForm, correctAnswerIndex: i})} />
                                            <input style={{ flex: 1 }} value={ans} onChange={e => {
                                                const newAns = [...questionForm.answers];
                                                newAns[i] = e.target.value;
                                                setQuestionForm({...questionForm, answers: newAns});
                                            }} placeholder={`Odpowiedź ${i+1}`} />
                                            {questionForm.answers.length > 2 && (
                                                <IconButton size="small" onClick={() => setQuestionForm({...questionForm, answers: questionForm.answers.filter((_, idx) => idx !== i)})}>
                                                    <RemoveIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                        </div>
                                    ))}
                                    <button className="editor-view__btn editor-view__btn--outline" style={{ padding: "8px", fontSize: "11px" }} onClick={() => setQuestionForm({...questionForm, answers: [...questionForm.answers, ""]})}>
                                        <AddIcon fontSize="small" /> DODAJ ODPOWIEDŹ
                                    </button>
                                </div>
                            )}

                            {(questionForm.answerMode === "open" || selectedType === "forehead") && (
                                <div className="editor-view__input-group">
                                    <label>Poprawna odpowiedź</label>
                                    <input value={questionForm.correctAnswer} onChange={e => setQuestionForm({...questionForm, correctAnswer: e.target.value})} placeholder="Wpisz poprawną odpowiedź..." />
                                </div>
                            )}

                            {selectedType === "illustrated" && (
                                <div className="editor-view__input-group">
                                    <label>Ścieżka do obrazka (np. images/pytanie1.jpg)</label>
                                    <input value={questionForm.image} onChange={e => setQuestionForm({...questionForm, image: e.target.value})} />
                                </div>
                            )}

                            {selectedType === "album" && (
                                <div className="editor-view__input-group">
                                    <label>Ścieżki do obrazków (jeden w linii)</label>
                                    <textarea rows={5} value={questionForm.images} onChange={e => setQuestionForm({...questionForm, images: e.target.value})} placeholder="images/1.jpg&#10;images/2.jpg" />
                                </div>
                            )}

                            <div className="editor-view__input-group">
                                <label>Ścieżka do dźwięku (opcjonalnie)</label>
                                <input value={questionForm.sound} onChange={e => setQuestionForm({...questionForm, sound: e.target.value})} placeholder="sounds/audio.mp3" />
                            </div>

                            <button className="editor-view__btn" onClick={handleSaveQuestion} style={{ width: "100%", justifyContent: "center", padding: "16px" }}>
                                {editingQuestionIndex !== null ? 'ZAKTUALIZUJ PYTANIE' : 'DODAJ PYTANIE DO KATEGORII'}
                            </button>

                            <div className="players-view__list" style={{ marginTop: "24px" }}>
                                {selectedCategory?.list?.map((q, i) => (
                                    <div key={i} className="players-view__item">
                                        <div className="players-view__item-name" style={{ fontSize: "14px" }}>{i+1}. {q.question || (selectedType === "album" ? "Album zdjęć" : "Pytanie")}</div>
                                        <div className="players-view__item-actions">
                                            <IconButton onClick={() => { 
                                                setQuestionForm({
                                                    ...emptyQuestionForm,
                                                    ...q,
                                                    images: q.images?.join('\n') || "",
                                                    correctAnswer: q.correctAnswer?.[0] || "",
                                                    correctAnswerIndex: q.answers?.findIndex(a => a === q.correctAnswer?.[0]) ?? 0,
                                                    answerMode: q.answers?.length ? "choices" : "open"
                                                }); 
                                                setEditingQuestionIndex(i); 
                                            }} size="small"><EditIcon fontSize="small" /></IconButton>
                                            <IconButton onClick={() => {
                                                const newList = selectedCategory.list.filter((_, idx) => idx !== i);
                                                setCategories(prev => prev.map((c, idx) => idx === selectedCategoryIndex ? { ...c, list: newList } : c));
                                            }} size="small" className="delete"><DeleteIcon fontSize="small" /></IconButton>
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
                <h3 style={{ marginBottom: "20px" }}>Podgląd Quizu: {quizName}</h3>
                <div className="quiz-grid">
                    {categories.map((cat, i) => (
                        <div key={i} className="quiz-card">
                            <h4 className="quiz-card__title">{cat.name}</h4>
                            <p className="quiz-card__info">{cat.list?.length || 0} pytań • {cat.type}</p>
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
            <button className="editor-view__btn" onClick={() => setActiveStep(activeStep + 1)}>DALEJ <ChevronRightIcon /></button>
          ) : (
            <>
                 <button className="editor-view__btn editor-view__btn--outline" onClick={() => handleFinish(true)}><SaveIcon /> POBIERZ JSON</button>
                 <button className="editor-view__btn" onClick={() => handleFinish(false)}>ZAPISZ I ZAKOŃCZ</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizEditor;
