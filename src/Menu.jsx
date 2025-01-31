import { Button } from "@mui/material";
import { useContext } from "react";
import { AppContext } from "./contexts/AppContext";

const Menu = () => {
  const { screen, setScreen } = useContext(AppContext);
  return (
    <>
      <div className="menu">
        {screen === "main" && (
          <>
            <div className="menu-button">
              <Button
                variant="outlined"
                onClick={() => setScreen("chooseType")}
              >
                Zagraj
              </Button>
            </div>
            <div className="menu-button">
              <Button variant="outlined" disabled>
                Stwórz nowy
              </Button>
            </div>
          </>
        )}
        {screen === "chooseType" && (
          <>
            <div className="menu-button">
              <Button
                variant="outlined"
                onClick={() => setScreen("chooseType")}
              >
                Wybierz gotowy zestaw
              </Button>
            </div>
            <div className="menu-button">
              <Button variant="outlined">Skomponuj zestaw</Button>
            </div>
            <div className="menu-button">
              <Button variant="outlined">Wcztaj z pliku</Button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Menu;
