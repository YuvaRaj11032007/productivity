import React, { useState, useContext } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Collapse, Paper, Alert, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { SubjectsContext } from '../contexts/SubjectsContext';

const SavedTests = ({ subject }) => {
  const [openTestId, setOpenTestId] = useState(null);
  const { deleteTest } = useContext(SubjectsContext);

  const handleTestClick = (testId) => {
    setOpenTestId(openTestId === testId ? null : testId);
  };

  const handleDeleteTest = (testId) => {
    if (window.confirm('Are you sure you want to delete this test?')) {
      deleteTest(subject.id, testId);
    }
  };

  if (!subject.tests || subject.tests.length === 0) {
    return <Typography>No saved tests for this subject.</Typography>;
  }

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Typography variant="h5" gutterBottom>Saved Tests</Typography>
      <List>
        {subject.tests.map((test) => (
          <React.Fragment key={test.id}>
            <ListItem 
              secondaryAction={
                <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteTest(test.id)}>
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText 
                primary={`Test from ${new Date(test.createdAt).toLocaleString()}`}
                secondary={`Mastery: ${test.results.mastery}`}
                onClick={() => handleTestClick(test.id)}
                sx={{ cursor: 'pointer' }}
              />
            </ListItem>
            <Collapse in={openTestId === test.id} timeout="auto" unmountOnExit>
              <Box sx={{ p: 2 }}>
                {test.questions.map((q, idx) => (
                  <Box key={q.id || idx} sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>{idx + 1}. {q.text}</Typography>
                    {q.type === 'mcq' ? (
                      q.options.map((opt, i) => (
                        <Typography 
                          key={i} 
                          sx={{ 
                            pl: 2, 
                            color: test.answers[q.id] === opt ? (q.result.correct ? 'green' : 'red') : 'inherit' 
                          }}
                        >
                          {opt}
                        </Typography>
                      ))
                    ) : (
                      <Typography sx={{ pl: 2, mt: 1, fontStyle: 'italic' }}>
                        {test.answers[q.id] || 'No answer provided'}
                      </Typography>
                    )}
                    {q.result && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2">{q.result.correct ? '✅ Correct' : '❌ Wrong'}</Typography>
                        {!q.result.correct && (
                          <Alert severity="info" sx={{ mt: 1 }}>{q.result.explanation}</Alert>
                        )}
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            </Collapse>
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default SavedTests;