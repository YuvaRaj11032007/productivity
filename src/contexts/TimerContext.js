import React, { createContext, useContext, useReducer, useEffect } from 'react';

const TimerContext = createContext();

const initialState = {
  activeTimer: null, // { subjectId, isRunning, elapsedSeconds, startTime, mode, targetDuration }
  timers: {}, // Store multiple timers by subjectId
};

function timerReducer(state, action) {
  switch (action.type) {
    case 'START_TIMER':
      return {
        ...state,
        activeTimer: {
          subjectId: action.payload.subjectId,
          isRunning: true,
          elapsedSeconds: action.payload.elapsedSeconds || 0,
          startTime: action.payload.startTime || Date.now(),
          mode: action.payload.mode || 'pomodoro',
          targetDuration: action.payload.targetDuration || 25 * 60, // 25 minutes default
        },
        timers: {
          ...state.timers,
          [action.payload.subjectId]: {
            subjectId: action.payload.subjectId,
            isRunning: true,
            elapsedSeconds: action.payload.elapsedSeconds || 0,
            startTime: action.payload.startTime || Date.now(),
            mode: action.payload.mode || 'pomodoro',
            targetDuration: action.payload.targetDuration || 25 * 60,
          }
        }
      };
    
    case 'PAUSE_TIMER':
      return {
        ...state,
        activeTimer: state.activeTimer ? {
          ...state.activeTimer,
          isRunning: false,
          elapsedSeconds: action.payload.elapsedSeconds
        } : null,
        timers: state.activeTimer ? {
          ...state.timers,
          [state.activeTimer.subjectId]: {
            ...state.timers[state.activeTimer.subjectId],
            isRunning: false,
            elapsedSeconds: action.payload.elapsedSeconds
          }
        } : state.timers
      };
    
    case 'RESUME_TIMER':
      return {
        ...state,
        activeTimer: state.activeTimer ? {
          ...state.activeTimer,
          isRunning: true,
          startTime: Date.now() - (state.activeTimer.elapsedSeconds * 1000)
        } : null,
        timers: state.activeTimer ? {
          ...state.timers,
          [state.activeTimer.subjectId]: {
            ...state.timers[state.activeTimer.subjectId],
            isRunning: true,
            startTime: Date.now() - (state.activeTimer.elapsedSeconds * 1000)
          }
        } : state.timers
      };
    
    case 'RESET_TIMER':
        {
          const subjectId = action.payload?.subjectId || state.activeTimer?.subjectId;
          if (!subjectId) return state;
          return {
            ...state,
            activeTimer: state.activeTimer && state.activeTimer.subjectId === subjectId
              ? {
                  ...state.activeTimer,
                  isRunning: false,
                  elapsedSeconds: 0,
                  startTime: Date.now()
                }
              : state.activeTimer,
            timers: {
              ...state.timers,
              [subjectId]: {
                ...(state.timers[subjectId] || {}),
                isRunning: false,
                elapsedSeconds: 0,
                startTime: Date.now()
              }
            }
          };
        }
    
    case 'UPDATE_ELAPSED':
      return {
        ...state,
        activeTimer: state.activeTimer ? {
          ...state.activeTimer,
          elapsedSeconds: action.payload.elapsedSeconds
        } : null,
        timers: state.activeTimer ? {
          ...state.timers,
          [state.activeTimer.subjectId]: {
            ...state.timers[state.activeTimer.subjectId],
            elapsedSeconds: action.payload.elapsedSeconds
          }
        } : state.timers
      };
    
    case 'STOP_TIMER':
      return {
        ...state,
        activeTimer: null,
        timers: state.activeTimer ? {
          ...state.timers,
          [state.activeTimer.subjectId]: {
            ...state.timers[state.activeTimer.subjectId],
            isRunning: false
          }
        } : state.timers
      };
    
    case 'LOAD_TIMERS':
      return {
        ...state,
        timers: action.payload.timers || {},
        activeTimer: action.payload.activeTimer || null
      };
    
    default:
      return state;
  }
}

export const TimerProvider = ({ children }) => {
  const [state, dispatch] = useReducer(timerReducer, initialState);

  // Load timers from localStorage on mount
  useEffect(() => {
    try {
      const savedTimers = localStorage.getItem('timerState');
      if (savedTimers) {
        const parsed = JSON.parse(savedTimers);
        dispatch({ type: 'LOAD_TIMERS', payload: parsed });
      }
    } catch (error) {
      console.error('Failed to load timer state:', error);
    }
  }, []);

  // Save timers to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem('timerState', JSON.stringify({
        timers: state.timers,
        activeTimer: state.activeTimer
      }));
    } catch (error) {
      console.error('Failed to save timer state:', error);
    }
  }, [state.timers, state.activeTimer]);

  // Update elapsed time every second when timer is running
  useEffect(() => {
    if (!state.activeTimer?.isRunning) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - state.activeTimer.startTime) / 1000);
      dispatch({ type: 'UPDATE_ELAPSED', payload: { elapsedSeconds: elapsed } });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.activeTimer?.isRunning, state.activeTimer?.startTime]);

  const startTimer = (subjectId, options = {}) => {
    const { mode = 'pomodoro', targetDuration = 25 * 60, elapsedSeconds = 0 } = options;
    dispatch({
      type: 'START_TIMER',
      payload: {
        subjectId,
        mode,
        targetDuration,
        elapsedSeconds,
        startTime: Date.now() - (elapsedSeconds * 1000)
      }
    });
  };

  const pauseTimer = () => {
    if (state.activeTimer?.isRunning) {
      dispatch({
        type: 'PAUSE_TIMER',
        payload: { elapsedSeconds: state.activeTimer.elapsedSeconds }
      });
    }
  };

  const resumeTimer = () => {
    if (state.activeTimer && !state.activeTimer.isRunning) {
      dispatch({ type: 'RESUME_TIMER' });
    }
  };

  const resetTimer = (subjectId) => {
    dispatch({ type: 'RESET_TIMER', payload: { subjectId } });
  };

  const stopTimer = () => {
    if (state.activeTimer) {
      dispatch({ type: 'STOP_TIMER' });
    }
  };

  const getTimerState = (subjectId) => {
    return state.timers[subjectId] || null;
  };

  const isTimerRunning = (subjectId) => {
    return state.activeTimer?.subjectId === subjectId && state.activeTimer?.isRunning;
  };

  const getElapsedTime = (subjectId) => {
    const timer = state.timers[subjectId];
    if (!timer) return 0;
    
    if (timer.isRunning) {
      const now = Date.now();
      return Math.floor((now - timer.startTime) / 1000);
    }
    
    return timer.elapsedSeconds || 0;
  };

  const value = {
    state,
    dispatch,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    stopTimer,
    getTimerState,
    isTimerRunning,
    getElapsedTime,
    activeTimer: state.activeTimer,
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
}

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};

export default TimerContext;
