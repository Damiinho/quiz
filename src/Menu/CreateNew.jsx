import { useContext } from "react";
import { AppContext } from "../contexts/AppContext";

const CreateNew = () => {
  const { setScreen } = useContext(AppContext);

  return (
    <div style={{ paddingTop: 120, color: "#000", textAlign: "center" }}>
      <p style={{ fontSize: 24 }}>tworzy sięsdfghbhaedjtnhrsjnrnjh</p>
      <div style={{ marginTop: 20 }}>
        <button onClick={() => setScreen("start")}>nazwa quizu</button>
        <button onClick={() => setScreen("start")}>utwórz kategorię</button>
        <button onClick={() => setScreen("start")}>utwórz pytanie</button>
        lista kategorii i pytań z możliwością edycji i usuwania
        <button onClick={() => setScreen("start")}>zakończ</button>
      </div>
    </div>
  );
};

export default CreateNew;
