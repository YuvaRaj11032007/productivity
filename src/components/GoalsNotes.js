import React, { useState, useEffect } from 'react';
import { useSubjects } from '../contexts/SubjectsContext';

const GoalsNotes = ({ subjectId }) => {
  const { subjects, updateSubject } = useSubjects();
  const subject = subjects.find(s => s.id === subjectId);
  
  const [goals, setGoals] = useState(subject?.goals || '');
  const [notes, setNotes] = useState(subject?.notes || '');
  const [isEditing, setIsEditing] = useState(false);

  // Update local state when subject changes
  useEffect(() => {
    setGoals(subject?.goals || '');
    setNotes(subject?.notes || '');
  }, [subject]);

  const handleSave = () => {
    if (subject) {
      updateSubject(subject.id, { goals, notes });
      setIsEditing(false);
    }
  };

  return (
    <div className="goals-notes-container">
      <div className="goals-notes-header">
        <h3>Goals & Notes</h3>
        {!isEditing ? (
          <button 
            className="edit-btn" 
            onClick={() => setIsEditing(true)}
          >
            Edit
          </button>
        ) : (
          <div className="edit-actions">
            <button 
              className="cancel-btn" 
              onClick={() => {
                setGoals(subject?.goals || '');
                setNotes(subject?.notes || '');
                setIsEditing(false);
              }}
            >
              Cancel
            </button>
            <button 
              className="save-btn" 
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        )}
      </div>

      <div className="goals-section">
        <h4>Goals</h4>
        {isEditing ? (
          <textarea
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            placeholder="What do you want to achieve with this subject?"
            rows="4"
          ></textarea>
        ) : (
          <div className="content-display">
            {goals ? (
              <p>{goals}</p>
            ) : (
              <p className="empty-content">No goals set. Click Edit to add goals.</p>
            )}
          </div>
        )}
      </div>

      <div className="notes-section">
        <h4>Notes</h4>
        {isEditing ? (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes or resources for this subject"
            rows="6"
          ></textarea>
        ) : (
          <div className="content-display">
            {notes ? (
              <p>{notes}</p>
            ) : (
              <p className="empty-content">No notes added. Click Edit to add notes.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalsNotes;