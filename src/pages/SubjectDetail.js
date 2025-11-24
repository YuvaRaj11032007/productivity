import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Paper, Divider, List, ListItem,
  ListItemText, IconButton, Button,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, Card, CardContent, LinearProgress, Tabs, Tab, CircularProgress,
  Chip, Stack
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import TimerIcon from '@mui/icons-material/Timer';
import NoteIcon from '@mui/icons-material/Note';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AlarmIcon from '@mui/icons-material/Alarm';
import BookIcon from '@mui/icons-material/Book';
import SaveIcon from '@mui/icons-material/Save';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import { SubjectsContext } from '../contexts/SubjectsContext';
import aiService from '../services/aiService';

import ModernTimer from '../components/ModernTimer';
import TaskList from '../components/TaskList';
import TestFeature from '../components/TestFeature';
import PdfViewer from '../components/PdfViewer';
import SavedTests from '../components/SavedTests';
import { extractTextFromPdf } from '../services/fileReader';

const SubjectDetail = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const {
    subjects,
    updateSubject,
    addMultipleTasks,
    addAttachment,
    deleteAttachment,
    addStudySession,
    studySessions,
    getTotalHoursForSubject,
    getSubjectProgress,
    fetchData
  } = useContext(SubjectsContext);

  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openSessionDialog, setOpenSessionDialog] = useState(false);
  const [openNotesDialog, setOpenNotesDialog] = useState(false);
  const [newSession, setNewSession] = useState({
    duration: 60, // default 60 minutes
    notes: ''
  });
  const [subjectNotes, setSubjectNotes] = useState('');
  const [newAttachment, setNewAttachment] = useState(null);
  const [newAttachmentData, setNewAttachmentData] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState(null);

  const completedTasks = subject?.tasks?.filter(t => t.completed) || [];

  useEffect(() => {
    const foundSubject = subjects.find(s => s.id === parseInt(subjectId));
    if (foundSubject) {
      setSubject(foundSubject);
      setSubjectNotes(foundSubject.notes || '');
      setLoading(false);
    } else if (subjects.length > 0) { // only navigate if subjects have loaded
      navigate('/');
    }
  }, [subjectId, subjects, navigate]);

  const filteredSessions = studySessions.filter(session =>
    session.subjectId === subjectId
  ).sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleGenerateTasksAI = useCallback(async () => {
    if (!subject) return;
    setIsGenerating(true);
    try {
      let extractedText = '';
      const perFileCharLimit = 2000;

      if (subject?.attachments) {
        for (const attachment of subject.attachments) {
          if (attachment.name.toLowerCase().endsWith('.pdf')) {
            const text = await extractTextFromPdf(attachment.path);
            extractedText += `\n\n--- Snippet from ${attachment.name} ---\n`;
            extractedText += text.substring(0, perFileCharLimit);
          }
        }
      }

      const context = {
        subjects: subjects,
        studySessions: studySessions,
        dailyGoals: [],
        currentTime: new Date().toISOString(),
        attachments: subject.attachments ? subject.attachments.map(a => a.name) : [],
        extractedText: extractedText
      };
      const responseText = await aiService.generateComprehensiveTaskList(subject.name, 'beginner', '3 months', context);

      const aiTasks = aiService.parseTaskListResponse(responseText || '');

      if (aiTasks.length > 0) {
        const newTasks = await addMultipleTasks(subjectId, aiTasks);
        if (newTasks) {
          fetchData();
        }
      } else {
        // Fallback tasks
        const fallbackTasks = [
          { name: 'Introduction and Setup', description: 'Introduction and Setup', estimatedMinutes: 60, dueDate: null },
          { name: 'Basic Concepts', description: 'Basic Concepts', estimatedMinutes: 120, dueDate: null },
          { name: 'Core Theory', description: 'Core Theory', estimatedMinutes: 180, dueDate: null },
          { name: 'Practice Problems', description: 'Practice Problems', estimatedMinutes: 90, dueDate: null },
        ];
        const newTasks = await addMultipleTasks(subjectId, fallbackTasks);
        if (newTasks) {
          fetchData();
        }
      }

    } catch (e) {
      console.error('AI task generation failed:', e);
    } finally {
      setIsGenerating(false);
    }
  }, [subject, addMultipleTasks, subjectId, studySessions, subjects, fetchData]);

  const handleOpenSessionDialog = () => {
    setOpenSessionDialog(true);
  };

  const handleCloseSessionDialog = () => {
    setOpenSessionDialog(false);
    setNewSession({
      duration: 60,
      notes: ''
    });
  };

  const handleSessionInputChange = (e) => {
    const { name, value } = e.target;
    setNewSession({
      ...newSession,
      [name]: value
    });
  };

  const handleAddSession = () => {
    addStudySession({
      subjectId: subjectId,
      duration: Number(newSession.duration),
      notes: newSession.notes,
      date: new Date().toISOString()
    });
    handleCloseSessionDialog();
  };

  const handleOpenNotesDialog = () => {
    setOpenNotesDialog(true);
  };

  const handleCloseNotesDialog = () => {
    setOpenNotesDialog(false);
  };

  const handleOpenPdf = (file) => {
    setSelectedPdf(file);
    setPdfViewerOpen(true);
  };

  const handleClosePdf = () => {
    setPdfViewerOpen(false);
    setSelectedPdf(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewAttachment(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAttachmentData(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveNotes = () => {
    updateSubject(subjectId, { notes: subjectNotes });
    if (newAttachment && newAttachmentData) {
      const attachment = {
        name: newAttachment.name,
        path: newAttachmentData
      }
      addAttachment(subjectId, attachment);
      setNewAttachment(null);
      setNewAttachmentData(null);
    }
    handleCloseNotesDialog();
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  if (!subject) return null;

  const progress = getSubjectProgress(subjectId);
  const totalHours = getTotalHoursForSubject(subjectId);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ mb: 2, color: 'text.secondary' }}
        >
          Back to Dashboard
        </Button>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h3" component="h1" fontWeight="bold" sx={{ mb: 1, color: subject.color }}>
              {subject.name}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={subject.category || 'Uncategorized'}
                sx={{
                  bgcolor: `${subject.color}20`,
                  color: subject.color,
                  border: `1px solid ${subject.color}40`,
                  fontWeight: 600
                }}
              />
              <Typography variant="body2" color="text.secondary">
                {subject.tasks?.length || 0} Tasks • {totalHours.toFixed(1)} Hours Studied
              </Typography>
            </Stack>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<NoteIcon />}
              onClick={handleOpenNotesDialog}
              sx={{
                borderColor: 'rgba(255,255,255,0.1)',
                color: 'text.primary',
                '&:hover': { borderColor: subject.color, bgcolor: `${subject.color}10` }
              }}
            >
              Notes
            </Button>
            <Button
              variant="contained"
              startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
              onClick={handleGenerateTasksAI}
              disabled={isGenerating}
              sx={{
                background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                boxShadow: '0 4px 20px rgba(6, 182, 212, 0.4)',
              }}
            >
              {isGenerating ? 'Generating...' : 'AI Plan'}
            </Button>
            <Button
              variant="contained"
              startIcon={<TimerIcon />}
              onClick={handleOpenSessionDialog}
              sx={{
                background: `linear-gradient(135deg, ${subject.color} 0%, ${subject.color}dd 100%)`,
                boxShadow: `0 4px 20px ${subject.color}60`,
              }}
            >
              Log Session
            </Button>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {/* Tabs */}
          <Paper
            className="glass-card"
            sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}
          >
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': {
                  py: 2,
                  transition: 'all 0.3s',
                  '&.Mui-selected': {
                    color: subject.color,
                    background: 'rgba(255,255,255,0.02)'
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: subject.color,
                  height: 3
                }
              }}
            >
              <Tab icon={<AddIcon />} label="Tasks" iconPosition="start" />
              <Tab icon={<TimerIcon />} label="Timer" iconPosition="start" />
              <Tab icon={<BookIcon />} label="Practice" iconPosition="start" />
              <Tab icon={<SaveIcon />} label="Saved Tests" iconPosition="start" />
            </Tabs>
          </Paper>

          {/* Tab Content */}
          <Box sx={{ minHeight: 400 }}>
            {tabValue === 0 && (
              <Paper className="glass-card" sx={{ p: 3 }}>
                <TaskList subjectId={subjectId} />
              </Paper>
            )}

            {tabValue === 1 && (
              <Paper className="glass-card" sx={{ p: 3 }} id="timer-section">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" fontWeight="bold">Focus Timer</Typography>
                  <Chip label="Deep Work" color="primary" size="small" variant="outlined" />
                </Box>
                <ModernTimer
                  subjectId={subjectId}
                  subjectName={subject?.name}
                  subjectColor={subject?.color}
                  onSessionComplete={(sessionData) => {
                    addStudySession({
                      subjectId: subjectId,
                      duration: sessionData.duration * 60,
                      notes: sessionData.notes,
                      date: new Date().toISOString()
                    });
                  }}
                />
              </Paper>
            )}

            {tabValue === 2 && (
              <TestFeature
                subject={subject}
                completedTasks={completedTasks}
                aiService={aiService}
                onMasteryUpdate={mastery => {/* Optionally update mastery here */ }}
              />
            )}

            {tabValue === 3 && (
              <SavedTests subject={subject} />
            )}
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          {/* Progress Card */}
          <Paper className="glass-card" sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">Progress</Typography>
            <Box sx={{ position: 'relative', display: 'inline-flex', width: '100%', justifyContent: 'center', my: 2 }}>
              <CircularProgress
                variant="determinate"
                value={100}
                size={120}
                thickness={4}
                sx={{ color: 'rgba(255,255,255,0.05)', position: 'absolute' }}
              />
              <CircularProgress
                variant="determinate"
                value={progress}
                size={120}
                thickness={4}
                sx={{
                  color: subject.color,
                  filter: `drop-shadow(0 0 8px ${subject.color}80)`
                }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column'
                }}
              >
                <Typography variant="h4" component="div" color="text.primary" fontWeight="bold">
                  {Math.round(progress)}%
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Tasks Completed</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {subject?.tasks?.filter(t => t.completed).length}/{subject?.tasks?.length}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: subject.color,
                  }
                }}
              />
            </Box>
          </Paper>

          {/* Stats Card */}
          <Paper className="glass-card" sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">Study Stats</Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: subject.color }}>
                    {totalHours.toFixed(1)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Total Hours</Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#10b981' }}>
                    {filteredSessions.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Sessions</Typography>
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Daily Goal</Typography>
                <Typography variant="body2" fontWeight="bold">{subject.dailyGoalHours}h</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min((totalHours / (subject.dailyGoalHours * 7)) * 100, 100)} // Example weekly progress
                sx={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#10b981',
                  }
                }}
              />
            </Box>
          </Paper>

          {/* Notes Preview */}
          {subject.notes && (
            <Paper className="glass-card" sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">Quick Notes</Typography>
                <IconButton size="small" onClick={handleOpenNotesDialog}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  whiteSpace: 'pre-wrap',
                  maxHeight: 200,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 8,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {subject.notes}
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Dialogs */}
      <Dialog
        open={openSessionDialog}
        onClose={handleCloseSessionDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          className: 'glass-card',
          sx: { bgcolor: 'rgba(20, 20, 25, 0.95)' }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Log Study Session</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            autoFocus
            margin="dense"
            name="duration"
            label="Duration (minutes)"
            type="number"
            fullWidth
            variant="outlined"
            value={newSession.duration}
            onChange={handleSessionInputChange}
            inputProps={{ min: 5, step: 5 }}
            sx={{ mb: 3, mt: 1 }}
          />
          <TextField
            margin="dense"
            name="notes"
            label="Session Notes (optional)"
            multiline
            rows={3}
            fullWidth
            variant="outlined"
            value={newSession.notes}
            onChange={handleSessionInputChange}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Button onClick={handleCloseSessionDialog} color="inherit">Cancel</Button>
          <Button onClick={handleAddSession} variant="contained">Save Session</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openNotesDialog}
        onClose={handleCloseNotesDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          className: 'glass-card',
          sx: { bgcolor: 'rgba(20, 20, 25, 0.95)' }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Subject Notes</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            autoFocus
            margin="dense"
            name="notes"
            label="Notes"
            multiline
            rows={8}
            fullWidth
            variant="outlined"
            value={subjectNotes}
            onChange={(e) => setSubjectNotes(e.target.value)}
            sx={{ mb: 3, mt: 1 }}
          />

          <Box sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<AddIcon />}
            >
              Add Attachment
              <input
                type="file"
                hidden
                onChange={handleFileChange}
              />
            </Button>
            {newAttachment && (
              <Typography variant="body2" sx={{ mt: 1, color: 'primary.main' }}>
                Selected: {newAttachment.name}
              </Typography>
            )}
          </Box>

          {subject.attachments && subject.attachments.length > 0 && (
            <>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Attachments</Typography>
              <List sx={{ bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
                {subject.attachments.map(attachment => (
                  <ListItem
                    key={attachment.id}
                    secondaryAction={
                      <IconButton edge="end" onClick={() => deleteAttachment(subjectId, attachment.id)} size="small" color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={
                        <Button
                          variant="text"
                          onClick={() => handleOpenPdf(attachment)}
                          sx={{ textTransform: 'none', justifyContent: 'flex-start', p: 0, minWidth: 0, color: 'text.primary' }}
                        >
                          {attachment.name}
                        </Button>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Button onClick={handleCloseNotesDialog} color="inherit">Cancel</Button>
          <Button onClick={handleSaveNotes} variant="contained">Save Notes</Button>
        </DialogActions>
      </Dialog>

      <PdfViewer open={pdfViewerOpen} onClose={handleClosePdf} file={selectedPdf} />
    </Container>
  );
};

export default SubjectDetail;