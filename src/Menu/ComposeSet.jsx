import { useContext, useMemo, useState } from "react";
import { Button, Checkbox, Paper, TextField, Typography } from "@mui/material";
import { AppContext } from "../contexts/AppContext";
import { makeSerializableQuiz } from "../utils/quizStorage";

const ComposeSet = () => {
  const { quizList, setEditingQuiz, setScreen } = useContext(AppContext);
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
    setScreen("createNew");
  };

  return (
    <div className="compose-set">
      <Typography variant="h4" sx={{ mb: 2 }}>
        Skomponuj zestaw
      </Typography>
      <Paper className="compose-set__header" sx={{ p: 2, mb: 2 }}>
        <TextField
          label="Nazwa nowego zestawu"
          value={quizName}
          onChange={(event) => setQuizName(event.target.value)}
          fullWidth
        />
      </Paper>

      <Paper className="compose-set__list" sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Kategorie z gotowych i wczytanych quizów
        </Typography>
        {categoryOptions.map((option) => (
          <div key={option.key} className="compose-set__row">
            <Checkbox
              checked={selectedKeys.includes(option.key)}
              onChange={() => toggleCategory(option.key)}
            />
            <div>
              <Typography variant="subtitle1">{option.category.name}</Typography>
              <Typography variant="body2">
                {option.category.list?.length || 0} pytań
              </Typography>
            </div>
            <Typography variant="body2">{option.quizName}</Typography>
          </div>
        ))}
      </Paper>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Button
          variant="contained"
          disabled={selectedKeys.length === 0}
          onClick={handleCompose}
        >
          Utwórz zestaw z wybranych kategorii
        </Button>
        <Button variant="outlined" onClick={() => setScreen("chooseType")}>
          Wróć
        </Button>
      </div>
    </div>
  );
};

export default ComposeSet;
