import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './App.css';

// Components
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';

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
                <Routes>
                  <Route element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="/subjects" element={<Dashboard />} />
                    <Route path="/subject/:subjectId" element={<SubjectDetail />} />
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/statistics" element={<Statistics />} />
                    <Route path="/blogs" element={<Blogs />} />
                    <Route path="/settings" element={<Settings />} />
                  </Route>
                </Routes>
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
  const [darkMode, setDarkMode] = useState(true); // Default to dark mode for glassmorphism

  // Listen for changes to the appSettings in localStorage
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'appSettings') {
        const savedSettings = event.newValue;
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          setDarkMode(settings.darkMode !== undefined ? settings.darkMode : true);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const theme = createTheme({
    palette: {
      mode: 'dark', // Always dark mode for this design
      primary: {
        main: '#8b5cf6',
        light: '#a78bfa',
        dark: '#7c3aed',
      },
      secondary: {
        main: '#ec4899',
        light: '#f472b6',
        dark: '#db2777',
      },
      background: {
        default: '#050505',
        paper: 'rgba(20, 20, 25, 0.6)',
      },
      text: {
        primary: '#ffffff',
        secondary: 'rgba(255, 255, 255, 0.7)',
      },
      success: {
        main: '#10b981',
      },
      warning: {
        main: '#f59e0b',
      },
      error: {
        main: '#ef4444',
      },
      info: {
        main: '#3b82f6',
      },
    },
    typography: {
      fontFamily: '"Outfit", "Inter", sans-serif',
      h1: { fontWeight: 700, letterSpacing: '-0.02em' },
      h2: { fontWeight: 700, letterSpacing: '-0.01em' },
      h3: { fontWeight: 600, letterSpacing: '-0.01em' },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: { fontWeight: 600, textTransform: 'none' },
    },
    shape: {
      borderRadius: 16,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: '#050505',
            backgroundImage: `
              radial-gradient(circle at 15% 50%, rgba(76, 29, 149, 0.15), transparent 25%),
              radial-gradient(circle at 85% 30%, rgba(236, 72, 153, 0.15), transparent 25%)
            `,
            backgroundAttachment: 'fixed',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            padding: '10px 20px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          },
          contained: {
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #9c75f7 0%, #8b5cf6 100%)',
              boxShadow: '0 8px 25px rgba(139, 92, 246, 0.4)',
              transform: 'translateY(-2px)',
            },
          },
          outlined: {
            borderColor: 'rgba(255, 255, 255, 0.2)',
            '&:hover': {
              borderColor: '#8b5cf6',
              background: 'rgba(139, 92, 246, 0.1)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            background: 'rgba(20, 20, 25, 0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.45)',
              borderColor: 'rgba(255, 255, 255, 0.15)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            background: 'rgba(20, 20, 25, 0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            background: 'rgba(10, 10, 15, 0.8)',
            backdropFilter: 'blur(16px)',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: 'rgba(5, 5, 5, 0.7)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: 'none',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.1)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.2)',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#8b5cf6',
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        },
      },
    },
  });

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <AuthProvider>
            <MainApp />
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
