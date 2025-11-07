import React, { useContext, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  Paper,
  Button,
} from '@mui/material';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format } from 'date-fns';
import { SubjectsContext } from '../contexts/SubjectsContext';
import { useAI } from '../contexts/AIContext';
import aiService from '../services/aiService';

const CalendarView = () => {
  const { subjects, getSessionsForDay, getTotalHoursForDay, timetableImage, setTimetableImage, classSchedule, setClassSchedule } = useContext(SubjectsContext);
  const [selectedDate, setSelectedDate] = useState(new Date());
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState('');
        
    const handleDateChange = (date) => {
      setSelectedDate(date);
    };
  
      const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setTimetableImage(reader.result);
            setClassSchedule([]);
            
          };
          reader.readAsDataURL(file);
        }
      };
    
        const handleAnalyzeTimetable = async () => {
    
          if (!timetableImage) return;
    
          setLoading(true);
    
          setError('');
    
          try {
    
            const schedule = await aiService.extractTimetable(timetableImage);
    
            setClassSchedule(schedule);
    
            if (schedule.length > 0) {
    
              const observations = await aiService.getTimetableObservations(schedule);
    
              
    
            }
    
          } catch (e) {
    
            setError(`Failed to analyze timetable: ${e.message || 'Unknown error'}`);
    
          } finally {
    
            setLoading(false);
    
          }
    
        };
    
      
    
        const handleDeleteImage = () => {
    
          setTimetableImage(null);
    
          setClassSchedule([]);
    
          
    
        };
    
      
    
        const sessionsForSelectedDay = getSessionsForDay(selectedDate);
    const totalHoursForDay = getTotalHoursForDay(selectedDate);
  
    const dayOfWeek = format(selectedDate, 'EEEE'); // e.g., "Monday"
    const classesForSelectedDay = classSchedule.filter(c => c.day.toLowerCase() === dayOfWeek.toLowerCase());
  
    // Group sessions by subject
    const sessionsBySubject = {};
    sessionsForSelectedDay.forEach(session => {
      if (!sessionsBySubject[session.subjectId]) {
        sessionsBySubject[session.subjectId] = [];
      }
      sessionsBySubject[session.subjectId].push(session);
    });
  
    // Function to render color dot for study time
    const getTileContent = ({ date, view }) => {
      if (view !== 'month') return null;
  
      const hours = getTotalHoursForDay(date);
      let backgroundColor;
      if (hours === 0) return null;
      else if (hours < 1) backgroundColor = '#ff4d4d'; // Darker red
      else if (hours < 3) backgroundColor = '#ffd700'; // Yellow
      else backgroundColor = '#66bb6a'; // Green
  
      return (
        <div style={{ 
          height: '8px', 
          width: '8px', 
          borderRadius: '50%', 
          backgroundColor, 
          margin: '0 auto',
          marginTop: '2px'
        }} />
      );
    };
  
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Study Calendar
        </Typography>
  
        <Grid container spacing={3}>
          {/* Calendar Section */}
          <Grid item xs={12} md={8}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                backdropFilter: 'blur(10px)',
                backgroundColor: 'rgba(26, 26, 36, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 2,
              }}
            >
              <Box
                sx={{
                  '.react-calendar': {
                    width: '100%',
                    border: 'none',
                    background: 'transparent',
                    fontFamily: '"Inter", sans-serif',
                  },
                  '.react-calendar__navigation button': {
                    color: '#ffffff',
                    fontWeight: 600,
                  },
                  '.react-calendar__navigation button:enabled:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                  '.react-calendar__month-view__days__day': {
                    padding: '12px',
                    color: '#f9fafb',
                    fontSize: '0.9rem',
                  },
                  '.react-calendar__tile--now': {
                    backgroundColor: '#3f51b5 !important',
                    color: '#fff',
                    fontWeight: 600,
                    borderRadius: '8px',
                  },
                  '.react-calendar__tile--active': {
                    backgroundColor: '#ff00aa !important',
                    color: '#fff',
                    fontWeight: 600,
                    borderRadius: '8px',
                  },
                  '.react-calendar__month-view__days__day--weekend': {
                    color: '#ff4d4d',
                  },
                }}
              >
                <Calendar
                  onChange={handleDateChange}
                  value={selectedDate}
                  tileContent={getTileContent}
                  className="dark-calendar"
                />
              </Box>
            </Paper>
                  </Grid>
          
                  {classesForSelectedDay.length > 0 && (
                    <Grid item xs={12}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 3,
                          backdropFilter: 'blur(10px)',
                          backgroundColor: 'rgba(26, 26, 36, 0.8)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: 2,
                          color: '#f9fafb',
                        }}
                      >
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                          Today's Classes
                        </Typography>
                        {classesForSelectedDay.map((c, index) => (
                          <Box key={index} sx={{ mb: 1, pl: 2 }}>
                            <Typography variant="body2" sx={{ color: '#ccc' }}>
                              • {c.subject} ({c.startTime} - {c.endTime})
                            </Typography>
                          </Box>
                        ))}
                      </Paper>
                    </Grid>
                  )}
          
                  {/* Summary Section */}
                  <Grid item xs={12} md={4}>            <Card
              sx={{
                backgroundColor: 'rgba(26, 26, 36, 0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                color: '#f9fafb',
                mb: 3
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Upload Timetable
                </Typography>
                <Button variant="contained" component="label">
                  Upload Image
                  <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                </Button>
              </CardContent>
            </Card>
  
                                {timetableImage && (
  
                                  <Card
  
                                    sx={{
  
                                      backgroundColor: 'rgba(26, 26, 36, 0.8)',
  
                                      backdropFilter: 'blur(10px)',
  
                                      border: '1px solid rgba(255, 255, 255, 0.1)',
  
                                      borderRadius: 2,
  
                                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  
                                      color: '#f9fafb',
  
                                      mb: 3
  
                                    }}
  
                                  >
  
                                    <CardContent>
  
                                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
  
                                        Your Timetable
  
                                      </Typography>
  
                                      <img src={timetableImage} alt="Timetable" style={{ width: '100%', borderRadius: '8px' }} />
  
                                      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
  
                                        <Button variant="contained" onClick={handleAnalyzeTimetable} disabled={loading}>
  
                                          {loading ? 'Analyzing...' : 'Analyze Timetable'}
  
                                        </Button>
  
                                        <Button variant="outlined" color="error" onClick={handleDeleteImage} disabled={loading}>
  
                                          Delete Image
  
                                        </Button>
  
                                      </Box>
  
                                      {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
  
                                    </CardContent>
  
                                  </Card>
  
                                )}
  
                      
  
                                <Card
  
                                  sx={{
  
                                    backgroundColor: 'rgba(26, 26, 36, 0.8)',
  
                                    backdropFilter: 'blur(10px)',
  
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
  
                                    borderRadius: 2,
  
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  
                                    color: '#f9fafb',
  
                                  }}
  
                                >
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  {format(selectedDate, 'PPPP')}
                </Typography>
                                            <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                              
                                            {totalHoursForDay > 0 ? (
                                              <>
                                                <Box sx={{ textAlign: 'center', py: 2 }}>
                                                  <Typography variant="h3" color="#6366f1">
                                                    {totalHoursForDay.toFixed(1)}
                                                  </Typography>                      <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                        Total Hours Studied
                      </Typography>
                    </Box>
  
                    <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
  
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                      Study Sessions:
                    </Typography>
  
                    {Object.keys(sessionsBySubject).map(subjectId => {
                      const subject = subjects.find(s => s.id === subjectId);
                      if (!subject) return null;
  
                      const sessions = sessionsBySubject[subjectId];
                      const totalSubjectHours = sessions.reduce(
                        (total, session) => total + (session.duration / 60),
                        0
                      );
  
                      return (
                        <Box key={subjectId} sx={{ mb: 2 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Chip
                              label={subject.name}
                              size="small"
                              sx={{
                                backgroundColor: subject.color,
                                color: '#fff',
                                fontWeight: 'medium',
                                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                              }}
                              onClick={undefined}
                            />
                            <Typography variant="body2" sx={{ color: '#bbb' }}>
                              {totalSubjectHours.toFixed(1)} hrs
                            </Typography>
                          </Box>
  
                          <Box sx={{ mt: 1, pl: 2 }}>
                            {sessions.map((session, index) => (
                              <Typography
                                key={index}
                                variant="body2"
                                sx={{ mb: 0.5, color: '#ccc' }}
                              >
                                • {session.duration} min ·{' '}
                                {format(new Date(session.date), 'p')}
                              </Typography>
                            ))}
                          </Box>
                        </Box>
                      );
                    })}
                  </>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="rgba(255, 255, 255, 0.6)">
                      No study sessions recorded for this day
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    );
  };

export default CalendarView;