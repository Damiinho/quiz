import { useContext } from "react";
import { AppContext } from "../contexts/AppContext";

const Start = () => {
  const { setScreen } = useContext(AppContext);
  return (
    <>
      <div className="menu-button">
        <button onClick={() => setScreen("chooseType")}>
          Zagraj
        </button>
      </div>
      <div className="menu-button">
        <button disabled>
          Stwórz nowy
        </button>
      </div>
    </>
  );
};

export default Start;
