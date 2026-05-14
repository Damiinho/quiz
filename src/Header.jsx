import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "./contexts/AppContext";

const Header = () => {
  const navigate = useNavigate();
  const { isQuestionActive, setIsQuestionActive } =
    useContext(AppContext);

  const handleHeaderClick = () => {
    if (isQuestionActive) {
      setIsQuestionActive(false);
    }
    navigate("/");
  };

  return (
    <div className="header">
      <div className="header__logo" onClick={handleHeaderClick}>
        super zgadywanka
      </div>
      <div className="header__nav">
        <span onClick={() => navigate("/kategorie")}>Moje quizy</span>
        <span onClick={() => navigate("/stworz")}>Stwórz quiz</span>
        <span onClick={() => {}}>Ustawienia</span>
      </div>
    </div>
  );
};

export default Header;
