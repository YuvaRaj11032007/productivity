import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  TextField,
  Paper,
  IconButton,
  Chip,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  FormControlLabel,
  Switch,
  Snackbar,
  Alert,
  FormGroup,
  Divider,
  useTheme
} from '@mui/material';
import {
  CheckCircle,
  Settings as SettingsIcon,
  Timer as TimerIcon,
  Alarm as AlarmIcon,
  Notifications as NotificationsIcon,
  Assignment as AssignmentIcon,
  Autorenew as AutorenewIcon,
} from '@mui/icons-material';
import { useTimer } from '../contexts/TimerContext';

const ModernTimer = ({ subjectId, onSessionComplete }) => {
  const theme = useTheme();
  const { 
    activeTimer, 
    startTimer: contextStartTimer, 
    pauseTimer: contextPauseTimer, 
    resetTimer: contextResetTimer, 
    stopTimer: contextStopTimer,
    getElapsedTime,
    isTimerRunning 
  } = useTimer();
  
  // Timer modes
  const TIMER_MODES = {
    FOCUS: 'focus',
    POMODORO: 'pomodoro',
    SHORT_BREAK: 'shortBreak',
    LONG_BREAK: 'longBreak',
    CUSTOM: 'custom'
  };

  // Default timer settings
  const DEFAULT_SETTINGS = {
    [TIMER_MODES.FOCUS]: 0, // Manual tracking (count up)
    [TIMER_MODES.POMODORO]: 25 * 60, // 25 minutes in seconds
    [TIMER_MODES.SHORT_BREAK]: 5 * 60, // 5 minutes in seconds
    [TIMER_MODES.LONG_BREAK]: 15 * 60, // 15 minutes in seconds
    [TIMER_MODES.CUSTOM]: 30 * 60, // 30 minutes in seconds
    autoStartBreaks: false,
    autoStartPomodoros: false,
    longBreakInterval: 4, // After 4 pomodoros
    notifications: true
  };

  // Local state for UI
  const [mode, setMode] = useState(TIMER_MODES.FOCUS);
  const [sessionName, setSessionName] = useState('');
  const [notes, setNotes] = useState('');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [openSettings, setOpenSettings] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [notification, setNotification] = useState({
    open: false,
    severity: 'info',
    message: ''
  });

  // Refs
  const audioRef = useRef(null);

  // Get current timer state
  const isRunning = isTimerRunning(subjectId);
  const time = getElapsedTime(subjectId);
  
  // Initialize audio
  useEffect(() => {
    try {
      audioRef.current = new Audio('/notification.mp3');
      // Preload the audio file
      audioRef.current.load();
    } catch (error) {
      console.warn('Error initializing notification sound:', error);
    }
  }, []);

  // Initialize timer based on mode
  useEffect(() => {
    if (activeTimer?.subjectId === subjectId) {
      // Timer is already running for this subject, don't reset
      return;
    }
    // Reset timer when mode changes (only if no active timer for this subject)
    if (!isRunning) {
      contextResetTimer();
    }
  }, [mode, subjectId, activeTimer, isRunning, contextResetTimer]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.src = '';
        } catch (error) {
          console.warn('Error cleaning up audio:', error);
        }
      }
    };
  }, []);

  // Format time as HH:MM:SS or MM:SS
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Start the timer
  const startTimer = useCallback(() => {
    if (!isRunning) {
      const targetDuration = mode === TIMER_MODES.FOCUS ? 0 : settings[mode];
      contextStartTimer(subjectId, {
        mode,
        targetDuration,
        elapsedSeconds: time
      });
    }
  }, [isRunning, mode, settings, contextStartTimer, subjectId, time, TIMER_MODES.FOCUS]);

  // Pause the timer
  const pauseTimer = () => {
    if (isRunning) {
      contextPauseTimer();
    }
  };

  // Reset the timer
  const resetTimer = useCallback(() => {
    contextResetTimer(subjectId);
  }, [contextResetTimer, subjectId]);

  // Show notification
  const showTimerNotification = useCallback((message, severity = 'info') => {
    setNotification({
      open: true,
      severity,
      message
    });
    setTimeout(() => setNotification(prev => ({ ...prev, open: false })), 5000); // Hide after 5 seconds
    
    // Browser notification if supported and permitted
    if (settings.notifications && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Study Timer', { body: message });
      } catch (error) {
        console.warn('Error showing browser notification:', error);
      }
    }
  }, [settings.notifications]);

  // Handle timer completion
  const handleTimerComplete = useCallback(() => {
    contextStopTimer();
    contextResetTimer();
    
    // Play notification sound if enabled
    if (settings.notifications && audioRef.current) {
      try {
        audioRef.current.play().catch(error => {
          console.warn('Error playing notification sound:', error);
        });
      } catch (error) {
        console.warn('Error playing notification sound:', error);
      }
    }

    if (mode === TIMER_MODES.POMODORO) {
      // Increment completed pomodoros
      const newCompletedPomodoros = completedPomodoros + 1;
      setCompletedPomodoros(newCompletedPomodoros);
      
      // Show notification
      showTimerNotification('Pomodoro completed! Time for a break.');
      
      // Check if it's time for a long break
      if (newCompletedPomodoros % settings.longBreakInterval === 0) {
        setMode(TIMER_MODES.LONG_BREAK);
        if (settings.autoStartBreaks) startTimer();
      } else {
        setMode(TIMER_MODES.SHORT_BREAK);
        if (settings.autoStartBreaks) startTimer();
      }
      
      // Log the completed pomodoro session
      onSessionComplete({
        name: sessionName || `Pomodoro Session ${new Date().toLocaleTimeString()}`,
        duration: settings[TIMER_MODES.POMODORO] / 3600, // Convert to hours
        notes: notes.trim(),
        date: new Date().toISOString().split('T')[0],
      });
      resetTimer();
    } else if (mode === TIMER_MODES.SHORT_BREAK || mode === TIMER_MODES.LONG_BREAK) {
      // Break is over, back to pomodoro
      showTimerNotification('Break completed! Ready to focus again?');
      setMode(TIMER_MODES.POMODORO);
      if (settings.autoStartPomodoros) startTimer();
    }
  }, [contextStopTimer, contextResetTimer, settings, mode, completedPomodoros, onSessionComplete, sessionName, notes, showTimerNotification, startTimer, resetTimer, TIMER_MODES.LONG_BREAK, TIMER_MODES.POMODORO, TIMER_MODES.SHORT_BREAK]);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          showTimerNotification('Notifications enabled', 'success');
        }
      } catch (error) {
        console.warn('Error requesting notification permission:', error);
        setSettings(prev => ({
          ...prev,
          notifications: false
        }));
      }
    }
  }, [showTimerNotification]);

  // Handle mode change
  const handleModeChange = (event, newMode) => {
    if (newMode !== null) {
      setMode(newMode);
    }
  };

  // Handle settings change
  const handleSettingsChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    if (mode === TIMER_MODES.FOCUS) {
      // For focus mode (counting up), cap at 2 hours for the progress circle
      const maxTime = 2 * 60 * 60; // 2 hours in seconds
      return Math.min((time / maxTime) * 100, 100);
    } else {
      // For countdown modes
      return (time / settings[mode]) * 100;
    }
  };

  // Get color based on current mode
  const getModeColor = () => {
    switch (mode) {
      case TIMER_MODES.FOCUS:
        return '#4dabf5'; // Blue for focus
      case TIMER_MODES.POMODORO:
        return '#f44336'; // Red for pomodoro
      case TIMER_MODES.SHORT_BREAK:
        return '#4caf50'; // Green for short break
      case TIMER_MODES.LONG_BREAK:
        return '#2196f3'; // Light blue for long break
      case TIMER_MODES.CUSTOM:
        return '#ff9800'; // Orange for custom
      default:
        return '#4dabf5';
    }
  };

  // Get mode label
  const getModeLabel = () => {
    switch (mode) {
      case TIMER_MODES.FOCUS:
        return 'Focus';
      case TIMER_MODES.POMODORO:
        return 'Pomodoro';
      case TIMER_MODES.SHORT_BREAK:
        return 'Short Break';
      case TIMER_MODES.LONG_BREAK:
        return 'Long Break';
      case TIMER_MODES.CUSTOM:
        return 'Custom';
      default:
        return 'Timer';
    }
  };

  // Complete session (for focus and custom modes)
  const completeSession = () => {
    pauseTimer();

    let durationInHours = 0;
    if (mode === TIMER_MODES.FOCUS) {
      // For focus mode, use elapsed time
      durationInHours = time / 3600;
    } else if (mode === TIMER_MODES.CUSTOM) {
      // For custom mode, use the difference between set time and remaining time
      const elapsedSeconds = settings[mode] ? settings[mode] - time : 0;
      durationInHours = elapsedSeconds / 3600;
    } else if (mode === TIMER_MODES.POMODORO) {
      // For pomodoro, use the full pomodoro duration
      durationInHours = settings[mode] ? settings[mode] / 3600 : 0;
    }
    // Ensure durationInHours is a valid number
    if (isNaN(durationInHours) || durationInHours === undefined) durationInHours = 0;
    onSessionComplete({
      name: sessionName || `Study Session ${new Date().toLocaleTimeString()}`,
      duration: parseFloat(durationInHours.toFixed(2)),
      notes: notes.trim(),
      date: new Date().toISOString().split('T')[0],
    });

    resetTimer();
    setSessionName('');
    setNotes('');
  };

  // Convert minutes to seconds for settings
  const minutesToSeconds = (minutes) => minutes * 60;
  
  // Convert seconds to minutes for settings display
  const secondsToMinutes = (seconds) => seconds / 60;

  // Request notification permission on component mount
  useEffect(() => {
    if (settings.notifications) {
      requestNotificationPermission();
    }
  }, [settings.notifications, requestNotificationPermission]);

  // Styles for the timer container
  const containerStyles = {
    position: 'relative',
    overflow: 'hidden',
    padding: '1.5rem',
    borderRadius: '24px',
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 40, 0.8)' : 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(10px)',
    boxShadow: theme.palette.mode === 'dark' 
      ? '0 10px 30px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.1)'
      : '0 10px 30px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(0, 0, 0, 0.05)',
    maxWidth: '500px',
    margin: '0 auto',
    transition: 'all 0.3s ease',
  };

  return (
    <Paper elevation={0} sx={containerStyles}>
      {/* Timer Header */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2
        }}
      >
        <Typography 
          variant="subtitle1" 
          component="h2" 
          sx={{ 
            fontWeight: 500, 
            color: 'text.secondary',
            fontSize: '0.9rem'
          }}
        >
          {getModeLabel()}
        </Typography>
        
        <IconButton 
          onClick={() => setOpenSettings(true)}
          size="small"
          sx={{ 
            color: 'text.secondary',
            '&:hover': { color: 'primary.main' } 
          }}
        >
          <SettingsIcon fontSize="small" />
        </IconButton>
      </Box>
      
      {/* Timer Tabs */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mb: 3
        }}
      >
        <Tabs 
          value={mode} 
          onChange={handleModeChange} 
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ 
            '& .MuiTabs-flexContainer': {
              justifyContent: 'center',
              gap: { xs: 0.5, sm: 1 }
            },
            '& .MuiTab-root': {
              minWidth: 'auto',
              minHeight: '32px',
              padding: '4px 10px',
              borderRadius: '16px',
              fontSize: '0.7rem',
              textTransform: 'none',
              transition: 'all 0.2s ease',
              mx: 0.5,
              fontWeight: 400
            },
            '& .Mui-selected': {
              backgroundColor: getModeColor(),
              color: 'white',
              fontWeight: 500
            }
          }}
          TabIndicatorProps={{ 
            style: { 
              display: 'none'
            } 
          }}
        >
          <Tab 
            label="Focus" 
            value={TIMER_MODES.FOCUS} 
            sx={{ color: mode === TIMER_MODES.FOCUS ? 'white' : 'text.secondary' }}
          />
          <Tab 
            label="Pomodoro" 
            value={TIMER_MODES.POMODORO} 
            sx={{ color: mode === TIMER_MODES.POMODORO ? 'white' : 'text.secondary' }}
          />
          <Tab 
            label="Short Break" 
            value={TIMER_MODES.SHORT_BREAK} 
            sx={{ color: mode === TIMER_MODES.SHORT_BREAK ? 'white' : 'text.secondary' }}
          />
          <Tab 
            label="Long Break" 
            value={TIMER_MODES.LONG_BREAK} 
            sx={{ color: mode === TIMER_MODES.LONG_BREAK ? 'white' : 'text.secondary' }}
          />
          <Tab 
            label="Custom" 
            value={TIMER_MODES.CUSTOM} 
            sx={{ color: mode === TIMER_MODES.CUSTOM ? 'white' : 'text.secondary' }}
          />
        </Tabs>
      </Box>

      {/* Timer Display */}
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center', 
          position: 'relative', 
          my: 4,
          transition: 'transform 0.3s ease',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: 280,
            height: 280,
            mb: 4,
            borderRadius: '50%',
          }}
        >
          <CircularProgress 
            variant="determinate" 
            value={calculateProgress()} 
            size={280} 
            thickness={3} 
            sx={{ 
              color: getModeColor(),
              position: 'absolute',
              zIndex: 1,
              transition: 'all 0.5s ease',
              borderRadius: '50%',
              opacity: 0.9
            }} 
          />
          <CircularProgress 
            variant="determinate" 
            value={100} 
            size={280} 
            thickness={3} 
            sx={{ 
              color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
              position: 'absolute',
              zIndex: 0
            }} 
          />
          <Box
            sx={{
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              transition: 'all 0.3s ease'
            }}
          >
            <Typography 
              variant="h1" 
              component="div" 
              color="text.primary"
              sx={{ 
                fontWeight: 300, 
                fontSize: { xs: '3rem', sm: '4rem' },
                fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                letterSpacing: '0.02em',
                textAlign: 'center',
                lineHeight: 1
              }}
            >
              {formatTime(time)}
            </Typography>
          </Box>
        </Box>

        {/* Pomodoro Counter */}
        {mode === TIMER_MODES.POMODORO && completedPomodoros > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Chip 
              label={`${completedPomodoros} ${completedPomodoros === 1 ? 'Pomodoro' : 'Pomodoros'} Completed`} 
              color="primary" 
              variant="outlined"
              size="small"
              sx={{ 
                borderRadius: '16px', 
                py: 0.5, 
                px: 1,
                fontWeight: 400,
                fontSize: '0.75rem',
                borderWidth: '1px',
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
              }} 
              onClick={undefined}
            />
          </Box>
        )}

        {/* Timer Controls */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center',
            gap: 2, 
            mb: 3,
            width: '100%' // Ensure full width
          }}
        >
          {!isRunning ? (
            <Button 
              variant="contained" 
              onClick={startTimer}
              sx={{ 
                borderRadius: '50%', 
                width: '80px',
                height: '80px',
                minWidth: 'unset',
                fontSize: '0.9rem',
                fontWeight: 500,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                backgroundColor: getModeColor(),
                color: 'white',
                '&:hover': {
                  backgroundColor: getModeColor(),
                  opacity: 0.9,
                  boxShadow: '0 6px 25px rgba(0, 0, 0, 0.2)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              START
            </Button>
          ) : (
            <Button 
              variant="contained" 
              onClick={pauseTimer}
              sx={{ 
                borderRadius: '50%', 
                width: '80px',
                height: '80px',
                minWidth: 'unset',
                fontSize: '0.9rem',
                fontWeight: 500,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                color: theme.palette.mode === 'dark' ? 'white' : 'text.primary',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                  boxShadow: '0 6px 25px rgba(0, 0, 0, 0.2)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              PAUSE
            </Button>
          )}

          <Button 
            variant="text" 
            onClick={resetTimer}
            size="small"
            sx={{ 
              mt: 1,
              color: 'text.secondary',
              fontSize: '0.75rem',
              fontWeight: 400,
              '&:hover': {
                backgroundColor: 'transparent',
                color: 'text.primary',
                textDecoration: 'underline'
              }
            }}
          >
            Reset
          </Button>

          <Button 
            variant="contained" 
            color="success" 
            startIcon={<CheckCircle />} 
            onClick={completeSession}
            disabled={mode === TIMER_MODES.FOCUS ? time < 60 : time === settings[mode]} // Require at least 1 minute for focus mode
            size="large"
            sx={{ 
              borderRadius: '30px', 
              py: 1, 
              px: 3,
              fontSize: '0.9rem',
              fontWeight: 500,
              boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
              minWidth: { xs: '100%', sm: '160px' },
              '&:hover': {
                boxShadow: theme.palette.mode === 'dark' ? '0 6px 25px rgba(0, 0, 0, 0.4)' : '0 6px 16px rgba(0, 0, 0, 0.15)',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.2s ease',
              opacity: (mode === TIMER_MODES.FOCUS ? time < 60 : time === settings[mode]) ? 0.6 : 1,
              backgroundColor: theme.palette.success.main
            }}
          >
            Complete
          </Button>
        </Box>

        {/* Session Details */}
        <Box 
          sx={{ 
            mt: 3, 
            mb: 2,
            px: { xs: 0, sm: 2 },
            py: 3,
            borderRadius: 3,
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)',
            width: '100%'
          }}
        >
          <Typography 
            variant="h6" 
            gutterBottom 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5,
              px: 3,
              mb: 3,
              fontWeight: 500,
              color: 'text.primary',
              fontSize: '0.95rem'
            }}
          >
            <AssignmentIcon color="primary" fontSize="small" /> Session Details
          </Typography>
          
          <Box sx={{ px: 3 }}>
            <TextField
              label="Session Name"
              variant="outlined"
              fullWidth
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              margin="normal"
              placeholder="e.g., Math Homework"
              InputProps={{
                sx: { 
                  borderRadius: 2,
                  '&.Mui-focused': {
                    boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)'
                  }
                }
              }}
              sx={{ mb: 3 }}
            />
            
            <TextField
              label="Notes"
              variant="outlined"
              fullWidth
              multiline
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              margin="normal"
              placeholder="What are you working on?"
              InputProps={{
                sx: { 
                  borderRadius: 2,
                  '&.Mui-focused': {
                    boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)'
                  }
                }
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Settings Dialog */}
      <Dialog 
        open={openSettings} 
        onClose={() => setOpenSettings(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            overflow: 'hidden',
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            bgcolor: getModeColor(), 
            color: 'white',
            py: 2.5,
            px: 3,
            fontWeight: 500,
            fontSize: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5
          }}
        >
          <SettingsIcon /> Timer Settings
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 2 }}>
          <Typography 
            variant="subtitle1" 
            gutterBottom 
            sx={{ 
              fontWeight: 500, 
              color: 'text.primary',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 2
            }}
          >
            <TimerIcon fontSize="small" /> Timer Durations (minutes)
          </Typography>
          
          <Box sx={{ mb: 4, px: 1 }}>
            <Typography 
              id="pomodoro-slider" 
              gutterBottom
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                color: 'text.secondary',
                fontWeight: 500
              }}
            >
              <span>Pomodoro</span>
              <Chip 
                label={`${secondsToMinutes(settings[TIMER_MODES.POMODORO])} min`} 
                size="small" 
                color="primary"
                sx={{ fontWeight: 500, bgcolor: '#f44336', color: 'white' }}
                onClick={undefined}
              />
            </Typography>
            <Slider
              aria-labelledby="pomodoro-slider"
              value={secondsToMinutes(settings[TIMER_MODES.POMODORO])}
              onChange={(e, newValue) => handleSettingsChange(TIMER_MODES.POMODORO, minutesToSeconds(newValue))}
              min={1}
              max={60}
              valueLabelDisplay="auto"
              sx={{ 
                color: '#f44336',
                '& .MuiSlider-thumb': {
                  width: 16,
                  height: 16,
                  '&:hover, &.Mui-focusVisible': {
                    boxShadow: '0 0 0 8px rgba(244, 67, 54, 0.16)'
                  }
                },
                '& .MuiSlider-valueLabel': {
                  backgroundColor: '#f44336'
                }
              }}
            />
            
            <Typography 
              id="short-break-slider" 
              gutterBottom
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                color: 'text.secondary',
                fontWeight: 500,
                mt: 3
              }}
            >
              <span>Short Break</span>
              <Chip 
                label={`${secondsToMinutes(settings[TIMER_MODES.SHORT_BREAK])} min`} 
                size="small" 
                color="primary"
                sx={{ fontWeight: 500, bgcolor: '#4caf50', color: 'white' }}
              />
            </Typography>
            <Slider
              aria-labelledby="short-break-slider"
              value={secondsToMinutes(settings[TIMER_MODES.SHORT_BREAK])}
              onChange={(e, newValue) => handleSettingsChange(TIMER_MODES.SHORT_BREAK, minutesToSeconds(newValue))}
              min={1}
              max={15}
              valueLabelDisplay="auto"
              sx={{ 
                color: '#4caf50',
                '& .MuiSlider-thumb': {
                  width: 16,
                  height: 16,
                  '&:hover, &.Mui-focusVisible': {
                    boxShadow: '0 0 0 8px rgba(76, 175, 80, 0.16)'
                  }
                },
                '& .MuiSlider-valueLabel': {
                  backgroundColor: '#4caf50'
                }
              }}
            />
            
            <Typography 
              id="long-break-slider" 
              gutterBottom
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                color: 'text.secondary',
                fontWeight: 500,
                mt: 3
              }}
            >
              <span>Long Break</span>
              <Chip 
                label={`${secondsToMinutes(settings[TIMER_MODES.LONG_BREAK])} min`} 
                size="small" 
                color="primary"
                sx={{ fontWeight: 500, bgcolor: '#2196f3', color: 'white' }}
                onClick={undefined}
              />
            </Typography>
            <Slider
              aria-labelledby="long-break-slider"
              value={secondsToMinutes(settings[TIMER_MODES.LONG_BREAK])}
              onChange={(e, newValue) => handleSettingsChange(TIMER_MODES.LONG_BREAK, minutesToSeconds(newValue))}
              min={5}
              max={30}
              valueLabelDisplay="auto"
              sx={{ 
                color: '#2196f3',
                '& .MuiSlider-thumb': {
                  width: 16,
                  height: 16,
                  '&:hover, &.Mui-focusVisible': {
                    boxShadow: '0 0 0 8px rgba(33, 150, 243, 0.16)'
                  }
                },
                '& .MuiSlider-valueLabel': {
                  backgroundColor: '#2196f3'
                }
              }}
            />
            
            <Typography 
              id="custom-timer-slider" 
              gutterBottom
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                color: 'text.secondary',
                fontWeight: 500,
                mt: 3
              }}
            >
              <span>Custom Timer</span>
              <Chip 
                label={`${secondsToMinutes(settings[TIMER_MODES.CUSTOM])} min`} 
                size="small" 
                color="primary"
                sx={{ fontWeight: 500, bgcolor: '#ff9800', color: 'white' }}
                onClick={undefined}
              />
            </Typography>
            <Slider
              aria-labelledby="custom-timer-slider"
              value={secondsToMinutes(settings[TIMER_MODES.CUSTOM])}
              onChange={(e, newValue) => handleSettingsChange(TIMER_MODES.CUSTOM, minutesToSeconds(newValue))}
              min={1}
              max={120}
              valueLabelDisplay="auto"
              sx={{ 
                color: '#ff9800',
                '& .MuiSlider-thumb': {
                  width: 16,
                  height: 16,
                  '&:hover, &.Mui-focusVisible': {
                    boxShadow: '0 0 0 8px rgba(255, 152, 0, 0.16)'
                  }
                },
                '& .MuiSlider-valueLabel': {
                  backgroundColor: '#ff9800'
                }
              }}
            />
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography 
            variant="subtitle1" 
            gutterBottom 
            sx={{ 
              fontWeight: 500, 
              color: 'text.primary',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 2
            }}
          >
            <AlarmIcon fontSize="small" /> Pomodoro Settings
          </Typography>
          
          <Box sx={{ mb: 4, px: 1 }}>
            <Typography 
              id="long-break-interval-slider" 
              gutterBottom
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                color: 'text.secondary',
                fontWeight: 500
              }}
            >
              <span>Long Break After</span>
              <Chip 
                label={`${settings.longBreakInterval} Pomodoros`} 
                size="small" 
                color="primary"
                sx={{ fontWeight: 500 }}
                onClick={undefined}
              />
            </Typography>
            <Slider
              aria-labelledby="long-break-interval-slider"
              value={settings.longBreakInterval}
              onChange={(e, newValue) => handleSettingsChange('longBreakInterval', newValue)}
              min={1}
              max={8}
              step={1}
              marks
              valueLabelDisplay="auto"
              sx={{ 
                '& .MuiSlider-thumb': {
                  width: 16,
                  height: 16,
                }
              }}
            />
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography 
            variant="subtitle1" 
            gutterBottom 
            sx={{ 
              fontWeight: 500, 
              color: 'text.primary',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 2
            }}
          >
            <AutorenewIcon fontSize="small" /> Auto Start Options
          </Typography>
          
          <FormGroup sx={{ px: 1 }}>
            <FormControlLabel 
              control={
                <Switch 
                  checked={settings.autoStartBreaks} 
                  onChange={(e) => handleSettingsChange('autoStartBreaks', e.target.checked)} 
                  color="primary"
                />
              } 
              label="Auto-start Breaks" 
              sx={{ mb: 1 }}
            />
            <FormControlLabel 
              control={
                <Switch 
                  checked={settings.autoStartPomodoros} 
                  onChange={(e) => handleSettingsChange('autoStartPomodoros', e.target.checked)} 
                  color="primary"
                />
              } 
              label="Auto-start Pomodoros" 
            />
          </FormGroup>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography 
            variant="subtitle1" 
            gutterBottom 
            sx={{ 
              fontWeight: 500, 
              color: 'text.primary',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 2
            }}
          >
            <NotificationsIcon fontSize="small" /> Notification Settings
          </Typography>
          
          <Box sx={{ px: 1 }}>
            <FormControlLabel 
              control={
                <Switch 
                  checked={settings.notifications} 
                  onChange={(e) => handleSettingsChange('notifications', e.target.checked)} 
                  color="primary"
                />
              } 
              label="Enable Notifications" 
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)' }}>
          <Button 
            onClick={() => setOpenSettings(false)}
            variant="contained"
            sx={{ 
              borderRadius: '20px',
              px: 3,
              py: 1,
              fontWeight: 500,
              boxShadow: 2
            }}
          >
            Save & Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity={notification.severity} 
          variant="filled"
          sx={{ 
            width: '100%',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            '& .MuiAlert-icon': {
              fontSize: '1.5rem'
            },
            '& .MuiAlert-message': {
              fontSize: '1rem',
              fontWeight: 500
            }
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default ModernTimer;