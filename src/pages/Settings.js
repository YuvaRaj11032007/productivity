import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Paper,
  Snackbar,
  Alert,
  IconButton,
  InputAdornment,
  Chip
} from '@mui/material';
import { Visibility, VisibilityOff, AutoAwesome as AIIcon, Key as KeyIcon } from '@mui/icons-material';
import { useAI } from '../contexts/AIContext';

const Settings = () => {
  const { state: aiState, setApiKeys, testConnection } = useAI();

  // AI Settings state
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [tempApiKeys, setTempApiKeys] = useState({
    gemini: aiState.geminiApiKey || '',
  });

  // Settings state
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('appSettings');
    return savedSettings ? JSON.parse(savedSettings) : {
      darkMode: false,
      notificationsEnabled: true,
      reminderTime: '18:00',
      defaultStudyDuration: 60,
      weeklyGoalHours: 20,
      language: 'en'
    };
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
  }, [settings]);

  const handleSettingChange = (setting, value) => {
    setSettings({
      ...settings,
      [setting]: value
    });

    setSnackbar({
      open: true,
      message: 'Settings saved successfully',
      severity: 'success'
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  const handleSaveApiKeys = () => {
    setApiKeys(tempApiKeys.gemini);
    setSnackbar({
      open: true,
      message: 'AI API keys saved successfully',
      severity: 'success'
    });
  };

  const handleTestConnection = async () => {
    if (!tempApiKeys.gemini) {
      setSnackbar({
        open: true,
        message: 'Please enter at least one API key to test',
        severity: 'warning'
      });
      return;
    }

    // Save keys first so test connection can use them
    setApiKeys(tempApiKeys.gemini);

    const result = await testConnection();

    setSnackbar({
      open: true,
      message: result.success
        ? `✅ Gemini API connection successful!`
        : `❌ Connection failed: ${result.message}`,
      severity: result.success ? 'success' : 'error'
    });
  };

  const handleApiKeyChange = (provider, value) => {
    setTempApiKeys({
      ...tempApiKeys,
      [provider]: value
    });
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all app data? This action cannot be undone.')) {
      localStorage.clear();
      setSnackbar({
        open: true,
        message: 'All data cleared. The app will reload.',
        severity: 'info'
      });

      // Give time for the snackbar to be seen before reloading
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" fontWeight="bold" className="text-gradient" gutterBottom sx={{ mb: 4 }}>
        Settings
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper className="glass-card" sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Appearance
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body1" fontWeight="500">Dark Mode</Typography>
                <Typography variant="body2" color="text.secondary">
                  Switch between light and dark theme (applied on reload)
                </Typography>
              </Box>
              <Switch
                checked={settings.darkMode}
                onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                color="primary"
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper className="glass-card" sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Notifications
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box>
                <Typography variant="body1" fontWeight="500">Enable Notifications</Typography>
                <Typography variant="body2" color="text.secondary">
                  Get reminders for your study sessions
                </Typography>
              </Box>
              <Switch
                checked={settings.notificationsEnabled}
                onChange={(e) => handleSettingChange('notificationsEnabled', e.target.checked)}
                color="primary"
              />
            </Box>

            <Box sx={{ mt: 2 }}>
              <TextField
                label="Daily Reminder Time"
                type="time"
                value={settings.reminderTime}
                onChange={(e) => handleSettingChange('reminderTime', e.target.value)}
                disabled={!settings.notificationsEnabled}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 200 }}
                variant="outlined"
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper className="glass-card" sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Study Preferences
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Default Session Duration (min)"
                  type="number"
                  fullWidth
                  value={settings.defaultStudyDuration}
                  onChange={(e) => handleSettingChange('defaultStudyDuration', parseInt(e.target.value))}
                  InputProps={{ inputProps: { min: 5, max: 240 } }}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Weekly Goal (hours)"
                  type="number"
                  fullWidth
                  value={settings.weeklyGoalHours}
                  onChange={(e) => handleSettingChange('weeklyGoalHours', parseInt(e.target.value))}
                  InputProps={{ inputProps: { min: 1, max: 168 } }}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper className="glass-card" sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AIIcon sx={{ mr: 1, color: '#8b5cf6' }} />
              <Typography variant="h5" fontWeight="bold">
                AI Assistant Configuration
              </Typography>
              <Chip
                label={aiState.isConfigured ? 'Configured' : 'Not Configured'}
                color={aiState.isConfigured ? 'success' : 'warning'}
                size="small"
                sx={{ ml: 2, fontWeight: 600 }}
              />
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Configure your AI provider API keys to enable intelligent productivity analysis, daily planning, and learning roadmaps.
            </Typography>

            <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary">
                AI Model: <strong style={{ color: '#8b5cf6' }}>Gemini 2.5 Flash Lite</strong> (fixed)
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Gemini API Key"
                type={showGeminiKey ? 'text' : 'password'}
                value={tempApiKeys.gemini}
                onChange={(e) => handleApiKeyChange('gemini', e.target.value)}
                placeholder="Enter your Google Gemini API key"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <KeyIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowGeminiKey(!showGeminiKey)}
                        edge="end"
                      >
                        {showGeminiKey ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{ mb: 1 }}
                variant="outlined"
              />
              <Typography variant="caption" color="text.secondary">
                Get your free API key from{' '}
                <Button
                  size="small"
                  href="https://ai.google.dev/"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ p: 0, minWidth: 'auto', verticalAlign: 'baseline' }}
                >
                  Google AI Studio
                </Button>
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleSaveApiKeys}
                disabled={!tempApiKeys.gemini}
                startIcon={<AIIcon />}
                sx={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                  boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
                }}
              >
                Save Configuration
              </Button>

              <Button
                variant="outlined"
                onClick={handleTestConnection}
                disabled={!tempApiKeys.gemini || aiState.isLoading}
                color="secondary"
                sx={{ borderColor: 'rgba(255,255,255,0.2)' }}
              >
                {aiState.isLoading ? 'Testing...' : 'Test Connection'}
              </Button>
            </Box>

            <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                AI Features:
              </Typography>
              <Box component="ul" sx={{ mt: 1, pl: 2, m: 0 }}>
                <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>Productivity analysis and insights</Typography>
                <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>Personalized daily study planning</Typography>
                <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>Learning roadmap generation</Typography>
                <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>Intelligent recommendations</Typography>
                <Typography component="li" variant="body2">Study pattern recognition</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper className="glass-card" sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Language & Region
            </Typography>

            <FormControl sx={{ width: 200 }}>
              <InputLabel>Language</InputLabel>
              <Select
                value={settings.language}
                label="Language"
                onChange={(e) => handleSettingChange('language', e.target.value)}
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="es">Spanish</MenuItem>
                <MenuItem value="fr">French</MenuItem>
                <MenuItem value="de">German</MenuItem>
              </Select>
            </FormControl>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper className="glass-card" sx={{ p: 4, borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <Typography variant="h5" color="error" fontWeight="bold" gutterBottom>
              Danger Zone
            </Typography>
            <Divider sx={{ mb: 3, bgcolor: 'rgba(239, 68, 68, 0.2)' }} />
            <Button
              variant="outlined"
              color="error"
              onClick={handleClearData}
              sx={{ borderColor: 'error.main', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' } }}
            >
              Clear All App Data
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              This will delete all your subjects, tasks, study sessions, and settings. This action cannot be undone.
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Settings;
