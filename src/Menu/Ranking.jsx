import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { AppContext } from "../contexts/AppContext";
import { Modal, Paper, Typography, Box } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

const Ranking = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { gameSettings, resetSavedGame } = useContext(AppContext);

  const sortedPlayers = [...(gameSettings.players || [])].sort((a, b) => b.points - a.points);

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
      <Paper sx={{ 
        width: '450px', 
        maxWidth: '90vw', 
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
