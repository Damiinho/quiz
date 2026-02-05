import { useContext } from "react";
import { AppContext } from "../contexts/AppContext";

const ChooseType = () => {
  const { setScreen } = useContext(AppContext);
  return (
    <>
      <div className="menu-button">
        <button onClick={() => setScreen("readySet")}>
          Wybierz gotowy zestaw
        </button>
      </div>
      <div className="menu-button">
        <button disabled>
          Skomponuj zestaw
        </button>
      </div>
      <div className="menu-button">
        <button disabled>
          Wcztaj z pliku
        </button>
      </div>
    </>
  );
};

export default ChooseType;
