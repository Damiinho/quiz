import { useContext } from "react";
import { AppContext } from "../contexts/AppContext";

const Start = () => {
  const { setEditingQuiz, setScreen } = useContext(AppContext);

  return (
    <>
      <div className="menu-button">
        <button onClick={() => setScreen("chooseType")}>Zagraj</button>
      </div>
      <div className="menu-button">
        <button
          onClick={() => {
            setEditingQuiz(null);
            setScreen("createNew");
          }}
        >
          Stwórz quiz
        </button>
      </div>
    </>
  );
};

export default Start;
