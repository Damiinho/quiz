import { useState, useEffect, useCallback, useRef } from "react";
import { Button, Typography, Paper, Modal } from "@mui/material";
import PropTypes from "prop-types";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

const Question = ({ category, handleGoBack }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [enlargedImage, setEnlargedImage] = useState(null);
  const audioRef = useRef(null);

  const getNextQuestion = useCallback(() => {
    if (!category?.list) return null;
    const unansweredQuestions = category.list.filter((q) => !q.done);
    if (unansweredQuestions.length === 0) return null;
    // Jeśli są pytania z polem `no`, zwróć to o najmniejszym `no` (kolejność rosnąca)
    const questionsWithNo = unansweredQuestions.filter((q) => q.no != null);
    if (questionsWithNo.length > 0) {
      questionsWithNo.sort((a, b) => a.no - b.no);
      return questionsWithNo[0];
    }

    // W przeciwnym razie zwróć pierwsze nieodpowiedziane pytanie (zachowując oryginalną kolejność)
    return unansweredQuestions[0];
  }, [category]); // funkcja do pobierania następnego pytania, najpierw szuka pytań z polem `no`, a jeśli ich nie ma, zwraca pierwsze nieodpowiedziane pytanie

  useEffect(() => {
    setSelectedQuestion(getNextQuestion());
    setShowAnswer(false);
  }, [category, getNextQuestion]); // ustawianie pytania przy zmianie kategorii

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
  }, [isTimerRunning]); // efekt timera dla kategorii Licytacja

  useEffect(() => {
    setTimer(30);
    setIsTimerRunning(false);
    setCurrentImageIndex(0);
    setEnlargedImage(null);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [selectedQuestion]); // reset timera przy zmianie pytania

  useEffect(() => {
    if (category?.type === "album" && selectedQuestion?.images && selectedQuestion.images.length > 0) {
      setEnlargedImage(`/${selectedQuestion.images[0]}`);
    }
  }, [selectedQuestion, category?.type]); // automatyczne ustawianie pierwszego obrazu jako powiększonego dla kategorii Album

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

  const hasAnswers = Array.isArray(selectedQuestion.answers) && selectedQuestion.answers.length > 0;
  const hasCorrectAnswer = Array.isArray(selectedQuestion.correctAnswer) && selectedQuestion.correctAnswer.length > 0;
  const albumImages = selectedQuestion?.images || [];
  const hasMultipleImages = albumImages.length > 1;

  return (
    <div style={{ padding: "20px", textAlign: "center", width: "100%" }}>

{
          /* WYŚWIETLANIE ODPOWIEDZI */
}

      {category?.type === "album" && albumImages.length > 1 && <Modal
        open={!!enlargedImage}
        onClose={() => setEnlargedImage(null)}
        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", width: "100%", height: "100%" }}>
          
            <Button
              variant="contained"
              onClick={() => {
                const newIndex = currentImageIndex === 0 ? albumImages.length - 1 : currentImageIndex - 1;
                setCurrentImageIndex(newIndex);
                setEnlargedImage(`/${albumImages[newIndex]}`);
              }}
            >
              <ChevronLeftIcon />
            </Button>
          
          <img
            src={enlargedImage}
            alt="powiększony obraz"
            onClick={() => setEnlargedImage(null)}
            style={{ maxWidth: "95vw", maxHeight: "95vh", objectFit: "contain", cursor: "pointer" }}
          />
          {category?.type === "album" && albumImages.length > 1 && (
            <Button
              variant="contained"
              onClick={() => {
                const newIndex = currentImageIndex === albumImages.length - 1 ? 0 : currentImageIndex + 1;
                setCurrentImageIndex(newIndex);
                setEnlargedImage(`/${albumImages[newIndex]}`);
              }}
            >
              <ChevronRightIcon />
            </Button>
          )}
        </div>
      </Modal>} {/* Modal do powiększania obrazów w kategorii Album */}
      
      {category?.type === "album" && (
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginBottom: "16px" }}>
            <Button
              variant="contained"
              disabled={!hasMultipleImages}
              onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? albumImages.length - 1 : prev - 1))}
              style={{ opacity: !hasMultipleImages ? 0.5 : 1 }}
            >
              <ChevronLeftIcon />
            </Button>
            <div style={{ flex: 1, maxWidth: "600px" }}>
              {albumImages[currentImageIndex] && (
                <img
                  src={`/${albumImages[currentImageIndex]}`}
                  alt={`Obraz ${currentImageIndex + 1}`}
                  onClick={() => setEnlargedImage(`/${albumImages[currentImageIndex]}`)}  
                  style={{ width: "100%", maxHeight: 500, objectFit: "contain", borderRadius: 8, cursor: "pointer" }}
                />
              )}
            </div>
            <Button
              variant="contained"
              disabled={!hasMultipleImages}
              onClick={() => setCurrentImageIndex((prev) => (prev === albumImages.length - 1 ? 0 : prev + 1))}
              style={{ opacity: !hasMultipleImages ? 0.5 : 1 }}
            >
              <ChevronRightIcon />
            </Button>
          </div>
          <Typography variant="body2" style={{ fontSize: "16px" }}>
            {currentImageIndex + 1} / {albumImages.length}
          </Typography>
        </div>
      )} {/* Wyświetlanie odpowiedzi dla kategorii Album */}

      {category?.type === "forehead" && (
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px" }}>
            <Typography
              variant="h1"
              gutterBottom
              style={{
                fontSize: "min(18vw, 120px)",
                lineHeight: 1,
                textAlign: "center",
                width: "100%",
                wordBreak: "break-word",
              }}
            >
              {selectedQuestion.question}
            </Typography>
          </div>
        </div>
      )} {/* Wyświetlanie odpowiedzi dla kategorii Czółko */}

      {!(category?.type === "forehead") && !(category?.type === "album") && selectedQuestion.question && (
        <Typography variant="h4" gutterBottom style={{ fontSize: "70px", margin: "0 20px 20px" }}>
          {selectedQuestion.question}
        </Typography>
      )} {/* Wyświetlanie odpowiedzi dla kategorii innych niż Album i Czółko (i zawiera jakieś pytanie) */}

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
      )} {/* Przycisk jeśli kategoria ma dźwięk */}

      {category?.type === "illustrated" && (
        <>
          {selectedQuestion.image && !selectedQuestion.correctAnswerImage && (
            <div style={{ marginBottom: 16 }}>
              <img
                src={`/${selectedQuestion.image}`}
                alt={selectedQuestion.question || "obraz"}
                onClick={() => setEnlargedImage(`/${selectedQuestion.image}`)}
                style={{ width: "100%", maxHeight: 400, objectFit: "contain", borderRadius: 8, cursor: "pointer" }}
              />
            </div>
          )}

          {selectedQuestion.image && selectedQuestion.correctAnswerImage && !showAnswer && (
            <div style={{ marginBottom: 16 }}>
              <img
                src={`/${selectedQuestion.image}`}
                alt={selectedQuestion.question || "obraz"}
                onClick={() => setEnlargedImage(`/${selectedQuestion.image}`)}
                style={{ width: "100%", maxHeight: 400, objectFit: "contain", borderRadius: 8, cursor: "pointer" }}
              />
            </div>
          )}

          {hasAnswers && (
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
          )
          }
        </>
      )} {/* Pokazuje obraz jeśli kategoria jest Ilustrowana */}

      { hasAnswers ? (
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
          showAnswer && selectedQuestion.correctAnswer?.[0] && !(category?.type === "forehead") && (
            <>
              {selectedQuestion.correctAnswerImage && (
                <div style={{ marginBottom: 16 }}>
                  <img
                    src={`/${selectedQuestion.correctAnswerImage}`}
                    alt="odpowiedź"
                    onClick={() => setEnlargedImage(`/${selectedQuestion.correctAnswerImage}`)}
                    style={{ width: "100%", maxHeight: 400, objectFit: "contain", borderRadius: 8, cursor: "pointer" }}
                  />
                </div>
              )}
              <Typography variant="h6" gutterBottom>
                {selectedQuestion.correctAnswer[0]}
              </Typography>
            </>
          )
      )}


{/* 
          POKAZYWANIE POPRAWNYCH ODPOWIEDZI 
*/}

      {category?.type === "forehead" && (
        <div style={{ marginBottom: "16px" }}>
          {selectedQuestion.correctAnswerImage && (
            <div style={{ marginBottom: 16 }}>
              <img
                src={`/${selectedQuestion.correctAnswerImage}`}
                alt="odpowiedź"
                onClick={() => setEnlargedImage(`/${selectedQuestion.correctAnswerImage}`)}
                style={{ width: "100%", maxHeight: 400, objectFit: "contain", borderRadius: 8, cursor: "pointer" }}
              />
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px" }}>
            <Typography
              variant="h1"
              gutterBottom
              style={{
                fontSize: "min(20vw, 120px)",
                lineHeight: 1,
                textAlign: "center",
                width: "100%",
                wordBreak: "break-word",
              }}
            >
              {showAnswer ? selectedQuestion.correctAnswer[0] : "Zakryj oczy lub odwróć się"}
            </Typography>
          </div>
        </div>
      )} {/* pokazuje odpowiedź dla Czółka: operuje przyciskiem pokaż/ukryj odpowiedź */}

      {category?.type === "auction" && (
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
      )} {/* operuje przyciskiem Start przy Licytacji */}
      {hasCorrectAnswer && (
        <Button
          variant="contained"
          onClick={() => setShowAnswer((s) => !s)}
          fullWidth
          style={{ marginBottom: "10px", fontSize: "20px" }}
        >
          {showAnswer ? "Ukryj odpowiedź" : "Pokaż odpowiedź"}
        </Button>
      )} {/* operuje przyciskiem pokaż odpowiedź/ukryj odpowiedź, jeśli istnieje poprawna odpowiedź */}

      <Button variant="contained" onClick={handleGoBackAndUpdate} fullWidth style={{ fontSize: "20px" }}>
        Wróć
      </Button>


    </div>
  );
};

Question.propTypes = {
  category: PropTypes.object.isRequired,
  handleGoBack: PropTypes.func.isRequired,
};

export default Question;
