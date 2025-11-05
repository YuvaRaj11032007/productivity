import React, { useState, useContext } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  List,
  ListItem,
  IconButton,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { AppContext } from '../contexts/AppContext';
import NewTimer from './NewTimer';

const StudySessionForm = ({ subjectId }) => {
  const { state, dispatch } = useContext(AppContext);
  const subject = state.subjects.find(s => s.id === subjectId);
  
  const [date] = useState(new Date().toISOString().split('T')[0]);

  // Get today's sessions for this subject
  const todaySessions = state.studySessions.filter(
    session => session.subjectId === subjectId && session.date === date
  );
  
  const totalHoursToday = todaySessions.reduce(
    (total, session) => total + session.duration, 0
  );

  // Handle completed timer session
  const handleTimerSessionComplete = (sessionData) => {
    const newSession = {
      id: Date.now(),
      subjectId,
      ...sessionData,
      createdAt: new Date().toISOString()
    };
    
    dispatch({ type: 'ADD_STUDY_SESSION', payload: newSession });
  };

  return (
    <Box className="study-session-container">
      <Typography variant="h5" component="h3" gutterBottom>
        Study Sessions
      </Typography>

      {subject.dailyGoalHours && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Today's Progress
          </Typography>
          <LinearProgress
            variant="determinate"
            value={Math.min(100, (totalHoursToday / subject.dailyGoalHours) * 100)}
            sx={{ height: 10, borderRadius: 5 }}
          />
          <Typography variant="body2" sx={{ mt: 1, textAlign: 'right' }}>
            {totalHoursToday.toFixed(1)} / {subject.dailyGoalHours} hours
          </Typography>
        </Box>
      )}

      {/* Timer Component */}
      <NewTimer 
        subjectId={subjectId} 
        onSessionComplete={handleTimerSessionComplete} 
      />

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Today's Sessions
        </Typography>
        {todaySessions.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            No sessions recorded for today.
          </Typography>
        ) : (
          <List>
            {todaySessions.map(session => (
              <ListItem 
                key={session.id}
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  mb: 1,
                  p: 2,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <Box>
                  {session.name && (
                    <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                      {session.name}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    {session.duration.toFixed(1)} hours • {format(new Date(session.date), 'MMM d, yyyy')}
                  </Typography>
                  {session.notes && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {session.notes}
                    </Typography>
                  )}
                </Box>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => {
                    dispatch({ 
                      type: 'DELETE_STUDY_SESSION', 
                      payload: session.id 
                    });
                  }}
                  aria-label="Delete session"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItem>
            ))}
           </List>
         )}
       </Box>
     </Box>
  );
};

export default StudySessionForm;