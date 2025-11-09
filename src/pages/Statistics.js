import React, { useContext, useState, useMemo, useRef, useCallback } from 'react';
import { 
  Container, Typography, Box, Paper, Grid, Card, CardContent, 
  Divider, FormControl, InputLabel, Select, MenuItem, Tabs, Tab,
  Button, IconButton, Tooltip, CircularProgress, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  ToggleButton, ToggleButtonGroup, Chip, Avatar, Badge,
  List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction
} from '@mui/material';
import { SubjectsContext } from '../contexts/SubjectsContext';
import { Bar, Pie, Line, Doughnut, Radar, PolarArea, getElementsAtEvent } from 'react-chartjs-2';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, 
  Title, Tooltip as ChartTooltip, Legend, ArcElement, PointElement, 
  LineElement, RadialLinearScale, RadarController, PolarAreaController,
  Filler, BubbleController, ScatterController
} from 'chart.js';
import { format, subDays, eachDayOfInterval, getDay, addDays, differenceInDays } from 'date-fns';
import DownloadIcon from '@mui/icons-material/Download';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import InsightsIcon from '@mui/icons-material/Insights';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DateRangeIcon from '@mui/icons-material/DateRange';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CategoryIcon from '@mui/icons-material/Category';
import GetAppIcon from '@mui/icons-material/GetApp';

import AIContext from '../contexts/AIContext';
import aiService from '../services/aiService';

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  ChartTooltip, 
  Legend, 
  ArcElement, 
  PointElement, 
  LineElement,
  RadialLinearScale,
  RadarController,
  PolarAreaController,
  Filler,
  BubbleController,
  ScatterController
);

const Statistics = () => {
  const { 
    subjects, 
    studySessions, 
    getTotalHoursForSubject, 
    getSubjectProgress,
    checkDailyGoals
  } = useContext(SubjectsContext);
  
  // Refs for chart downloads
  const chartRefs = {
    hoursChart: useRef(null),
    progressChart: useRef(null),
    dailyChart: useRef(null),
    timeDistributionChart: useRef(null),
    productivityRadarChart: useRef(null),
    focusTimeChart: useRef(null),
    goalTrackingChart: useRef(null),
    categoryDistributionChart: useRef(null),
    categoryCompletionChart: useRef(null)
  };
  
  // State for various filters and view options
  const [timeRange, setTimeRange] = useState('week');
  const [activeTab, setActiveTab] = useState(0);
  const [chartType, setChartType] = useState('bar');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [goalTrackingView, setGoalTrackingView] = useState('daily'); // 'daily', 'weekly', 'monthly'
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const { apiKeys } = useContext(AIContext);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [showInsightsDialog, setShowInsightsDialog] = useState(false);
  
  // Get unique categories from subjects
  const categories = useMemo(() => {
    const uniqueCategories = new Set(subjects.map(subject => subject.category || 'Uncategorized'));
    return ['all', ...Array.from(uniqueCategories)];
  }, [subjects]);
  
  
  // Prepare data for charts
  const prepareSubjectData = useCallback(() => {
    // Filter subjects if a specific one is selected
    const filteredSubjects = selectedSubject === 'all' 
      ? subjects 
      : subjects.filter(subject => subject.id === selectedSubject);
      
    return {
      labels: filteredSubjects.map(subject => subject.name),
      datasets: [
        {
          label: 'Hours Studied',
          data: filteredSubjects.map(subject => getTotalHoursForSubject(subject.id)),
          backgroundColor: filteredSubjects.map(subject => subject.color),
          borderColor: filteredSubjects.map(subject => subject.color),
          borderWidth: 1,
        },
      ],
    };
  }, [selectedSubject, subjects, getTotalHoursForSubject]);
  
  const prepareProgressData = useCallback(() => {
    // Filter subjects if a specific one is selected
    const filteredSubjects = selectedSubject === 'all' 
      ? subjects 
      : subjects.filter(subject => subject.id === selectedSubject);
      
    return {
      labels: filteredSubjects.map(subject => subject.name),
      datasets: [
        {
          label: 'Completion Percentage',
          data: filteredSubjects.map(subject => getSubjectProgress(subject.id)),
          backgroundColor: filteredSubjects.map(subject => subject.color),
          borderColor: filteredSubjects.map(subject => subject.color),
          borderWidth: 1,
        },
      ],
    };
  }, [selectedSubject, subjects, getSubjectProgress]);
  
  const prepareDailyData = useCallback(() => {
    let days;
    const today = new Date();
    
    if (timeRange === 'week') {
      days = 7;
    } else if (timeRange === 'month') {
      days = 30;
    } else { // year
      days = 365;
    }
    
    const dateRange = eachDayOfInterval({
      start: subDays(today, days - 1),
      end: today
    });
    
    const dailyData = dateRange.map(date => {
      const dayStr = format(date, 'yyyy-MM-dd');
      const dayStart = new Date(dayStr);
      const dayEnd = new Date(dayStr);
      dayEnd.setHours(23, 59, 59, 999);
      
      // Filter by selected subject if applicable
      const relevantSessions = studySessions.filter(session => {
        const sessionDate = new Date(session.date);
        const dateMatches = sessionDate >= dayStart && sessionDate <= dayEnd;
        const subjectMatches = selectedSubject === 'all' || session.subjectId === selectedSubject;
        return dateMatches && subjectMatches;
      });
      
      const dayTotal = relevantSessions.reduce((total, session) => total + (session.duration / 60), 0);
      
      return {
        date,
        total: dayTotal
      };
    });
    
    // Calculate moving average for trend line (3-day moving average)
    const movingAverages = [];
    for (let i = 2; i < dailyData.length; i++) {
        const avg = (dailyData[i].total + dailyData[i-1].total + dailyData[i-2].total) / 3;
        movingAverages.push(avg);
    }
    
    // Add padding for the first two days where we can't calculate a 3-day average
    movingAverages.unshift(null, null);
    
    return {
      labels: dailyData.map(d => format(d.date, timeRange === 'week' ? 'EEE' : 'MMM dd')),
      datasets: [
        {
          label: 'Hours Studied',
          data: dailyData.map(d => d.total),
          backgroundColor: '#3f51b5',
          borderColor: '#3f51b5',
          tension: 0.1,
          fill: false,
          type: 'bar'
        },
        {
          label: '3-Day Average',
          data: movingAverages,
          borderColor: '#f50057',
          backgroundColor: 'rgba(0, 0, 0, 0)',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 0,
          borderDash: [5, 5],
          type: 'line'
        }
      ],
    };
  }, [timeRange, studySessions, selectedSubject]);
  
  // Prepare time distribution data (hours by day of week)
  const prepareTimeDistributionData = useCallback(() => {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayTotals = Array(7).fill(0);
    const hoursByTimeOfDay = Array(24).fill(0);
    
    // Filter sessions by selected subject and category if applicable
    const relevantSessions = studySessions.filter(session => {
      const subjectMatches = selectedSubject === 'all' || session.subjectId === selectedSubject;
      
      if (!subjectMatches) return false;
      
      if (selectedCategory !== 'all') {
        const subject = subjects.find(s => s.id === session.subjectId);
        return subject && (subject.category || 'Uncategorized') === selectedCategory;
      }
      
      return true;
    });
    
    relevantSessions.forEach(session => {
      const sessionDate = new Date(session.date);
      const dayOfWeek = getDay(sessionDate); // 0 = Sunday, 6 = Saturday
      const hourOfDay = sessionDate.getHours();
      
      dayTotals[dayOfWeek] += session.duration / 60; // Convert minutes to hours
      hoursByTimeOfDay[hourOfDay] += session.duration / 60;
    });
    
    // Prepare time of day data for heatmap
    const timeOfDayData = [];
    for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
        // In a real implementation, we would calculate this from actual data
        // For now, we'll use a simplified model based on the day totals
        const value = relevantSessions.filter(session => {
            const sessionDate = new Date(session.date);
            return getDay(sessionDate) === day && sessionDate.getHours() === hour;
        }).reduce((sum, session) => sum + (session.duration / 60), 0);
        
        timeOfDayData.push({
          day,
          hour,
          value
        });
      }
    }
    
    return {
      dayOfWeek: {
        labels: daysOfWeek,
        datasets: [
          {
            label: 'Hours by Day of Week',
            data: dayTotals,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
        ],
      },
      timeOfDay: {
        labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
        datasets: [
          {
            label: 'Hours by Time of Day',
            data: hoursByTimeOfDay,
            backgroundColor: 'rgba(153, 102, 255, 0.6)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1,
          },
        ],
      },
      heatmap: timeOfDayData
    };
  }, [studySessions, selectedSubject, selectedCategory, subjects]);
  
  // Prepare goal tracking data
  const prepareGoalTrackingData = useCallback(() => {
    // For weekly and monthly views, we need to aggregate the data
    const today = new Date();
    
    // Filter sessions based on time range
    let relevantSessions;
    if (timeRange === 'week') {
      relevantSessions = studySessions.filter(session => {
        const sessionDate = new Date(session.date);
        return differenceInDays(today, sessionDate) < 7;
      });
    } else if (timeRange === 'month') {
      relevantSessions = studySessions.filter(session => {
        const sessionDate = new Date(session.date);
        return differenceInDays(today, sessionDate) < 30;
      });
    } else { // year
      relevantSessions = studySessions.filter(session => {
        const sessionDate = new Date(session.date);
        return differenceInDays(today, sessionDate) < 365;
      });
    }
    
    // Group sessions by subject and date
    const sessionsBySubjectAndDate = {};
    relevantSessions.forEach(session => {
      const dateStr = format(new Date(session.date), 'yyyy-MM-dd');
      const subjectId = session.subjectId;
      
      if (!sessionsBySubjectAndDate[subjectId]) {
        sessionsBySubjectAndDate[subjectId] = {};
      }
      
      if (!sessionsBySubjectAndDate[subjectId][dateStr]) {
        sessionsBySubjectAndDate[subjectId][dateStr] = [];
      }
      
      sessionsBySubjectAndDate[subjectId][dateStr].push(session);
    });
    
    // Calculate daily goal achievement for each subject
    const goalData = subjects.map(subject => {
      const dailyGoalHours = subject.dailyGoalHours || 0;
      
      if (dailyGoalHours === 0) {
        return {
          subject,
          goalAchievement: 100, // If no goal, consider it achieved
          daysMetGoal: 0,
          totalDays: 0,
          streak: 0
        };
      }
      
      // Calculate days where goal was met
      let daysMetGoal = 0;
      let currentStreak = 0;
      let maxStreak = 0;
      
      // Get date range based on selected time range
      let days;
      if (timeRange === 'week') {
        days = 7;
      } else if (timeRange === 'month') {
        days = 30;
      } else { // year
        days = 365;
      }
      
      const dateRange = eachDayOfInterval({
        start: subDays(today, days - 1),
        end: today
      });
      
      // Check each day in the range
      dateRange.forEach(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const sessionsForDay = sessionsBySubjectAndDate[subject.id]?.[dateStr] || [];
        const hoursForDay = sessionsForDay.reduce((sum, session) => sum + (session.duration / 60), 0);
        
        const goalMet = hoursForDay >= dailyGoalHours;
        
        if (goalMet) {
          daysMetGoal++;
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      });
      
      return {
        subject,
        goalAchievement: (daysMetGoal / days) * 100,
        daysMetGoal,
        totalDays: days,
        streak: maxStreak
      };
    });
    
    // Filter by selected subject if applicable
    const filteredGoalData = selectedSubject === 'all' 
      ? goalData 
      : goalData.filter(item => item.subject.id === selectedSubject);
    
    // Prepare data for daily view (last 7 days)
    const last7Days = eachDayOfInterval({
      start: subDays(today, 6),
      end: today
    });
    
    const dailyViewData = {
      labels: last7Days.map(date => format(date, 'MMM dd')),
      datasets: filteredGoalData.map(item => {
        const dailyHours = last7Days.map(date => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const sessionsForDay = sessionsBySubjectAndDate[item.subject.id]?.[dateStr] || [];
          return sessionsForDay.reduce((sum, session) => sum + (session.duration / 60), 0);
        });
        
        return {
          label: item.subject.name,
          data: dailyHours,
          backgroundColor: item.subject.color,
          borderColor: item.subject.color,
          borderWidth: 1,
        };
      })
    };
    
    // Prepare data for weekly view (last 4 weeks)
    const weeklyLabels = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = subDays(today, i * 7 + 6);
      const weekEnd = subDays(today, i * 7);
      weeklyLabels.push(`${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd')}`);
    }
    
    const weeklyViewData = {
      labels: weeklyLabels,
      datasets: filteredGoalData.map(item => {
        const weeklyHours = [0, 0, 0, 0]; // Initialize with 4 weeks
        
        // Calculate hours for each week
        relevantSessions.forEach(session => {
            if (session.subjectId === item.subject.id) {
            const sessionDate = new Date(session.date);
            const daysAgo = differenceInDays(today, sessionDate);
            const weekIndex = Math.floor(daysAgo / 7);
            
            if (weekIndex >= 0 && weekIndex < 4) {
              weeklyHours[3 - weekIndex] += session.duration / 60; // Reverse index to show oldest first
            }
          }
        });
        
        return {
          label: item.subject.name,
          data: weeklyHours,
          backgroundColor: item.subject.color,
          borderColor: item.subject.color,
          borderWidth: 1,
        };
      })
    };
    
    // Prepare data for monthly view (last 6 months)
    const monthlyLabels = [];
    for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(today);
        monthDate.setMonth(today.getMonth() - i);
        monthlyLabels.push(format(monthDate, 'MMM yyyy'));
    }
    
    const monthlyViewData = {
        labels: monthlyLabels,
        datasets: filteredGoalData.map(item => {
        const monthlyHours = [0, 0, 0, 0, 0, 0]; // Initialize with 6 months
        
        // Calculate hours for each month
        relevantSessions.forEach(session => {
          if (session.subjectId === item.subject.id) {
            const sessionDate = new Date(session.date);
            const monthsAgo = (today.getMonth() - sessionDate.getMonth()) + 
                             (12 * (today.getFullYear() - sessionDate.getFullYear()));
            
            if (monthsAgo >= 0 && monthsAgo < 6) {
              monthlyHours[5 - monthsAgo] += session.duration / 60; // Reverse index to show oldest first
            }
          }
        });
        
        return {
          label: item.subject.name,
          data: monthlyHours,
          backgroundColor: item.subject.color,
          borderColor: item.subject.color,
          borderWidth: 1,
        };
      })
    };
    
    return {
      labels: filteredGoalData.map(item => item.subject.name),
      datasets: [
        {
          label: 'Goal Achievement (%)',
          data: filteredGoalData.map(item => item.goalAchievement),
          backgroundColor: filteredGoalData.map(item => item.subject.color),
          borderColor: filteredGoalData.map(item => item.subject.color),
          borderWidth: 1,
        },
      ],
      goalDetails: filteredGoalData,
      daily: dailyViewData,
      weekly: weeklyViewData,
      monthly: monthlyViewData
    };
  }, [subjects, studySessions, timeRange]);
  
  // Prepare category distribution data
  const prepareCategoryDistributionData = useCallback(() => {
    // Group subjects by category
    const subjectsByCategory = {};
    subjects.forEach(subject => {
      const category = subject.category || 'Uncategorized';
      if (!subjectsByCategory[category]) {
        subjectsByCategory[category] = [];
      }
      subjectsByCategory[category].push(subject);
    });
    
    // Calculate total hours and task completion for each category
    const categoryData = Object.entries(subjectsByCategory).map(([category, categorySubjects]) => {
      const totalHours = categorySubjects.reduce(
        (sum, subject) => sum + getTotalHoursForSubject(subject.id), 0
      );
      
      const totalTasks = categorySubjects.reduce(
        (sum, subject) => sum + subject.tasks.length, 0
      );
      
      const completedTasks = categorySubjects.reduce(
        (sum, subject) => sum + subject.tasks.filter(task => task.completed).length, 0
      );
      
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      
      return {
        category,
        subjectCount: categorySubjects.length,
        totalHours,
        totalTasks,
        completedTasks,
        completionRate
      };
    });
    
    return {
      hours: {
        labels: categoryData.map(item => item.category),
        datasets: [
          {
            label: 'Hours by Category',
            data: categoryData.map(item => item.totalHours),
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)',
              'rgba(255, 159, 64, 0.6)',
              'rgba(199, 199, 199, 0.6)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)',
              'rgba(199, 199, 199, 1)'
            ],
            borderWidth: 1,
          },
        ],
      },
      completion: {
        labels: categoryData.map(item => item.category),
        datasets: [
          {
            label: 'Task Completion Rate (%)',
            data: categoryData.map(item => item.completionRate),
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)',
              'rgba(255, 159, 64, 0.6)',
              'rgba(199, 199, 199, 0.6)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)',
              'rgba(199, 199, 199, 1)'
            ],
            borderWidth: 1,
          },
        ],
      },
      details: categoryData
    };
  }, [subjects, getTotalHoursForSubject]);
  
  
  // Prepare productivity score radar chart
  const prepareProductivityRadarData = useCallback(() => {
    // Filter subjects if a specific one is selected
    const filteredSubjects = selectedSubject === 'all' 
      ? subjects.slice(0, 5) // Limit to 5 subjects for readability
      : subjects.filter(subject => subject.id === selectedSubject);
    
    // Calculate metrics for each subject
    const metrics = filteredSubjects.map(subject => {
      const totalHours = getTotalHoursForSubject(subject.id);
      const progress = getSubjectProgress(subject.id);
      const dailyGoal = subject.dailyGoalHours;
      const recentSessions = studySessions
        .filter(session => session.subjectId === subject.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
      
      // Calculate consistency (days between first and last session divided by number of sessions)
      let consistency = 0;
      if (recentSessions.length > 1) {
        const firstDate = new Date(recentSessions[recentSessions.length - 1].date);
        const lastDate = new Date(recentSessions[0].date);
        const daysBetween = differenceInDays(lastDate, firstDate) + 1;
        consistency = (recentSessions.length / daysBetween) * 100;
        consistency = Math.min(consistency, 100); // Cap at 100%
      }
      
      // Calculate average session length
      const avgSessionLength = recentSessions.length > 0
        ? recentSessions.reduce((sum, session) => sum + session.duration, 0) / recentSessions.length / 60
        : 0;
      
      // Calculate daily goal achievement rate
      const dailyGoalAchievement = dailyGoal > 0 ? Math.min((totalHours / (dailyGoal * 30)) * 100, 100) : 0;
      
      return {
        subject,
        metrics: {
          'Progress': progress,
          'Consistency': consistency,
          'Session Length': Math.min(avgSessionLength * 20, 100), // Scale to 0-100
          'Goal Achievement': dailyGoalAchievement,
          'Study Hours': Math.min(totalHours * 5, 100) // Scale to 0-100
        }
      };
    });
    
    return {
      labels: ['Progress', 'Consistency', 'Session Length', 'Goal Achievement', 'Study Hours'],
      datasets: metrics.map(item => ({
        label: item.subject.name,
        data: Object.values(item.metrics),
        backgroundColor: `${item.subject.color}40`,
        borderColor: item.subject.color,
        borderWidth: 2,
        pointBackgroundColor: item.subject.color,
        pointRadius: 4
      }))
    };
  }, [selectedSubject, subjects, getTotalHoursForSubject, getSubjectProgress, studySessions]);
  
  
  // Memoize chart data to prevent unnecessary recalculations
  const subjectData = useMemo(prepareSubjectData, [prepareSubjectData]);
  
  const progressData = useMemo(prepareProgressData, [prepareProgressData]);
  
  const dailyData = useMemo(prepareDailyData, [prepareDailyData]);
  
  const timeDistributionData = useMemo(prepareTimeDistributionData, [prepareTimeDistributionData]);
  
  const productivityRadarData = useMemo(prepareProductivityRadarData, [prepareProductivityRadarData]);

  const goalTrackingData = useMemo(prepareGoalTrackingData, [prepareGoalTrackingData]);
  
  const categoryDistributionData = useMemo(prepareCategoryDistributionData, [prepareCategoryDistributionData]);

  // Calculate total stats
  const totalHours = useMemo(() => subjects.reduce(
    (total, subject) => total + getTotalHoursForSubject(subject.id), 0
  ), [subjects, getTotalHoursForSubject]);
  
  const totalTasks = useMemo(() => subjects.reduce(
    (total, subject) => total + subject.tasks.length, 0
  ), [subjects]);
  
  const completedTasks = useMemo(() => subjects.reduce(
    (total, subject) => total + subject.tasks.filter(task => task.completed).length, 0
  ), [subjects]);
  
  const overallProgress = useMemo(() => totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0, [completedTasks, totalTasks]);
  
  // Calculate productivity score
  const calculateProductivityScore = useCallback(() => {
    if (subjects.length === 0 || studySessions.length === 0) return 0;
    
    // Get recent sessions (last 30 days)
    const recentSessions = studySessions.filter(session => {
      const sessionDate = new Date(session.date);
      const thirtyDaysAgo = subDays(new Date(), 30);
      return sessionDate >= thirtyDaysAgo;
    });
    
    if (recentSessions.length === 0) return 0;
    
    // Calculate metrics
    const totalRecentHours = recentSessions.reduce((sum, session) => sum + (session.duration / 60), 0);
    const avgDailyHours = totalRecentHours / 30;
    
    // Calculate consistency (number of unique days with sessions in the last 30 days)
    const uniqueDays = new Set(recentSessions.map(session => format(new Date(session.date), 'yyyy-MM-dd')));
    const consistencyScore = (uniqueDays.size / 30) * 100;
    
    // Calculate task completion rate
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    // Calculate goal achievement
    const dailyGoalsResults = checkDailyGoals();
    const goalAchievement = dailyGoalsResults.filter(goal => goal.goalMet).length / dailyGoalsResults.length * 100 || 0;
    
    // Weighted score calculation
    const score = (
      (avgDailyHours * 20) + // Weight: 20%
      (consistencyScore * 0.3) + // Weight: 30%
      (completionRate * 0.3) + // Weight: 30%
      (goalAchievement * 0.2) // Weight: 20%
    );
    
    return Math.min(Math.round(score), 100); // Cap at 100
  }, [subjects, studySessions, totalTasks, completedTasks, checkDailyGoals]);

  const productivityScore = useMemo(calculateProductivityScore, [calculateProductivityScore]);
  
  // Predict future progress
  const predictFutureProgress = useCallback(() => {
    if (subjects.length === 0 || studySessions.length === 0) {
      return { daysToComplete: null, estimatedCompletion: null, trend: 'neutral' };
    }
    
    // Get recent sessions (last 14 days) to establish trend
    const recentSessions = studySessions.filter(session => {
      const sessionDate = new Date(session.date);
      const fourteenDaysAgo = subDays(new Date(), 14);
      return sessionDate >= fourteenDaysAgo;
    });
    
    if (recentSessions.length === 0) {
      return { daysToComplete: null, estimatedCompletion: null, trend: 'neutral' };
    }
    
    // Calculate average daily hours in recent period
    const totalRecentHours = recentSessions.reduce((sum, session) => sum + (session.duration / 60), 0);
    const avgDailyHours = totalRecentHours / 14;
    
    // Calculate remaining tasks
    const remainingTasks = totalTasks - completedTasks;
    
    // Estimate days to complete all tasks based on current rate
    // Assuming each task requires an average of 2 hours to complete (simplified model)
    const estimatedHoursPerTask = 2;
    const estimatedRemainingHours = remainingTasks * estimatedHoursPerTask;
    
    // Calculate days to completion
    const daysToComplete = avgDailyHours > 0 ? Math.ceil(estimatedRemainingHours / avgDailyHours) : null;
    
    // Calculate estimated completion date
    const estimatedCompletion = daysToComplete ? addDays(new Date(), daysToComplete) : null;
    
    // Determine trend (improving, declining, or stable)
    let trend = 'neutral';
    if (recentSessions.length >= 4) {
      // Compare first half to second half of the period
      const halfwayPoint = Math.floor(recentSessions.length / 2);
      const firstHalfSessions = recentSessions.slice(0, halfwayPoint);
      const secondHalfSessions = recentSessions.slice(halfwayPoint);
      
      const firstHalfHours = firstHalfSessions.reduce((sum, session) => sum + (session.duration / 60), 0);
      const secondHalfHours = secondHalfSessions.reduce((sum, session) => sum + (session.duration / 60), 0);
      
      if (secondHalfHours > firstHalfHours * 1.2) { // 20% improvement
        trend = 'improving';
      } else if (secondHalfHours < firstHalfHours * 0.8) { // 20% decline
        trend = 'declining';
      }
    }
    
    return { daysToComplete, estimatedCompletion, trend };
  }, [subjects, studySessions, totalTasks, completedTasks]);

  const prediction = useMemo(predictFutureProgress, [predictFutureProgress]);
  
  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleChartTypeChange = (event, newType) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };
  
  const handleSubjectChange = (event) => {
    setSelectedSubject(event.target.value);
  };
  
  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };

  const handleGoalTrackingViewChange = (event, newView) => {
    if (newView !== null) {
      setGoalTrackingView(newView);
    }
  };
  
  const handleShowInsightsDialog = () => {
    handleGenerateRecommendations();
    setShowInsightsDialog(true);
  };

  const handleGenerateRecommendations = async () => {
    try {
      aiService.setApiKeys(apiKeys);
      const recommendations = await aiService.getRecommendations(subjects, studySessions, checkDailyGoals());
      setAiRecommendations(recommendations);
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
    }
  };

  const handleGenerateAiAnalysis = async () => {
    setIsAiLoading(true);
    try {
      aiService.setApiKeys(apiKeys);
      const analysis = await aiService.analyzeProductivity(subjects, studySessions, checkDailyGoals());
      setAiAnalysis(analysis);
    } catch (error) {
      console.error('Error generating AI analysis:', error);
      setSnackbarMessage('Error generating AI analysis. Please check your API keys.');
      setSnackbarSeverity('error');
      setShowSnackbar(true);
    }
    setIsAiLoading(false);
  };
  
  return (
    <>
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Analytics Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="View Insights">
            <IconButton 
              color="primary" 
              onClick={handleShowInsightsDialog} 
              sx={{ mr: 1 }}
            >
              <Badge badgeContent={generateInsights().length} color="secondary">
                <InsightsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          <Button 
            variant="outlined" 
            startIcon={isLoading ? <CircularProgress size={20} /> : <DownloadIcon />}
            onClick={handleExportData}
            disabled={isLoading}
            sx={{ mr: 2 }}
          >
            Export Data
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 120, mr: 1 }} size="small">
              <InputLabel id="subject-filter-label">Subject</InputLabel>
              <Select
                labelId="subject-filter-label"
                value={selectedSubject}
                label="Subject"
                onChange={handleSubjectChange}
              >
                <MenuItem value="all">All Subjects</MenuItem>
                {subjects.map((subject) => (
                  <MenuItem key={subject.id} value={subject.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box 
                        sx={{ 
                          width: 12, 
                          height: 12, 
                          borderRadius: '50%', 
                          backgroundColor: subject.color,
                          mr: 1 
                        }} 
                      />
                      {subject.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl sx={{ minWidth: 120 }} size="small">
              <InputLabel id="category-filter-label">Category</InputLabel>
              <Select
                labelId="category-filter-label"
                value={selectedCategory}
                label="Category"
                onChange={handleCategoryChange}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categories.filter(cat => cat !== 'all').map((category) => (
                  <MenuItem key={category} value={category}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CategoryIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                      {category}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Box>
      
      <Tabs 
        value={activeTab} 
        onChange={handleTabChange} 
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Overview" icon={<EqualizerIcon />} iconPosition="start" />
        <Tab label="Productivity Analysis" icon={<InsightsIcon />} iconPosition="start" />
        <Tab label="Time Distribution" icon={<AccessTimeIcon />} iconPosition="start" />
        <Tab label="Subject Details" icon={<AssessmentIcon />} iconPosition="start" />
        <Tab label="Goal Tracking" icon={<EmojiEventsIcon />} iconPosition="start" />
        <Tab label="Category Analysis" icon={<CategoryIcon />} iconPosition="start" />
        <Tab label="AI Insights" icon={<InsightsIcon />} iconPosition="start" />
      </Tabs>
      
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  Total Study Time
                </Typography>
                <Typography variant="h3" component="div" color="primary">
                  {totalHours.toFixed(1)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Hours
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  Subjects
                </Typography>
                <Typography variant="h3" component="div" color="primary">
                  {subjects.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  Tasks Completed
                </Typography>
                <Typography variant="h3" component="div" color="primary">
                  {completedTasks}/{totalTasks}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {Math.round(overallProgress)}% Complete
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  Study Sessions
                </Typography>
                <Typography variant="h3" component="div" color="primary">
                  {studySessions.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        
          {/* Charts */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Hours by Subject</Typography>
                <ToggleButtonGroup
                  value={chartType}
                  exclusive
                  onChange={handleChartTypeChange}
                  size="small"
                >
                  <ToggleButton value="bar">
                    <Tooltip title="Bar Chart">
                      <BarChartIcon fontSize="small" />
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value="pie">
                    <Tooltip title="Pie Chart">
                      <PieChartIcon fontSize="small" />
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value="doughnut">
                    <Tooltip title="Doughnut Chart">
                      <DonutLargeIcon fontSize="small" />
                    </Tooltip>
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {subjects.length > 0 ? (
                <Box sx={{ height: 300 }}>
                  {chartType === 'bar' && subjectData && subjectData.labels && subjectData.labels.length > 0 && (
                    <Bar 
                      data={subjectData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'Hours',
                            },
                          },
                        },
                      }}
                    />
                  )}
                  {chartType === 'pie' && subjectData && subjectData.labels && subjectData.labels.length > 0 && (
                    <Pie 
                      data={subjectData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'right',
                          },
                        },
                      }}
                    />
                  )}
                  {chartType === 'doughnut' && subjectData && subjectData.labels && subjectData.labels.length > 0 && (
                    <Doughnut 
                      data={subjectData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'right',
                          },
                        },
                        cutout: '70%',
                      }}
                    />
                  )}
                  {(!subjectData || !subjectData.labels || subjectData.labels.length === 0) && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <Typography variant="body2" color="textSecondary">
                        No data available for the selected filters
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                  <Typography variant="body1" color="textSecondary">
                    Add subjects to see statistics
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Progress by Subject</Typography>
              <Divider sx={{ mb: 2 }} />
              {subjects.length > 0 ? (
                <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                  {progressData && progressData.labels && progressData.labels.length > 0 ? (
                    <Pie 
                      data={progressData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'right',
                          },
                        },
                      }}
                    />
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <Typography variant="body2" color="textSecondary">
                        No progress data available
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                  <Typography variant="body1" color="textSecondary">
                    Add subjects to see statistics
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Study Time Trend</Typography>
                <FormControl sx={{ minWidth: 120 }} size="small">
                  <InputLabel id="time-range-label">Time Range</InputLabel>
                  <Select
                    labelId="time-range-label"
                    value={timeRange}
                    label="Time Range"
                    onChange={handleTimeRangeChange}
                  >
                    <MenuItem value="week">Last 7 Days</MenuItem>
                    <MenuItem value="month">Last 30 Days</MenuItem>
                    <MenuItem value="year">Last 365 Days</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ height: 300 }}>
                {dailyData && dailyData.labels && dailyData.labels.length > 0 ? (
                  <Line 
                    data={dailyData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: true,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Hours',
                          },
                        },
                      },
                    }}
                    ref={chartRefs.dailyChart}
                    onClick={(event) => handleChartClick(event, chartRefs.dailyChart, 'Daily Study Hours')}
                  />
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography variant="body2" color="textSecondary">
                      No data available for the selected time range
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
      
      {activeTab === 1 && (
        <Grid container spacing={3}>
          {/* Productivity Score */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="h6" gutterBottom>Productivity Score</Typography>
              <Box sx={{ position: 'relative', display: 'inline-flex', my: 2 }}>
                <CircularProgress 
                  variant="determinate" 
                  value={productivityScore} 
                  size={160} 
                  thickness={5} 
                  sx={{ 
                    color: productivityScore > 75 ? 'success.main' : 
                           productivityScore > 50 ? 'warning.main' : 'error.main' 
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
                  }}
                >
                  <Typography variant="h3" component="div" color="text.secondary">
                    {productivityScore}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="textSecondary" align="center">
                Based on consistency, task completion, and goal achievement
              </Typography>
            </Paper>
          </Grid>
          
          {/* Prediction Card */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Completion Prediction</Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ mr: 1 }}>
                  {prediction.trend === 'improving' ? (
                    <TrendingUpIcon color="success" fontSize="large" />
                  ) : prediction.trend === 'declining' ? (
                    <TrendingDownIcon color="error" fontSize="large" />
                  ) : (
                    <TimelineIcon color="action" fontSize="large" />
                  )}
                </Box>
                <Typography variant="body1">
                  {prediction.trend === 'improving' ? 'Improving Trend' : 
                   prediction.trend === 'declining' ? 'Declining Trend' : 'Stable Trend'}
                </Typography>
              </Box>
              
              {prediction.daysToComplete ? (
                <>
                  <Typography variant="body2" paragraph>
                    At your current pace, you'll complete all tasks in approximately:
                  </Typography>
                  <Typography variant="h5" color="primary" gutterBottom>
                    {prediction.daysToComplete} days
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Estimated completion date: {prediction.estimatedCompletion ? 
                      format(prediction.estimatedCompletion, 'MMMM d, yyyy') : 'Unknown'}
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Not enough data to make a prediction. Continue logging your study sessions.
                </Typography>
              )}
            </Paper>
          </Grid>
          
          {/* Productivity Radar */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Performance Metrics</Typography>
              <Divider sx={{ mb: 2 }} />
              {subjects.length > 0 ? (
                <Box sx={{ height: 300 }}>
                  {productivityRadarData && productivityRadarData.labels && productivityRadarData.labels.length > 0 ? (
                    <Radar 
                      data={productivityRadarData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          r: {
                            angleLines: {
                              display: true
                            },
                            suggestedMin: 0,
                            suggestedMax: 100
                          }
                        },
                        plugins: {
                          legend: {
                            position: 'bottom',
                          },
                        },
                      }}
                      ref={chartRefs.productivityRadarChart}
                      onClick={(event) => handleChartClick(event, chartRefs.productivityRadarChart, 'Performance Metrics')}
                    />
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <Typography variant="body2" color="textSecondary">
                        No performance data available
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                  <Typography variant="body1" color="textSecondary">
                    Add subjects to see performance metrics
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
      
      {activeTab === 2 && (
        <Grid container spacing={3}>
          {/* Time Distribution by Day of Week */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Study Time by Day of Week</Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ height: 300 }}>
                {timeDistributionData && timeDistributionData.dayOfWeek && timeDistributionData.dayOfWeek.labels && timeDistributionData.dayOfWeek.labels.length > 0 ? (
                  <Bar 
                    data={timeDistributionData.dayOfWeek} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Hours',
                          },
                        },
                      },
                    }}
                    ref={chartRefs.timeDistributionChart}
                    onClick={(event) => handleChartClick(event, chartRefs.timeDistributionChart, 'Day of Week Distribution')}
                  />
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography variant="body2" color="text.secondary">
                      No data available for day of week distribution
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
          
          {/* Study Sessions Calendar Heatmap (simplified version) */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Recent Activity</Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ height: 300, overflowY: 'auto' }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Subject</TableCell>
                        <TableCell>Duration</TableCell>
                        <TableCell>Notes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {studySessions
                        .filter(session => selectedSubject === 'all' || session.subjectId === selectedSubject)
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .slice(0, 10)
                        .map((session) => {
                          const subject = subjects.find(s => s.id === session.subjectId);
                          return (
                            <TableRow key={session.id}>
                              <TableCell>{format(new Date(session.date), 'MMM d, yyyy')}</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  {subject && (
                                    <Box 
                                      sx={{ 
                                        width: 12, 
                                        height: 12, 
                                        borderRadius: '50%', 
                                        backgroundColor: subject?.color || '#ccc',
                                        mr: 1 
                                      }} 
                                    />
                                  )}
                                  {subject?.name || 'Unknown'}
                                </Box>
                              </TableCell>
                              <TableCell>{(session.duration / 60).toFixed(1)} hrs</TableCell>
                              <TableCell>
                                {session.notes ? (
                                  <Tooltip title={session.notes}>
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        maxWidth: 150, 
                                        overflow: 'hidden', 
                                        textOverflow: 'ellipsis', 
                                        whiteSpace: 'nowrap' 
                                      }}
                                    >
                                      {session.notes}
                                    </Typography>
                                  </Tooltip>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">-</Typography>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
      
      {activeTab === 3 && (
        <Grid container spacing={3}>
          {/* Subject Details Table */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Subject Details</Typography>
                <Tooltip title="Download as CSV">
                  <IconButton onClick={handleExportData}>
                    <FileDownloadIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Subject</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Total Hours</TableCell>
                      <TableCell>Daily Goal</TableCell>
                      <TableCell>Progress</TableCell>
                      <TableCell>Last Session</TableCell>
                      <TableCell>Consistency</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {subjects.map((subject) => {
                      const totalHours = getTotalHoursForSubject(subject.id);
                      const progress = getSubjectProgress(subject.id);
                      const subjectSessions = studySessions
                        .filter(session => session.subjectId === subject.id)
                        .sort((a, b) => new Date(b.date) - new Date(a.date));
                      
                      const lastSession = subjectSessions[0];
                      
                      // Calculate consistency score (percentage of days with sessions in last 30 days)
                      const last30Days = new Set();
                      const sessionDays = new Set();
                      
                      for (let i = 0; i < 30; i++) {
                        last30Days.add(format(subDays(new Date(), i), 'yyyy-MM-dd'));
                      }
                      
                      subjectSessions.forEach(session => {
                        const dateStr = format(new Date(session.date), 'yyyy-MM-dd');
                        if (last30Days.has(dateStr)) {
                          sessionDays.add(dateStr);
                        }
                      });
                      
                      const consistencyScore = (sessionDays.size / 30) * 100;
                      
                      return (
                        <TableRow key={subject.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar 
                                sx={{ 
                                  width: 30, 
                                  height: 30, 
                                  bgcolor: subject.color,
                                  fontSize: '0.875rem',
                                  mr: 1 
                                }}
                              >
                                {subject.name.charAt(0).toUpperCase()}
                              </Avatar>
                              {subject.name}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={subject.category || 'Uncategorized'} 
                              size="small" 
                              sx={{ backgroundColor: `${subject.color}20` }} 
                              onClick={undefined}
                            />
                          </TableCell>
                          <TableCell>{totalHours.toFixed(1)} hrs</TableCell>
                          <TableCell>{subject.dailyGoalHours} hrs/day</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={progress} 
                                sx={{ 
                                  width: 100, 
                                  mr: 1,
                                  height: 8,
                                  borderRadius: 5,
                                  backgroundColor: '#e0e0e0',
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: subject.color,
                                  }
                                }} 
                              />
                              <Typography variant="body2">
                                {Math.round(progress)}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {lastSession ? (
                              format(new Date(lastSession.date), 'MMM d, yyyy')
                            ) : (
                              <Typography variant="body2" color="text.secondary">No sessions</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Tooltip title={`${Math.round(consistencyScore)}% of days in the last 30 days`}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={consistencyScore} 
                                  sx={{ 
                                    width: 60, 
                                    mr: 1,
                                    height: 8,
                                    borderRadius: 5,
                                    backgroundColor: '#e0e0e0',
                                    '& .MuiLinearProgress-bar': {
                                      backgroundColor: 
                                        consistencyScore > 70 ? 'success.main' : 
                                        consistencyScore > 40 ? 'warning.main' : 'error.main',
                                    }
                                  }} 
                                />
                                <Typography variant="body2">
                                  {Math.round(consistencyScore)}%
                                </Typography>
                              </Box>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}
      
      {activeTab === 4 && (
        <Grid container spacing={3}>
          {/* Goal Tracking */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Goal Achievement</Typography>
                <ToggleButtonGroup
                  value={goalTrackingView}
                  exclusive
                  onChange={handleGoalTrackingViewChange}
                  size="small"
                >
                  <ToggleButton value="daily">
                    <Tooltip title="Daily View">
                      <CalendarTodayIcon fontSize="small" />
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value="weekly">
                    <Tooltip title="Weekly View">
                      <DateRangeIcon fontSize="small" />
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value="monthly">
                    <Tooltip title="Monthly View">
                      <EqualizerIcon fontSize="small" />
                    </Tooltip>
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ height: 400 }}>
                {goalTrackingData && goalTrackingData[goalTrackingView] && 
                 goalTrackingData[goalTrackingView].labels && 
                 goalTrackingData[goalTrackingView].labels.length > 0 ? (
                  <Bar 
                    data={goalTrackingData[goalTrackingView]} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const label = context.dataset.label || '';
                              const value = context.raw || 0;
                              return `${label}: ${value.toFixed(1)} hours`;
                            }
                          }
                        }
                      },
                      scales: {
                        x: {
                          stacked: true,
                        },
                        y: {
                          stacked: true,
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Hours',
                          },
                        },
                      },
                    }}
                    ref={chartRefs.goalTrackingChart}
                    onClick={(event) => handleChartClick(event, chartRefs.goalTrackingChart, 'Goal Achievement')}
                  />
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography variant="body1" color="text.secondary">
                      No goal tracking data available for the selected view
                    </Typography>
                  </Box>
                )}
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button 
                  size="small" 
                  startIcon={<GetAppIcon />}
                  onClick={() => downloadChartAsImage(chartRefs.goalTrackingChart, 'goal-tracking')}
                >
                  Download Chart
                </Button>
              </Box>
            </Paper>
          </Grid>
          
          {/* Daily Goals Status */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Daily Goals Status</Typography>
              <Divider sx={{ mb: 2 }} />
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {checkDailyGoals().map((goalData, index, array) => {
                  // Calculate percentage for progress bar
                  const percentage = goalData.subject.dailyGoalHours > 0 
                    ? Math.min((goalData.hoursStudied / goalData.subject.dailyGoalHours) * 100, 100) 
                    : 100;
                    
                  return (
                    <ListItem key={goalData.subject.id} divider={index < array.length - 1}>
                      <ListItemIcon>
                        {goalData.goalMet ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <AssessmentIcon color="warning" />
                        )}
                      </ListItemIcon>
                      <ListItemText 
                        primary={goalData.subject.name}
                        secondary={
                          <>
                            <Typography variant="body2" component="span">
                              {goalData.hoursStudied.toFixed(1)} / {goalData.subject.dailyGoalHours} hours
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={percentage} 
                              sx={{ 
                                mt: 1,
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: '#e0e0e0',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: goalData.goalMet ? 'success.main' : 'warning.main',
                                }
                              }} 
                            />
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Typography variant="body2" color="textSecondary">
                          {goalData.goalMet ? (
                            <Chip 
                              label="Completed" 
                              size="small" 
                              color="success" 
                              variant="outlined" 
                            />
                          ) : (
                            <Chip 
                              label={`${Math.round(percentage)}%`} 
                              size="small" 
                              color="warning" 
                              variant="outlined" 
                              onClick={undefined}
                            />
                          )}
                        </Typography>
                      </ListItemSecondaryAction>
                    </ListItem>
                  );
                })}
              </List>
            </Paper>
          </Grid>
        </Grid>
      )}
      
      {activeTab === 5 && (
        <Grid container spacing={3}>
          {/* Category Distribution */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Hours by Category</Typography>
                <IconButton 
                  onClick={() => downloadChartAsImage(chartRefs.categoryDistributionChart, 'category-hours')}
                >
                  <GetAppIcon fontSize="small" />
                </IconButton>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ height: 300 }}>
                {categoryDistributionData.hours && categoryDistributionData.hours.labels && 
                 categoryDistributionData.hours.labels.length > 0 ? (
                  <Doughnut 
                    data={categoryDistributionData.hours} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right',
                        },
                      },
                      cutout: '70%',
                    }}
                    ref={chartRefs.categoryDistributionChart}
                    onClick={(event) => handleChartClick(event, chartRefs.categoryDistributionChart, 'Category Distribution')}
                  />
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography variant="body2" color="textSecondary">
                      No category distribution data available
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
          
          {/* Category Completion */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Task Completion by Category</Typography>
                <IconButton 
                  onClick={() => downloadChartAsImage(chartRefs.categoryCompletionChart, 'category-completion')}
                >
                  <GetAppIcon fontSize="small" />
                </IconButton>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ height: 300 }}>
                {categoryDistributionData.completion && categoryDistributionData.completion.labels && 
                 categoryDistributionData.completion.labels.length > 0 ? (
                  <PolarArea 
                    data={categoryDistributionData.completion} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right',
                        },
                      },
                    }}
                    ref={chartRefs.categoryCompletionChart}
                    onClick={(event) => handleChartClick(event, chartRefs.categoryCompletionChart, 'Category Completion')}
                  />
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography variant="body2" color="text.secondary">
                      No category completion data available
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
          
          {/* Category Details */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Category Details</Typography>
              <Divider sx={{ mb: 2 }} />
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell>Subjects</TableCell>
                      <TableCell>Total Hours</TableCell>
                      <TableCell>Tasks</TableCell>
                      <TableCell>Completion Rate</TableCell>
                      <TableCell>Average Daily Hours</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {categoryDistributionData.details && categoryDistributionData.details.length > 0 ? (
                      categoryDistributionData.details.map((category) => (
                        <TableRow key={category.category}>
                          <TableCell>
                            <Chip 
                              label={category.category} 
                              size="small" 
                              sx={{ backgroundColor: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.2)` }} 
                              onClick={undefined}
                            />
                          </TableCell>
                          <TableCell>{category.subjectCount}</TableCell>
                          <TableCell>{category.totalHours.toFixed(1)} hrs</TableCell>
                          <TableCell>{category.completedTasks} / {category.totalTasks}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={category.completionRate} 
                                sx={{ 
                                  width: 100, 
                                  mr: 1,
                                  height: 8,
                                  borderRadius: 5,
                                  backgroundColor: '#e0e0e0',
                                }} 
                              />
                              <Typography variant="body2">
                                {Math.round(category.completionRate)}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{(category.totalHours / 30).toFixed(1)} hrs/day</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography variant="body2" color="text.secondary">
                            No category data available
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {activeTab === 6 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6">AI-Powered Insights</Typography>
              <Divider sx={{ my: 2 }} />
              <Button 
                variant="contained" 
                onClick={handleGenerateAiAnalysis} 
                disabled={isAiLoading}
              >
                {isAiLoading ? <CircularProgress size={24} /> : 'Generate AI Analysis'}
              </Button>
              {aiAnalysis && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body1">{aiAnalysis}</Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
    </>
  );
};

export default Statistics;