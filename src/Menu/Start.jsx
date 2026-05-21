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
          onClick={() => navigate("/kategorie")}
        >
          ZAGRAJ <PlayArrowIcon />
        </button>

        <button 
          onClick={() => navigate("/gracz")}
          style={{ 
              background: "rgba(255, 255, 255, 0.05)", 
              color: "#2ecc71", 
              border: "2px solid #2ecc71", 
              padding: "12px 40px", 
              borderRadius: "12px", 
              fontWeight: "800", 
              cursor: "pointer", 
              fontSize: "14px",
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '24px',
              transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
              e.currentTarget.style.background = "rgba(46, 204, 113, 0.1)";
              e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseOut={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
              e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          DOŁĄCZ DO GRY
        </button>
        <div className="hero__actions">
          <button
            onClick={() => {
              navigate("/wybor");
            }}
          >
            STWÓRZ QUIZ
          </button>
          <button onClick={() => navigate("/ustawienia")}>
            USTAWIENIA
          </button>
        </div>
      </div>
    </div>
  );
};

export default Start;
