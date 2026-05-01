import { useContext, useMemo, useState } from "react";
import {
  Button,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PropTypes from "prop-types";
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
  answers: ["", ""],
  correctAnswerIndex: 0,
  correctAnswer: "",
  image: "",
  correctAnswerImage: "",
  sound: "",
  images: "",
};

const splitLines = (value) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

const joinLines = (value) => (Array.isArray(value) ? value.join("\n") : "");

const cleanAnswers = (answers) => answers.map((answer) => answer.trim()).filter(Boolean);

const normalizeCategory = (category) => ({
  type: category.type || (category.name?.toLowerCase() === "pojedynek" ? "duel" : "standard"),
  timerSeconds: category.type === "auction" ? category.timerSeconds || 30 : category.timerSeconds,
  list: [],
  ...category,
});

const QuizEditor = ({ initialQuiz, editingIndex, title }) => {
  const { addCustomQuiz, setEditingQuiz, setScreen, updateCustomQuiz } =
    useContext(AppContext);
  const [quizName, setQuizName] = useState(initialQuiz?.name || "Nowy quiz");
  const [categories, setCategories] = useState(
    (initialQuiz?.categories || []).map(normalizeCategory)
  );
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    type: "standard",
    timerSeconds: 30,
  });
  const [editingCategoryIndex, setEditingCategoryIndex] = useState(null);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState("");
  const [questionForm, setQuestionForm] = useState(emptyQuestionForm);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [expandedPreviewCategories, setExpandedPreviewCategories] = useState([]);
  const [message, setMessage] = useState("");

  const draftQuiz = useMemo(
    () => makeSerializableQuiz({ name: quizName.trim(), categories }),
    [categories, quizName]
  );
  const validationIssues = validateQuiz(draftQuiz);
  const selectedCategory =
    selectedCategoryIndex === "" ? null : categories[Number(selectedCategoryIndex)];
  const selectedType = selectedCategory?.type || "standard";
  const usesChoiceAnswers =
    (selectedType === "standard" || selectedType === "illustrated") &&
    questionForm.answerMode === "choices";
  const usesOpenAnswer =
    selectedType === "forehead" ||
    ((selectedType === "standard" || selectedType === "illustrated") &&
      questionForm.answerMode === "open");

  const resetCategoryForm = () => {
    setCategoryForm({ name: "", type: "standard", timerSeconds: 30 });
    setEditingCategoryIndex(null);
  };

  const resetQuestionForm = () => {
    setQuestionForm(emptyQuestionForm);
    setEditingQuestion(null);
  };

  const updateAnswer = (index, value) => {
    setQuestionForm((prevForm) => ({
      ...prevForm,
      answers: prevForm.answers.map((answer, answerIndex) =>
        answerIndex === index ? value : answer
      ),
    }));
  };

  const addAnswerRow = () => {
    setQuestionForm((prevForm) => ({
      ...prevForm,
      answers: [...prevForm.answers, ""],
    }));
  };

  const removeAnswerRow = (index) => {
    setQuestionForm((prevForm) => {
      const answers = prevForm.answers.filter((_, answerIndex) => answerIndex !== index);
      const nextCorrectAnswerIndex =
        prevForm.correctAnswerIndex === index
          ? 0
          : prevForm.correctAnswerIndex > index
            ? prevForm.correctAnswerIndex - 1
            : prevForm.correctAnswerIndex;

      return {
        ...prevForm,
        answers: answers.length > 0 ? answers : [""],
        correctAnswerIndex: nextCorrectAnswerIndex >= answers.length ? 0 : nextCorrectAnswerIndex,
      };
    });
  };

  const validateCurrentQuestion = () => {
    if (!selectedCategory) return "Najpierw wybierz kategorię z listy.";

    if (selectedType === "album") {
      return splitLines(questionForm.images).length > 0
        ? null
        : "Album wymaga co najmniej jednego obrazka.";
    }

    if (selectedType !== "forehead" && !questionForm.question.trim()) {
      return "Podaj treść pytania.";
    }

    if (usesChoiceAnswers) {
      const answers = cleanAnswers(questionForm.answers);
      const selectedAnswer = questionForm.answers[questionForm.correctAnswerIndex]?.trim();
      if (answers.length < 2) return "Dodaj co najmniej dwie odpowiedzi.";
      if (!selectedAnswer) return "Zaznacz poprawną, uzupełnioną odpowiedź.";
    }

    if (usesOpenAnswer && !questionForm.correctAnswer.trim()) {
      return "Podaj poprawną odpowiedź.";
    }

    if (selectedType === "illustrated" && !questionForm.image.trim()) {
      return "Pytanie obrazkowe wymaga ścieżki do obrazka.";
    }

    return null;
  };

  const handleSaveCategory = () => {
    const name = categoryForm.name.trim();
    if (!name) {
      setMessage("Podaj nazwę kategorii.");
      return;
    }

    const category = {
      name,
      type: categoryForm.type,
      list: editingCategoryIndex == null ? [] : categories[editingCategoryIndex].list,
    };

    if (categoryForm.type === "auction") {
      category.timerSeconds = Math.max(1, Number(categoryForm.timerSeconds) || 30);
    }

    if (editingCategoryIndex == null) {
      if (categories.some((item) => item.name.trim().toLowerCase() === name.toLowerCase())) {
        setMessage("Taka kategoria już istnieje.");
        return;
      }

      setCategories((prevCategories) => [...prevCategories, category]);
      setSelectedCategoryIndex(String(categories.length));
    } else {
      setCategories((prevCategories) =>
        prevCategories.map((item, index) =>
          index === editingCategoryIndex ? { ...category, list: item.list } : item
        )
      );
    }

    resetCategoryForm();
    setMessage("Zapisano kategorię.");
  };

  const handleEditCategory = (index) => {
    const category = categories[index];
    setCategoryForm({
      name: category.name,
      type: category.type || "standard",
      timerSeconds: category.timerSeconds || 30,
    });
    setEditingCategoryIndex(index);
  };

  const handleDeleteCategory = (index) => {
    setCategories((prevCategories) => prevCategories.filter((_, itemIndex) => itemIndex !== index));
    if (String(index) === selectedCategoryIndex) {
      setSelectedCategoryIndex("");
      resetQuestionForm();
    }
  };

  const buildQuestion = () => {
    const baseQuestion = {
      no:
        editingQuestion?.questionIndex != null
          ? categories[editingQuestion.categoryIndex].list[editingQuestion.questionIndex].no
          : (selectedCategory?.list?.length || 0) + 1,
    };

    if (selectedType === "album") {
      return { ...baseQuestion, images: splitLines(questionForm.images) };
    }

    if (selectedType === "forehead") {
      return { ...baseQuestion, correctAnswer: [questionForm.correctAnswer.trim()] };
    }

    const question = {
      ...baseQuestion,
      question: questionForm.question.trim(),
    };

    if (selectedType === "standard" || selectedType === "illustrated") {
      if (questionForm.answerMode === "choices") {
        const answers = cleanAnswers(questionForm.answers);
        question.answers = answers;
        question.correctAnswer = [questionForm.answers[questionForm.correctAnswerIndex].trim()];
      } else {
        question.correctAnswer = [questionForm.correctAnswer.trim()];
      }
    }

    if (selectedType === "illustrated") {
      question.image = questionForm.image.trim();
      if (questionForm.correctAnswerImage.trim()) {
        question.correctAnswerImage = questionForm.correctAnswerImage.trim();
      }
    }

    if (questionForm.sound.trim()) {
      question.sound = questionForm.sound.trim();
    }

    return question;
  };

  const fillQuestionForm = (question) => {
    const answers = Array.isArray(question.answers) && question.answers.length > 0
      ? question.answers
      : ["", ""];
    const correctAnswerIndex = Math.max(
      0,
      answers.findIndex((answer) => answer === question.correctAnswer?.[0])
    );

    setQuestionForm({
      question: question.question || "",
      answerMode: question.answers?.length ? "choices" : "open",
      answers,
      correctAnswerIndex,
      correctAnswer: question.correctAnswer?.[0] || "",
      image: question.image || "",
      correctAnswerImage: question.correctAnswerImage || "",
      sound: question.sound || "",
      images: joinLines(question.images),
    });
  };

  const handleSaveQuestion = () => {
    const questionIssue = validateCurrentQuestion();
    if (questionIssue) {
      setMessage(questionIssue);
      return;
    }

    const nextQuestion = buildQuestion();
    const nextCategories = categories.map((category, categoryIndex) => {
      if (categoryIndex !== Number(selectedCategoryIndex)) return category;

      const nextList =
        editingQuestion?.categoryIndex === categoryIndex
          ? category.list.map((question, questionIndex) =>
              questionIndex === editingQuestion.questionIndex ? nextQuestion : question
            )
          : [...category.list, nextQuestion];

      return { ...category, list: nextList };
    });

    setCategories(nextCategories);
    resetQuestionForm();
    setMessage(editingQuestion ? "Zaktualizowano pytanie." : "Dodano pytanie.");
  };

  const handleEditQuestion = (categoryIndex, questionIndex) => {
    setSelectedCategoryIndex(String(categoryIndex));
    setEditingQuestion({ categoryIndex, questionIndex });
    fillQuestionForm(categories[categoryIndex].list[questionIndex]);
  };

  const handleDeleteQuestion = (categoryIndex, questionIndex) => {
    setCategories((prevCategories) =>
      prevCategories.map((category, index) =>
        index === categoryIndex
          ? {
              ...category,
              list: category.list
                .filter((_, itemIndex) => itemIndex !== questionIndex)
                .map((question, itemIndex) => ({ ...question, no: itemIndex + 1 })),
            }
          : category
      )
    );
  };

  const togglePreviewCategory = (categoryIndex) => {
    setExpandedPreviewCategories((prevCategories) =>
      prevCategories.includes(categoryIndex)
        ? prevCategories.filter((index) => index !== categoryIndex)
        : [...prevCategories, categoryIndex]
    );
  };

  const saveQuiz = (shouldDownload) => {
    const issues = validateQuiz(draftQuiz);
    if (issues.length > 0) {
      setMessage(issues[0]);
      return;
    }

    if (editingIndex == null) {
      addCustomQuiz(draftQuiz);
      setMessage("Quiz zapisany jako nowy zestaw.");
    } else {
      updateCustomQuiz(editingIndex, draftQuiz);
      setMessage("Quiz zaktualizowany.");
    }

    if (shouldDownload) {
      downloadJson(draftQuiz, `${quizName.trim() || "quiz"}.json`);
    }
  };

  return (
    <div className="quiz-editor">
      <Typography variant="h4" sx={{ mb: 2 }}>
        {title}
      </Typography>

      <Paper className="quiz-editor__name" sx={{ p: 2 }}>
        <TextField
          label="Nazwa quizu"
          value={quizName}
          onChange={(event) => setQuizName(event.target.value)}
          fullWidth
        />
      </Paper>

      <div className="quiz-editor__workspace">
        <Paper className="quiz-editor__panel" sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Kategorie
          </Typography>
          <TextField
            label="Nazwa kategorii"
            value={categoryForm.name}
            onChange={(event) =>
              setCategoryForm((prevForm) => ({ ...prevForm, name: event.target.value }))
            }
            fullWidth
            sx={{ mb: 1.5 }}
          />
          <FormControl fullWidth sx={{ mb: 1.5 }}>
            <InputLabel>Typ</InputLabel>
            <Select
              label="Typ"
              value={categoryForm.type}
              onChange={(event) =>
                setCategoryForm((prevForm) => ({ ...prevForm, type: event.target.value }))
              }
            >
              {categoryTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {categoryForm.type === "auction" && (
            <TextField
              label="Timer licytacji"
              type="number"
              value={categoryForm.timerSeconds}
              onChange={(event) =>
                setCategoryForm((prevForm) => ({
                  ...prevForm,
                  timerSeconds: event.target.value,
                }))
              }
              fullWidth
              sx={{ mb: 1.5 }}
            />
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button variant="contained" onClick={handleSaveCategory}>
              {editingCategoryIndex == null ? "Dodaj" : "Zapisz"}
            </Button>
            {editingCategoryIndex != null && (
              <Button variant="outlined" onClick={resetCategoryForm}>
                Anuluj
              </Button>
            )}
          </div>

          <div className="quiz-editor__category-list">
            {categories.map((category, index) => (
              <Paper
                key={`${category.name}-${index}`}
                className={
                  String(index) === selectedCategoryIndex
                    ? "quiz-editor__category quiz-editor__category--selected"
                    : "quiz-editor__category"
                }
                onClick={() => {
                  setSelectedCategoryIndex(String(index));
                  resetQuestionForm();
                }}
                sx={{ p: 1.25 }}
              >
                <div className="quiz-editor__category-row">
                  <div className="quiz-editor__category-text">
                    <Typography variant="subtitle2" title={category.name}>
                      {category.name}
                    </Typography>
                    <Typography variant="caption">
                      {categoryTypes.find((type) => type.value === category.type)?.label ||
                        category.type}
                      {category.type === "auction" ? `, ${category.timerSeconds || 30}s` : ""} ·{" "}
                      {category.list.length} pytań
                    </Typography>
                  </div>
                  <div className="quiz-editor__inline-actions">
                    <IconButton
                      size="small"
                      title="Edytuj kategorię"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleEditCategory(index);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      title="Usuń kategorię"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDeleteCategory(index);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </div>
                </div>
              </Paper>
            ))}
          </div>
        </Paper>

        <Paper className="quiz-editor__panel quiz-editor__question" sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Pytanie
          </Typography>
          {!selectedCategory ? (
            <Typography>Wybierz kategorię z lewego panelu albo dodaj nową.</Typography>
          ) : (
            <>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                {selectedCategory.name}
              </Typography>
              {selectedType !== "album" && selectedType !== "forehead" && (
                <TextField
                  label={selectedType === "duel" ? "Hasło pojedynku" : "Treść pytania"}
                  value={questionForm.question}
                  onChange={(event) =>
                    setQuestionForm((prevForm) => ({
                      ...prevForm,
                      question: event.target.value,
                    }))
                  }
                  fullWidth
                  multiline
                  minRows={2}
                  sx={{ mb: 2 }}
                />
              )}

              {(selectedType === "standard" || selectedType === "illustrated") && (
                <>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Rodzaj odpowiedzi</InputLabel>
                    <Select
                      label="Rodzaj odpowiedzi"
                      value={questionForm.answerMode}
                      onChange={(event) =>
                        setQuestionForm((prevForm) => ({
                          ...prevForm,
                          answerMode: event.target.value,
                        }))
                      }
                    >
                      <MenuItem value="choices">Lista odpowiedzi</MenuItem>
                      <MenuItem value="open">Bez listy odpowiedzi</MenuItem>
                    </Select>
                  </FormControl>

                  {usesChoiceAnswers ? (
                    <div className="quiz-editor__answers">
                      {questionForm.answers.map((answer, index) => (
                        <div className="quiz-editor__answer-row" key={index}>
                          <FormControlLabel
                            control={
                              <Radio
                                checked={questionForm.correctAnswerIndex === index}
                                onChange={() =>
                                  setQuestionForm((prevForm) => ({
                                    ...prevForm,
                                    correctAnswerIndex: index,
                                  }))
                                }
                              />
                            }
                            label=""
                          />
                          <TextField
                            label={`Odpowiedź ${index + 1}`}
                            value={answer}
                            onChange={(event) => updateAnswer(index, event.target.value)}
                            fullWidth
                          />
                          <Button
                            variant="outlined"
                            color="error"
                            onClick={() => removeAnswerRow(index)}
                          >
                            -
                          </Button>
                        </div>
                      ))}
                      <Button variant="outlined" onClick={addAnswerRow}>
                        + Dodaj odpowiedź
                      </Button>
                    </div>
                  ) : (
                    <TextField
                      label="Poprawna odpowiedź"
                      value={questionForm.correctAnswer}
                      onChange={(event) =>
                        setQuestionForm((prevForm) => ({
                          ...prevForm,
                          correctAnswer: event.target.value,
                        }))
                      }
                      fullWidth
                      sx={{ mb: 2 }}
                    />
                  )}
                </>
              )}

              {selectedType === "forehead" && (
                <TextField
                  label="Poprawna odpowiedź"
                  value={questionForm.correctAnswer}
                  onChange={(event) =>
                    setQuestionForm((prevForm) => ({
                      ...prevForm,
                      correctAnswer: event.target.value,
                    }))
                  }
                  fullWidth
                  sx={{ mb: 2 }}
                />
              )}

              {selectedType === "illustrated" && (
                <div className="quiz-editor__media-grid">
                  <TextField
                    label="Ścieżka obrazka"
                    value={questionForm.image}
                    onChange={(event) =>
                      setQuestionForm((prevForm) => ({ ...prevForm, image: event.target.value }))
                    }
                  />
                  <TextField
                    label="Ścieżka obrazka z odpowiedzią"
                    value={questionForm.correctAnswerImage}
                    onChange={(event) =>
                      setQuestionForm((prevForm) => ({
                        ...prevForm,
                        correctAnswerImage: event.target.value,
                      }))
                    }
                  />
                </div>
              )}

              {selectedType === "album" && (
                <TextField
                  label="Ścieżki obrazków, każda w osobnej linii"
                  value={questionForm.images}
                  onChange={(event) =>
                    setQuestionForm((prevForm) => ({ ...prevForm, images: event.target.value }))
                  }
                  fullWidth
                  multiline
                  minRows={4}
                  sx={{ mb: 2 }}
                />
              )}

              {selectedType !== "album" && (
                <TextField
                  label="Ścieżka dźwięku, opcjonalnie"
                  value={questionForm.sound}
                  onChange={(event) =>
                    setQuestionForm((prevForm) => ({ ...prevForm, sound: event.target.value }))
                  }
                  fullWidth
                  sx={{ mt: 2, mb: 2 }}
                />
              )}

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Button variant="contained" onClick={handleSaveQuestion}>
                  {editingQuestion ? "Zapisz pytanie" : "Dodaj pytanie"}
                </Button>
                {editingQuestion && (
                  <Button variant="outlined" onClick={resetQuestionForm}>
                    Anuluj edycję pytania
                  </Button>
                )}
              </div>
            </>
          )}
        </Paper>
      </div>

      <Paper className="quiz-editor__preview" sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Podgląd i edycja pytań
        </Typography>
        <div className="quiz-editor__preview-list">
          {categories.map((category, categoryIndex) => {
            const isExpanded = expandedPreviewCategories.includes(categoryIndex);

            return (
              <Paper key={`${category.name}-${categoryIndex}`} className="quiz-editor__preview-category">
                <button
                  className="quiz-editor__preview-header"
                  type="button"
                  onClick={() => togglePreviewCategory(categoryIndex)}
                >
                  <ExpandMoreIcon
                    fontSize="small"
                    className={isExpanded ? "quiz-editor__expand-icon quiz-editor__expand-icon--open" : "quiz-editor__expand-icon"}
                  />
                  <span>{category.name}</span>
                  <span>{category.list.length} pytań</span>
                </button>
                {isExpanded && (
                  <div className="quiz-editor__question-list">
                    {category.list.map((question, questionIndex) => (
                      <div
                        key={`${category.name}-${question.no}-${questionIndex}`}
                        className="quiz-editor__question-row"
                      >
                        <Typography variant="body2" className="quiz-editor__question-title">
                          {question.no}.{" "}
                          {question.question ||
                            question.correctAnswer?.[0] ||
                            question.images?.join(", ") ||
                            "Pytanie bez treści"}
                        </Typography>
                        <div className="quiz-editor__inline-actions">
                          <IconButton
                            size="small"
                            title="Edytuj pytanie"
                            onClick={() => handleEditQuestion(categoryIndex, questionIndex)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            title="Usuń pytanie"
                            onClick={() => handleDeleteQuestion(categoryIndex, questionIndex)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Paper>
            );
          })}
        </div>
      </Paper>

      <Paper className="quiz-editor__save" sx={{ p: 2 }}>
        <Typography variant="h6">Zapis</Typography>
        <Typography sx={{ mb: 1 }}>
          Kategorie: {categories.length}, pytania:{" "}
          {categories.reduce((sum, category) => sum + category.list.length, 0)}
        </Typography>
        {validationIssues.length > 0 ? (
          validationIssues.map((issue) => (
            <Typography key={issue} color="warning.main">
              {issue}
            </Typography>
          ))
        ) : (
          <Typography color="success.main">Quiz jest gotowy do zapisu.</Typography>
        )}
        {message && <Typography sx={{ mt: 1 }}>{message}</Typography>}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
          <Button variant="contained" color="success" onClick={() => saveQuiz(false)}>
            Zapisz w aplikacji
          </Button>
          <Button variant="contained" onClick={() => saveQuiz(true)}>
            Zapisz i pobierz JSON
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              setEditingQuiz(null);
              setScreen("chooseType");
            }}
          >
            Wróć
          </Button>
        </div>
      </Paper>
    </div>
  );
};

QuizEditor.propTypes = {
  editingIndex: PropTypes.number,
  initialQuiz: PropTypes.object,
  title: PropTypes.string.isRequired,
};

export default QuizEditor;
