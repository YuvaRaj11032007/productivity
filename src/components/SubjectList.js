import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubjects } from '../contexts/SubjectsContext';
import { useAppContext } from '../contexts/AppContext';

const SubjectList = () => {
  const { subjects, deleteSubject } = useSubjects();
  const { state, dispatch } = useAppContext();
  const { activeSubject } = state;
  const navigate = useNavigate();

  const handleSelectSubject = (subjectId) => {
    dispatch({ type: 'SET_ACTIVE_SUBJECT', payload: subjectId });
    navigate(`/subject/${subjectId}`);
  };

  const handleDeleteSubject = (e, subjectId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this subject? All associated tasks and study sessions will be lost.')) {
      deleteSubject(subjectId);
      if (activeSubject === subjectId) {
        dispatch({ type: 'SET_ACTIVE_SUBJECT', payload: null });
      }
    }
  };

  const calculateProgress = (subject) => {
    const totalTasks = subject.tasks.length;
    const completedTasks = subject.tasks.filter(task => task.completed).length;
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  return (
    <div className="subject-list">
      <h2>Subjects</h2>
      {subjects.length === 0 ? (
        <p>No subjects added yet. Add your first subject below.</p>
      ) : (
        <ul className="subjects">
          {subjects.map(subject => (
            <li 
              key={subject.id} 
              className={`subject-item ${activeSubject === subject.id ? 'active' : ''}`}
              onClick={() => handleSelectSubject(subject.id)}
            >
              <div className="subject-header">
                <h3>{subject.name}</h3>
                <button 
                  className="delete-btn" 
                  onClick={(e) => handleDeleteSubject(e, subject.id)}
                  aria-label="Delete subject"
                >
                  ×
                </button>
              </div>
              <div className="subject-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${calculateProgress(subject)}%` }}
                  ></div>
                </div>
                <span className="progress-text">{calculateProgress(subject)}%</span>
              </div>
              <div className="subject-meta">
                <span>{subject.tasks.length} tasks</span>
                {subject.dailyGoalHours && (
                  <span>{subject.dailyGoalHours} hours/day</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SubjectList;