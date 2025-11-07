import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './App.css';

// Components
import Navbar from './components/Navbar';
import AIAssistant from './components/AIAssistant';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Dashboard from './pages/Dashboard';
import SubjectDetail from './pages/SubjectDetail';
import Calendar from './pages/Calendar';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';
import Blogs from './pages/Blogs';
import Auth from './pages/Auth';

// Context
import { SubjectsProvider } from './contexts/SubjectsContext';
import { AppProvider } from './contexts/AppContext';
import { AIProvider } from './contexts/AIContext';
import { TimerProvider } from './contexts/TimerContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function MainApp() {
  const { user } = useAuth();

  return (
    <>
      <div style={{ display: user ? 'block' : 'none' }}>
        <AppProvider>
          <SubjectsProvider>
            <TimerProvider>
              <AIProvider>
                <Router>
                  <div className="App">
                    <Navbar />
                    <div className="container">
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/subjects" element={<Dashboard />} />
                        <Route path="/subject/:subjectId" element={<SubjectDetail />} />
                        <Route path="/calendar" element={<Calendar />} />
                        <Route path="/statistics" element={<Statistics />} />
                        <Route path="/blogs" element={<Blogs />} />
                        <Route path="/settings" element={<Settings />} />
                      </Routes>
                    </div>
                    <AIAssistant />
                  </div>
                </Router>
              </AIProvider>
            </TimerProvider>
          </SubjectsProvider>
        </AppProvider>
      </div>
      <div style={{ display: user ? 'none' : 'block' }} inert={user ? 'true' : undefined}>
        <Auth />
      </div>
    </>
  );
}

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    // Get dark mode setting from localStorage
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      return settings.darkMode || false;
    }
    return false;
  });

  // Listen for changes to the appSettings in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setDarkMode(settings.darkMode || false);
      }
    };

    // Check for changes every second (since storage events don't fire in the same window)
    const interval = setInterval(handleStorageChange, 1000);
    return () => clearInterval(interval);
  }, []);

  // Create developer-style dark theme colors inspired by the neon hexagon image
  const devThemeColors = {
    background: {
      default: '#0d0d12', // Very dark background to match image
      paper: '#14141c',   // Slightly lighter than background
      card: '#1a1a24'     // Card background
    },
    primary: {
      main: '#ff00aa',    // Neon pink from the image
      light: '#ff5cc7',
      dark: '#c4008a'
    },
    accent: {
      purple: '#9c27b0',  // Secondary accent colors
      blue: '#3f51b5',
      cyan: '#00e5ff'
    }
  };

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: darkMode ? devThemeColors.primary.main : '#6366f1',
        light: darkMode ? devThemeColors.primary.light : '#818cf8',
        dark: darkMode ? devThemeColors.primary.dark : '#4f46e5',
      },
      secondary: {
        main: darkMode ? devThemeColors.accent.purple : '#ec4899',
      },
      background: {
        default: darkMode ? devThemeColors.background.default : '#f9fafb',
        paper: darkMode ? devThemeColors.background.paper : '#ffffff',
      },
      success: {
        main: darkMode ? '#00e676' : '#10b981',
      },
      warning: {
        main: darkMode ? '#ffea00' : '#f59e0b',
      },
      error: {
        main: darkMode ? '#ff1744' : '#ef4444',
      },
      info: {
        main: darkMode ? devThemeColors.accent.blue : '#3b82f6',
      },
      text: {
        primary: darkMode ? '#ffffff' : '#111827',
        secondary: darkMode ? '#b0b0c0' : '#6b7280',
      },
      divider: darkMode ? '#2c2c3a' : '#e5e7eb',
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
      },
      h2: {
        fontWeight: 600,
      },
      h3: {
        fontWeight: 600,
      },
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 500,
      },
      h6: {
        fontWeight: 500,
      },
      button: {
        fontWeight: 500,
        textTransform: 'none',
      },
      code: {
        fontFamily: '"JetBrains Mono", "Fira Code", "Menlo", monospace',
        fontSize: '0.9em',
        backgroundColor: darkMode ? '#1e2329' : '#f3f4f6',
        padding: '0.2em 0.4em',
        borderRadius: '4px',
      }
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarColor: darkMode ? '#30363d #0d1117' : '#e5e7eb #ffffff',
            '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
              width: '8px',
              height: '8px',
            },
            '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
              backgroundColor: darkMode ? '#30363d' : '#e5e7eb',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
              backgroundColor: darkMode ? '#6e7681' : '#d1d5db',
            },
            '&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track': {
              backgroundColor: darkMode ? '#0d1117' : '#ffffff',
            },
            // Add background image for dark mode
            ...(darkMode && {
              backgroundImage: 'url(/neon-hexagon-bg.jpg)', // Local image in public folder
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundAttachment: 'fixed',
              backgroundRepeat: 'no-repeat',
              backgroundColor: '#0d0d12', // Fallback color
              '&::before': {
                content: '""',
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(13, 13, 18, 0.75)', // Semi-transparent overlay
                zIndex: -1,
              },
              '.App': {
                backgroundColor: 'transparent', // Make sure App background is transparent
              },
              '.app-main': {
                backgroundColor: 'transparent', // Make sure main content area is transparent
              }
            }),
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '10px 16px',
            boxShadow: 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              boxShadow: darkMode ? '0 8px 25px rgba(255, 0, 170, 0.3)' : '0 4px 8px rgba(0, 0, 0, 0.1)',
              transform: 'translateY(-2px)',
            },
          },
          contained: {
            backgroundColor: darkMode ? devThemeColors.background.card : undefined,
            border: darkMode ? '1px solid rgba(255, 0, 170, 0.3)' : undefined,
            '&:hover': {
              backgroundColor: darkMode ? 'rgba(255, 0, 170, 0.1)' : undefined,
              borderColor: darkMode ? devThemeColors.primary.main : undefined,
              boxShadow: darkMode ? '0 8px 25px rgba(255, 0, 170, 0.4)' : '0 4px 8px rgba(0, 0, 0, 0.1)',
              transform: 'translateY(-2px)',
            },
          },
          outlined: {
            borderColor: darkMode ? '#30363d' : undefined,
            '&:hover': {
              borderColor: darkMode ? devThemeColors.primary.main : undefined,
              backgroundColor: darkMode ? 'rgba(255, 0, 170, 0.05)' : undefined,
              boxShadow: darkMode ? '0 4px 15px rgba(255, 0, 170, 0.2)' : undefined,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: darkMode ? '0 4px 20px rgba(255, 0, 170, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.05)',
            backgroundColor: darkMode ? 'rgba(26, 26, 36, 0.8)' : '#ffffff',
            border: darkMode ? '1px solid rgba(255, 0, 170, 0.2)' : 'none',
            backdropFilter: darkMode ? 'blur(10px)' : 'none',
            overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: darkMode ? '0 12px 40px rgba(255, 0, 170, 0.25)' : '0 12px 20px rgba(0, 0, 0, 0.1)',
              borderColor: darkMode ? 'rgba(255, 0, 170, 0.4)' : undefined,
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: darkMode ? '0 4px 20px rgba(255, 0, 170, 0.15)' : '0 2px 10px rgba(0, 0, 0, 0.05)',
            backgroundColor: darkMode ? 'rgba(20, 20, 28, 0.8)' : '#ffffff',
            backdropFilter: darkMode ? 'blur(10px)' : 'none',
            color: darkMode ? '#ffffff' : '#111827',
            borderBottom: darkMode ? '1px solid rgba(255, 0, 170, 0.2)' : 'none',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 500,
            backgroundColor: darkMode ? '#2d333b' : undefined,
            border: darkMode ? '1px solid #30363d' : undefined,
          },
          filled: {
            backgroundColor: darkMode ? '#2d333b' : undefined,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: darkMode ? devThemeColors.background.paper : '#ffffff',
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            backgroundColor: darkMode ? 'rgba(44, 44, 58, 0.5)' : undefined,
            borderRadius: 4,
            height: 8,
          },
          barColorPrimary: {
            backgroundImage: darkMode ? 
              'linear-gradient(90deg, #c4008a 0%, #ff00aa 50%, #ff5cc7 100%)' : 
              undefined,
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: darkMode ? '#30363d' : '#e5e7eb',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: darkMode ? '#30363d' : undefined,
              },
              '&:hover fieldset': {
                borderColor: darkMode ? '#58a6ff' : undefined,
              },
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: darkMode ? '1px solid #30363d' : undefined,
          },
          head: {
            backgroundColor: darkMode ? devThemeColors.background.card : undefined,
          },
        },
      },
    },
  });

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
