import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { AppContext } from "../contexts/AppContext";
import { Modal, Paper, Typography, Box } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { downloadCsv } from "../utils/quizStorage";
import { buildScoreReportRows, getScoreTimeline } from "../utils/gameHistory";

const CHART_COLORS = ["#2ecc71", "#60a5fa", "#f59e0b", "#f472b6", "#a78bfa", "#22d3ee", "#fb7185", "#a3e635"];

const ScoreHistoryChart = ({ timeline }) => {
  const allValues = timeline.series.flatMap((series) => series.values).filter(Number.isFinite);
  if (timeline.series.length === 0 || allValues.length === 0) return null;

  const width = 720;
  const height = 250;
  const plot = { left: 44, right: 704, top: 20, bottom: 188 };
  const minimum = Math.min(0, ...allValues);
  const maximum = Math.max(0, ...allValues);
  const span = Math.max(1, maximum - minimum);
  const x = (index) => plot.left + (timeline.labels.length <= 1
    ? (plot.right - plot.left) / 2
    : index * (plot.right - plot.left) / (timeline.labels.length - 1));
  const y = (value) => plot.bottom - ((value - minimum) / span) * (plot.bottom - plot.top);
  const horizontalGuides = [0, 1, 2, 3].map((step) => minimum + (span * step) / 3);

  return (
    <section className="ranking-score-history" aria-label="Historia punktów">
      <h3>Historia punktów</h3>
      <div className="ranking-score-history__chart-wrap">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Wykres zmian punktów graczy">
          {horizontalGuides.map((value, index) => (
            <g key={`guide-${index}`}>
              <line x1={plot.left} y1={y(value)} x2={plot.right} y2={y(value)} />
              <text x={plot.left - 8} y={y(value) + 4} textAnchor="end">{Math.round(value)}</text>
            </g>
          ))}
          {timeline.series.map((series, seriesIndex) => {
            const color = CHART_COLORS[seriesIndex % CHART_COLORS.length];
            const points = series.values
              .map((value, index) => Number.isFinite(value) ? `${x(index)},${y(value)}` : null)
              .filter(Boolean)
              .join(" ");
            return (
              <g key={series.name}>
                {series.values.filter(Number.isFinite).length > 1 && <polyline points={points} fill="none" stroke={color} />}
                {series.values.map((value, index) => Number.isFinite(value) && (
                  <circle key={`${series.name}-${index}`} cx={x(index)} cy={y(value)} r="4" fill={color} />
                ))}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="ranking-score-history__legend">
        {timeline.series.map((series, index) => (
          <span key={series.name}>
            <i style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
            {series.name}
          </span>
        ))}
      </div>
      {timeline.changes.length === 0 && <p className="ranking-score-history__empty">Brak zmian punktów w tej rozgrywce.</p>}
    </section>
  );
};

ScoreHistoryChart.propTypes = {
  timeline: PropTypes.shape({
    labels: PropTypes.arrayOf(PropTypes.string).isRequired,
    series: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string.isRequired,
      values: PropTypes.array,
    })).isRequired,
    changes: PropTypes.arrayOf(PropTypes.object).isRequired,
  }).isRequired,
};

const Ranking = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { gameSettings, quizLog, undoPointer, resetSavedGame } = useContext(AppContext);

  const sortedPlayers = [...(gameSettings.players || [])].sort((a, b) => b.points - a.points);
  const scoreTimeline = getScoreTimeline(quizLog, undoPointer, gameSettings.players || []);

  const handleDownloadResults = () => {
    downloadCsv(
      buildScoreReportRows(sortedPlayers, scoreTimeline),
      `wyniki-${gameSettings.quiz?.name || "quiz"}.csv`
    );
  };

  const handleExit = () => {
    if (window.confirm("Czy na pewno chcesz zakończyć grę? Wszystkie postępy zostaną usunięte.")) {
      resetSavedGame();
      navigate("/");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      slotProps={{
        backdrop: {
          style: { 
            backgroundColor: 'rgba(15, 23, 42, 0.5)', 
            backdropFilter: 'blur(8px)' 
          }
        }
      }}
    >
      <Paper className="ranking-panel game-panel" sx={{ 
        width: '450px', 
        maxWidth: '90vw', 
        maxHeight: '90vh',
        overflowY: 'auto',
        background: 'rgba(30, 41, 59, 0.95) !important', 
        borderRadius: '24px', 
        padding: '40px',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)',
        outline: 'none'
      }}>
        <Box sx={{ textAlign: 'center', marginBottom: '40px' }}>
          <EmojiEventsIcon sx={{ fontSize: '80px', color: '#eab308', marginBottom: '16px' }} />
          <Typography variant="h4" sx={{ fontWeight: '800', color: '#fff' }}>Ranking</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>{gameSettings.quiz?.name || 'Koniec gry'}</Typography>
        </Box>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px' }}>
          {sortedPlayers.length === 0 ? (
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>Brak graczy</Typography>
          ) : (
            sortedPlayers.map((player, index) => (
              <div 
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px 20px',
                  background: index === 0 ? 'rgba(234, 179, 8, 0.15)' : 'rgba(255,255,255,0.02)',
                  borderRadius: '16px',
                  border: index === 0 ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid rgba(255,255,255,0.05)'
                }}
              >
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  background: index === 0 ? '#eab308' : 'rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '16px',
                  fontWeight: '800',
                  color: index === 0 ? '#000' : '#fff',
                  fontSize: '14px'
                }}>
                  {index + 1}
                </div>
                <div style={{ flex: 1, fontWeight: '700', fontSize: '18px', color: '#fff' }}>{player.name}</div>
                <div style={{ fontWeight: '800', fontSize: '20px', color: index === 0 ? '#eab308' : '#2ecc71' }}>{player.points} pkt</div>
              </div>
            ))
          )}
        </div>

        <ScoreHistoryChart timeline={scoreTimeline} />

        <button
          onClick={handleDownloadResults}
          disabled={sortedPlayers.length === 0}
          style={{ width: '100%', marginBottom: '12px', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontWeight: '700', cursor: sortedPlayers.length ? 'pointer' : 'not-allowed', opacity: sortedPlayers.length ? 1 : 0.45, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
        >
          <FileDownloadIcon fontSize="small" /> POBIERZ WYNIKI CSV
        </button>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={onClose}
            style={{ flex: 1, padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', fontWeight: '700', cursor: 'pointer' }}
          >
            WRÓĆ DO GRY
          </button>
          <button 
            onClick={handleExit}
            style={{ flex: 1, padding: '16px', borderRadius: '12px', background: '#ef4444', border: 'none', color: '#fff', fontWeight: '700', cursor: 'pointer' }}
          >
            ZAKOŃCZ QUIZ
          </button>
        </div>
      </Paper>
    </Modal>
  );
};

Ranking.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default Ranking;
