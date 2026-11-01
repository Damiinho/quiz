export const compactGameSnapshot = (state, referenceQuiz = state?.gameSettings?.quiz) => {
  if (!state) return null;
  const sourceSettings = state.gameSettings || { players: [], quiz: null, wiemLepiejLimit: 1 };
  const quiz = sourceSettings.quiz || referenceQuiz;
  const completedQuestionIds = state.completedQuestionIds || (quiz?.categories || [])
    .flatMap((category) => (category.list || [])
      .filter((question) => question.done)
      .map((question) => question.id))
    .filter(Boolean);

  return {
    gameSettings: {
      ...sourceSettings,
      players: JSON.parse(JSON.stringify(sourceSettings.players || [])),
      quiz: undefined,
    },
    quizId: state.quizId || quiz?.id || null,
    completedQuestionIds,
    scoreHistory: JSON.parse(JSON.stringify(state.scoreHistory || [])),
    isQuestionActive: Boolean(state.isQuestionActive),
    selectedCategoryName: state.selectedCategoryName || null,
    wheelRoundState: state.wheelRoundState ? JSON.parse(JSON.stringify(state.wheelRoundState)) : null,
    showAnswer: Boolean(state.showAnswer),
    isAudioPlaying: false,
    buzzerQueue: JSON.parse(JSON.stringify(state.buzzerQueue || [])),
    auctionBids: JSON.parse(JSON.stringify(state.auctionBids || {})),
    playerAnswers: JSON.parse(JSON.stringify(state.playerAnswers || {})),
    auctionStage: state.auctionStage || 0,
    isAuctionTimerRunning: Boolean(state.isAuctionTimerRunning),
  };
};

export const restoreQuizProgress = (quiz, completedQuestionIds = []) => {
  if (!quiz) return null;
  const completedIds = new Set(completedQuestionIds);
  return {
    ...quiz,
    categories: (quiz.categories || []).map((category) => ({
      ...category,
      list: (category.list || []).map((question) => ({
        ...question,
        done: completedIds.has(question.id),
      })),
    })),
  };
};

export const compactQuizLog = (log, referenceQuiz) => (Array.isArray(log) ? log : []).map((entry) => {
  const compactLegacySnapshot = (snapshot) => {
    if (!snapshot?.gameSettings) return snapshot;
    const sourceQuiz = snapshot.gameSettings.quiz;
    const completedQuestionIds = snapshot.completedQuestionIds || (sourceQuiz?.categories || [])
      .flatMap((category, categoryIndex) => (category.list || [])
        .map((question, questionIndex) => ({ question, categoryIndex, questionIndex }))
        .filter(({ question }) => question.done)
        .map(({ question, categoryIndex, questionIndex }) =>
          question.id || referenceQuiz?.categories?.[categoryIndex]?.list?.[questionIndex]?.id
        ))
      .filter(Boolean);

    return {
      ...snapshot,
      gameSettings: { ...snapshot.gameSettings, quiz: undefined },
      quizId: snapshot.quizId || sourceQuiz?.id || referenceQuiz?.id || null,
      completedQuestionIds,
    };
  };

  return {
    ...entry,
    before: compactLegacySnapshot(entry.before),
    after: compactLegacySnapshot(entry.after),
  };
});

export const getScoreTimeline = (quizLog = [], undoPointer = quizLog.length - 1, fallbackPlayers = []) => {
  const activeLog = (quizLog || []).slice(0, Math.max(0, undoPointer + 1));
  const initialPlayers = activeLog[0]?.before?.gameSettings?.players || fallbackPlayers;
  const playerNames = new Set(initialPlayers.map((player) => player.name));
  const labels = ["Start"];
  const valuesByPlayer = new Map(initialPlayers.map((player) => [player.name, [Number(player.points) || 0]]));
  const changes = [];

  activeLog.forEach((entry) => {
    const beforePlayers = entry.before?.gameSettings?.players;
    const afterPlayers = entry.after?.gameSettings?.players;
    if (!beforePlayers || !afterPlayers) return;

    const beforePoints = new Map(beforePlayers.map((player) => [player.name, Number(player.points) || 0]));
    const afterPoints = new Map(afterPlayers.map((player) => [player.name, Number(player.points) || 0]));
    const names = new Set([...beforePoints.keys(), ...afterPoints.keys()]);
    const changedPlayers = [...names]
      .filter((name) => beforePoints.get(name) !== afterPoints.get(name))
      .map((name) => ({
        name,
        before: beforePoints.get(name) ?? 0,
        after: afterPoints.get(name) ?? 0,
        delta: (afterPoints.get(name) ?? 0) - (beforePoints.get(name) ?? 0),
      }));
    if (changedPlayers.length === 0) return;

    changedPlayers.forEach(({ name }) => playerNames.add(name));
    const label = entry.timestamp || `Akcja ${labels.length}`;
    labels.push(label);
    playerNames.forEach((name) => {
      if (!valuesByPlayer.has(name)) valuesByPlayer.set(name, Array(labels.length - 1).fill(null));
      const values = valuesByPlayer.get(name);
      if (values.length < labels.length - 1) values.push(null);
      values.push(afterPoints.has(name) ? afterPoints.get(name) : null);
    });
    changes.push({ timestamp: label, description: entry.description || entry.type || "Zmiana punktów", players: changedPlayers });
  });

  return {
    labels,
    series: [...valuesByPlayer].map(([name, values]) => ({ name, values })),
    changes,
  };
};

export const buildScoreReportRows = (players, scoreTimeline) => {
  const rankingRows = [...(players || [])]
    .sort((first, second) => (Number(second.points) || 0) - (Number(first.points) || 0))
    .map((player, index) => ({
      Typ: "RANKING KOŃCOWY",
      Czas: "",
      Miejsce: index + 1,
      Gracz: player.name,
      Punkty: player.points,
      Zmiana: "",
      Akcja: "",
    }));
  const historyRows = (scoreTimeline?.changes || []).flatMap((change) => change.players.map((player) => ({
    Typ: "HISTORIA PUNKTÓW",
    Czas: change.timestamp,
    Miejsce: "",
    Gracz: player.name,
    Punkty: player.after,
    Zmiana: player.delta,
    Akcja: change.description,
  })));

  return [...rankingRows, ...historyRows];
};