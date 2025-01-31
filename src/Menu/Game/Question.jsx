import { useState } from "react";
import { Button, Typography, Paper } from "@mui/material";
import PropTypes from "prop-types";

const Question = ({ category, handleGoBack }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  // Wybieranie pytania z najmniejszym no lub losowego
  const getNextQuestion = () => {
    const unansweredQuestions = category.list.filter((q) => !q.done);

    if (unansweredQuestions.length === 0) return null;

    // Jeśli pytanie ma no, wybieramy to z najmniejszym no
    const questionWithNo = unansweredQuestions.filter((q) => q.no != null);
    if (questionWithNo.length > 0) {
      return questionWithNo.reduce((prev, curr) =>
        prev.no < curr.no ? prev : curr
      );
    }

    // Jeśli brak no, wybieramy losowe
    return unansweredQuestions[
      Math.floor(Math.random() * unansweredQuestions.length)
    ];
  };

  // Zmieniamy stan pytania i jego status
  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleGoBackAndUpdate = () => {
    // Oznaczamy pytanie jako 'done: true'
    const updatedList = category.list.map((q) =>
      q.no === selectedQuestion.no ? { ...q, done: true } : q
    );
    category.list = updatedList;
    setSelectedQuestion(getNextQuestion());
    setShowAnswer(false);
    handleGoBack(); // Przechodzimy z powrotem do kategorii
  };

  // Pierwsze pytanie
  if (!selectedQuestion) {
    setSelectedQuestion(getNextQuestion());
  }

  if (!selectedQuestion)
    return <Typography>Brak pytań do wyświetlenia.</Typography>;

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <Typography variant="h6" gutterBottom>
        {selectedQuestion.question}
      </Typography>

      <Paper sx={{ marginBottom: "16px", padding: "10px" }}>
        {selectedQuestion.answers.map((answer, index) => (
          <Typography
            key={index}
            variant="body1"
            sx={{
              fontWeight:
                showAnswer && selectedQuestion.correctAnswer.includes(answer)
                  ? "bold"
                  : "normal",
              color:
                showAnswer && selectedQuestion.correctAnswer.includes(answer)
                  ? "green"
                  : "black",
            }}
          >
            {answer}
          </Typography>
        ))}
      </Paper>

      {!showAnswer ? (
        <Button variant="contained" onClick={handleShowAnswer} fullWidth>
          Pokaż odpowiedź
        </Button>
      ) : (
        <Button variant="contained" onClick={handleGoBackAndUpdate} fullWidth>
          Wróć
        </Button>
      )}
    </div>
  );
};

Question.propTypes = {
  category: PropTypes.shape({
    name: PropTypes.string.isRequired,
    list: PropTypes.arrayOf(
      PropTypes.shape({
        no: PropTypes.number,
        question: PropTypes.string.isRequired,
        answers: PropTypes.arrayOf(PropTypes.string).isRequired,
        correctAnswer: PropTypes.arrayOf(PropTypes.string).isRequired,
        done: PropTypes.bool.isRequired,
      })
    ).isRequired,
  }).isRequired,
  handleGoBack: PropTypes.func.isRequired,
};

export default Question;
