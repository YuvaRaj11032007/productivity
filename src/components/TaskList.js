import React, { useState, useContext } from 'react';
import { SubjectsContext } from '../contexts/SubjectsContext';
import TaskItem from './TaskItem';
import { TextField, Button, Box, Typography, LinearProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import TimerIcon from '@mui/icons-material/Timer';

function TaskList({ subjectId }) {
  const { subjects, addTask, toggleTaskCompletion, deleteTask, getSubjectProgress, getTotalHoursForSubject } = useContext(SubjectsContext);
  const subject = subjects.find(s => s.id === subjectId);

  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    addTask(subjectId, {
      name: newTaskTitle,
    });
    setNewTaskTitle('');
  };

  const handleToggleTask = (taskId) => {
    toggleTaskCompletion(subjectId, taskId);
  };

  const handleDeleteTask = (taskId) => {
    deleteTask(subjectId, taskId);
  };

  if (!subject) return null;

  // Group tasks by completion status
  const pendingTasks = subject.tasks.filter(task => !task.completed);
  const completedTasks = subject.tasks.filter(task => task.completed);

  // Progress and study time
  const progress = getSubjectProgress(subjectId);
  const totalHours = getTotalHoursForSubject(subjectId);

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Tasks</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ minWidth: 120 }}>
            <Typography variant="body2" color="text.secondary">Progress</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LinearProgress variant="determinate" value={progress} sx={{ width: 80, height: 8, borderRadius: 4 }} />
              <Typography variant="caption">{Math.round(progress)}%</Typography>
            </Box>
          </Box>
          <Box sx={{ minWidth: 100 }}>
            <Typography variant="body2" color="text.secondary">Study Time</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TimerIcon fontSize="small" sx={{ color: 'primary.main' }} />
              <Typography variant="caption">{totalHours.toFixed(1)} hrs</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Add Task Form */}
      <Box component="form" onSubmit={handleAddTask} sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Add new task"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            size="small"
          />
          <Button
            type="submit"
            variant="contained"
            startIcon={<AddIcon />}
            size="small"
          >
            Add
          </Button>
        </Box>
      </Box>

      {/* Pending Tasks */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Pending Tasks ({pendingTasks.length})
        </Typography>
        {pendingTasks.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            No pending tasks. Great job!
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {pendingTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={handleToggleTask}
                onDelete={handleDeleteTask}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Completed Tasks ({completedTasks.length})
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {completedTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={handleToggleTask}
                onDelete={handleDeleteTask}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default TaskList;