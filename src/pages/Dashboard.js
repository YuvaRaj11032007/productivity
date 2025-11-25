import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Grid, Card, CardContent,
  Button, LinearProgress, Box, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, IconButton,
  MenuItem, Select, InputLabel, FormControl,
  Paper, Chip, Menu, ListItemIcon, ListItemText
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import TimerIcon from '@mui/icons-material/Timer';
import EditIcon from '@mui/icons-material/Edit';
import CategoryIcon from '@mui/icons-material/Category';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { SubjectsContext } from '../contexts/SubjectsContext';

const StatCard = ({ icon, value, label, color }) => (
  <Paper
    className="glass-card"
    sx={{
      p: 3,
      textAlign: 'center',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}
  >
    <Box sx={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '4px',
      bgcolor: color
    }} />
    <Box sx={{
      p: 1.5,
      borderRadius: '50%',
      bgcolor: `${color}20`,
      color: color,
      mb: 2,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {icon}
    </Box>
    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
      {value}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
  </Paper>
);

const Dashboard = () => {
  const {
    subjects,
    addSubject,
    deleteSubject,
    updateSubject,
    getTotalHoursForSubject,
    getSubjectProgress,
    checkDailyGoals,
    getRecentStudySessions
  } = useContext(SubjectsContext);

  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [currentSubject, setCurrentSubject] = useState(null);
  const [newSubject, setNewSubject] = useState({
    name: '',
    color: '#8b5cf6',
    dailyGoalHours: 1,
    notes: '',
    category: 'Uncategorized'
  });

  // Dashboard view options
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('name'); // 'name', 'progress', 'recent'
  const [filterCategory, setFilterCategory] = useState('all');
  const [subjectMenuAnchorEl, setSubjectMenuAnchorEl] = useState(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);

  // Get all unique categories
  const categories = ['all', ...new Set(subjects.map(s => s.category || 'Uncategorized'))];

  // Get recent study sessions for dashboard insights
  const recentSessions = getRecentStudySessions(7); // Last 7 days

  const dailyGoalsStatus = checkDailyGoals();
  const goalsMet = dailyGoalsStatus.filter(s => s.goalMet).length;

  // Sort subjects based on selected criteria
  const sortedSubjects = [...subjects].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'progress':
        return getSubjectProgress(b.id) - getSubjectProgress(a.id);
      case 'recent':
        const aRecent = recentSessions.find(s => s.subjectId === a.id);
        const bRecent = recentSessions.find(s => s.subjectId === b.id);
        return (bRecent ? new Date(bRecent.date) : new Date(0)) -
          (aRecent ? new Date(aRecent.date) : new Date(0));
      default:
        return 0;
    }
  });

  // Filter subjects by category
  const filteredSubjects = filterCategory === 'all'
    ? sortedSubjects
    : sortedSubjects.filter(s => (s.category || 'Uncategorized') === filterCategory);

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (subject) => {
    setCurrentSubject(subject);
    setNewSubject({
      name: subject.name,
      color: subject.color,
      dailyGoalHours: subject.dailyGoalHours,
      notes: subject.notes || '',
      category: subject.category || 'Uncategorized'
    });
    setOpenEditDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewSubject({
      name: '',
      color: '#8b5cf6',
      dailyGoalHours: 1,
      notes: '',
      category: 'Uncategorized'
    });
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setCurrentSubject(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSubject({
      ...newSubject,
      [name]: value
    });
  };

  const handleAddSubject = () => {
    if (newSubject.name.trim()) {
      addSubject(newSubject);
      handleCloseDialog();
    }
  };

  const handleUpdateSubject = () => {
    if (currentSubject && newSubject.name.trim()) {
      updateSubject(currentSubject.id, newSubject);
      handleCloseEditDialog();
    }
  };

  const handleDeleteSubject = (id, e) => {
    if (e) e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this subject? All associated study sessions will be lost.')) {
      deleteSubject(id);
      handleCloseSubjectMenu();
    }
  };

  const handleOpenSubjectMenu = (event, subjectId) => {
    event.stopPropagation();
    setSelectedSubjectId(subjectId);
    setSubjectMenuAnchorEl(event.currentTarget);
  };

  const handleCloseSubjectMenu = () => {
    setSubjectMenuAnchorEl(null);
    setSelectedSubjectId(null);
  };

  const handleCardClick = (subjectId) => {
    navigate(`/subject/${subjectId}`);
  };

  const colorOptions = [
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#3b82f6', // Blue
    '#ef4444', // Red
    '#6366f1', // Indigo
  ];

  const categoryOptions = [
    'Uncategorized',
    'Academic',
    'Professional',
    'Personal Development',
    'Languages',
    'Technology',
    'Arts',
    'Science',
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ background: 'linear-gradient(45deg, #8b5cf6, #ec4899)', backgroundClip: 'text', WebkitTextFillColor: 'transparent', WebkitBackgroundClip: 'text' }}>
          Study Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
          sx={{
            background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
            boxShadow: '0 4px 14px 0 rgba(139, 92, 246, 0.5)'
          }}
        >
          Add Subject
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard key="active-subjects" icon={<CategoryIcon />} value={subjects.length} label="Active Subjects" color="#8b5cf6" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard key="total-hours" icon={<AccessTimeIcon />} value={subjects.reduce((acc, s) => acc + getTotalHoursForSubject(s.id), 0).toFixed(1)} label="Total Hours" color="#06b6d4" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard key="goals-met" icon={<CheckCircleIcon />} value={goalsMet} label="Goals Met Today" color="#10b981" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard key="weekly-consistency" icon={<TrendingUpIcon />} value={`${Math.round((new Set(recentSessions.map(s => new Date(s.date).toDateString())).size / 7) * 100)}%`} label="Weekly Consistency" color="#f59e0b" />
        </Grid>
      </Grid>

      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search subjects..."
          size="small"
          sx={{ flexGrow: 1, maxWidth: 400 }}
          InputProps={{
            className: 'glass-input'
          }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            displayEmpty
            className="glass-input"
          >
            {categories.map(cat => (
              <MenuItem key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ display: 'flex', bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
          <IconButton onClick={() => setViewMode('grid')} color={viewMode === 'grid' ? 'primary' : 'default'}>
            <ViewModuleIcon />
          </IconButton>
          <IconButton onClick={() => setViewMode('list')} color={viewMode === 'list' ? 'primary' : 'default'}>
            <ViewListIcon />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {filteredSubjects.map((subject) => (
          <Grid item xs={12} sm={viewMode === 'grid' ? 6 : 12} md={viewMode === 'grid' ? 4 : 12} key={subject.id}>
            <Card
              className="glass-card"
              onClick={() => handleCardClick(subject.id)}
              sx={{
                cursor: 'pointer',
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' },
                position: 'relative'
              }}
            >
              <Box sx={{ height: 6, bgcolor: subject.color }} />
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">{subject.name}</Typography>
                  <IconButton
                    size="small"
                    onClick={(e) => handleOpenSubjectMenu(e, subject.id)}
                    sx={{ color: 'text.secondary' }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>

                <Chip
                  label={subject.category || 'Uncategorized'}
                  size="small"
                  sx={{
                    bgcolor: `${subject.color}20`,
                    color: subject.color,
                    mb: 2,
                    fontWeight: 500
                  }}
                />

                <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Progress</Typography>
                  <Typography variant="body2" fontWeight="bold">{Math.round(getSubjectProgress(subject.id))}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getSubjectProgress(subject.id)}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '& .MuiLinearProgress-bar': { bgcolor: subject.color }
                  }}
                />

                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {getTotalHoursForSubject(subject.id).toFixed(1)}h
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TimerIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      Goal: {subject.dailyGoalHours}h/day
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Menu
        anchorEl={subjectMenuAnchorEl}
        open={Boolean(subjectMenuAnchorEl)}
        onClose={handleCloseSubjectMenu}
        PaperProps={{
          sx: {
            bgcolor: 'rgba(20, 20, 25, 0.9)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }
        }}
      >
        <MenuItem
          onClick={() => {
            const subject = subjects.find(s => s.id === selectedSubjectId);
            if (subject) {
              handleOpenEditDialog(subject);
            }
            handleCloseSubjectMenu();
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={(e) => {
            handleDeleteSubject(selectedSubjectId, e);
            handleCloseSubjectMenu();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          className: 'glass-card',
          sx: { bgcolor: 'rgba(20, 20, 25, 0.95)' }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Add New Subject</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Subject Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newSubject.name}
            onChange={handleInputChange}
            sx={{ mb: 3, mt: 1 }}
          />

          <FormControl fullWidth margin="dense" sx={{ mb: 3 }}>
            <InputLabel id="category-label">Category</InputLabel>
            <Select
              labelId="category-label"
              name="category"
              value={newSubject.category}
              onChange={handleInputChange}
              label="Category"
            >
              {categoryOptions.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="dense" sx={{ mb: 3 }}>
            <InputLabel id="color-label">Color Theme</InputLabel>
            <Select
              labelId="color-label"
              name="color"
              value={newSubject.color}
              onChange={handleInputChange}
              label="Color Theme"
            >
              {colorOptions.map((color) => (
                <MenuItem key={color} value={color}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                      width: 20,
                      height: 20,
                      backgroundColor: color,
                      borderRadius: '50%',
                      boxShadow: `0 0 10px ${color} `
                    }} />
                    {color}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            margin="dense"
            name="dailyGoalHours"
            label="Daily Goal (hours)"
            type="number"
            fullWidth
            variant="outlined"
            value={newSubject.dailyGoalHours}
            onChange={handleInputChange}
            inputProps={{ min: 0.5, max: 24, step: 0.5 }}
            sx={{ mb: 3 }}
          />

          <TextField
            margin="dense"
            name="notes"
            label="Notes (optional)"
            multiline
            rows={3}
            fullWidth
            variant="outlined"
            value={newSubject.notes}
            onChange={handleInputChange}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Button onClick={handleCloseDialog} color="inherit">Cancel</Button>
          <Button onClick={handleAddSubject} variant="contained">Add Subject</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openEditDialog}
        onClose={handleCloseEditDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          className: 'glass-card',
          sx: { bgcolor: 'rgba(20, 20, 25, 0.95)' }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Edit Subject</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Subject Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newSubject.name}
            onChange={handleInputChange}
            sx={{ mb: 3, mt: 1 }}
          />

          <FormControl fullWidth margin="dense" sx={{ mb: 3 }}>
            <InputLabel id="edit-category-label">Category</InputLabel>
            <Select
              labelId="edit-category-label"
              name="category"
              value={newSubject.category}
              onChange={handleInputChange}
              label="Category"
            >
              {categoryOptions.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="dense" sx={{ mb: 3 }}>
            <InputLabel id="edit-color-label">Color Theme</InputLabel>
            <Select
              labelId="edit-color-label"
              name="color"
              value={newSubject.color}
              onChange={handleInputChange}
              label="Color Theme"
            >
              {colorOptions.map((color) => (
                <MenuItem key={color} value={color}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                      width: 20,
                      height: 20,
                      backgroundColor: color,
                      borderRadius: '50%',
                      boxShadow: `0 0 10px ${color} `
                    }} />
                    {color}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            margin="dense"
            name="dailyGoalHours"
            label="Daily Goal (hours)"
            type="number"
            fullWidth
            variant="outlined"
            value={newSubject.dailyGoalHours}
            onChange={handleInputChange}
            inputProps={{ min: 0.5, max: 24, step: 0.5 }}
            sx={{ mb: 3 }}
          />

          <TextField
            margin="dense"
            name="notes"
            label="Notes (optional)"
            multiline
            rows={3}
            fullWidth
            variant="outlined"
            value={newSubject.notes}
            onChange={handleInputChange}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Button onClick={handleCloseEditDialog} color="inherit">Cancel</Button>
          <Button onClick={handleUpdateSubject} variant="contained">Update Subject</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard;