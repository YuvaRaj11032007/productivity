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
  Card,
  CardContent,
  Snackbar,
  Alert,
  IconButton,
  InputAdornment,
  Chip
} from '@mui/material';
import { Visibility, VisibilityOff, AutoAwesome as AIIcon, Key as KeyIcon } from '@mui/icons-material';
import { useAI } from '../contexts/AIContext';

const Settings = () => {
  const { state: aiState, setApiKeys, setModel, getAvailableModels, testConnection } = useAI();
  
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
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Appearance
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.darkMode}
                    onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                  />
                }
                label="Dark Mode"
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Switch between light and dark theme (will be applied on next app reload)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Notifications
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notificationsEnabled}
                    onChange={(e) => handleSettingChange('notificationsEnabled', e.target.checked)}
                  />
                }
                label="Enable Notifications"
              />
              
              <Box sx={{ mt: 2 }}>
                <TextField
                  label="Daily Reminder Time"
                  type="time"
                  value={settings.reminderTime}
                  onChange={(e) => handleSettingChange('reminderTime', e.target.value)}
                  disabled={!settings.notificationsEnabled}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: 200 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Study Preferences
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <TextField
                  label="Default Study Session Duration (minutes)"
                  type="number"
                  value={settings.defaultStudyDuration}
                  onChange={(e) => handleSettingChange('defaultStudyDuration', parseInt(e.target.value))}
                  InputProps={{ inputProps: { min: 5, max: 240 } }}
                  sx={{ width: 300 }}
                />
              </Box>
              
              <TextField
                label="Weekly Goal (hours)"
                type="number"
                value={settings.weeklyGoalHours}
                onChange={(e) => handleSettingChange('weeklyGoalHours', parseInt(e.target.value))}
                InputProps={{ inputProps: { min: 1, max: 168 } }}
                sx={{ width: 300 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AIIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  AI Assistant Configuration
                </Typography>
                <Chip 
                  label={aiState.isConfigured ? 'Configured' : 'Not Configured'} 
                  color={aiState.isConfigured ? 'success' : 'warning'}
                  size="small"
                  sx={{ ml: 2 }}
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configure your AI provider API keys to enable intelligent productivity analysis, daily planning, and learning roadmaps.
              </Typography>

              {/* Model Selection */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>AI Model</InputLabel>
                <Select
                  value={aiState.currentModels?.gemini || ''}
                  label="AI Model"
                  onChange={(e) => setModel(e.target.value)}
                >
                  {getAvailableModels().map((model) => (
                    <MenuItem key={model.id} value={model.id}>
                      <Box>
                        <Typography variant="body1">{model.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {model.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

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
                />
                <Typography variant="caption" color="text.secondary">
                  Get your free API key from{' '}
                  <Button
                    size="small"
                    href="https://ai.google.dev/"
                    target="_blank"
                    rel="noopener noreferrer"
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
                >
                  Save AI Configuration
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={handleTestConnection}
                  disabled={!tempApiKeys.gemini || aiState.isLoading}
                  color="secondary"
                >
                  {aiState.isLoading ? 'Testing...' : 'Test Connection'}
                </Button>
              </Box>

              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  AI Features:
                </Typography>
                <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                  <Typography component="li" variant="body2">Productivity analysis and insights</Typography>
                  <Typography component="li" variant="body2">Personalized daily study planning</Typography>
                  <Typography component="li" variant="body2">Learning roadmap generation</Typography>
                  <Typography component="li" variant="body2">Intelligent recommendations</Typography>
                  <Typography component="li" variant="body2">Study pattern recognition</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
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
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="error" gutterBottom>
                Danger Zone
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Button 
                variant="outlined" 
                color="error"
                onClick={handleClearData}
              >
                Clear All App Data
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                This will delete all your subjects, tasks, study sessions, and settings. This action cannot be undone.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Settings;
