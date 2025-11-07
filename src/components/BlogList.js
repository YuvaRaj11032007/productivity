import React, { useState } from 'react';
import { 
  Box, Typography, Paper, TextField, Button, 
  Dialog, DialogTitle, DialogContent, DialogActions,
  Card, CardContent, CardActions, Grid
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { useSubjects } from '../contexts/SubjectsContext';

const BlogList = ({ subjectId }) => {
  const { subjects, addBlog, updateBlog, deleteBlog } = useSubjects();
  const subject = subjects.find(s => s.id === subjectId) || {};
  const blogs = subject.blogs || [];
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogContent, setBlogContent] = useState('');
  
  const handleOpenDialog = (blog = null) => {
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
      updateBlog(subjectId, {
        ...editingBlog,
        title: blogTitle.trim(),
        content: blogContent.trim(),
      });
    } else {
      // Add new blog
      addBlog(subjectId, {
        title: blogTitle.trim(),
        content: blogContent.trim(),
      });
    }
    
    handleCloseDialog();
  };
  
  const handleDeleteBlog = (blogId) => {
    if (window.confirm('Are you sure you want to delete this blog entry?')) {
      deleteBlog(subjectId, blogId);
    }
  };
  
  // Group blogs by date
  const blogsByDate = blogs.reduce((acc, blog) => {
    const date = blog.createdAt.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(blog);
    return acc;
  }, {});
  
  return (
    <Box sx={{ mt: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Journal Entries</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          New Entry
        </Button>
      </Box>
      
      {Object.keys(blogsByDate).length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            No journal entries yet. Click the button above to create your first entry.
          </Typography>
        </Paper>
      ) : (
        Object.entries(blogsByDate)
          .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
          .map(([date, dateBlogs]) => (
            <Box key={date} mb={3}>
              <Typography variant="h6" gutterBottom>
                {format(new Date(date), 'EEEE, MMMM d, yyyy')}
              </Typography>
              <Grid container spacing={2}>
                {dateBlogs.map(blog => (
                  <Grid item xs={12} key={blog.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="h6">{blog.title}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {format(new Date(blog.createdAt), 'h:mm a')}
                          </Typography>
                        </Box>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
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
                          onClick={() => handleDeleteBlog(blog.id)}
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
      
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="md">
        <DialogTitle>{editingBlog ? 'Edit Journal Entry' : 'New Journal Entry'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={blogTitle}
            onChange={(e) => setBlogTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Content"
            multiline
            rows={10}
            fullWidth
            value={blogContent}
            onChange={(e) => setBlogContent(e.target.value)}
            placeholder="Write your thoughts here..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveBlog} variant="contained" color="primary">
            {editingBlog ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BlogList;