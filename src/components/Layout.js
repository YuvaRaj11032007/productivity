import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Chip } from '@mui/material';
import TimerIcon from '@mui/icons-material/Timer';
import Sidebar from './Sidebar';
import AIAssistant from './AIAssistant';
import { useTimer } from '../contexts/TimerContext';

const Layout = () => {
  const { activeTimer, getElapsedTime } = useTimer();

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#050505' }}>
      <Sidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          marginLeft: '280px', // Width of sidebar
          padding: '32px',
          minHeight: '100vh',
          position: 'relative',
        }}
      >
        {/* Top Bar Area */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          mb: 4,
          position: 'sticky',
          top: 32,
          zIndex: 1100,
          pointerEvents: 'none' // Let clicks pass through to content below if not hitting the timer
        }}>
          {activeTimer && (
            <Chip
              icon={<TimerIcon />}
              label={`Timer: ${formatTime(getElapsedTime(activeTimer.subjectId))}`}
              sx={{
                pointerEvents: 'auto',
                background: 'rgba(139, 92, 246, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                color: '#a78bfa',
                fontWeight: 600,
                boxShadow: '0 0 20px rgba(139, 92, 246, 0.2)',
                '& .MuiChip-icon': {
                  color: '#a78bfa'
                },
                animation: 'pulse-glow 2s infinite'
              }}
            />
          )}
        </Box>

        <Outlet />
      </Box>

      <AIAssistant />
    </Box>
  );
};

export default Layout;
