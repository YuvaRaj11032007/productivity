import React from 'react';
import { Chip, Box, Typography, IconButton } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DeleteIcon from '@mui/icons-material/Delete';

const TaskItem = ({ task, onToggle, onDelete }) => {
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const isOverdue = () => {
    if (!task.dueDate || task.completed) return false;
    const today = new Date().toISOString().split('T')[0];
    return task.dueDate < today;
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1, 
      p: 1, 
      borderRadius: 1,
      backgroundColor: task.completed ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
      border: isOverdue() ? '1px solid #f44336' : 'none'
    }}>
      <input
        type="checkbox"
        checked={task.completed}
        onChange={(e) => onToggle(task.id, e.target.checked)}
        id={`task-${task.id}`}
      />
      <Box sx={{ flex: 1 }}>
        <Typography 
          variant="body2" 
          sx={{ 
            textDecoration: task.completed ? 'line-through' : 'none',
            color: task.completed ? 'text.secondary' : 'text.primary'
          }}
        >
          {task.name || task.title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
          {task.dueDate && (
            <Chip 
              size="small" 
              icon={<CalendarMonthIcon />} 
              label={formatDate(task.dueDate)} 
              color={isOverdue() ? 'error' : 'default'}
              variant="outlined"
            />
          )}
          {isOverdue() && (
            <Chip 
              size="small" 
              label="Overdue" 
              color="error"
              variant="filled"
            />
          )}
        </Box>
      </Box>
      <IconButton 
        aria-label="Delete task"
        onClick={() => onDelete(task.id)}
        size="small"
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};

export default TaskItem;