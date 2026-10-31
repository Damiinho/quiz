import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Typography } from "@mui/material";
import {
  applyWheelBankrupt,
  canBuyWheelVowel,
  countWheelLetter,
  isWheelPhraseSolved,
  isWheelVowel,
  normalizeWheelLetter,
  normalizeWheelSegments,
  pickWeightedWheelIndex,
  revealWheelPhrase,
} from "../../utils/wheelGame";

const LETTERS = "AĄBCĆDEĘFGHIJKLŁMNŃOÓPRSŚTUVWYZŹŻ".split("");

const getWheelLabel = (value) => {
  if (value === "bankrupt") return "BANKRUT";
  if (value === "freeVowel") return "DARMOWA SAMOGŁOSKA";
  return `+${value}`;
};

const getWheelPoint = (angle, radius) => {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: 200 + radius * Math.cos(radians),
    y: 200 + radius * Math.sin(radians),
  };
};

const getWheelSectorPath = (segment) => {
  const start = getWheelPoint(segment.start, 200);
  const end = getWheelPoint(segment.end, 200);
  const largeArc = segment.end - segment.start > 180 ? 1 : 0;
  return `M 200 200 L ${start.x} ${start.y} A 200 200 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
};

const WHEEL_COLORS = ["#f4c542", "#39b9d1", "#e97451", "#86bd72", "#e6a23c", "#7189d8", "#df6f9b", "#58a897"];

const WheelQuestion = ({ category, question, players, onChangePoints, wheelRoundState, onWheelRoundStateChange, onWheelRoundAction, onFinish, onExit, wheelControlEvent }) => {
  const phrase = question.correctAnswer?.[0] || "";
  const questionKey = `${category.name}:${question.no ?? phrase}`;
  const savedRound = wheelRoundState?.questionKey === questionKey ? wheelRoundState : null;
  const [guessedLetters, setGuessedLetters] = useState(() => savedRound?.guessedLetters || []);
  const [roundPoints, setRoundPoints] = useState(() => savedRound?.roundPoints || {});
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(() => Math.min(savedRound?.currentPlayerIndex || 0, Math.max(0, players.length - 1)));
  const [wheelValue, setWheelValue] = useState(() => savedRound?.wheelValue ?? null);
  const [isWheelOpen, setIsWheelOpen] = useState(() => Boolean(savedRound?.isWheelOpen));
  const [spinPhase, setSpinPhase] = useState("idle");
  const [wheelRotation, setWheelRotation] = useState(() => savedRound?.wheelRotation || 0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isHintVisible, setIsHintVisible] = useState(false);
  const [message, setMessage] = useState("Zakreć kołem i wybierz spółgłoskę.");
  const [timer, setTimer] = useState(() => Number(savedRound?.timer ?? category.timerSeconds) || 0);
  const spinFrameRef = useRef(null);
  const wheelRotationRef = useRef(savedRound?.wheelRotation || 0);
  const spinTimestampRef = useRef(null);
  const processedControlRef = useRef(null);
  const startWheelRef = useRef(null);
  const stopWheelRef = useRef(null);
  const lastPersistedRoundRef = useRef(savedRound);

  const getRoundState = useCallback((overrides = {}) => ({
    questionKey,
    guessedLetters,
    roundPoints,
    currentPlayerIndex,
    wheelValue,
    isWheelOpen,
    wheelRotation: wheelRotationRef.current,
    timer,
    message,
    ...overrides,
  }), [questionKey, guessedLetters, roundPoints, currentPlayerIndex, wheelValue, isWheelOpen, timer, message]);

  useEffect(() => {
    if (wheelRoundState?.questionKey !== questionKey || wheelRoundState === lastPersistedRoundRef.current) return;
    lastPersistedRoundRef.current = wheelRoundState;
    setGuessedLetters(wheelRoundState.guessedLetters || []);
    setRoundPoints(wheelRoundState.roundPoints || {});
    setCurrentPlayerIndex(Math.min(wheelRoundState.currentPlayerIndex || 0, Math.max(0, players.length - 1)));
    setWheelValue(wheelRoundState.wheelValue ?? null);
    setIsWheelOpen(Boolean(wheelRoundState.isWheelOpen));
    wheelRotationRef.current = wheelRoundState.wheelRotation || 0;
    setWheelRotation(wheelRotationRef.current);
    setTimer(Number(wheelRoundState.timer ?? category.timerSeconds) || 0);
    if (wheelRoundState.message) setMessage(wheelRoundState.message);
  }, [wheelRoundState, questionKey, players.length, category.timerSeconds]);

  useEffect(() => {
    const nextRoundState = getRoundState();
    lastPersistedRoundRef.current = nextRoundState;
    onWheelRoundStateChange(nextRoundState);
  }, [getRoundState, onWheelRoundStateChange]);

  const currentPlayer = players[currentPlayerIndex];
  const currentRoundPoints = roundPoints[currentPlayer?.name] || 0;
  const timerDuration = Number(category.timerSeconds) || 0;
  const timerProgress = timerDuration > 0
    ? Math.min(100, Math.max(0, ((timerDuration - timer) / timerDuration) * 100))
    : 0;
  const visiblePhrase = useMemo(() => revealWheelPhrase(phrase, guessedLetters), [phrase, guessedLetters]);
  const phraseTokens = useMemo(() => {
    let characterIndex = 0;
    return phrase.split(/(\s+)/).map((token) => {
      const characters = visiblePhrase.slice(characterIndex, characterIndex + token.length);
      characterIndex += token.length;
      return { token, characters };
    });
  }, [phrase, visiblePhrase]);
  const availableLetters = useMemo(
    () => LETTERS.filter((letter) => !guessedLetters.includes(letter)),
    [guessedLetters]
  );
  const wheelSegments = useMemo(() => normalizeWheelSegments(category.wheelValues), [category.wheelValues]);
  const wheelSegmentLayout = useMemo(() => {
    const totalWeight = wheelSegments.reduce((sum, segment) => sum + segment.weight, 0) || 1;
    let cursor = 0;
    return wheelSegments.map((segment) => {
      const start = cursor;
      const end = cursor + (segment.weight / totalWeight) * 360;
      cursor = end;
      return { ...segment, start, end, center: start + (end - start) / 2 };
    });
  }, [wheelSegments]);
  const nextPlayer = useCallback((reason) => {
    setWheelValue(null);
    setIsWheelOpen(false);
    setSpinPhase("idle");
    setCurrentPlayerIndex((index) => players.length ? (index + 1) % players.length : 0);
    setTimer(Number(category.timerSeconds) || 0);
    setMessage(reason || "Kolej przechodzi na następną osobę.");
  }, [category.timerSeconds, players.length]);

  useEffect(() => () => {
    if (spinFrameRef.current) window.cancelAnimationFrame(spinFrameRef.current);
  }, []);

  useEffect(() => {
    if (!timer || spinPhase !== "idle" || !isTimerRunning) return undefined;
    const timerId = window.setInterval(() => {
      setTimer((value) => {
        if (value <= 1) {
          window.clearInterval(timerId);
          setIsTimerRunning(false);
          setMessage("Czas minął. Mistrz gry decyduje o dalszym kroku.");
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [timer, spinPhase, isTimerRunning, nextPlayer]);

  const finishSolvedPhrase = (earnedPointsOverride = null) => {
    const earnedPoints = earnedPointsOverride ?? (roundPoints[currentPlayer.name] || 0);
    if (earnedPoints > 0) onChangePoints(currentPlayerIndex, earnedPoints);
    setMessage(`${currentPlayer.name} zdobywa ${earnedPoints} pkt i rozwiązuje hasło.`);
    window.setTimeout(onFinish, 600);
  };

  const finishSpin = (value) => {
    const isBankrupt = value === "bankrupt";
    const nextRoundPoints = isBankrupt ? { ...roundPoints, [currentPlayer.name]: 0 } : roundPoints;
    const playerPoints = currentPlayer.points || 0;
    const nextTotalPoints = isBankrupt ? applyWheelBankrupt(playerPoints) : playerPoints;
    const pointsChange = nextTotalPoints === playerPoints
      ? null
      : { playerIndex: currentPlayerIndex, delta: nextTotalPoints - playerPoints };
    const resultMessage = isBankrupt
      ? "BANKRUT. Wynik gracza został wyzerowany. Mistrz gry zatwierdza przejście dalej."
      : value === "freeVowel"
        ? "Darmowa samogłoska. Wybierz samogłoskę."
        : `Wylosowano ${getWheelLabel(value)}. Wybierz spółgłoskę.`;
    onWheelRoundAction(
      getRoundState({ wheelValue: value, roundPoints: nextRoundPoints, message: resultMessage }),
      `Wylosowano ${getWheelLabel(value)}`,
      pointsChange
    );
    setWheelValue(value);
    setSpinPhase("idle");
    if (isBankrupt) {
      setRoundPoints(nextRoundPoints);
      setMessage("BANKRUT. Wynik gracza został wyzerowany. Mistrz gry zatwierdza przejście dalej.");
    } else if (value === "freeVowel") {
      setMessage("Darmowa samogłoska. Wybierz samogłoskę.");
    } else {
      setMessage(`Wylosowano ${getWheelLabel(value)}. Wybierz spółgłoskę.`);
    }
  };

  const startRotationLoop = () => {
    if (spinFrameRef.current) window.cancelAnimationFrame(spinFrameRef.current);
    spinTimestampRef.current = null;
    const rotate = (timestamp) => {
      if (spinTimestampRef.current !== null) {
        wheelRotationRef.current += ((timestamp - spinTimestampRef.current) * 300) / 1000;
      }
      spinTimestampRef.current = timestamp;
      setWheelRotation(wheelRotationRef.current);
      spinFrameRef.current = window.requestAnimationFrame(rotate);
    };
    spinFrameRef.current = window.requestAnimationFrame(rotate);
  };

  const handleOpenWheel = () => {
    if (wheelValue !== null || !wheelSegments.length) return;
    setIsWheelOpen(true);
    setSpinPhase("idle");
    setMessage("Koło gotowe. Kliknij START, aby rozpocząć obrót.");
  };

  const handleStartSpin = () => {
    if (!isWheelOpen || spinPhase !== "idle" || wheelValue !== null) return;
    setSpinPhase("spinning");
    startRotationLoop();
  };

  const handleStopSpin = () => {
    if (spinPhase !== "spinning") return;
    if (spinFrameRef.current) window.cancelAnimationFrame(spinFrameRef.current);
    const selectedIndex = pickWeightedWheelIndex(wheelSegments);
    const selectedCenter = wheelSegmentLayout[selectedIndex]?.center || 0;
    const currentAngle = ((wheelRotationRef.current % 360) + 360) % 360;
    const correction = (360 - selectedCenter - currentAngle + 360) % 360;
    const stopDistance = 360 + correction;
    const startRotation = wheelRotationRef.current;
    const finalRotation = startRotation + stopDistance;
    const stopDuration = (2 * stopDistance * 1000) / 300;
    let stopStartTimestamp = null;
    setSpinPhase("stopping");
    const decelerate = (timestamp) => {
      if (stopStartTimestamp === null) stopStartTimestamp = timestamp;
      const progress = Math.min((timestamp - stopStartTimestamp) / stopDuration, 1);
      const easedProgress = progress * (2 - progress);
      wheelRotationRef.current = startRotation + stopDistance * easedProgress;
      setWheelRotation(wheelRotationRef.current);
      if (progress < 1) {
        spinFrameRef.current = window.requestAnimationFrame(decelerate);
        return;
      }
      wheelRotationRef.current = finalRotation;
      setWheelRotation(finalRotation);
      spinFrameRef.current = null;
      finishSpin(wheelSegments[selectedIndex].value);
    };
    spinFrameRef.current = window.requestAnimationFrame(decelerate);
  };

  startWheelRef.current = handleOpenWheel;
  stopWheelRef.current = handleStopSpin;

  useEffect(() => {
    if (!wheelControlEvent || processedControlRef.current === wheelControlEvent.id) return;
    processedControlRef.current = wheelControlEvent.id;
    if (wheelControlEvent.action === "start") startWheelRef.current?.();
    if (wheelControlEvent.action === "stop") stopWheelRef.current?.();
  }, [wheelControlEvent]);

  const handleExitWheel = () => {
    if (spinPhase !== "idle") return;
    setIsWheelOpen(false);
  };

  const handleBuyBeforeSpin = () => {
    if (wheelValue !== null || !currentPlayer) return;
    const result = canBuyWheelVowel({ roundPoints: currentRoundPoints, totalPoints: currentPlayer.points, cost: category.vowelCost });
    if (!result.source) {
      setMessage(`Nie można kupić samogłoski. Potrzeba ${category.vowelCost} pkt.`);
      return;
    }
    const nextRoundPoints = result.source === "round"
      ? { ...roundPoints, [currentPlayer.name]: currentRoundPoints - Number(category.vowelCost) }
      : roundPoints;
    const pointsChange = result.source === "total"
      ? { playerIndex: currentPlayerIndex, delta: -Number(category.vowelCost) }
      : null;
    onWheelRoundAction(
      getRoundState({
        roundPoints: nextRoundPoints,
        wheelValue: "freeVowel",
        message: result.source === "total"
          ? `Uwaga: pobrano ${category.vowelCost} pkt z wyniku całkowitego, bo punkty rundy są niewystarczające.`
          : `Kupiono samogłoskę za ${category.vowelCost} pkt z tej rundy.`,
      }),
      `Kupiono samogłoskę za ${category.vowelCost} pkt`,
      pointsChange
    );
    if (result.source === "total") {
      setMessage(`Uwaga: pobrano ${category.vowelCost} pkt z wyniku całkowitego, bo punkty rundy są niewystarczające.`);
    } else {
      setRoundPoints(nextRoundPoints);
      setMessage(`Kupiono samogłoskę za ${category.vowelCost} pkt z tej rundy.`);
    }
    setWheelValue("freeVowel");
  };

  const handleLetter = (letter) => {
    if (wheelValue === null || guessedLetters.includes(letter) || !currentPlayer) return;
    if (isWheelVowel(letter) && wheelValue !== "freeVowel") {
      setMessage("Najpierw kup samogłoskę albo wylosuj darmową samogłoskę.");
      return;
    }
    if (!isWheelVowel(letter) && wheelValue === "freeVowel") {
      setMessage("Darmowa samogłoska wymaga wybrania samogłoski.");
      return;
    }

    const occurrences = countWheelLetter(phrase, letter);
    const nextGuessedLetters = [...guessedLetters, normalizeWheelLetter(letter)];
    let nextRoundPoints = roundPoints;
    let nextPlayerIndex = currentPlayerIndex;
    let nextTimer = timer;
    let nextWheelOpen = isWheelOpen;

    if (occurrences === 0) {
      nextPlayerIndex = players.length ? (currentPlayerIndex + 1) % players.length : 0;
      nextTimer = Number(category.timerSeconds) || 0;
      nextWheelOpen = false;
    } else if (!isWheelVowel(letter)) {
      const earned = Number(wheelValue) * occurrences;
      nextRoundPoints = {
        ...roundPoints,
        [currentPlayer.name]: currentRoundPoints + earned,
      };
    }

    const nextMessage = occurrences === 0
      ? `Litery ${letter} nie ma w haśle.`
      : isWheelPhraseSolved(phrase, nextGuessedLetters)
        ? "Hasło jest kompletne. Mistrz gry może je teraz uznać."
        : isWheelVowel(letter)
          ? `Samogłoska ${letter} występuje ${occurrences} razy.`
          : `${currentPlayer.name} zdobywa ${Number(wheelValue) * occurrences} pkt. Możesz zakręcić ponownie.`;
    onWheelRoundAction(getRoundState({
      guessedLetters: nextGuessedLetters,
      roundPoints: nextRoundPoints,
      currentPlayerIndex: nextPlayerIndex,
      wheelValue: null,
      isWheelOpen: nextWheelOpen,
      timer: nextTimer,
      message: nextMessage,
    }), `${occurrences ? "Trafiona" : "Nietrafiona"} litera ${letter}`);
    setGuessedLetters(nextGuessedLetters);
    setWheelValue(null);
    if (occurrences === 0) {
      nextPlayer(`Litery ${letter} nie ma w haśle.`);
      return;
    }

    if (!isWheelVowel(letter)) {
      const earned = Number(wheelValue) * occurrences;
      setRoundPoints((previous) => ({
        ...previous,
        [currentPlayer.name]: (previous[currentPlayer.name] || 0) + earned,
      }));
      setMessage(`${currentPlayer.name} zdobywa ${earned} pkt. Możesz zakręcić ponownie.`);
    } else {
      setMessage(`Samogłoska ${letter} występuje ${occurrences} razy.`);
    }

    if (isWheelPhraseSolved(phrase, [...guessedLetters, letter])) {
      setMessage("Hasło jest kompletne. Mistrz gry może je teraz uznać.");
    }
  };

  const handleMasterAccept = () => {
    setGuessedLetters(LETTERS);
    finishSolvedPhrase();
  };

  const handleMasterReject = () => {
    const nextPlayerIndex = players.length ? (currentPlayerIndex + 1) % players.length : 0;
    onWheelRoundAction(getRoundState({
      currentPlayerIndex: nextPlayerIndex,
      wheelValue: null,
      isWheelOpen: false,
      timer: Number(category.timerSeconds) || 0,
      message: "Mistrz gry nie uznał rozwiązania. Kolej przechodzi dalej.",
    }), "Mistrz gry odrzucił rozwiązanie");
    nextPlayer("Mistrz gry nie uznał rozwiązania. Kolej przechodzi dalej.");
  };

  const handleConfirmBankrupt = () => {
    const nextPlayerIndex = players.length ? (currentPlayerIndex + 1) % players.length : 0;
    onWheelRoundAction(getRoundState({
      currentPlayerIndex: nextPlayerIndex,
      wheelValue: null,
      isWheelOpen: false,
      timer: Number(category.timerSeconds) || 0,
      message: "BANKRUT zatwierdzony. Kolej przechodzi dalej.",
    }), "Zatwierdzono bankruta");
    nextPlayer("BANKRUT zatwierdzony. Kolej przechodzi dalej.");
  };

  const toggleTimer = () => {
    if (timer === 0) setTimer(Number(category.timerSeconds) || 0);
    setIsTimerRunning((running) => !running);
  };

  return (
    <section
      className="wheel-question"
      aria-label="Koło fortuny"
      style={{ "--timer-progress": `${timerProgress}%` }}
    >
      <header className="wheel-question__header">
        <div>
          <Typography variant="overline">KOŁO FORTUNY</Typography>
          <Typography variant="h5">Tura: {currentPlayer?.name || "Gracz"}</Typography>
        </div>
        {timerDuration > 0 && <div className="wheel-question__timer" aria-live="polite">{timer}</div>}
      </header>

      {(category.wheelHint || question.context) && (
        <div className="wheel-question__hint-area">
          <button type="button" className="wheel-question__hint-button" onClick={() => setIsHintVisible((visible) => !visible)}>
            {isHintVisible ? "ZAMKNIJ PODPOWIEDŹ" : "POKAŻ PODPOWIEDŹ"}
          </button>
          {isHintVisible && (
            <div className="wheel-question__hint-modal" role="dialog" aria-label="Podpowiedź do hasła">
              <div className="wheel-question__hint-modal-content">
                <span>PODPOWIEDŹ</span>
                <strong>{category.wheelHint || question.context}</strong>
                <button type="button" onClick={() => setIsHintVisible(false)}>ZAMKNIJ</button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="wheel-question__phrase" aria-label="Hasło">
        {phraseTokens.map(({ token, characters }, tokenIndex) => token.trim() ? (
          <span className="wheel-question__phrase-word" key={`${token}-${tokenIndex}`}>
            {characters.map((character, characterIndex) => (
              <span key={`${character}-${characterIndex}`} className={character === "_" ? "is-hidden" : ""}>{character}</span>
            ))}
          </span>
        ) : <span className="wheel-question__phrase-space" key={`${token}-${tokenIndex}`} aria-hidden="true" />)}
      </div>

      <div className="wheel-question__status" aria-live="polite">{message}</div>
      <div className="wheel-question__score">Punkty rundy: <strong>{currentRoundPoints}</strong></div>

      <div className="wheel-question__main-controls">
        {wheelValue === null && (
          <button type="button" className="wheel-question__open-button" onClick={handleOpenWheel}>
            ZAKRĘĆ KOŁEM
          </button>
        )}
        <button type="button" className="wheel-question__buy" onClick={handleBuyBeforeSpin} disabled={spinPhase !== "idle" || wheelValue !== null}>
          KUP SAMOGŁOSKĘ ({category.vowelCost} pkt)
        </button>
        <button type="button" className="wheel-question__timer-control" onClick={toggleTimer}>
          {isTimerRunning ? "PAUZA CZASU" : timer === 0 ? "START CZASU" : "WZNÓW CZAS"}
        </button>
      </div>

      {isWheelOpen && (
        <div className="wheel-question__wheel-overlay" role="dialog" aria-label="Losowanie kołem fortuny">
          <button
            type="button"
            className="wheel-question__wheel-close"
            onClick={handleExitWheel}
            disabled={spinPhase !== "idle"}
            aria-label="Wyjdź z koła fortuny"
          >
            WYJDŹ Z KOŁA
          </button>
          <div className="wheel-question__result" role="status" aria-live="polite">
            {wheelValue !== null
              ? <>WYLOSOWANO <strong>{getWheelLabel(wheelValue)}</strong></>
              : spinPhase === "stopping" ? "KOŁO ZWALNIA" : spinPhase === "spinning" ? "KOŁO W RUCHU" : "GOTOWE DO LOSOWANIA"}
          </div>

          <div className="wheel-question__wheel-stage" role="img" aria-label="Koło fortuny z polami losowania">
            <svg
              className="wheel-question__wheel-rotor"
              viewBox="0 0 400 400"
              style={{ transform: `rotate(${wheelRotation}deg)` }}
              aria-hidden="true"
            >
              {wheelSegmentLayout.map((segment, index) => {
                return (
                  <g key={`${segment.value}-${index}`}>
                    <path
                      d={getWheelSectorPath(segment)}
                      fill={WHEEL_COLORS[index % WHEEL_COLORS.length]}
                      stroke="#fff9e8"
                      strokeWidth="3"
                      strokeLinejoin="round"
                    />
                  </g>
                );
              })}
              <circle cx="200" cy="200" r="196" fill="none" stroke="#fff9e8" strokeWidth="8" />
            </svg>
            <svg className="wheel-question__wheel-labels" viewBox="0 0 400 400" aria-hidden="true">
              <g transform={`rotate(${wheelRotation} 200 200)`}>
                {wheelSegmentLayout.map((segment, index) => {
                  const labelPoint = getWheelPoint(segment.center, 132);
                  const label = segment.value === "freeVowel" ? "SAMOGŁOSKA" : getWheelLabel(segment.value);
                  return (
                    <text
                      key={`${segment.value}-${index}`}
                      x={labelPoint.x}
                      y={labelPoint.y}
                      transform={`rotate(${-wheelRotation} ${labelPoint.x} ${labelPoint.y})`}
                      fill="#1b2733"
                      fontSize="13"
                      fontWeight="800"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {label}
                    </text>
                  );
                })}
              </g>
            </svg>
            <span className="wheel-question__pointer" aria-hidden="true" />
            <div className="wheel-question__wheel-center" aria-hidden="true"><span>KOŁO</span></div>
          </div>

          <div className="wheel-question__controls wheel-question__wheel-controls">
            {spinPhase === "spinning" && (
              <button type="button" className="wheel-question__spin wheel-question__stop" onClick={handleStopSpin}>
                STOP
              </button>
            )}
            {spinPhase === "idle" && wheelValue === null && (
              <button type="button" className="wheel-question__spin" onClick={handleStartSpin}>
                START KRĘCENIA
              </button>
            )}
            {wheelValue !== null && spinPhase === "idle" && (
              <button type="button" className="wheel-question__spin" onClick={handleExitWheel}>
                PRZEJDŹ DO HASŁA
              </button>
            )}
            {wheelValue === "bankrupt" && (
                <button type="button" className="wheel-question__confirm-outcome" onClick={handleConfirmBankrupt}>
                ZATWIERDŹ BANKRUTA
              </button>
            )}
          </div>
        </div>
      )}

      <div className="wheel-question__letters" aria-label="Wybór litery">
        {availableLetters.map((letter) => {
          const vowel = isWheelVowel(letter);
          const needsVowelPurchase = vowel && wheelValue !== "freeVowel";
          const needsConsonantTurn = !vowel && wheelValue === "freeVowel";
          return (
            <button
              key={letter}
              type="button"
              className={`${vowel ? "is-vowel" : "is-consonant"} ${needsVowelPurchase || needsConsonantTurn ? "is-disabled-phase" : ""}`}
              onClick={() => handleLetter(letter)}
              disabled={wheelValue === null || needsVowelPurchase || needsConsonantTurn}
            >
              {letter}
            </button>
          );
        })}
      </div>

      <div className="wheel-question__master-controls">
        <span>Decyzja mistrza gry</span>
        <button type="button" onClick={handleMasterAccept}>UZNANO HASŁO</button>
        <button type="button" onClick={handleMasterReject}>NASTĘPNY GRACZ</button>
      </div>

      <button type="button" className="wheel-question__exit" onClick={onExit}>
        WRÓĆ DO PLANSZY
      </button>
    </section>
  );
};

WheelQuestion.propTypes = {
  category: PropTypes.object.isRequired,
  question: PropTypes.object.isRequired,
  players: PropTypes.arrayOf(PropTypes.object).isRequired,
  onChangePoints: PropTypes.func.isRequired,
  wheelRoundState: PropTypes.object,
  onWheelRoundStateChange: PropTypes.func.isRequired,
  onWheelRoundAction: PropTypes.func.isRequired,
  onFinish: PropTypes.func.isRequired,
  onExit: PropTypes.func.isRequired,
  wheelControlEvent: PropTypes.shape({
    id: PropTypes.string,
    action: PropTypes.oneOf(["start", "stop"]),
  }),
};

WheelQuestion.defaultProps = {
  wheelControlEvent: null,
  wheelRoundState: null,
};

export default WheelQuestion;
