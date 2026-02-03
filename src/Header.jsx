import { useContext } from "react";
import { AppContext } from "./contexts/AppContext";

const Header = () => {
  const { screen, setScreen, isQuestionActive, setIsQuestionActive } =
    useContext(AppContext);

  const handleHeaderClick = () => {
    if (screen === "game") {
      if (isQuestionActive) {
        setIsQuestionActive(false); // Cofnij do listy kategorii
      }
      // Jeśli wyświetla się lista kategorii, nie rób nic
    } else {
      setScreen("start");
    }
  };

  return (
    <div className="header" onClick={handleHeaderClick}>
      super zgadywanka
    </div>
  );
};

export default Header;
