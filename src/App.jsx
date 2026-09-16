import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./Header";
import DynamicBackground from "./DynamicBackground";
import RouteErrorBoundary from "./RouteErrorBoundary";

const Start = lazy(() => import("./Menu/Start"));
const CreateMenu = lazy(() => import("./Menu/CreateMenu"));
const ReadySet = lazy(() => import("./Menu/ReadySet"));
const Players = lazy(() => import("./Menu/Players"));
const Game = lazy(() => import("./Menu/Game"));
const QuizEditor = lazy(() => import("./Menu/QuizEditor"));
const CreateNew = lazy(() => import("./Menu/CreateNew"));
const ComposeSet = lazy(() => import("./Menu/ComposeSet"));
const Settings = lazy(() => import("./Menu/Settings"));
const PlayerView = lazy(() => import("./Menu/PlayerView"));

function App() {
  return (
    <>
      <DynamicBackground />
      <Header />
      <div className="container">
        <RouteErrorBoundary>
          <Suspense fallback={<div className="route-loading" role="status">ŁADOWANIE...</div>}>
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
          </Suspense>
        </RouteErrorBoundary>
      </div>
    </>
  );
}

export default App;
