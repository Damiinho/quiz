import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./Header";
import Start from "./Menu/Start";
import CreateMenu from "./Menu/CreateMenu";
import ReadySet from "./Menu/ReadySet";
import Players from "./Menu/Players";
import Game from "./Menu/Game";
import QuizEditor from "./Menu/QuizEditor";
import CreateNew from "./Menu/CreateNew";
import ComposeSet from "./Menu/ComposeSet";
import Settings from "./Menu/Settings";
import PlayerView from "./Menu/PlayerView";
import DynamicBackground from "./DynamicBackground";

function App() {
  return (
    <>
      <DynamicBackground />
      <Header />
      <div className="container">
        <Routes>
          <Route path="/" element={<Start />} />
          <Route path="/wybor" element={<CreateMenu />} />
          <Route path="/kategorie" element={<ReadySet />} />
          <Route path="/gracze" element={<Players />} />
          <Route path="/gra" element={<Game />} />
          <Route path="/edytuj" element={<QuizEditor />} />
          <Route path="/stworz" element={<CreateNew />} />
          <Route path="/zloz" element={<ComposeSet />} />
          <Route path="/ustawienia" element={<Settings />} />
          <Route path="/gracz" element={<PlayerView />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
