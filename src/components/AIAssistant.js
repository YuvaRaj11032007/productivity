import React, { useState, useRef, useEffect, useContext } from 'react';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Button,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Badge,
  Fab
} from '@mui/material';
import {
  Send as SendIcon,
  AutoAwesome as AIIcon,
  Analytics as AnalyticsIcon,
  Schedule as PlanningIcon,
  Lightbulb as InsightIcon,
  Clear as ClearIcon,
  Psychology as BrainIcon,
  TrendingUp as TrendIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import ReactMarkdown from 'react-markdown';
import { useAI } from '../contexts/AIContext';
import { SubjectsContext } from '../contexts/SubjectsContext';
import aiService from '../services/aiService';
import { useAuth } from '../contexts/AuthContext';

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false); // Default to closed
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 400, height: 500 });
  const theme = useTheme();
  const { state: aiState, dispatch, sendMessage, analyzeProductivity, generateDailyPlan, generateSubjectWithSubtopics, createSubjectWithTasks, getRecommendations, setCurrentView, clearConversations, clearError, getAvailableModels } = useAI();
  const { subjects, studySessions, checkDailyGoals, addSubject, addTask, addStudySession, classSchedule } = useContext(SubjectsContext);
  const { user } = useAuth();

  const username = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  const [message, setMessage] = useState('');
  const [subjectDialog, setSubjectDialog] = useState(false);

  const [subjectData, setSubjectData] = useState({
    name: '',
    description: '',
    level: '',
    timeframe: ''
  });

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [aiState.conversations, isOpen]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const appData = {
      subjects,
      studySessions,
      dailyGoals: checkDailyGoals(),
      currentTime: new Date().toISOString(),
      weeklyStats: getWeeklyStats(),
      classSchedule,
      username
    };

    await sendMessage(message, appData);
    setMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getWeeklyStats = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklySessionsInfo = studySessions.filter(session =>
      new Date(session.date) >= oneWeekAgo
    );

    return {
      totalHours: weeklySessionsInfo.reduce((total, session) => total + (session.duration / 60), 0),
      totalSessions: weeklySessionsInfo.length,
      activeDays: new Set(weeklySessionsInfo.map(session =>
        new Date(session.date).toDateString()
      )).size
    };
  };

  const handleQuickAction = async (action) => {
    const context = {
      subjects,
      studySessions,
      dailyGoals: checkDailyGoals(),
      classSchedule,
      username
    };

    switch (action) {
      case 'analyze':
        await analyzeProductivity(subjects, studySessions, checkDailyGoals(), classSchedule, context);
        setCurrentView('insights');
        break;
      case 'plan':
        await generateDailyPlan(subjects, studySessions, checkDailyGoals(), classSchedule, context);
        setCurrentView('planning');
        break;
      case 'recommendations':
        await getRecommendations(subjects, studySessions, checkDailyGoals(), classSchedule, context);
        break;
      case 'subject':
        setSubjectDialog(true);
        break;
      default:
        break;
    }
  };

  const handleSubjectGeneration = async () => {
    if (!subjectData.name || !subjectData.description || !subjectData.level || !subjectData.timeframe) {
      return;
    }

    await generateSubjectWithSubtopics(
      subjectData.name,
      subjectData.description,
      subjectData.level,
      subjectData.timeframe,
      { subjects, studySessions, checkDailyGoals, username }
    );
    setSubjectDialog(false);
    setSubjectData({ name: '', description: '', level: '', timeframe: '' });
    setCurrentView('chat');
  };

  const handleCreateSubjectInApp = async (subjectName, subjectStructure) => {
    // Create the subject with tasks in the app
    const result = await createSubjectWithTasks(subjectName, subjectStructure, { addSubject });

    // Show success or error message
    const resultMessage = {
      id: Date.now(),
      type: 'assistant',
      content: result.success
        ? `✅ ${result.message} You can now view and manage it in your subject list with the subtopics as tasks.`
        : `❌ ${result.message}`,
      timestamp: new Date().toISOString()
    };
    dispatch({ type: 'ADD_CONVERSATION', payload: resultMessage });
  };

  const renderTabContent = () => {
    switch (aiState.currentView) {
      case 'insights':
        return (
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AnalyticsIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Productivity Analysis</Typography>
            </Box>
            {aiState.productivityAnalysis ? (
              <Card>
                <CardContent>
                  <ReactMarkdown>{aiState.productivityAnalysis}</ReactMarkdown>
                </CardContent>
              </Card>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  Click "Analyze Productivity" to get insights about your study patterns
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AnalyticsIcon />}
                  onClick={() => handleQuickAction('analyze')}
                  sx={{ mt: 2 }}
                  disabled={aiState.isLoading}
                >
                  {aiState.isLoading ? <CircularProgress size={20} /> : 'Analyze Now'}
                </Button>
              </Box>
            )}
          </Box>
        );

      case 'planning':
        return (
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PlanningIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Daily Planning</Typography>
            </Box>
            {aiState.dailyPlan ? (
              <Card>
                <CardContent>
                  <ReactMarkdown>{aiState.dailyPlan}</ReactMarkdown>
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button variant="contained" size="small" onClick={async () => {
                      const parsed = aiService.parseDailyPlanToTasks(aiState.dailyPlan);
                      parsed.forEach(item => {
                        const target = subjects.find(s => s.name.toLowerCase().includes((item.subjectName || '').toLowerCase())) || subjects[0];
                        if (!target) return;
                        const exists = (target.tasks || []).some(t => t.name.toLowerCase() === item.taskName.toLowerCase());
                        if (!exists) {
                          // add as task
                          if (typeof addTask === 'function') {
                            addTask(target.id, { name: item.taskName });
                          }
                        }
                        // add a planned study session if duration provided
                        if (item.durationMinutes && typeof addStudySession === 'function') {
                          addStudySession({ subjectId: target.id, duration: item.durationMinutes, notes: 'Planned by AI daily plan' });
                        }
                      });
                    }} disabled={subjects.length === 0}>Apply to Tasks</Button>
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  Generate a personalized daily study plan based on your goals and progress
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<PlanningIcon />}
                  onClick={() => handleQuickAction('plan')}
                  sx={{ mt: 2 }}
                  disabled={aiState.isLoading}
                >
                  {aiState.isLoading ? <CircularProgress size={20} /> : 'Plan My Day'}
                </Button>
              </Box>
            )}
          </Box>
        );

      default: // chat
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Quick Actions */}
            <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="subtitle2" gutterBottom>Quick Actions</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  icon={<AnalyticsIcon />}
                  label="Analyze Productivity"
                  clickable
                  size="small"
                  onClick={() => handleQuickAction('analyze')}
                  disabled={aiState.isLoading}
                />
                <Chip
                  icon={<PlanningIcon />}
                  label="Plan My Day"
                  clickable
                  size="small"
                  onClick={() => handleQuickAction('plan')}
                  disabled={aiState.isLoading}
                />
                <Chip
                  icon={<InsightIcon />}
                  label="Get Recommendations"
                  clickable
                  size="small"
                  onClick={() => handleQuickAction('recommendations')}
                  disabled={aiState.isLoading}
                />
                <Chip
                  icon={<AIIcon />}
                  label="Create Subject"
                  clickable
                  size="small"
                  onClick={() => handleQuickAction('subject')}
                  disabled={aiState.isLoading}
                />
              </Box>
            </Box>

            {/* Messages */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
              {aiState.conversations.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <AIIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Hi {username}! I'm your AI study assistant 🤖
                  </Typography>
                  <Typography color="text.secondary" sx={{ mb: 3 }}>
                    I can help you analyze your productivity, plan your day, and generate subjects with subtopics!
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Try asking me:</Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>"How productive was I this week?"</Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>"Plan my study schedule for today"</Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>"Create a subject for Machine Learning with subtopics"</Typography>
                  </Box>
                </Box>
              ) : (
                aiState.conversations.map((conversation) => (
                  <Box
                    key={conversation.id}
                    sx={{
                      display: 'flex',
                      justifyContent: conversation.type === 'user' ? 'flex-end' : 'flex-start',
                      mb: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, maxWidth: '80%' }}>
                      {conversation.type === 'assistant' && (
                        <Avatar
                          sx={{
                            bgcolor: 'primary.main',
                            width: 32,
                            height: 32,
                            fontSize: '0.875rem'
                          }}
                        >
                          <BrainIcon fontSize="small" />
                        </Avatar>
                      )}
                      <Paper
                        sx={{
                          p: 2,
                          backgroundColor: conversation.type === 'user'
                            ? theme.palette.primary.main
                            : theme.palette.mode === 'dark'
                              ? 'rgba(255, 255, 255, 0.05)'
                              : 'rgba(0, 0, 0, 0.02)',
                          color: conversation.type === 'user' ? '#fff' : 'text.primary',
                          borderRadius: 2,
                          maxWidth: '100%'
                        }}
                      >
                        {conversation.type === 'assistant' ? (
                          <>
                            <ReactMarkdown>{conversation.content}</ReactMarkdown>
                            {conversation.isSubjectStructure && (
                              <Box sx={{ mt: 2 }}>
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={() => handleCreateSubjectInApp(conversation.subjectName, conversation.subjectStructure)}
                                >
                                  Create Subject in App
                                </Button>
                              </Box>
                            )}
                          </>
                        ) : (
                          <Typography variant="body2">{conversation.content}</Typography>
                        )}
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            mt: 1,
                            opacity: 0.7,
                            textAlign: conversation.type === 'user' ? 'right' : 'left'
                          }}
                        >
                          {new Date(conversation.timestamp).toLocaleTimeString()}
                        </Typography>
                      </Paper>
                      {conversation.type === 'user' && (
                        <Avatar
                          sx={{
                            bgcolor: 'secondary.main',
                            width: 32,
                            height: 32,
                            fontSize: '0.875rem'
                          }}
                        >
                          L
                        </Avatar>
                      )}
                    </Box>
                  </Box>
                ))
              )}
              {aiState.isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                      <BrainIcon fontSize="small" />
                    </Avatar>
                    <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="body2">Thinking...</Typography>
                    </Paper>
                  </Box>
                </Box>
              )}
              <div ref={messagesEndRef} />
            </Box>

            {/* Input */}
            <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your study progress..."
                  disabled={aiState.isLoading || !aiState.isConfigured}
                  variant="outlined"
                  size="small"
                />
                <IconButton
                  onClick={handleSendMessage}
                  disabled={!message.trim() || aiState.isLoading || !aiState.isConfigured}
                  color="primary"
                >
                  <SendIcon />
                </IconButton>
              </Box>
              {!aiState.isConfigured && (
                <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                  Please configure your AI API keys in Settings to start chatting
                </Typography>
              )}
            </Box>
          </Box>
        );
    }
  };

  const handleDrag = (e, ui) => {
    setPosition({ x: ui.x, y: ui.y });
  };

  const onResize = (event, { element, size, handle }) => {
    setSize({ width: size.width, height: size.height });
  };

  return (
    <>
      {!isOpen && (
        <Draggable onStop={handleDrag} position={position}>
          <Fab
            color="primary"
            aria-label="open ai assistant"
            onClick={() => setIsOpen(true)}
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              zIndex: 1300
            }}
          >
            <AIIcon />
          </Fab>
        </Draggable>
      )}
      {isOpen && (
        <Draggable onStop={handleDrag} position={position}>
          <ResizableBox
            width={size.width}
            height={size.height}
            onResize={onResize}
            className="resizable"
            style={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              zIndex: 1300,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <Paper
              elevation={8}
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <Box sx={{
                p: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AIIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">AI Assistant</Typography>
                  {aiState.isConfigured && (
                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, gap: 1 }}>
                      <Badge
                        badgeContent={aiState.totalQueries}
                        color="primary"
                        max={99}
                      >
                        <Chip
                          label={aiState.currentProvider?.toUpperCase()}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Badge>
                      {/* Current Model Indicator */}
                      <Tooltip title={`Current Model: ${getAvailableModels(aiState.currentProvider).find(m => m.id === aiState.currentModels?.[aiState.currentProvider])?.name || aiState.currentModels?.[aiState.currentProvider] || 'Unknown'}`}>
                        <Chip
                          label={aiState.currentModels?.[aiState.currentProvider]?.replace(/^(gemini-|llama3-|mixtral-|gemma-)/, '') || 'Unknown'}
                          size="small"
                          color="secondary"
                          variant="outlined"
                          icon={<BrainIcon />}
                        />
                      </Tooltip>
                    </Box>
                  )}
                </Box>
                <Box>
                  {aiState.conversations.length > 0 && (
                    <Tooltip title="Clear conversation">
                      <IconButton size="small" onClick={clearConversations}>
                        <ClearIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  <IconButton size="small" onClick={() => setIsOpen(false)}>
                    <CloseIcon />
                  </IconButton>
                </Box>
              </Box>

              {/* Error Display */}
              {aiState.error && (
                <Alert severity="error" onClose={clearError} sx={{ m: 2 }}>
                  {aiState.error}
                </Alert>
              )}

              {/* Tabs */}
              <Tabs
                value={aiState.currentView}
                onChange={(e, newValue) => setCurrentView(newValue)}
                variant="fullWidth"
                sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
              >
                <Tab
                  icon={<AIIcon />}
                  label="Chat"
                  value="chat"
                  iconPosition="start"
                />
                <Tab
                  icon={<TrendIcon />}
                  label="Insights"
                  value="insights"
                  iconPosition="start"
                />
                <Tab
                  icon={<PlanningIcon />}
                  label="Planning"
                  value="planning"
                  iconPosition="start"
                />
              </Tabs>

              {/* Content */}
              <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                {renderTabContent()}
              </Box>

              {/* Subject Dialog */}
              <Dialog open={subjectDialog} onClose={() => setSubjectDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AIIcon sx={{ mr: 1 }} />
                    Create New Subject with Subtopics
                  </Box>
                </DialogTitle>
                <DialogContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                    <TextField
                      label="Subject Name"
                      value={subjectData.name}
                      onChange={(e) => setSubjectData({ ...subjectData, name: e.target.value })}
                      placeholder="e.g., Machine Learning, Web Development"
                      fullWidth
                    />
                    <TextField
                      label="Description"
                      value={subjectData.description}
                      onChange={(e) => setSubjectData({ ...subjectData, description: e.target.value })}
                      placeholder="Brief description of what this subject covers"
                      fullWidth
                      multiline
                      rows={3}
                    />
                    <TextField
                      label="Your Current Level"
                      value={subjectData.level}
                      onChange={(e) => setSubjectData({ ...subjectData, level: e.target.value })}
                      placeholder="e.g., Complete beginner, Some experience, Intermediate"
                      fullWidth
                    />
                    <FormControl fullWidth>
                      <InputLabel>Timeframe</InputLabel>
                      <Select
                        value={subjectData.timeframe}
                        onChange={(e) => setSubjectData({ ...subjectData, timeframe: e.target.value })}
                        label="Timeframe"
                      >
                        <MenuItem value="1 month">1 Month</MenuItem>
                        <MenuItem value="3 months">3 Months</MenuItem>
                        <MenuItem value="6 months">6 Months</MenuItem>
                        <MenuItem value="1 year">1 Year</MenuItem>
                        <MenuItem value="flexible">Flexible</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setSubjectDialog(false)}>Cancel</Button>
                  <Button
                    onClick={handleSubjectGeneration}
                    variant="contained"
                    disabled={!subjectData.name || !subjectData.description || !subjectData.level || !subjectData.timeframe || aiState.isLoading}
                  >
                    {aiState.isLoading ? <CircularProgress size={20} /> : 'Generate Subject Structure'}
                  </Button>
                </DialogActions>
              </Dialog>
            </Paper>
          </ResizableBox>
        </Draggable>
      )}
    </>
  );
};

export default AIAssistant;
