import React, { useState } from 'react';
import { 
  Container, Typography, Box, Paper, Divider, Button, 
  TextField, Dialog, DialogTitle, DialogContent, 
  DialogActions, Grid, Card, CardContent, CardActions,
  Chip, MenuItem, Select, FormControl,
  InputLabel, Tab, Tabs
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Edit as EditIcon
} from '@mui/icons-material';
import { format, parseISO, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { useSubjects } from '../contexts/SubjectsContext';

const Blogs = () => {
  const { subjects, addBlog, updateBlog, deleteBlog } = useSubjects();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [tabValue, setTabValue] = useState(0);
  
  // Get all blogs from all subjects
  const allBlogs = subjects.reduce((acc, subject) => {
    if (subject.blogs && subject.blogs.length > 0) {
      const subjectBlogs = subject.blogs.map(blog => ({
        ...blog,
        subjectId: subject.id,
        subjectName: subject.name,
        subjectColor: subject.color
      }));
      return [...acc, ...subjectBlogs];
    }
    return acc;
  }, []);
  
  // Filter blogs by subject and time
  const filteredBlogs = allBlogs.filter(blog => {
    const subjectMatch = selectedSubject === 'all' || blog.subjectId === selectedSubject;
    
    if (!subjectMatch) return false;
    
    if (timeFilter === 'all') return true;
    
    const blogDate = parseISO(blog.createdAt);
    switch (timeFilter) {
      case 'today':
        return isToday(blogDate);
      case 'week':
        return isThisWeek(blogDate);
      case 'month':
        return isThisMonth(blogDate);
      default:
        return true;
    }
  });
  
  // Sort blogs by date (newest first)
  const sortedBlogs = [...filteredBlogs].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  
  // Group blogs by date
  const blogsByDate = sortedBlogs.reduce((acc, blog) => {
    const date = blog.createdAt.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(blog);
    return acc;
  }, {});
  
  const handleOpenDialog = (blog = null, subjectId = null) => {
    if (blog) {
      setEditingBlog(blog);
      setBlogTitle(blog.title);
      setBlogContent(blog.content);
    } else {
      setEditingBlog(null);
      setBlogTitle('');
      setBlogContent('');
    }
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingBlog(null);
    setBlogTitle('');
    setBlogContent('');
  };
  
  const handleSaveBlog = () => {
    if (!blogTitle.trim() || !blogContent.trim()) return;
    
    if (editingBlog) {
      // Update existing blog
      updateBlog(editingBlog.subjectId, {
        ...editingBlog,
        title: blogTitle.trim(),
        content: blogContent.trim(),
      });
    } else {
      // For new blogs, we need to select a subject
      if (selectedSubject === 'all') {
        alert('Please select a subject for your blog entry');
        return;
      }
      
      // Add new blog
      addBlog(selectedSubject, {
        title: blogTitle.trim(),
        content: blogContent.trim(),
      });
    }
    
    handleCloseDialog();
  };
  
  const handleDeleteBlog = (blog) => {
    if (window.confirm('Are you sure you want to delete this blog entry?')) {
      deleteBlog(blog.subjectId, blog.id);
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Journal Entries
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          New Entry
        </Button>
      </Box>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="blog view tabs">
            <Tab label="All Entries" />
            <Tab label="By Date" />
            <Tab label="By Subject" />
          </Tabs>
          
          <Box display="flex" gap={2}>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="subject-filter-label">Subject</InputLabel>
              <Select
                labelId="subject-filter-label"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                label="Subject"
              >
                <MenuItem value="all">All Subjects</MenuItem>
                {subjects.map(subject => (
                  <MenuItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="time-filter-label">Time</InputLabel>
              <Select
                labelId="time-filter-label"
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                label="Time"
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">This Week</MenuItem>
                <MenuItem value="month">This Month</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Paper>
      
      {sortedBlogs.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No journal entries found
          </Typography>
          <Typography color="textSecondary">
            {selectedSubject !== 'all' || timeFilter !== 'all' 
              ? 'Try changing your filters or ' 
              : 'Start journaling by '}
            <Button 
              color="primary" 
              onClick={() => handleOpenDialog()}
            >
              creating a new entry
            </Button>
          </Typography>
        </Paper>
      ) : (
        <div>
          {/* Tab 0: All Entries */}
          {tabValue === 0 && (
            Object.entries(blogsByDate)
              .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
              .map(([date, dateBlogs]) => (
                <Box key={date} mb={4}>
                  <Typography variant="h6" className="blog-date-header">
                    {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                  </Typography>
                  <Grid container spacing={3}>
                    {dateBlogs.map(blog => (
                      <Grid item xs={12} md={6} key={blog.id}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                              <Typography variant="h6">{blog.title}</Typography>
                              <Chip 
                                label={blog.subjectName} 
                                size="small" 
                                sx={{ 
                                  backgroundColor: blog.subjectColor,
                                  color: '#fff'
                                }} 
                                onClick={undefined}
                              />
                            </Box>
                            <Typography variant="caption" color="textSecondary" display="block">
                              {format(new Date(blog.createdAt), 'h:mm a')}
                            </Typography>
                            <Typography variant="body1" className="blog-content" mt={2}>
                              {blog.content}
                            </Typography>
                            {blog.updatedAt !== blog.createdAt && (
                              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                                Edited {format(new Date(blog.updatedAt), 'MMM d, yyyy h:mm a')}
                              </Typography>
                            )}
                          </CardContent>
                          <CardActions>
                            <Button 
                              size="small" 
                              startIcon={<EditIcon />}
                              onClick={() => handleOpenDialog(blog)}
                            >
                              Edit
                            </Button>
                            <Button 
                              size="small" 
                              color="error" 
                              startIcon={<DeleteIcon />}
                              onClick={() => handleDeleteBlog(blog)}
                            >
                              Delete
                            </Button>
                          </CardActions>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ))
          )}
          
          {/* Tab 1: By Date */}
          {tabValue === 1 && (
            Object.entries(blogsByDate)
              .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
              .map(([date, dateBlogs]) => (
                <Paper key={date} sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  {dateBlogs.map(blog => (
                    <Card key={blog.id} variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="h6">{blog.title}</Typography>
                          <Chip 
                            label={blog.subjectName} 
                            size="small" 
                            sx={{ 
                              backgroundColor: blog.subjectColor,
                              color: '#fff'
                            }} 
                            onClick={undefined}
                          />
                        </Box>
                        <Typography variant="caption" color="textSecondary">
                          {format(new Date(blog.createdAt), 'h:mm a')}
                        </Typography>
                        <Typography variant="body1" className="blog-content">
                          {blog.content}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button size="small" onClick={() => handleOpenDialog(blog)}>
                          Edit
                        </Button>
                        <Button size="small" color="error" onClick={() => handleDeleteBlog(blog)}>
                          Delete
                        </Button>
                      </CardActions>
                    </Card>
                  ))}
                </Paper>
              ))
          )}
          
          {/* Tab 2: By Subject */}
          {tabValue === 2 && (
            subjects
              .filter(subject => 
                selectedSubject === 'all' || subject.id === selectedSubject
              )
              .filter(subject => 
                subject.blogs && subject.blogs.length > 0
              )
              .map(subject => {
                // Filter blogs by time for this subject
                const subjectBlogs = subject.blogs
                  .filter(blog => {
                    if (timeFilter === 'all') return true;
                    
                    const blogDate = parseISO(blog.createdAt);
                    switch (timeFilter) {
                      case 'today':
                        return isToday(blogDate);
                      case 'week':
                        return isThisWeek(blogDate);
                      case 'month':
                        return isThisMonth(blogDate);
                      default:
                        return true;
                    }
                  })
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                
                if (subjectBlogs.length === 0) return null;
                
                return (
                  <Paper key={subject.id} sx={{ p: 3, mb: 3 }}>
                    <Box 
                      display="flex" 
                      alignItems="center" 
                      mb={2}
                      sx={{ 
                        borderLeft: `4px solid ${subject.color}`,
                        pl: 2
                      }}
                    >
                      <Typography variant="h5">{subject.name}</Typography>
                      <Chip 
                        label={`${subjectBlogs.length} ${subjectBlogs.length === 1 ? 'entry' : 'entries'}`}
                        size="small"
                        sx={{ ml: 2 }}
                        onClick={undefined}
                      />
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    {subjectBlogs.map(blog => {
                      const blogWithSubject = {
                        ...blog,
                        subjectId: subject.id,
                        subjectName: subject.name,
                        subjectColor: subject.color
                      };
                      
                      return (
                        <Card key={blog.id} variant="outlined" sx={{ mb: 2 }}>
                          <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="h6">{blog.title}</Typography>
                              <Typography variant="caption" color="textSecondary">
                                {format(new Date(blog.createdAt), 'MMM d, yyyy h:mm a')}
                              </Typography>
                            </Box>
                            <Typography variant="body1" className="blog-content">
                              {blog.content}
                            </Typography>
                          </CardContent>
                          <CardActions>
                            <Button size="small" onClick={() => handleOpenDialog(blogWithSubject)}>
                              Edit
                            </Button>
                            <Button size="small" color="error" onClick={() => handleDeleteBlog(blogWithSubject)}>
                              Delete
                            </Button>
                          </CardActions>
                        </Card>
                      );
                    })}
                  </Paper>
                );
              }).filter(Boolean)
          )}
        </div>
      )}
      
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="md">
        <DialogTitle>{editingBlog ? 'Edit Journal Entry' : 'New Journal Entry'}</DialogTitle>
        <DialogContent>
          {!editingBlog && (
            <FormControl fullWidth margin="normal">
              <InputLabel id="blog-subject-label">Subject</InputLabel>
              <Select
                labelId="blog-subject-label"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                label="Subject"
                required
              >
                <MenuItem value="all" disabled>Select a subject</MenuItem>
                {subjects.map(subject => (
                  <MenuItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={blogTitle}
            onChange={(e) => setBlogTitle(e.target.value)}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            label="Content"
            multiline
            rows={10}
            fullWidth
            value={blogContent}
            onChange={(e) => setBlogContent(e.target.value)}
            placeholder="Write your thoughts here..."
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveBlog} variant="contained" color="primary">
            {editingBlog ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Blogs;