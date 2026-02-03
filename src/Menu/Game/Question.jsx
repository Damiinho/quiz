import { useState, useEffect, useCallback, useRef } from "react";
import { Button, Typography, Paper } from "@mui/material";
import PropTypes from "prop-types";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

const Question = ({ category, handleGoBack }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const audioRef = useRef(null);

  const getNextQuestion = useCallback(() => {
    if (!category?.list) return null;
    const unansweredQuestions = category.list.filter((q) => !q.done);
    if (unansweredQuestions.length === 0) return null;

    if (category?.type === "forehead") {
      return unansweredQuestions[
        Math.floor(Math.random() * unansweredQuestions.length)
      ];
    }

    const questionWithNo = unansweredQuestions.filter((q) => q.no != null);
    if (questionWithNo.length > 0) {
      return questionWithNo.reduce((prev, curr) => (prev.no < curr.no ? prev : curr));
    }

    return unansweredQuestions[Math.floor(Math.random() * unansweredQuestions.length)];
  }, [category]);

  useEffect(() => {
    setSelectedQuestion(getNextQuestion());
    setShowAnswer(false);
  }, [category, getNextQuestion]);

  const isAuction = category?.type === "auction";
  const [timer, setTimer] = useState(30);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isTimerRunning && timerRef.current == null) {
      timerRef.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            setIsTimerRunning(false);
            setShowAnswer(true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isTimerRunning]);

  // reset timer and stop when question changes
  useEffect(() => {
    setTimer(30);
    setIsTimerRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [selectedQuestion]);

  const handleGoBackAndUpdate = () => {
    if (!selectedQuestion) return;
    // mark question as done
    if (Array.isArray(category.list)) {
      for (let i = 0; i < category.list.length; i++) {
        if (category.list[i] === selectedQuestion) {
          category.list[i] = { ...category.list[i], done: true };
          break;
        }
      }
    }
    setSelectedQuestion(getNextQuestion());
    setShowAnswer(false);
    handleGoBack();
  };

  if (!selectedQuestion) {
    return <Typography>Brak pytań do wyświetlenia.</Typography>;
  }

  const playSound = (soundPath) => {
    if (audioRef.current) {
      audioRef.current.src = `/${soundPath}`;
      audioRef.current.play();
    }
  };

  const isForehead = category?.type === "forehead";
  const isSongs = category?.type === "songs" || category?.name?.toLowerCase() === "piosenki";
  const isIllustrated = category?.type === "illustrated";
  const hasAnswers = Array.isArray(selectedQuestion.answers) && selectedQuestion.answers.length > 0;

  return (
    <div style={{ padding: "20px", textAlign: "center", width: "100%" }}>
      {isForehead && (
        <Paper sx={{ marginBottom: "16px", padding: "10px" }}>
          <Typography variant="h6" gutterBottom>
            Zakryj oczy lub odwróć się
          </Typography>
        </Paper>
      )}

      {!isForehead && selectedQuestion.question && (
        <Typography variant="h4" gutterBottom style={{ fontSize: "40px" }}>
          {selectedQuestion.question}
        </Typography>
      )}

      {selectedQuestion.sound && (
        <div style={{ marginBottom: "16px" }}>
          <audio ref={audioRef} />
          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={() => playSound(selectedQuestion.sound)}
            style={{ fontSize: "16px" }}
          >
            Odtwórz dźwięk
          </Button>
        </div>
      )}

      {isIllustrated && (
        <>
          {selectedQuestion.image && !selectedQuestion.correctAnswerImage && (
            <div style={{ marginBottom: 16 }}>
              <img
                src={`/${selectedQuestion.image}`}
                alt={selectedQuestion.question || "obraz"}
                style={{ width: "100%", maxHeight: 400, objectFit: "contain", borderRadius: 8 }}
              />
            </div>
          )}

          {selectedQuestion.image && selectedQuestion.correctAnswerImage && !showAnswer && (
            <div style={{ marginBottom: 16 }}>
              <img
                src={`/${selectedQuestion.image}`}
                alt={selectedQuestion.question || "obraz"}
                style={{ width: "100%", maxHeight: 400, objectFit: "contain", borderRadius: 8 }}
              />
            </div>
          )}

          {hasAnswers ? (
            <Paper sx={{ marginBottom: "16px", padding: "10px", width: "100%" }}>
              {selectedQuestion.answers.map((answer, index) => (
                <Typography
                  key={index}
                  variant="body1"
                  style={{
                    fontSize: "24px",
                    textAlign: "left",
                    marginLeft: "20px",
                    backgroundColor: showAnswer && answer === selectedQuestion.correctAnswer?.[0] ? "lightgreen" : "transparent",
                  }}
                >
                  {answer}
                </Typography>
              ))}
            </Paper>
          ) : (
            showAnswer && selectedQuestion.correctAnswer?.[0] && (
              <>
                {selectedQuestion.correctAnswerImage && (
                  <div style={{ marginBottom: 16 }}>
                    <img
                      src={`/${selectedQuestion.correctAnswerImage}`}
                      alt="odpowiedź"
                      style={{ width: "100%", maxHeight: 400, objectFit: "contain", borderRadius: 8 }}
                    />
                  </div>
                )}
                <Typography variant="h6" gutterBottom>
                  {selectedQuestion.correctAnswer[0]}
                </Typography>
              </>
            )
          )}
        </>
      )}

      {!isIllustrated && !isForehead && (
        hasAnswers ? (
          <Paper sx={{ marginBottom: "16px", padding: "10px", width: "100%" }}>
            {selectedQuestion.answers?.map((answer, index) => (
              <Typography
                key={index}
                variant="body1"
                style={{
                  fontSize: "24px",
                  textAlign: "left",
                  marginLeft: "20px",
                  backgroundColor: showAnswer && answer === selectedQuestion.correctAnswer?.[0] ? "lightgreen" : "transparent",
                }}
              >
                {answer}
              </Typography>
            ))}
          </Paper>
        ) : (
          showAnswer && selectedQuestion.correctAnswer?.[0] && (
            <>
              {selectedQuestion.correctAnswerImage && (
                <div style={{ marginBottom: 16 }}>
                  <img
                    src={`/${selectedQuestion.correctAnswerImage}`}
                    alt="odpowiedź"
                    style={{ width: "100%", maxHeight: 400, objectFit: "contain", borderRadius: 8 }}
                  />
                </div>
              )}
              <Typography variant="h6" gutterBottom>
                {selectedQuestion.correctAnswer[0]}
              </Typography>
            </>
          )
        )
      )}

      {isForehead && showAnswer && selectedQuestion.correctAnswer?.[0] && (
        <>
          {selectedQuestion.correctAnswerImage && (
            <div style={{ marginBottom: 16 }}>
              <img
                src={`/${selectedQuestion.correctAnswerImage}`}
                alt="odpowiedź"
                style={{ width: "100%", maxHeight: 400, objectFit: "contain", borderRadius: 8 }}
              />
            </div>
          )}
          <Typography variant="h6" gutterBottom>
            {selectedQuestion.correctAnswer[0]}
          </Typography>
        </>
      )}

      {isAuction ? (
        <div style={{ marginBottom: "10px" }}>
          <Typography variant="h3" gutterBottom style={{ fontSize: "48px" }}>
            {timer}s
          </Typography>
          <Button
            variant="contained"
            onClick={() => {
              if (!isTimerRunning) {
                setTimer(30);
                setShowAnswer(false);
                setIsTimerRunning(true);
              }
            }}
            fullWidth
            disabled={isTimerRunning || timer === 0}
            style={{ marginBottom: "10px", fontSize: "20px" }}
          >
            Start
          </Button>
        </div>
      ) : (
        <Button
          variant="contained"
          onClick={() => setShowAnswer((s) => !s)}
          fullWidth
          style={{ marginBottom: "10px", fontSize: "20px" }}
        >
          {showAnswer ? "Ukryj odpowiedź" : "Pokaż odpowiedź"}
        </Button>
      )}

      <Button variant="contained" onClick={handleGoBackAndUpdate} fullWidth style={{ fontSize: "20px" }}>
        Wróć
      </Button>

      {showAnswer && isSongs && (
        <Typography variant="h6" gutterBottom>
          <a href={selectedQuestion.correctAnswer?.[0]} target="_blank" rel="noopener noreferrer">
            {selectedQuestion.correctAnswer?.[0]}
          </a>
        </Typography>
      )}
    </div>
  );
};

Question.propTypes = {
  category: PropTypes.object.isRequired,
  handleGoBack: PropTypes.func.isRequired,
};

export default Question;
