import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';

export const SubjectsContext = createContext();

export const SubjectsProvider = ({ children }) => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [studySessions, setStudySessions] = useState([]);
  const [timetableImage, setTimetableImage] = useState(null);
  const [classSchedule, setClassSchedule] = useState([]);

  const fetchData = useCallback(async () => {
    if (user) {

      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('*, tasks(*), blogs(*), tests(*), attachments(*)')
        .eq('user_id', user.id);

      if (subjectsError) console.error('Error fetching subjects:', subjectsError);
      else setSubjects(subjectsData || []);

      const { data: sessionsData, error: sessionsError } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id);

      if (sessionsError) console.error('Error fetching study sessions:', sessionsError);
      else setStudySessions(sessionsData || []);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('timetable_image, class_schedule')
        .eq('id', user.id)
        .single();

      if (profileError) console.error('Error fetching profile:', profileError);
      else {
        setTimetableImage(profileData?.timetable_image);
        setClassSchedule(profileData?.class_schedule || []);
      }


    }
  }, [user, setSubjects, setStudySessions, setTimetableImage, setClassSchedule]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addSubject = async (subject) => {
    if (!user) return;
    const { error } = await supabase
      .from('subjects')
      .insert([{ ...subject, user_id: user.id }]);
    if (error) {
      console.error('Error adding subject:', error);
    } else {
      fetchData();
    }
  };

  const addStudySession = async (session) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('study_sessions')
      .insert([{ ...session, user_id: user.id }])
      .select()
      .single();
    if (error) console.error('Error adding study session:', error);
    else setStudySessions([...studySessions, data]);
  };

  const deleteStudySession = async (sessionId) => {
    if (!user) return;
    const { error } = await supabase.from('study_sessions').delete().eq('id', sessionId);
    if (error) console.error('Error deleting study session:', error);
    else setStudySessions(studySessions.filter(s => s.id !== sessionId));
  };

  // Add a new test to a subject
  const addTest = async (subjectId, test) => {
    if (!user) return;
    const { error } = await supabase.from('tests').insert([{ ...test, subject_id: subjectId, user_id: user.id }]);
    if (error) console.error('Error adding test:', error);
    else fetchData();
  };

  // Update an existing subject
  const updateSubject = async (id, updatedData) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('subjects')
      .update(updatedData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select();

    if (error) {
      console.error('Error updating subject:', error);
    } else if (data) {
      fetchData();
    }
  };

  // Delete a subject
  const deleteSubject = async (id) => {
    if (!user) return;
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting subject:', error);
    } else {
      setSubjects(subjects.filter(subject => subject.id !== id));
    }
  };

  // Add a blog to a subject
  const addBlog = async (subjectId, blog) => {
    if (!user) return;
    const { error } = await supabase.from('blogs').insert([{ ...blog, subject_id: subjectId, user_id: user.id }]);
    if (error) console.error('Error adding blog:', error);
    else fetchData();
  };

  const updateBlog = async (subjectId, updatedBlog) => {
    if (!user) return;
    const { error } = await supabase.from('blogs').update(updatedBlog).eq('id', updatedBlog.id);
    if (error) console.error('Error updating blog:', error);
    else fetchData();
  };

  const deleteBlog = async (subjectId, blogId) => {
    if (!user) return;
    const { error } = await supabase.from('blogs').delete().eq('id', blogId);
    if (error) console.error('Error deleting blog:', error);
    else fetchData();
  };

  // Delete a test from a subject
  const deleteTest = async (subjectId, testId) => {
    if (!user) return;
    const { error } = await supabase.from('tests').delete().eq('id', testId);
    if (error) console.error('Error deleting test:', error);
    else fetchData();
  };

  // Add a task to a subject
  const addTask = async (subjectId, task) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ ...task, subject_id: subjectId, user_id: user.id }])
      .select();

    if (error) {
      console.error('Error adding task:', error);
    } else if (data) {
      fetchData(); // Refetch all data to update subjects and tasks
    }
  };

  const addMultipleTasks = async (subjectId, tasks) => {
    if (!user) return;
    const tasksWithIds = tasks.map(t => ({ ...t, subject_id: subjectId, user_id: user.id }));
    const { data, error } = await supabase.from('tasks').insert(tasksWithIds).select();

    if (error) {
      console.error('Error adding multiple tasks:', error);
      return null;
    } else {
      fetchData();
      return data;
    }
  };

  const setTaskFields = async (subjectId, taskId, partial) => {
    if (!user) return;
    const { error } = await supabase
      .from('tasks')
      .update(partial)
      .eq('id', taskId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating task:', error);
    } else {
      fetchData();
    }
  };

  const toggleTaskCompletion = async (subjectId, taskId) => {
    if (!user) return;
    // First, get the current task to toggle its `completed` status
    const task = subjects.find(s => s.id === subjectId)?.tasks.find(t => t.id === taskId);
    if (!task) return;

    const { error } = await supabase
      .from('tasks')
      .update({ completed: !task.completed })
      .eq('id', taskId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error toggling task:', error);
    } else {
      fetchData();
    }
  };

  const deleteTask = async (subjectId, taskId) => {
    if (!user) return;
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting task:', error);
    } else {
      fetchData();
    }
  };

  // Add an attachment to a subject
  const addAttachment = async (subjectId, attachment, file) => {
    if (!user) return;
    const { data, error } = await supabase.storage.from('attachments').upload(`${user.id}/${subjectId}/${file.name}`, file);
    if (error) {
      console.error('Error uploading attachment:', error);
      return;
    }

    const { error: dbError } = await supabase.from('attachments').insert([{
      subject_id: subjectId,
      user_id: user.id,
      name: file.name,
      path: data.path
    }]);

    if (dbError) console.error('Error saving attachment metadata:', dbError);
    else fetchData();
  };

  const deleteAttachment = async (subjectId, attachmentId, path) => {
    if (!user) return;
    const { error: storageError } = await supabase.storage.from('attachments').remove([path]);
    if (storageError) console.error('Error deleting attachment from storage:', storageError);

    const { error: dbError } = await supabase.from('attachments').delete().eq('id', attachmentId);
    if (dbError) console.error('Error deleting attachment metadata:', dbError);
    else fetchData();
  };

  const updateTimetableImage = async (image) => {
    if (!user) return;
    const { error } = await supabase.from('profiles').update({ timetable_image: image }).eq('id', user.id);
    if (error) console.error('Error saving timetable image:', error);
    else setTimetableImage(image);
  };

  const updateClassSchedule = async (schedule) => {
    if (!user) return;
    const { error } = await supabase.from('profiles').update({ class_schedule: schedule }).eq('id', user.id);
    if (error) console.error('Error saving class schedule:', error);
    else setClassSchedule(schedule);
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

  // Get recent study sessions for a given number of days
  const getRecentStudySessions = (days = 7) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return studySessions
      .filter(session => new Date(session.date) >= cutoffDate)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  return (
    <SubjectsContext.Provider value={{
      subjects,
      studySessions,
      timetableImage,
      classSchedule,
      setTimetableImage: updateTimetableImage,
      setClassSchedule: updateClassSchedule,
      addSubject,
      updateSubject,
      deleteSubject,
      addBlog,
      updateBlog,
      deleteBlog,
      addTest,
      deleteTest, // Add this line
      addTask,
      addMultipleTasks,
      setTaskFields,
      toggleTaskCompletion,
      deleteTask,
      addAttachment, // Add this line
      deleteAttachment,
      addStudySession,
      deleteStudySession,
      getTotalHoursForSubject,
      getTotalHoursForDay,
      getSessionsForDay,
      checkDailyGoals,
      getSubjectProgress,
      getRecentStudySessions,

      fetchData,
      // Flashcard functions
      fetchFlashcards: async (subjectId) => {
        if (!user) return [];
        const { data, error } = await supabase
          .from('flashcards')
          .select('*')
          .eq('subject_id', subjectId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching flashcards:', error);
          return [];
        }
        return data;
      },
      addFlashcard: async (flashcard) => {
        if (!user) return null;
        const { data, error } = await supabase
          .from('flashcards')
          .insert([{ ...flashcard, user_id: user.id }])
          .select()
          .single();

        if (error) {
          console.error('Error adding flashcard:', error);
          return null;
        }
        return data;
      },
      addMultipleFlashcards: async (flashcards) => {
        if (!user) return null;
        const cardsWithUser = flashcards.map(card => ({ ...card, user_id: user.id }));
        const { data, error } = await supabase
          .from('flashcards')
          .insert(cardsWithUser)
          .select();

        if (error) {
          console.error('Error adding multiple flashcards:', error);
          return null;
        }
        return data;
      },
      updateFlashcard: async (id, updates) => {
        if (!user) return null;
        const { data, error } = await supabase
          .from('flashcards')
          .update(updates)
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating flashcard:', error);
          return null;
        }
        return data;
      },
      deleteFlashcard: async (id) => {
        if (!user) return;
        const { error } = await supabase
          .from('flashcards')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error deleting flashcard:', error);
        }
      }
    }}>
      {children}
    </SubjectsContext.Provider>
  );
};

export const useSubjects = () => useContext(SubjectsContext);