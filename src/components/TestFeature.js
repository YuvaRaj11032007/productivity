import React, { useState, useContext } from 'react';
import { Box, Typography, Button, Paper, TextField, RadioGroup, FormControlLabel, Radio, Divider, Alert, MenuItem, Select, InputLabel, FormControl, CircularProgress } from '@mui/material';
import { SubjectsContext } from '../contexts/SubjectsContext';

import { extractTextFromPdf } from '../services/fileReader';

// This component expects: subject, completedTasks, aiService
const TestFeature = ({ subject, completedTasks, aiService, onMasteryUpdate }) => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [numQuestions, setNumQuestions] = useState(5); // New state for number of questions
  const [difficulty, setDifficulty] = useState('medium'); // New state for difficulty
  const [questionType, setQuestionType] = useState('both'); // New state for question type
  const [geminiModel, setGeminiModel] = useState('gemini-2.5-pro');

  const { subjects, studySessions, dailyGoals, addTest } = useContext(SubjectsContext);

  // Generate questions using AI
  const generateQuestions = async () => {
    setLoading(true);
    setError('');
    try {
      // Only use completed tasks for question generation
      const taskNames = completedTasks.map(t => t.name);
      console.log('Task names sent to AI:', taskNames);

      const context = {
        subjects: subjects,
        studySessions: studySessions,
        dailyGoals: dailyGoals,
        currentTime: new Date().toISOString(),
      };

      const aiQuestions = await aiService.generateTestQuestions(subject.name, taskNames, numQuestions, difficulty, questionType, context, geminiModel);
      console.log('AI questions received:', aiQuestions);
      setQuestions(aiQuestions);
      setResults(null);
      setAnswers({});
    } catch (e) {
      setError('Failed to generate questions.');
      console.error('Error generating questions in TestFeature:', e);
    } finally {
      setLoading(false);
    }
  };

  // Handle answer change
  const handleAnswerChange = (qid, value) => {
    setAnswers(prev => ({ ...prev, [qid]: value }));
  };

  // Submit answers to AI for checking
  const submitAnswers = async () => {
    setLoading(true);
    setError('');
    try {
      const checkResults = await aiService.checkTestAnswers(subject.name, questions, answers);
      setResults(checkResults);
      const newQuestions = questions.map((q, i) => ({ ...q, result: checkResults.answers[i] }));
      setQuestions(newQuestions);
      if (onMasteryUpdate) onMasteryUpdate(checkResults.mastery);
    } catch (e) {
      setError('Failed to check answers.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTest = () => {
    if (results) {
      addTest(subject.id, { questions, answers, results });
      alert('Test saved!');
    }
  };

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Typography variant="h5" gutterBottom>Test Your Knowledge</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <TextField
          label="Number of Questions"
          type="number"
          value={numQuestions}
          onChange={(e) => setNumQuestions(Math.max(1, parseInt(e.target.value) || 1))}
          inputProps={{ min: 1, max: 10 }}
          sx={{ width: 180 }}
        />
        <FormControl sx={{ width: 180 }}>
          <InputLabel>Difficulty</InputLabel>
          <Select
            value={difficulty}
            label="Difficulty"
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <MenuItem value="beginner">Beginner</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="advanced">Advanced</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ width: 180 }}>
          <InputLabel>Question Type</InputLabel>
          <Select
            value={questionType}
            label="Question Type"
            onChange={(e) => setQuestionType(e.target.value)}
          >
            <MenuItem value="both">Both</MenuItem>
            <MenuItem value="mcq">MCQ</MenuItem>
            <MenuItem value="descriptive">Descriptive</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ width: 180 }}>
          <InputLabel>Gemini Model</InputLabel>
          <Select
            value={geminiModel}
            label="Gemini Model"
            onChange={(e) => setGeminiModel(e.target.value)}
          >
            <MenuItem value="gemini-2.5-pro">Gemini 2.5 Pro</MenuItem>
            <MenuItem value="gemini-2.5-flash">Gemini 2.5 Flash</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Button variant="contained" onClick={generateQuestions} disabled={loading || completedTasks.length === 0} sx={{ mb: 2 }}>
        {loading ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : null}
        {loading ? 'Generating…' : 'Generate Test'}
      </Button>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {questions.length > 0 && (
        <Box>
          {questions.map((q, idx) => (
            <Box key={q.id || idx} sx={{ mb: 3 }}>
              {console.log('Question object:', q)}
              <Typography variant="subtitle1" sx={{ mb: 1 }}>{idx + 1}. {q.text}</Typography>
              {q.type === 'mcq' ? (
                q.options && Array.isArray(q.options) && q.options.length > 0 ? (
                  <RadioGroup value={answers[q.id] || ''} onChange={e => handleAnswerChange(q.id, e.target.value)}>
                    {q.options.map((opt, i) => (
                      <FormControlLabel key={i} value={opt} control={<Radio />} label={opt} />
                    ))}
                  </RadioGroup>
                ) : (
                  <Alert severity="warning">Options for this multiple-choice question are missing or malformed.</Alert>
                )
              ) : (
                <TextField fullWidth multiline minRows={2} value={answers[q.id] || ''} onChange={e => handleAnswerChange(q.id, e.target.value)} placeholder="Your answer..." />
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
          {!results ? (
            <Button variant="contained" color="success" onClick={submitAnswers} disabled={loading} sx={{ mt: 2 }}>
              {loading ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : null}
              {loading ? 'Submitting…' : 'Submit Answers'}
            </Button>
          ) : (
            <Button variant="contained" color="primary" onClick={handleSaveTest} sx={{ mt: 2 }}>
              Save Test
            </Button>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default TestFeature;
