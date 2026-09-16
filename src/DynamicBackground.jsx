import { useEffect, useState, useContext } from "react";
import { useLocation } from "react-router-dom";
import { AppContext } from "./contexts/AppContext";

const DynamicBackground = () => {
  const { appSettings } = useContext(AppContext);
  const location = useLocation();
  const [colors, setColors] = useState([]);
  const [positions, setPositions] = useState([]);

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
    setPositions([
      `${Math.random() * 30}% ${Math.random() * 30}%`,
      `${70 + Math.random() * 30}% ${Math.random() * 30}%`,
      `${Math.random() * 100}% ${Math.random() * 100}%`,
      `${Math.random() * 30}% ${70 + Math.random() * 30}%`,
      `${70 + Math.random() * 30}% ${70 + Math.random() * 30}%`
    ]);
  }, [location.pathname]);

  if (appSettings.themeMode !== "colorful" || colors.length === 0 || positions.length === 0) return null;

  const backgroundStyle = {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      zIndex: -1,
      pointerEvents: "none",
      background: `
        radial-gradient(circle at ${positions[0]}, ${colors[0]} 0%, transparent 50%),
        radial-gradient(circle at ${positions[1]}, ${colors[1]} 0%, transparent 50%),
        radial-gradient(circle at ${positions[2]}, ${colors[2]} 0%, transparent 70%),
        radial-gradient(circle at ${positions[3]}, ${colors[3]} 0%, transparent 50%),
        radial-gradient(circle at ${positions[4]}, ${colors[4]} 0%, transparent 50%)
      `,
      transition: "background 1s ease-in-out"
  };

  return <div style={backgroundStyle} />;
};

export default DynamicBackground;
