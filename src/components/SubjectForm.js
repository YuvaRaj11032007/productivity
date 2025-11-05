import React, { useState } from 'react';
import { useSubjects } from '../contexts/SubjectsContext';
import { useAppContext } from '../contexts/AppContext';

const SubjectForm = () => {
  const { addSubject } = useSubjects();
  const { dispatch } = useAppContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const [dailyGoalHours, setDailyGoalHours] = useState('');
  const [color, setColor] = useState('#36A2EB');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (subjectName.trim()) {
      const newSubject = {
        name: subjectName.trim(),
        dailyGoalHours: dailyGoalHours ? parseFloat(dailyGoalHours) : null,
        color,
      };
      
      const newSubjectId = addSubject(newSubject);
      dispatch({ type: 'SET_ACTIVE_SUBJECT', payload: newSubjectId });
      
      // Reset form
      setSubjectName('');
      setDailyGoalHours('');
      setColor('#36A2EB');
      setIsFormOpen(false);
    }
  };

  return (
    <div className="subject-form-container">
      {!isFormOpen ? (
        <button 
          className="add-subject-btn" 
          onClick={() => setIsFormOpen(true)}
        >
          + Add Subject
        </button>
      ) : (
        <form className="subject-form" onSubmit={handleSubmit}>
          <h3>Add New Subject</h3>
          
          <div className="form-group">
            <label htmlFor="subjectName">Subject Name</label>
            <input
              type="text"
              id="subjectName"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="e.g., C++, DSA, Machine Learning"
              required
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="dailyGoalHours">Daily Goal (hours)</label>
            <input
              type="number"
              id="dailyGoalHours"
              value={dailyGoalHours}
              onChange={(e) => setDailyGoalHours(e.target.value)}
              placeholder="e.g., 2"
              min="0.1"
              step="0.1"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="color">Color</label>
            <input
              type="color"
              id="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={() => setIsFormOpen(false)}>Cancel</button>
            <button type="submit">Add Subject</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SubjectForm;