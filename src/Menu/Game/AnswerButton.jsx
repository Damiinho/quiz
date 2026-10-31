import PropTypes from "prop-types";

const getAnswerLengthClass = (answer = "") => {
  if (answer.length > 120) return "question-view__answer--verylong";
  if (answer.length > 70) return "question-view__answer--long";
  if (answer.length > 40) return "question-view__answer--medium";
  return "";
};

const AnswerButton = ({
  answer,
  index,
  isCorrect,
  isSelected,
  isWrong,
  hasImage,
  disabled,
  onSelect,
}) => {
  const answerLetter = String.fromCharCode(65 + index);
  const answerLengthClass = getAnswerLengthClass(answer);
  const answerMediaClass = hasImage ? "question-view__answer--with-image" : "";
  const stateClasses = [
    isCorrect && "question-view__answer--correct",
    isSelected && "question-view__answer--selected",
    isWrong && "question-view__answer--wrong",
  ].filter(Boolean).join(" ");

  return (
    <button
      type="button"
      className={`question-view__answer ${answerLengthClass} ${answerMediaClass} ${stateClasses}`}
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={isSelected}
      aria-label={`Odpowiedź ${answerLetter}: ${answer}`}
    >
      <span className="question-view__answer-letter">{answerLetter}</span>
      <span className="question-view__answer-text">{answer}</span>
    </button>
  );
};

AnswerButton.propTypes = {
  answer: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
  isCorrect: PropTypes.bool.isRequired,
  isSelected: PropTypes.bool.isRequired,
  isWrong: PropTypes.bool.isRequired,
  hasImage: PropTypes.bool.isRequired,
  disabled: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
};

export default AnswerButton;
