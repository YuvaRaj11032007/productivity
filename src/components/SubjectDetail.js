import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSubjects } from '../contexts/SubjectsContext';
import ModernTimer from './ModernTimer';
import TestFeature from './TestFeature';
import aiService from '../services/aiService';
import {
  Container, Typography, Box, Paper, Divider, List, ListItem,
  ListItemText, ListItemIcon, Checkbox, IconButton, Button,
  TextField, Card, CardContent, LinearProgress, Chip, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import TimerIcon from '@mui/icons-material/Timer';
import NoteIcon from '@mui/icons-material/Note';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AlarmIcon from '@mui/icons-material/Alarm';
import BookIcon from '@mui/icons-material/Book';
import { format } from 'date-fns';

const SubjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    subjects,
    updateSubject,
    addTask,
    toggleTaskCompletion,
    addStudySession,
    studySessions,
    deleteStudySession,
    getTotalHoursForSubject,
    getSubjectProgress,
    deleteTask
  } = useSubjects();

  const [subject, setSubject] = useState(null);
  const [newTask, setNewTask] = useState('');
  const [openNotesDialog, setOpenNotesDialog] = useState(false);
  const [subjectNotes, setSubjectNotes] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const theme = useTheme();

  useEffect(() => {
    const foundSubject = subjects.find(s => s.id === id);
    if (foundSubject) {
      setSubject(foundSubject);
      setSubjectNotes(foundSubject.notes || '');
    } else {
      navigate('/');
    }
  }, [id, subjects, navigate]);

  const filteredSessions = studySessions.filter(session => 
    session.subjectId === id
  ).sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleAddTask = () => {
    if (newTask.trim()) {
      addTask(id, { name: newTask });
      setNewTask('');
    }
  };

  const handleOpenNotesDialog = () => {
    setOpenNotesDialog(true);
  };

  const handleCloseNotesDialog = () => {
    setOpenNotesDialog(false);
  };

  const handleSaveNotes = () => {
    updateSubject(id, { notes: subjectNotes });
    handleCloseNotesDialog();
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSessionComplete = (sessionData) => {
    addStudySession({
      subjectId: id,
      duration: sessionData.duration * 60, // Convert hours to minutes
      notes: sessionData.notes,
      date: new Date().toISOString()
    });
  };

  if (!subject) return <Typography>Loading subject details...</Typography>;

  const progress = getSubjectProgress(id);
  const totalHours = getTotalHoursForSubject(id);


  // Get completed tasks for test feature
  const completedTasks = subject?.tasks?.filter(t => t.completed) || [];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/')} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          {subject.name}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<NoteIcon />}
          onClick={handleOpenNotesDialog}
          sx={{ mr: 2 }}
        >
          Notes
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AlarmIcon />}
          onClick={() => {
            const timerSection = document.getElementById('timer-section');
            if (timerSection) {
              timerSection.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        >
          Start Timer
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{ mb: 2 }}
        >
          <Tab icon={<AddIcon />} label="Tasks" />
          <Tab icon={<TimerIcon />} label="Study Timer" />
          <Tab icon={<BookIcon />} label="Test Your Knowledge" />
        </Tabs>
      </Paper>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {/* Tasks Tab */}
          {tabValue === 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Tasks</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TextField
                    size="small"
                    placeholder="Add new task"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                    sx={{ mr: 1 }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={handleAddTask}
                  >
                    Add
                  </Button>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<BookIcon />}
                  size="large"
                  onClick={() => setTabValue(2)}
                >
                  Test Your Knowledge
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {subject.tasks && subject.tasks.length === 0 ? (
                <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 3 }}>
                  No tasks added yet. Add your first task to get started!
                </Typography>
              ) : (
                <List>
                  {subject.tasks && subject.tasks.map((task) => (
                    <ListItem
                      key={task.id}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => deleteTask(id, task.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      }
                      sx={{
                        bgcolor: task.completed ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                        borderRadius: 1,
                        mb: 1
                      }}
                    >
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={task.completed}
                          onChange={() => toggleTaskCompletion(id, task.id)}
                          sx={{
                            color: subject.color,
                            '&.Mui-checked': {
                              color: subject.color,
                            },
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={task.name}
                        sx={{
                          textDecoration: task.completed ? 'line-through' : 'none',
                          color: task.completed ? 'text.secondary' : 'text.primary',
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          )}

          {/* Timer Tab */}
          {tabValue === 1 && (
            <Paper sx={{ p: 3 }} id="timer-section">
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>  
                <Typography variant="h6">Study Timer</Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              <ModernTimer 
                subjectId={id}
                subjectName={subject.name}
                subjectColor={subject.color}
                onSessionComplete={handleSessionComplete}
              />
            </Paper>
          )}

          {/* Test Feature Tab */}
          {tabValue === 2 && (
            <TestFeature 
              subject={subject}
              completedTasks={completedTasks}
              aiService={aiService}
              onMasteryUpdate={mastery => {/* Optionally update mastery here */}}
            />
          )}

          {/* Recent Study Sessions (only shown in Tasks tab) */}
          {tabValue === 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="h6">Recent Study Sessions</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {filteredSessions.length === 0 ? (
                <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 3 }}>
                  No study sessions recorded yet. Use the timer to log your first session!
                </Typography>
              ) : (
                <List>
                  {filteredSessions.slice(0, 5).map((session) => (
                    <ListItem
                      key={session.id}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => deleteStudySession(session.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      }
                      sx={{ borderBottom: '1px solid #f0f0f0' }}
                    >
                      <ListItemIcon>
                        <TimerIcon sx={{ color: subject.color }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${session.duration} minutes`}
                        secondary={
                          <>
                            {format(new Date(session.date), 'PPP p')}
                            {session.notes && (
                              <Typography variant="body2" component="span" sx={{ display: 'block', mt: 0.5 }}>
                                Note: {session.notes}
                              </Typography>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Progress</Typography>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  mb: 1,
                  backgroundColor: '#e0e0e0',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: subject.color,
                  }
                }}
              />
              <Typography variant="body2" sx={{ textAlign: 'center' }}>
                {Math.round(progress)}% Complete
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Tasks:</strong> {subject.tasks ? subject.tasks.filter(t => t.completed).length : 0} of {subject.tasks ? subject.tasks.length : 0} completed
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Study Time</Typography>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h3" sx={{ color: subject.color }}>
                  {totalHours.toFixed(1)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Hours
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2">
                <strong>Daily Goal:</strong> {subject.dailyGoalHours || 0} hours
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Sessions:</strong> {filteredSessions.length}
              </Typography>
            </CardContent>
          </Card>

          {subject.notes && (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" gutterBottom>Notes</Typography>
                  <Button size="small" onClick={handleOpenNotesDialog}>Edit</Button>
                </Box>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {subject.notes}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Notes Dialog */}
      <Dialog open={openNotesDialog} onClose={handleCloseNotesDialog} maxWidth="md" fullWidth>
        <DialogTitle>Subject Notes</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="notes"
            label="Notes"
            type="text"
            fullWidth
            multiline
            rows={8}
            value={subjectNotes}
            onChange={(e) => setSubjectNotes(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNotesDialog}>Cancel</Button>
          <Button onClick={handleSaveNotes} color="primary">Save</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default SubjectDetail;