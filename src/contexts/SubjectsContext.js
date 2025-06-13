import React, { createContext, useState, useEffect } from 'react';

export const SubjectsContext = createContext();

export const SubjectsProvider = ({ children }) => {
  // Load data from localStorage or use default empty arrays
  const [subjects, setSubjects] = useState(() => {
    const savedSubjects = localStorage.getItem('subjects');
    return savedSubjects ? JSON.parse(savedSubjects) : [];
  });

  const [studySessions, setStudySessions] = useState(() => {
    const savedSessions = localStorage.getItem('studySessions');
    return savedSessions ? JSON.parse(savedSessions) : [];
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('studySessions', JSON.stringify(studySessions));
  }, [studySessions]);

  // Add a new subject
  const addSubject = (subject) => {
    const newSubject = {
      id: Date.now().toString(),
      name: subject.name,
      color: subject.color || '#3f51b5',
      tasks: [],
      dailyGoalHours: subject.dailyGoalHours || 1,
      notes: subject.notes || '',
      deadline: subject.deadline || null,
      createdAt: new Date().toISOString(),
    };
    setSubjects([...subjects, newSubject]);
    return newSubject.id;
  };

  // Update an existing subject
  const updateSubject = (id, updatedData) => {
    setSubjects(subjects.map(subject => 
      subject.id === id ? { ...subject, ...updatedData } : subject
    ));
  };

  // Delete a subject
  const deleteSubject = (id) => {
    setSubjects(subjects.filter(subject => subject.id !== id));
    // Also delete related study sessions
    setStudySessions(studySessions.filter(session => session.subjectId !== id));
  };

  // Add a task to a subject
  const addTask = (subjectId, task) => {
    setSubjects(subjects.map(subject => {
      if (subject.id === subjectId) {
        const newTask = {
          id: Date.now().toString(),
          name: task.name,
          completed: false,
          createdAt: new Date().toISOString(),
        };
        return {
          ...subject,
          tasks: [...subject.tasks, newTask]
        };
      }
      return subject;
    }));
  };

  // Toggle task completion status
  const toggleTaskCompletion = (subjectId, taskId) => {
    setSubjects(subjects.map(subject => {
      if (subject.id === subjectId) {
        return {
          ...subject,
          tasks: subject.tasks.map(task => 
            task.id === taskId ? { ...task, completed: !task.completed } : task
          )
        };
      }
      return subject;
    }));
  };

  // Delete a task
  const deleteTask = (subjectId, taskId) => {
    setSubjects(subjects.map(subject => {
      if (subject.id === subjectId) {
        return {
          ...subject,
          tasks: subject.tasks.filter(task => task.id !== taskId)
        };
      }
      return subject;
    }));
  };

  // Add a study session
  const addStudySession = (session) => {
    const newSession = {
      id: Date.now().toString(),
      subjectId: session.subjectId,
      date: session.date || new Date().toISOString(),
      duration: session.duration, // in minutes
      notes: session.notes || '',
    };
    setStudySessions([...studySessions, newSession]);
  };

  // Delete a study session
  const deleteStudySession = (sessionId) => {
    setStudySessions(studySessions.filter(session => session.id !== sessionId));
  };

  // Get total study hours for a subject
  const getTotalHoursForSubject = (subjectId) => {
    return studySessions
      .filter(session => session.subjectId === subjectId)
      .reduce((total, session) => total + (session.duration / 60), 0);
  };

  // Get total study hours for a specific day
  const getTotalHoursForDay = (date) => {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    return studySessions
      .filter(session => {
        const sessionDate = new Date(session.date);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === targetDate.getTime();
      })
      .reduce((total, session) => total + (session.duration / 60), 0);
  };

  // Get study sessions for a specific day
  const getSessionsForDay = (date) => {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    return studySessions.filter(session => {
      const sessionDate = new Date(session.date);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate.getTime() === targetDate.getTime();
    });
  };

  // Check if daily goals are met
  const checkDailyGoals = (date = new Date()) => {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    return subjects.map(subject => {
      const totalHours = studySessions
        .filter(session => {
          const sessionDate = new Date(session.date);
          sessionDate.setHours(0, 0, 0, 0);
          return session.subjectId === subject.id && 
                 sessionDate.getTime() === targetDate.getTime();
        })
        .reduce((total, session) => total + (session.duration / 60), 0);
      
      return {
        subject,
        goalMet: totalHours >= subject.dailyGoalHours,
        hoursStudied: totalHours,
      };
    });
  };

  // Calculate progress percentage for a subject
  const getSubjectProgress = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject || subject.tasks.length === 0) return 0;
    
    const completedTasks = subject.tasks.filter(task => task.completed).length;
    return (completedTasks / subject.tasks.length) * 100;
  };

  return (
    <SubjectsContext.Provider value={{
      subjects,
      studySessions,
      addSubject,
      updateSubject,
      deleteSubject,
      addTask,
      toggleTaskCompletion,
      deleteTask,
      addStudySession,
      deleteStudySession,
      getTotalHoursForSubject,
      getTotalHoursForDay,
      getSessionsForDay,
      checkDailyGoals,
      getSubjectProgress,
    }}>
      {children}
    </SubjectsContext.Provider>
  );
};