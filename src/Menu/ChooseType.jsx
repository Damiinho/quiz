import { Button } from "@mui/material";
import { useContext } from "react";
import { AppContext } from "../contexts/AppContext";

const ChooseType = () => {
  const { setScreen } = useContext(AppContext);
  return (
    <>
      <div className="menu-button">
        <Button variant="outlined" onClick={() => setScreen("readySet")}>
          Wybierz gotowy zestaw
        </Button>
      </div>
      <div className="menu-button">
        <Button variant="outlined" disabled>
          Skomponuj zestaw
        </Button>
      </div>
      <div className="menu-button">
        <Button variant="outlined" disabled>
          Wcztaj z pliku
        </Button>
      </div>
    </>
  );
};

export default ChooseType;
