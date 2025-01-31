import { createContext, useEffect, useState } from "react";
import PropTypes from "prop-types";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [screen, setScreen] = useState("start");
  const [gameSettings, setGameSettings] = useState({
    players: [],
    quiz: {},
  });

  const quizList = [
    {
      name: "Testowy",
      categories: [
        {
          name: "Polska",
          list: [
            {
              no: 1,
              question: "Jak się masz?",
              answers: ["Dobrze", "Źle", "Jako-tako", "Bywało lepiej"],
              correctAnswer: ["Bywało lepiej"],
              done: false,
            },
          ],
        },
        {
          name: "Niemcy",
          list: [
            {
              no: 1,
              question: "Jak das się masz?",
              answers: ["Dobrze", "Źle", "Jako-tako", "Bywało lepiej"],
              correctAnswer: ["Bywało lepiej"],
              done: false,
            },
            {
              no: 2,
              question: "Jak das się masz hier?",
              answers: ["Dobrze", "Źle", "Jako-tako", "Bywało lepiej"],
              correctAnswer: ["Bywało lepiej"],
              done: false,
            },
          ],
        },
      ],
    },
    {
      name: "Testowy2",
      categories: [
        {
          name: "Polska",
          list: [
            {
              no: 1,
              question: "Jak się masz?",
              answers: ["Dobrze", "Źle", "Jako-tako", "Bywało lepiej"],
              correctAnswer: ["Bywało lepiej"],
              done: false,
            },
          ],
        },
        {
          name: "Niemcy",
          list: [
            {
              no: 1,
              question: "Jak das się masz?",
              answers: ["Dobrze", "Źle", "Jako-tako", "Bywało lepiej"],
              correctAnswer: ["Bywało lepiej"],
              done: false,
            },
            {
              no: 2,
              question: "Jak das się masz hier?",
              answers: ["Dobrze", "Źle", "Jako-tako", "Bywało lepiej"],
              correctAnswer: ["Bywało lepiej"],
              done: false,
            },
          ],
        },
      ],
    },
  ];

  const providerValue = {
    windowWidth,
    screen,
    setScreen,
    gameSettings,
    setGameSettings,
    quizList,
  };

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <AppContext.Provider value={providerValue}>{children}</AppContext.Provider>
  );
};

AppProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AppProvider;
