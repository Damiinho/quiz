import { useContext } from "react";
import { AppContext } from "./contexts/AppContext";
import Start from "./Menu/Start";
import ChooseType from "./Menu/ChooseType";
import ReadySet from "./Menu/ReadySet";
import Players from "./Menu/Players";
import Game from "./Menu/Game";

const Menu = () => {
  const { screen } = useContext(AppContext);
  return (
    <>
      <div className="menu">
        {screen === "start" && <Start />}
        {screen === "chooseType" && <ChooseType />}
        {screen === "readySet" && <ReadySet />}
        {screen === "players" && <Players />}
        {screen === "game" && <Game />}
      </div>
    </>
  );
};

export default Menu;
