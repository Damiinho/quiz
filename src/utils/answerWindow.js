export const isAnswerWindowOpen = (gameState) => Boolean(
  gameState?.isQuestionActive
  && gameState?.isWriting
  && gameState.questionData?.acceptingAnswers === true
  && Number(gameState.questionData.remainingSeconds) > 0
);