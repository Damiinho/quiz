import { Button } from "@mui/material";
import { useContext } from "react";
import { AppContext } from "../contexts/AppContext";

const Start = () => {
  const { setScreen } = useContext(AppContext);
  return (
    <>
      <div className="menu-button">
        <Button variant="outlined" onClick={() => setScreen("chooseType")}>
          Zagraj
        </Button>
      </div>
      <div className="menu-button">
        <Button variant="outlined" disabled>
          Stwórz nowy
        </Button>
      </div>
    </>
  );
};

export default Start;
