import { useEffect, useState, useMemo, useContext } from "react";
import { useLocation } from "react-router-dom";
import { AppContext } from "./contexts/AppContext";

const DynamicBackground = () => {
  const { appSettings } = useContext(AppContext);
  const location = useLocation();
  const [colors, setColors] = useState([]);

  useEffect(() => {
    // Bardziej nasycone kolory
    const baseColors = [
        `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.35)`,
        `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.35)`,
        `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.35)`,
        `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.35)`,
        `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.35)`,
    ];
    setColors(baseColors);
  }, [location.pathname]);

  const backgroundStyle = useMemo(() => {
    if (appSettings.themeMode !== "colorful" || colors.length === 0) return {};
    
    return {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      zIndex: -1,
      pointerEvents: "none",
      background: `
        radial-gradient(circle at ${Math.random() * 30}% ${Math.random() * 30}%, ${colors[0]} 0%, transparent 50%),
        radial-gradient(circle at ${70 + Math.random() * 30}% ${Math.random() * 30}%, ${colors[1]} 0%, transparent 50%),
        radial-gradient(circle at ${Math.random() * 100}% ${Math.random() * 100}%, ${colors[2]} 0%, transparent 70%),
        radial-gradient(circle at ${Math.random() * 30}% ${70 + Math.random() * 30}%, ${colors[3]} 0%, transparent 50%),
        radial-gradient(circle at ${70 + Math.random() * 30}% ${70 + Math.random() * 30}%, ${colors[4]} 0%, transparent 50%)
      `,
      transition: "background 1s ease-in-out"
    };
  }, [colors, appSettings.themeMode]);

  if (appSettings.themeMode !== "colorful") return null;

  return <div style={backgroundStyle} />;
};

export default DynamicBackground;
