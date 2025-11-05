import React from 'react';
import { Box, Typography, Stack, IconButton } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

const bubbleStyle = (active, completed) => ({
  px: 1.2,
  py: 0.5,
  borderRadius: 1,
  backgroundColor: completed ? 'success.main' : (active ? 'primary.main' : 'action.disabledBackground'),
  color: completed ? 'common.white' : (active ? 'common.white' : 'text.secondary'),
  fontWeight: 600,
  fontSize: 14,
  position: 'relative',
  minWidth: 36,
  textAlign: 'center'
});

const tailStyle = (active, completed) => ({
  width: 0,
  height: 0,
  borderLeft: '6px solid transparent',
  borderRight: '6px solid transparent',
  borderTop: `6px solid ${completed ? '#2e7d32' : (active ? '#1976d2' : 'rgba(0,0,0,0.12)')}`,
  position: 'absolute',
  left: '50%',
  transform: 'translateX(-50%)',
  top: '100%'
});

const DailyGoalsRoadmap = ({ steps = [], activeIndex = 0, onToggle }) => {
  return (
    <Stack direction="row" spacing={3} alignItems="center">
      {steps.map((step, idx) => {
        const active = idx === activeIndex;
        return (
          <Box key={step.id} sx={{ textAlign: 'center' }}>
            <Box sx={bubbleStyle(active, step.completed)}>
              {idx + 1}
              <Box sx={tailStyle(active, step.completed)} />
            </Box>
            <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: step.completed ? 'text.primary' : 'text.secondary' }}>
              {step.label}
            </Typography>
            <IconButton size="small" onClick={() => onToggle && onToggle(step)} aria-label="toggle-step">
              <CheckIcon fontSize="inherit" />
            </IconButton>
          </Box>
        );
      })}
    </Stack>
  );
};

export default DailyGoalsRoadmap;


