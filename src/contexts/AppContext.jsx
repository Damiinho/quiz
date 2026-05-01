import { createContext, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { defaultQuizzes } from "../data/defaultQuizzes";
import {
  clearSavedGameState,
  loadCustomQuizzes,
  loadGameState,
  saveCustomQuizzes,
  saveGameState,
} from "../utils/quizStorage";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const savedGameState = loadGameState();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [screen, setScreen] = useState(savedGameState?.screen || "start");
  const [isQuestionActive, setIsQuestionActive] = useState(
    savedGameState?.isQuestionActive || false
  );
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [customQuizzes, setCustomQuizzes] = useState(loadCustomQuizzes);
  const [gameSettings, setGameSettings] = useState(
    savedGameState?.gameSettings || {
      players: [],
      quiz: {},
    }
  );

  // Typy kategorii: standard, illustrated, forehead, auction, album.
  const quizList = useMemo(
    () => [...defaultQuizzes, ...customQuizzes],
    [customQuizzes]
  );

  const addCustomQuiz = (quiz) => {
    setCustomQuizzes((prevQuizzes) => [...prevQuizzes, quiz]);
  };

  const updateCustomQuiz = (quizIndex, quiz) => {
    setCustomQuizzes((prevQuizzes) =>
      prevQuizzes.map((currentQuiz, index) => (index === quizIndex ? quiz : currentQuiz))
    );
  };

  const resetSavedGame = () => {
    clearSavedGameState();
    setScreen("start");
    setIsQuestionActive(false);
    setSelectedCategory(null);
    setGameSettings({ players: [], quiz: {} });
  };

  useEffect(() => {
    saveCustomQuizzes(customQuizzes);
  }, [customQuizzes]);

  useEffect(() => {
    saveGameState({
      screen,
      isQuestionActive,
      gameSettings,
    });
  }, [screen, isQuestionActive, gameSettings]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const providerValue = {
    windowWidth,
    screen,
    setScreen,
    gameSettings,
    setGameSettings,
    quizList,
    customQuizzes,
    setCustomQuizzes,
    addCustomQuiz,
    updateCustomQuiz,
    editingQuiz,
    setEditingQuiz,
    resetSavedGame,
    isQuestionActive,
    setIsQuestionActive,
    selectedCategory,
    setSelectedCategory,
  };

  return (
    <AppContext.Provider value={providerValue}>{children}</AppContext.Provider>
  );
};

AppProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AppProvider;
