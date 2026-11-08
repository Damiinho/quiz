import PropTypes from "prop-types";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";

const formatClock = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const GameTimer = ({ seconds, duration, isRunning, onToggle, className = "" }) => {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const safeDuration = Math.max(1, Number(duration) || 1);
  const fractionRemaining = Math.min(1, safeSeconds / safeDuration);
  const circumference = 2 * Math.PI * 27;
  const color = safeSeconds === 0
    ? "#ef4444"
    : !isRunning
      ? "#f59e0b"
      : safeSeconds <= 5
      ? "#ef4444"
      : safeSeconds <= 10
        ? "#f59e0b"
        : "#34d399";
  const action = isRunning ? "Wstrzymaj" : safeSeconds === 0 ? "Uruchom ponownie" : "Uruchom";

  return (
    <button
      type="button"
      className={`game-timer ${className}`.trim()}
      onClick={onToggle}
      aria-label={`${action} zegar. Pozostało ${formatClock(safeSeconds)}.`}
      title={`${action} zegar`}
      style={{ "--game-timer-color": color }}
    >
      <svg className="game-timer__ring" viewBox="0 0 64 64" aria-hidden="true">
        <circle className="game-timer__track" cx="32" cy="32" r="27" />
        <circle
          className="game-timer__progress"
          cx="32"
          cy="32"
          r="27"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fractionRemaining)}
        />
      </svg>
      <span className="game-timer__time" aria-hidden="true">{formatClock(safeSeconds)}</span>
      <span className="game-timer__action-icon" aria-hidden="true">
        {isRunning ? <PauseIcon /> : <PlayArrowIcon />}
      </span>
    </button>
  );
};

GameTimer.propTypes = {
  seconds: PropTypes.number.isRequired,
  duration: PropTypes.number.isRequired,
  isRunning: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  className: PropTypes.string,
};

export default GameTimer;
