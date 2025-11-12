import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Paper, Divider, List, ListItem,
  ListItemText, IconButton, Button,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, Card, CardContent, LinearProgress, Tabs, Tab, CircularProgress
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import TimerIcon from '@mui/icons-material/Timer';
import NoteIcon from '@mui/icons-material/Note';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AlarmIcon from '@mui/icons-material/Alarm';
import BookIcon from '@mui/icons-material/Book';


import { SubjectsContext } from '../contexts/SubjectsContext';
import aiService from '../services/aiService';

import { scheduleTasksDaily } from '../services/scheduling';

import ModernTimer from '../components/ModernTimer';

import TaskList from '../components/TaskList';
import TestFeature from '../components/TestFeature';
import PdfViewer from '../components/PdfViewer';
import SavedTests from '../components/SavedTests';
import SaveIcon from '@mui/icons-material/Save';
// import SkillTree from '../components/SkillTree';

import { extractTextFromPdf } from '../services/fileReader';

const SubjectDetail = () => {
  const { subjectId } = useParams();
  console.log('SubjectDetail component rendered with subjectId:', subjectId);
  const navigate = useNavigate();
  const {
    subjects,
    updateSubject,
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

  const [isScheduling, setIsScheduling] = useState(false);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState(null);


  // const [nodes, setNodes, onNodesChange] = useNodesState([]);
  // const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  /*
  useEffect(() => {
    if (subject && subject.tasks && subject.tasks.length > 0) {
      const tasks = subject.tasks;
      const taskMap = new Map(tasks.map(t => [t.id, t]));
      const levelMap = new Map();
      
      const getLevel = (taskId) => {
        if (levelMap.has(taskId)) return levelMap.get(taskId);
        const task = taskMap.get(taskId);
        if (!task || !task.parent) {
          levelMap.set(taskId, 0);
          return 0;
        }
        const level = getLevel(task.parent) + 1;
        levelMap.set(taskId, level);
        return level;
      };

      tasks.forEach(task => getLevel(task.id));
      
      const levelCounts = {};
      const taskNodes = tasks.map(task => {
        const level = levelMap.get(task.id);
        if (levelCounts[level] === undefined) levelCounts[level] = 0;
        
        const x = level * 350;
        const y = levelCounts[level] * 180 + (Math.random() - 0.5) * 50; // Add some randomness
        levelCounts[level]++;

        const parent = task.parent ? taskMap.get(task.parent) : null;

        return {
          id: task.id,
          type: 'custom',
          position: { x, y },
          data: { 
            label: task.name, 
            completed: task.completed, 
            isLocked: parent && !parent.completed,
          },
        };
      });

      const taskEdges = tasks
        .filter(task => task.parent)
        .map(task => ({
          id: `e${task.parent}-${task.id}`,
          source: task.parent,
          target: task.id,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#00c6ff', strokeWidth: 3 }, // Vibrant color, solid line
        }));

      setNodes(taskNodes);
      setEdges(taskEdges);
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [subject, setNodes, setEdges]);

  const onNodeClick = useCallback((event, node) => {
    if (node.data.isLocked) {
      console.log('Node is locked!');
      return;
    }
    toggleTaskCompletion(subjectId, node.id);
  }, [subjectId, toggleTaskCompletion]);
  */

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





  const handleAutoSchedule = useCallback(() => {
    if (!subject) return;
    setIsScheduling(true);
    try {
      const pending = (subject.tasks || []).filter(t => !t.completed);
      const map = scheduleTasksDaily(pending, { days: 7, minutesPerDay: (subject?.dailyGoalHours || 1) * 60, now: new Date() });
      
      // Build the complete updated tasks array with all scheduled due dates
      const nextTasks = subject?.tasks?.map(t => {
        if (map.has(t.id)) {
          return { ...t, dueDate: map.get(t.id) };
        }
        return t;
      });
      
      // Update all tasks in a single call
      updateSubject(subjectId, { tasks: nextTasks });
    } finally {
      setIsScheduling(false);
    }
  }, [subject, subjectId, updateSubject]);

  const handleMoveTask = useCallback((task, destIsoKey) => {
    const newDueDate = destIsoKey === 'unplanned' ? null : destIsoKey;
    const nextTasks = subject?.tasks?.map(t => t.id === task.id ? { ...t, dueDate: newDueDate } : t);
    updateSubject(subjectId, { tasks: nextTasks });
  }, [subject, subjectId, updateSubject]);

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
    return <CircularProgress />;
  }

  if (!subject) return null;

  const progress = getSubjectProgress(subjectId);
  const totalHours = getTotalHoursForSubject(subjectId);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/')} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          {subject?.name}
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
          startIcon={<TimerIcon />}
          onClick={handleOpenSessionDialog}
          sx={{ mr: 2 }}
        >
          Log Study Session
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<AlarmIcon />}
          onClick={() => {
            const timerSection = document.getElementById('timer-section');
            if (timerSection) {
              timerSection.scrollIntoView({ behavior: 'smooth' });
            } else {
              setTabValue(1); // Switch to timer tab if section not found
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
              variant="fullWidth"
              sx={{ mb: 2 }}
            >
              <Tab icon={<AddIcon />} label="Tasks" />
              <Tab icon={<TimerIcon />} label="Study Timer" />
              <Tab icon={<BookIcon />} label="Test Your Knowledge" />
              <Tab icon={<SaveIcon />} label="Saved Tests" />
            </Tabs>
          </Paper>

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              {/* Tab Content - Only show active tab */}
              {tabValue === 0 && (
                <>
                  {/*
                  <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" component="h2" fontWeight="bold" gutterBottom>
                      Skill Tree
                    </Typography>
                    <SkillTree 
                      nodes={nodes}
                      edges={edges}
                      onNodesChange={onNodesChange}
                      onEdgesChange={onEdgesChange}
                      onNodeClick={onNodeClick}
                    />
                  </Paper>
                  */}
                  <Paper sx={{ p: 3, mb: 3 }}>
                    <TaskList subjectId={subjectId} />
                  </Paper>
                </>
              )}

              {tabValue === 1 && (
                <Paper sx={{ p: 3 }} id="timer-section">
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>  
                    <Typography variant="h6">Study Timer</Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />
              
                  <ModernTimer 
                    subjectId={subjectId}
                    subjectName={subject?.name}
                    subjectColor={subject?.color}
                    onSessionComplete={(sessionData) => {
                      addStudySession({
                        subjectId: subjectId,
                        duration: sessionData.duration * 60, // Convert hours to minutes
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
                  onMasteryUpdate={mastery => {/* Optionally update mastery here */}}
                />
              )}

              {tabValue === 3 && (
                <SavedTests subject={subject} />
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
                        backgroundColor: subject?.color,
                      }
                    }}
                  />
                  <Typography variant="body2" sx={{ textAlign: 'center' }}>
                    {Math.round(progress)}% Complete
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Tasks:</strong> {subject?.tasks?.filter(t => t.completed).length} of {subject?.tasks?.length} completed
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Study Time</Typography>
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h3" sx={{ color: subject?.color }}>
                      {totalHours.toFixed(1)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Hours
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2">
                    <strong>Daily Goal:</strong> {subject?.dailyGoalHours} hours
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
                      {subject?.notes}
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Grid>
          </Grid>
      <Dialog open={openSessionDialog} onClose={handleCloseSessionDialog} maxWidth="sm" fullWidth closeAfterTransition={false}>
        <DialogTitle>Log Study Session</DialogTitle>
        <DialogContent>
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
            sx={{ mb: 2, mt: 1 }}
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
        <DialogActions>
          <Button onClick={handleCloseSessionDialog}>Cancel</Button>
          <Button onClick={handleAddSession} variant="contained" color="primary">
            Save Session
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={openNotesDialog} onClose={handleCloseNotesDialog} maxWidth="sm" fullWidth closeAfterTransition={false}>
        <DialogTitle>Subject Notes</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="notes"
            label="Notes"
            multiline
            rows={6}
            fullWidth
            variant="outlined"
            value={subjectNotes}
            onChange={(e) => setSubjectNotes(e.target.value)}
            sx={{ mt: 1 }}
          />
          <Button
            variant="contained"
            component="label"
            sx={{ mt: 2 }}
          >
            Choose File
            <input
              type="file"
              hidden
              onChange={handleFileChange}
            />
          </Button>
          {newAttachment && <Typography variant="body2" sx={{ mt: 1 }}>{newAttachment.name}</Typography>}
          <Typography variant="h6" sx={{ mt: 2 }}>Attachments</Typography>
          <List>
            {(subject.attachments || []).map(attachment => (
              <ListItem key={attachment.id} secondaryAction={ 
                <>
                  <IconButton edge="end" aria-label="delete" onClick={() => deleteAttachment(subjectId, attachment.id)}>
                    <DeleteIcon />
                  </IconButton>
                </>
              }>
                <ListItemText primary={<Button variant="text" onClick={() => handleOpenPdf(attachment)} style={{textTransform: 'none', padding: 0, minWidth: 0}}>{attachment.name}</Button>} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNotesDialog}>Cancel</Button>
          <Button onClick={handleSaveNotes} variant="contained" color="primary">
            Save Notes
          </Button>
        </DialogActions>
      </Dialog>

      <PdfViewer open={pdfViewerOpen} onClose={handleClosePdf} file={selectedPdf} />
    </Container>
  );
};

export default SubjectDetail;