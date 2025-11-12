import React, { createContext, useContext, useReducer, useEffect } from 'react';
import aiService from '../services/aiService';

const AIContext = createContext();

const initialState = {
  // API Configuration
  geminiApiKey: '',
  currentModels: {
    gemini: 'gemini-2.5-flash-lite',
  },
  isConfigured: false,
  
  // Chat State
  conversations: [],
  isLoading: false,
  error: null,
  
  // AI Insights
  productivityAnalysis: null,
  dailyPlan: null,
  recommendations: [],
  routineMemory: {},
  
  // UI State
  isAIAssistantOpen: false,
  currentView: 'chat', // 'chat', 'insights', 'planning', 'roadmap'
  
  // Analytics
  totalQueries: 0,
  lastAnalysisTime: null,
};

function aiReducer(state, action) {
  switch (action.type) {
    case 'SET_API_KEYS':
      const { geminiKey } = action.payload;
      aiService.setApiKeys({ geminiApiKey: geminiKey });
      try {
        localStorage.setItem('ai_keys', JSON.stringify({ geminiApiKey: geminiKey || state.geminiApiKey }));
      } catch {}
      return {
        ...state,
        geminiApiKey: geminiKey || state.geminiApiKey,
        isConfigured: aiService.isConfigured()
      };
      
    case 'SET_MODEL':
      // Ignore model changes, always use gemini-2.5-flash-lite
      aiService.setModel('gemini', 'gemini-2.5-flash-lite');
      return {
        ...state,
        currentModels: {
          ...state.currentModels,
          gemini: 'gemini-2.5-flash-lite'
        }
      };
      
    case 'ADD_CONVERSATION':
      return {
        ...state,
        conversations: [...state.conversations, action.payload],
        totalQueries: action.payload.type === 'user' ? state.totalQueries + 1 : state.totalQueries
      };
      
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
      
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
      
    case 'SET_PRODUCTIVITY_ANALYSIS':
      return {
        ...state,
        productivityAnalysis: action.payload,
        lastAnalysisTime: new Date().toISOString()
      };
      
    case 'SET_DAILY_PLAN':
      return {
        ...state,
        dailyPlan: action.payload
      };
      
    case 'SET_RECOMMENDATIONS':
      return {
        ...state,
        recommendations: action.payload
      };
      
    case 'UPDATE_ROUTINE_MEMORY':
      return {
        ...state,
        routineMemory: { ...state.routineMemory, ...action.payload }
      };
      
    case 'TOGGLE_AI_ASSISTANT':
      return {
        ...state,
        isAIAssistantOpen: !state.isAIAssistantOpen
      };
      
    case 'SET_AI_ASSISTANT_OPEN':
      return {
        ...state,
        isAIAssistantOpen: action.payload
      };
      
    case 'SET_CURRENT_VIEW':
      return {
        ...state,
        currentView: action.payload
      };
      
    case 'CLEAR_CONVERSATIONS':
      return {
        ...state,
        conversations: []
      };
      
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
      
    case 'INITIALIZE_AI_STATE':
      return {
        ...state,
        ...action.payload
      };
      
    default:
      return state;
  }
}

export const AIProvider = ({ children }) => {
  const [state, dispatch] = useReducer(aiReducer, initialState);

  // Load saved state from localStorage on initial render
  useEffect(() => {
    const savedState = localStorage.getItem('ai_state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        // Always force model to gemini-2.5-flash-lite
        parsed.currentModels = { gemini: 'gemini-2.5-flash-lite' };
        dispatch({ type: 'INITIALIZE_AI_STATE', payload: parsed });
        // Configure AI service with saved keys
        if (parsed.geminiApiKey) {
          aiService.setApiKeys({ geminiApiKey: parsed.geminiApiKey });
          aiService.setModel('gemini', 'gemini-2.5-flash-lite');
        }
      } catch (error) {
        console.error('Error loading AI state:', error);
      }
    }
    // Also load keys saved separately (back-compat and reliability)
    const savedKeys = localStorage.getItem('ai_keys');
    if (savedKeys) {
      try {
        const parsed = JSON.parse(savedKeys);
        if (parsed.geminiApiKey) {
          aiService.setApiKeys({ geminiApiKey: parsed.geminiApiKey });
          aiService.setModel('gemini', 'gemini-2.5-flash-lite');
          // Update state so UI shows configured immediately
          dispatch({ type: 'SET_API_KEYS', payload: { geminiKey: parsed.geminiApiKey || '' } });
        }
      } catch {}
    }
    // Load routine memory
    const routineMemory = aiService.getRoutineMemory();
    if (Object.keys(routineMemory).length > 0) {
      dispatch({ type: 'UPDATE_ROUTINE_MEMORY', payload: routineMemory });
    }
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    const stateToSave = {
      geminiApiKey: state.geminiApiKey,
      currentModels: state.currentModels,
      conversations: state.conversations,
      totalQueries: state.totalQueries,
      lastAnalysisTime: state.lastAnalysisTime
    };
    localStorage.setItem('ai_state', JSON.stringify(stateToSave));
  }, [state.geminiApiKey, state.currentModels, state.conversations, state.totalQueries, state.lastAnalysisTime]);

  // AI Action Functions
  const sendMessage = async (message, appData = {}) => {
    if (!state.isConfigured) {
      dispatch({ type: 'SET_ERROR', payload: 'AI is not configured. Please set up your API keys in settings.' });
      return;
    }

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    dispatch({ type: 'ADD_CONVERSATION', payload: userMessage });
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      const response = await aiService.generateResponse(message, appData);
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      };
      dispatch({ type: 'ADD_CONVERSATION', payload: aiMessage });
    } catch (error) {
      console.error('AI Message Error:', error);
      dispatch({ type: 'SET_ERROR', payload: `AI Message Error: ${error.message || 'Failed to get AI response'}` });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const analyzeProductivity = async (subjects, studySessions, dailyGoals, classSchedule) => {
    if (!state.isConfigured) {
      dispatch({ type: 'SET_ERROR', payload: 'AI is not configured. Please set up your API keys in settings.' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      const analysis = await aiService.analyzeProductivity(subjects, studySessions, dailyGoals, classSchedule);
      dispatch({ type: 'SET_PRODUCTIVITY_ANALYSIS', payload: analysis });
      return analysis;
    } catch (error) {
      console.error('Productivity Analysis Error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to analyze productivity' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const generateDailyPlan = async (subjects, studySessions, dailyGoals, classSchedule, preferences = {}) => {
    if (!state.isConfigured) {
      dispatch({ type: 'SET_ERROR', payload: 'AI is not configured. Please set up your API keys in settings.' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      const plan = await aiService.planDay(subjects, studySessions, dailyGoals, classSchedule, preferences);
      dispatch({ type: 'SET_DAILY_PLAN', payload: plan });
      return plan;
    } catch (error) {
      console.error('Daily Plan Error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to generate daily plan' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const generateRoadmap = async (subject, currentLevel, targetLevel, timeframe) => {
    if (!state.isConfigured) {
      dispatch({ type: 'SET_ERROR', payload: 'AI is not configured. Please set up your API keys in settings.' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      const roadmap = await aiService.generateRoadmap(subject, currentLevel, targetLevel, timeframe);
      
      // Add to conversations for reference
      const roadmapMessage = {
        id: Date.now(),
        type: 'assistant',
        content: `I've created a detailed learning roadmap for ${subject}. You can create an interactive version with trackable tasks.\n\n${roadmap}`,
        timestamp: new Date().toISOString(),
        isRoadmap: true,
        subject: subject
      };
      dispatch({ type: 'ADD_CONVERSATION', payload: roadmapMessage });
      
      return roadmap;
    } catch (error) {
      console.error('Roadmap Generation Error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to generate roadmap' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const generateSubjectWithSubtopics = async (subjectName, description, level, timeframe, appContext) => {
    if (!state.isConfigured) {
      dispatch({ type: 'SET_ERROR', payload: 'AI is not configured. Please set up your API keys in settings.' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      const subjectStructure = await aiService.generateSubjectWithSubtopics(subjectName, description, level, timeframe);
      
      // Add to conversations for reference
      const subjectMessage = {
        id: Date.now(),
        type: 'assistant',
        content: `I've created a structure for the subject "${subjectName}" with subtopics. You can now add this subject to your app.\n\n${subjectStructure}`,
        timestamp: new Date().toISOString(),
        isSubjectStructure: true,
        subjectName: subjectName,
        subjectStructure: subjectStructure
      };
      dispatch({ type: 'ADD_CONVERSATION', payload: subjectMessage });
      
      return subjectStructure;
    } catch (error) {
      console.error('Subject Generation Error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to generate subject structure' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const createSubjectFromStructure = async (subjectName, subjectStructure, appContext) => {
    // This function would interface with the SubjectsContext to create actual subjects
    // For now, we'll just return a success message
    return {
      success: true,
      message: `Subject "${subjectName}" created successfully with the AI-generated structure.`
    };
  };

  const createSubjectWithTasks = async (subjectName, subjectStructure, appContext) => {
    try {
      // Extract subtopics from the AI-generated structure
      const subtopics = aiService.extractSubtopicsFromStructure(subjectStructure);
      
      // Create the main subject
      const newSubject = {
        name: subjectName,
        color: '#3f51b5',
        dailyGoalHours: 1,
        notes: subjectStructure,
        category: 'AI Generated',
        tasks: []
      };
      
      // Add subtopics as tasks if any were found
      if (subtopics.length > 0) {
        newSubject.tasks = [];
        for (const [index, subtopic] of subtopics.entries()) {
          newSubject.tasks.push({
            id: Date.now().toString() + index,
            name: subtopic.name,
            completed: false,
            createdAt: new Date().toISOString(),
            description: subtopic.description || ''
          });
        }
      }
      
      // Add the subject to the app context
      if (appContext && typeof appContext.addSubject === 'function') {
        appContext.addSubject(newSubject);
      }
      
      return {
        success: true,
        message: `Subject "${subjectName}" created successfully with ${subtopics.length} subtopics as tasks!`,
        subject: newSubject
      };
    } catch (error) {
      console.error('Error creating subject with tasks:', error);
      return {
        success: false,
        message: `Failed to create subject: ${error.message}`
      };
    }
  };

  const createRoadmapSubject = async (subjectName, roadmapStructure, appContext) => {
    try {
      // Extract phases and tasks from the AI-generated roadmap
      const phases = aiService.extractRoadmapFromStructure(roadmapStructure);
      
      // Create the main subject
      const newSubject = {
        name: `${subjectName} - Learning Roadmap`,
        color: '#9c27b0',
        dailyGoalHours: 2, // Default to 2 hours for roadmap subjects
        notes: roadmapStructure,
        category: 'AI Roadmap',
        tasks: []
      };
      
      // Convert phases and tasks to a flat task list with phase information
      const roadmapTasks = [];
      phases.forEach((phase, phaseIndex) => {
        // Add a task for the phase itself
        roadmapTasks.push({
          id: `phase-task-${Date.now()}-${phaseIndex}`,
          name: `Phase ${phaseIndex + 1}: ${phase.name}`,
          completed: false,
          createdAt: new Date().toISOString(),
          description: `Phase overview: ${phase.name}`,
          isPhase: true,
          phaseId: phase.id
        });
        
        // Add individual tasks within the phase
        phase.tasks.forEach((task, taskIndex) => {
          roadmapTasks.push({
            id: task.id,
            name: task.name,
            completed: false,
            createdAt: new Date().toISOString(),
            description: task.description || '',
            phaseId: phase.id,
            phaseName: phase.name,
            duration: task.duration || ''
          });
        });
      });
      
      newSubject.tasks = roadmapTasks;
      
      // Add the subject to the app context and capture id
      let createdId = null;
      if (appContext && typeof appContext.addSubject === 'function') {
        createdId = appContext.addSubject(newSubject);
      }
      
      return {
        success: true,
        message: `Interactive roadmap for "${subjectName}" created successfully with ${roadmapTasks.length} tasks across ${phases.length} phases!`,
        subject: { ...newSubject, id: createdId },
        phases: phases
      };
    } catch (error) {
      console.error('Error creating roadmap subject:', error);
      return {
        success: false,
        message: `Failed to create roadmap: ${error.message}`
      };
    }
  };

  const getRecommendations = async (subjects, studySessions, dailyGoals, classSchedule) => {
    if (!state.isConfigured) {
      dispatch({ type: 'SET_ERROR', payload: 'AI is not configured. Please set up your API keys in settings.' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      const recommendations = await aiService.getRecommendations(subjects, studySessions, dailyGoals, classSchedule);
      dispatch({ type: 'SET_RECOMMENDATIONS', payload: recommendations });
      return recommendations;
    } catch (error) {
      console.error('Recommendations Error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to get recommendations' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateRoutineMemory = async (routineData) => {
    try {
      const updatedMemory = await aiService.updateRoutineMemory(routineData);
      dispatch({ type: 'UPDATE_ROUTINE_MEMORY', payload: updatedMemory });
      return updatedMemory;
    } catch (error) {
      console.error('Routine Memory Update Error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to update routine memory' });
    }
  };

  const testConnection = async (provider = null) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });
    
    try {
      const result = await aiService.testConnection(provider);
      if (result.success) {
        dispatch({ type: 'SET_ERROR', payload: null });
        return result;
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.message });
        return result;
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to test API connection';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, message: errorMessage, error };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const value = {
    state,
    dispatch,
    // Actions
    sendMessage,
    analyzeProductivity,
    generateDailyPlan,
    generateRoadmap,
    generateSubjectWithSubtopics,
    createSubjectFromStructure,
    createSubjectWithTasks,
    createRoadmapSubject,
    getRecommendations,
    updateRoutineMemory,
    testConnection,
    // Utilities
    isConfigured: () => state.isConfigured,
    clearError: () => dispatch({ type: 'CLEAR_ERROR' }),
    clearConversations: () => dispatch({ type: 'CLEAR_CONVERSATIONS' }),
    toggleAIAssistant: () => dispatch({ type: 'TOGGLE_AI_ASSISTANT' }),
    setAIAssistantOpen: (isOpen) => dispatch({ type: 'SET_AI_ASSISTANT_OPEN', payload: isOpen }),
    setCurrentView: (view) => dispatch({ type: 'SET_CURRENT_VIEW', payload: view }),
    setApiKeys: (geminiKey) => dispatch({ type: 'SET_API_KEYS', payload: { geminiKey } }),
    setModel: (model) => dispatch({ type: 'SET_MODEL', payload: { model } }),
    getAvailableModels: () => aiService.getAvailableModels(),
    getCurrentModel: () => aiService.getCurrentModel()
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
};

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};

export default AIContext;