import React, { useMemo, useState, useCallback } from 'react';
import { Box, Card, CardContent, CardHeader, Typography, Chip, IconButton, Stack, Tooltip, Divider } from '@mui/material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

import { startOfDay, addDays } from '../services/scheduling';

const DayColumn = ({ dayKey, label, tasks, onToggle, renderTaskMeta }) => (
  <Card sx={{ minWidth: 260, backgroundColor: 'background.paper' }}>
    <CardHeader title={label} subheader={`${tasks.length} task${tasks.length === 1 ? '' : 's'}`} />
    <CardContent sx={{ pt: 0 }}>
      <Droppable droppableId={dayKey}>
        {(provided, snapshot) => (
          <Box ref={provided.innerRef} {...provided.droppableProps} sx={{ minHeight: 200, p: 1, borderRadius: 1, backgroundColor: snapshot.isDraggingOver ? 'action.hover' : 'transparent', transition: 'background-color 0.2s ease' }}>
            {tasks.map((t, index) => (
              <Draggable key={t.id} draggableId={t.id} index={index}>
                {(draggableProvided, draggableSnapshot) => (
                  <Box ref={draggableProvided.innerRef} {...draggableProvided.draggableProps} {...draggableProvided.dragHandleProps} sx={{ mb: 1, p: 1, borderRadius: 1, display: 'flex', alignItems: 'center', gap: 1, backgroundColor: 'background.default', boxShadow: draggableSnapshot.isDragging ? 3 : 1 }}>
                    <IconButton size="small" onClick={() => onToggle && onToggle(t)} aria-label="toggle-task">
                      {t.completed ? <CheckCircleIcon color="success" fontSize="inherit" /> : <RadioButtonUncheckedIcon color="disabled" fontSize="inherit" />}
                    </IconButton>
                    <Tooltip title={t.name} placement="top" arrow>
                      <Typography variant="body2" sx={{ flex: 1, textDecoration: t.completed ? 'line-through' : 'none' }}>{t.name}</Typography>
                    </Tooltip>
                    {renderTaskMeta ? renderTaskMeta(t) : null}
                  </Box>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </CardContent>
  </Card>
);

const formatDayLabel = (d) => {
  const today = startOfDay(new Date());
  const dd = startOfDay(d);
  const diff = Math.round((dd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return dd.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

const DailyPlannerBoard = ({ days = 7, subjects = [], subjectId = null, onMoveTask, onToggleTask }) => {
  const allTasks = useMemo(() => {
    const filteredSubjects = subjectId ? subjects.filter(s => s.id === subjectId) : subjects;
    return filteredSubjects.flatMap(s => (s.tasks || []).map(t => ({ ...t, subjectId: s.id, subjectName: s.name, color: s.color })));
  }, [subjects, subjectId]);

  const [today] = useState(() => new Date());
  const dayKeys = useMemo(() => {
    const keys = [];
    for (let i = 0; i < days; i++) keys.push(startOfDay(addDays(today, i)));
    return keys;
  }, [days, today]);

  const columns = useMemo(() => {
    const map = new Map();
    dayKeys.forEach(d => map.set(d.toISOString(), []));
    const unplanned = [];
    allTasks.filter(t => !t.completed).forEach((t) => {
      if (t.dueDate) {
        const k = startOfDay(new Date(t.dueDate)).toISOString();
        if (map.has(k)) map.get(k).push(t); else unplanned.push(t);
      } else {
        unplanned.push(t);
      }
    });
    return { byDay: map, unplanned };
  }, [allTasks, dayKeys]);

  const handleDragEnd = useCallback((result) => {
    const { destination, draggableId } = result;
    if (!destination) return;
    const destKey = destination.droppableId;
    const task = allTasks.find(t => t.id === draggableId);
    if (!task) return;
    if (onMoveTask) onMoveTask(task, destKey);
  }, [allTasks, onMoveTask]);

  const renderTaskMeta = useCallback((t) => (
    <Stack direction="row" alignItems="center" spacing={1}>
      {typeof t.estimatedMinutes === 'number' ? (
        <Chip size="small" icon={<AccessTimeIcon />} label={`${t.estimatedMinutes}m`} variant="outlined" />
      ) : null}
      {t.dueDate ? (
        <Chip size="small" icon={<CalendarMonthIcon />} label={new Date(t.dueDate).toLocaleDateString()} />
      ) : null}
    </Stack>
  ), []);

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
        <Typography variant="h6">Daily Planner</Typography>
        <Typography variant="body2" color="text.secondary">Drag tasks between days to reschedule</Typography>
      </Stack>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 1 }}>
          {dayKeys.map((d) => {
            const key = d.toISOString();
            const tasks = columns.byDay.get(key) || [];
            return (
              <DayColumn key={key} dayKey={key} label={formatDayLabel(d)} tasks={tasks} onToggle={(t) => onToggleTask && onToggleTask(t)} renderTaskMeta={renderTaskMeta} />
            );
          })}
        </Stack>
        {columns.unplanned.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 1 }} />
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Unscheduled</Typography>
            <Droppable droppableId="unplanned">
              {(provided) => (
                <Box ref={provided.innerRef} {...provided.droppableProps} sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {columns.unplanned.map((t, index) => (
                    <Draggable key={t.id} draggableId={t.id} index={index}>
                      {(draggableProvided) => (
                        <Chip ref={draggableProvided.innerRef} {...draggableProvided.draggableProps} {...draggableProvided.dragHandleProps} label={t.name} onDelete={() => onToggleTask && onToggleTask(t)} />
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </Box>
        )}
      </DragDropContext>
    </Box>
  );
};

export default DailyPlannerBoard;


