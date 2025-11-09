import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Grid, Card, CardContent, CardActions, 
  Button, LinearProgress, Box, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, IconButton,
  MenuItem, Select, InputLabel, FormControl,
  Paper, Chip, Menu, ListItemIcon, ListItemText,
  Badge
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import TimerIcon from '@mui/icons-material/Timer';
import EditIcon from '@mui/icons-material/Edit';
import CategoryIcon from '@mui/icons-material/Category';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import { SubjectsContext } from '../contexts/SubjectsContext';

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
    color: '#3f51b5',
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
      color: '#3f51b5',
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
    console.log('Navigating to subject with ID:', subjectId);
    navigate(`/subject/${subjectId}`);
  };

  const colorOptions = [
    '#3f51b5', // Indigo
    '#f50057', // Pink
    '#00bcd4', // Cyan
    '#4caf50', // Green
    '#ff9800', // Orange
    '#9c27b0', // Purple
    '#795548', // Brown
    '#607d8b', // Blue Grey
    '#e91e63', // Pink
    '#2196f3', // Blue
    '#009688', // Teal
    '#ff5722', // Deep Orange
    '#673ab7', // Deep Purple
    '#ffc107', // Amber
  ];
  
  // Category options (can be expanded)
  const categoryOptions = [
    'Uncategorized',
    'Academic',
    'Professional',
    'Personal Development',
    'Languages',
    'Technology',
    'Arts',
    'Science',
    'Mathematics',
    'Literature',
    'History',
    'Other'
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Dashboard Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Dashboard
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* View Mode Toggle */}
          <Box>
            <IconButton
              onClick={() => setViewMode('grid')}
              color={viewMode === 'grid' ? 'primary' : 'default'}
              size="small"
            >
              <ViewModuleIcon />
            </IconButton>
            <IconButton
              onClick={() => setViewMode('list')}
              color={viewMode === 'list' ? 'primary' : 'default'}
              size="small"
            >
              <ViewListIcon />
            </IconButton>
          </Box>
          
          {/* Sort and Filter */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Sort by</InputLabel>
            <Select
              value={sortBy}
              label="Sort by"
              onChange={(e) => setSortBy(e.target.value)}
            >
              <MenuItem value="name">Name</MenuItem>
              <MenuItem value="progress">Progress</MenuItem>
              <MenuItem value="recent">Recent</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={filterCategory}
              label="Category"
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            Add Subject
          </Button>
        </Box>
      </Box>

      {/* Dashboard Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary" fontWeight="bold">
              {subjects.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Subjects
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary" fontWeight="bold">
              {dailyGoalsStatus.filter(s => s.goalMet).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Daily Goals Met
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary" fontWeight="bold">
              {recentSessions.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sessions This Week
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary" fontWeight="bold">
              {Math.round(recentSessions.reduce((total, session) => total + session.duration, 0) / 60)}h
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Hours This Week
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Subjects Grid/List */}
      {filteredSubjects.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No subjects found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Start by adding your first subject to track your study progress.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            Add Your First Subject
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredSubjects.map((subject) => {
            const progress = getSubjectProgress(subject.id);
            const totalHours = getTotalHoursForSubject(subject.id);
            const dailyGoal = dailyGoalsStatus.find(s => s.subject.id === subject.id);
            
            return (
              <Grid 
                item 
                xs={12} 
                sm={viewMode === 'grid' ? 6 : 12} 
                md={viewMode === 'grid' ? 4 : 12} 
                lg={viewMode === 'grid' ? 3 : 12} 
                key={subject.id}
              >
                <Card 
                  sx={{ 
                    height: '100%',
                    cursor: 'pointer',
                    borderLeft: `4px solid ${subject.color}`,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: (theme) => theme.shadows[4],
                    },
                    transition: 'all 0.2s',
                  }}
                  onClick={() => handleCardClick(subject.id)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="h2" gutterBottom>
                          {subject.name}
                        </Typography>
                        <Chip 
                          label={subject.category || 'Uncategorized'} 
                          size="small" 
                          variant="outlined"
                          icon={<CategoryIcon />}
                        />
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => handleOpenSubjectMenu(e, subject.id)}
                        sx={{ ml: 1 }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Progress
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {Math.round(progress)}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={progress} 
                        sx={{ 
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: `${subject.color}20`,
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: subject.color,
                          }
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Total: {totalHours.toFixed(1)}h
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Today: {dailyGoal?.hoursStudied.toFixed(1) || 0}/{subject.dailyGoalHours}h
                        </Typography>
                        {dailyGoal?.goalMet && (
                          <Badge color="success" variant="dot" sx={{ ml: 1 }} />
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                  
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<TimerIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/subject/${subject.id}`);
                      }}
                    >
                      Start Session
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Subject Menu */}
      <Menu
        anchorEl={subjectMenuAnchorEl}
        open={Boolean(subjectMenuAnchorEl)}
        onClose={handleCloseSubjectMenu}
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
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={() => {
            handleDeleteSubject(selectedSubjectId);
            handleCloseSubjectMenu();
          }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Add Subject Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Subject</DialogTitle>
        <DialogContent>
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
            sx={{ mb: 2, mt: 1 }}
          />
          
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
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
          
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel id="color-label">Color</InputLabel>
            <Select
              labelId="color-label"
              name="color"
              value={newSubject.color}
              onChange={handleInputChange}
              label="Color"
            >
              {colorOptions.map((color) => (
                <MenuItem key={color} value={color}>
                  <Box sx={{ 
                    width: 20, 
                    height: 20, 
                    backgroundColor: color, 
                    mr: 1, 
                    borderRadius: '50%' 
                  }} />
                  {color}
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
            sx={{ mb: 2 }}
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
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleAddSubject} variant="contained">Add Subject</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Subject Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Subject</DialogTitle>
        <DialogContent>
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
            sx={{ mb: 2, mt: 1 }}
          />
          
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
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
          
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel id="edit-color-label">Color</InputLabel>
            <Select
              labelId="edit-color-label"
              name="color"
              value={newSubject.color}
              onChange={handleInputChange}
              label="Color"
            >
              {colorOptions.map((color) => (
                <MenuItem key={color} value={color}>
                  <Box sx={{ 
                    width: 20, 
                    height: 20, 
                    backgroundColor: color, 
                    mr: 1, 
                    borderRadius: '50%' 
                  }} />
                  {color}
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
            sx={{ mb: 2 }}
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
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleUpdateSubject} variant="contained">Update Subject</Button>
        </DialogActions>
      </Dialog>


    </Container>
  );
};

export default Dashboard;