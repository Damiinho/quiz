import { useContext } from "react";
import { AppContext } from "./contexts/AppContext";
import Start from "./Menu/Start";
import ChooseType from "./Menu/ChooseType";
import ReadySet from "./Menu/ReadySet";
import Players from "./Menu/Players";
import Game from "./Menu/Game";
import CreateNew from "./Menu/CreateNew";

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
        {screen === "createNew" && <CreateNew />}
      </div>
    </>
  );
};

export default Menu;
