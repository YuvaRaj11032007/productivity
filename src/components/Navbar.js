import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, Chip } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import BookIcon from '@mui/icons-material/Book';
import TimerIcon from '@mui/icons-material/Timer';
import { useTimer } from '../contexts/TimerContext';

const Navbar = () => {
  const location = useLocation();
  const { activeTimer, getElapsedTime } = useTimer();

  const isActive = (path) => {
    return location.pathname === path;
  };

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
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Preparation Tracker
        </Typography>
        
        {/* Timer Indicator */}
        {activeTimer && (
          <Chip
            icon={<TimerIcon />}
            label={`Timer: ${formatTime(getElapsedTime(activeTimer.subjectId))}`}
            color="secondary"
            variant="filled"
            sx={{ 
              mr: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              '& .MuiChip-icon': {
                color: 'white'
              }
            }}
          />
        )}
        
        <Box sx={{ display: 'flex' }}>
          <Button
            color="inherit"
            component={RouterLink}
            to="/"
            startIcon={<DashboardIcon />}
            sx={{ 
              fontWeight: isActive('/') ? 'bold' : 'normal',
              borderBottom: isActive('/') ? '2px solid white' : 'none'
            }}
          >
            Dashboard
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/calendar"
            startIcon={<CalendarTodayIcon />}
            sx={{ 
              fontWeight: isActive('/calendar') ? 'bold' : 'normal',
              borderBottom: isActive('/calendar') ? '2px solid white' : 'none'
            }}
          >
            Calendar
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/statistics"
            startIcon={<BarChartIcon />}
            sx={{ 
              fontWeight: isActive('/statistics') ? 'bold' : 'normal',
              borderBottom: isActive('/statistics') ? '2px solid white' : 'none'
            }}
          >
            Statistics
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/blogs"
            startIcon={<BookIcon />}
            sx={{ 
              fontWeight: isActive('/blogs') ? 'bold' : 'normal',
              borderBottom: isActive('/blogs') ? '2px solid white' : 'none'
            }}
          >
            Journal
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/settings"
            startIcon={<SettingsIcon />}
            sx={{ 
              fontWeight: isActive('/settings') ? 'bold' : 'normal',
              borderBottom: isActive('/settings') ? '2px solid white' : 'none'
            }}
          >
            Settings
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;