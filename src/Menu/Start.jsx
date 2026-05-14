import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../contexts/AppContext";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

const Start = () => {
  const navigate = useNavigate();
  const { setEditingQuiz } = useContext(AppContext);

  return (
    <div className="hero">
      <div className="hero__content">
        <div className="hero__welcome">Witaj w</div>
        <h1 className="hero__title">
          super <br />
          zgadywance
        </h1>
        <p className="hero__subtitle">
          Twórz quizy, graj ze znajomymi i zostań mistrzem zgadywania!
        </p>

        <button 
          className="hero__main-btn" 
          onClick={() => navigate("/wybor")}
        >
          ZAGRAJ <PlayArrowIcon />
        </button>

        <div className="hero__actions">
          <button
            onClick={() => {
              setEditingQuiz(null);
              navigate("/stworz");
            }}
          >
            STWÓRZ QUIZ
          </button>
          <button onClick={() => {}}>
            USTAWIENIA
          </button>
        </div>
      </div>
    </div>
  );
};

export default Start;
