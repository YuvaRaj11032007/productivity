import axios from 'axios';

class AIService {
  constructor() {
    console.log("AIService constructor called, initializing...");
    this.geminiApiKey = null;
    this.currentProvider = 'gemini'; // 'gemini' or 'groq'
    this.currentModel = {
      gemini: 'gemini-1.5-pro',
    };
    this.baseUrls = {
      gemini: 'https://generativelanguage.googleapis.com/v1beta/models',
    };
    this.availableModels = {
      gemini: [
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Low-latency, high-volume tasks; latest 2.5 Flash' },
        { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', description: 'Lightweight 2.5 Flash model' },
        { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'The most capable 2.5 model for complex tasks' },
      ],
    };
  }

  async generateComprehensiveTaskList(subjectName, level, timeframe, context = {}) {
    const prompt = `
      Create a comprehensive, structured task list for learning **${subjectName}**.
      - **Current Level:** ${level}
      - **Target Timeframe:** ${timeframe}

      **Instructions:**
      1.  Generate a list of 10-15 high-level tasks in a logical, sequential order.
      2.  The tasks should cover all the key concepts of the subject, from beginner to advanced.
      3.  For each task, provide an estimated time in minutes for completion.
      4.  The output must be a simple list of tasks, each on a new line, formatted as: 'Task Name (Estimated Minutes: MM)'.

      **Example:**
      - Introduction to ${subjectName} and its Core Principles (Estimated Minutes: 120)
      - Foundational Concepts of ${subjectName} (Estimated Minutes: 180)
      - Advanced Topic in ${subjectName} (Estimated Minutes: 240)
    `;
    return await this.generateResponse(prompt, context);
  }

  parseTaskListResponse(response) {
    if (!response) return [];
    
    const tasks = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.replace(/^-/, '').trim();
      const match = trimmedLine.match(/(.+?)\s*\(Estimated Minutes:\s*(\d+)\)/);
      
      if (match) {
        tasks.push({
          name: match[1].trim(),
          estimatedMinutes: parseInt(match[2], 10),
          dueDate: null
        });
      }
    }
    
    return tasks;
  }

  // Set the current model for a provider
  setModel(provider, modelId) {
    if (this.availableModels[provider]?.find(m => m.id === modelId)) {
      this.currentModel[provider] = modelId;
      console.log(`AI model for ${provider} set to: ${modelId}`);
    } else {
      console.error(`Model ${modelId} is not available for provider ${provider}.`);
    }
  }

  // Set API keys for Gemini and Groq
  setApiKeys({ geminiApiKey }) {
    if (geminiApiKey !== undefined) this.geminiApiKey = geminiApiKey;
  }



  getAvailableModels(provider = this.currentProvider) {
    return this.availableModels[provider] || [];
  }

  async generateResponse(prompt, context = {}, imageDataUrl = null, modelOverride = null) {
    if (this.currentProvider === 'gemini') {
      return this.callGemini(prompt, context, imageDataUrl, modelOverride);
    }
    throw new Error('Invalid AI provider selected');
  }

  // Generate test questions from completed tasks
  async generateTestQuestions(subjectName, completedTaskNames, numQuestions = 5, difficulty = 'medium', questionType = 'both', context = {}) {
    let questionTypePrompt = 'Include a mix of multiple-choice questions (MCQ) and open-ended questions.';
    if (questionType === 'mcq') {
      questionTypePrompt = 'Only generate multiple-choice questions (MCQ).';
    } else if (questionType === 'descriptive') {
      questionTypePrompt = 'Only generate open-ended questions.';
    }

    // Prompt: Only ask from completed tasks, allow MCQ or open-ended
    let difficultyPrompt = '';
    if (difficulty === 'advanced') {
      difficultyPrompt = 'For these advanced questions, you should create imaginary scenarios that require the user to apply their knowledge to solve a problem.';
    }

    const prompt = `Generate a short test of ${numQuestions} questions for the subject '${subjectName}' at a ${difficulty} difficulty level. ${questionTypePrompt} The questions should be based on these completed topics: ${completedTaskNames.join(", ")}. You should ask questions that test the application of the knowledge, not just recall of information. You can also generate questions on related topics that are not explicitly covered in the completed topics, but are relevant to the subject. ${difficultyPrompt} For MCQs, ensure options are relevant, plausible, and distinct, and provide them as an array of strings (at least 3 options). Always include a 'correct_answer' field for MCQs. For open-ended, just ask the question. Return as JSON: [{id: number, text: string, type: 'mcq' | 'open_ended', options?: string[], correct_answer?: string}].`;
    const response = await this.generateResponse(prompt, context);
    console.log('Raw AI response for generateTestQuestions:', response);
    // Try to parse JSON
    try {
      let jsonString = '';
      let startIndex = -1;
      let endIndex = -1;

      // Try to find an array first
      startIndex = response.indexOf('[');
      endIndex = response.lastIndexOf(']');

      if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
        // If no array, try to find an object
        startIndex = response.indexOf('{');
        endIndex = response.lastIndexOf('}');
      }
      
      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        jsonString = response.substring(startIndex, endIndex + 1);
      }

      if (!jsonString.trim()) {
        throw new Error('No valid JSON structure found or extracted JSON is empty.');
      }

      console.log('Extracted JSON string for generateTestQuestions:', jsonString);
      const questions = JSON.parse(jsonString);
      console.log('Parsed AI questions:', questions);
      return questions;
    } catch (e) {
      console.error('Error parsing AI questions:', e);
      console.error('Full error object:', e);
      // Fallback: return empty array
      return [];
    }
  }
  async checkTestAnswers(subjectName, questions, answers) {
    // Prepare questions and answers for the AI, ensuring all MCQ options are included
    const questionsForAI = questions.map(q => {
      if (q.type === 'mcq') {
        return { ...q, user_answer: answers[q.id] };
      }
      return { ...q, user_answer: answers[q.id] };
    });

    const prompt = `
    You are an AI testing assistant. Evaluate the user's answers for a test on "${subjectName}".

    **Questions with User Answers:**
    ${JSON.stringify(questionsForAI, null, 2)}

    **Instructions:**
    1.  For each question, determine if the user's answer is correct. For MCQs, consider all provided options and the user's selected option.
    2.  Provide a brief, one-sentence explanation for any incorrect answers, referencing the correct option for MCQs.
    3.  Calculate a "mastery level" (e.g., "Beginner", "Intermediate", "Advanced") based on the user's performance.
    4.  Return a single JSON object with two keys: "answers" (an array of objects with "correct" and "explanation" fields) and "mastery" (a string).

    **JSON Structure Example:**
    {
      "answers": [
        { "correct": true, "explanation": "" },
        { "correct": false, "explanation": "The correct answer is X because..." }
      ],
      "mastery": "Intermediate"
    }
    `;

    const response = await this.generateResponse(prompt);
    console.log('Raw AI response for checkTestAnswers:', response);

    try {
      // First, try to find a JSON markdown block
      const match = response.match(/```json\n([\s\S]*?)\n```/);
      if (match && match[1]) {
        const jsonString = match[1];
        const results = JSON.parse(jsonString);
        return results;
      }

      // Fallback to the old method if no markdown block is found
      const jsonString = response.substring(response.indexOf('{'), response.lastIndexOf('}') + 1);
      if (jsonString) {
        const results = JSON.parse(jsonString);
        return results;
      }

      throw new Error('No valid JSON found in the response.');
    } catch (e) {
      console.error('Error parsing AI response for checkTestAnswers:', e);
      // Fallback for non-JSON responses
      return {
        answers: questions.map(() => ({ correct: false, explanation: "Could not parse AI response." })),
        mastery: 'Unknown'
      };
    }
  }


  async callGemini(prompt, context, imageDataUrl = null, modelOverride = null) {
    const model = modelOverride || this.currentModel.gemini;
    const url = `${this.baseUrls.gemini}/${model}:generateContent?key=${this.geminiApiKey}`;

    const parts = [{ text: this.buildPrompt(prompt, context) }];

    if (imageDataUrl) {
      const mimeType = imageDataUrl.substring(imageDataUrl.indexOf(':') + 1, imageDataUrl.indexOf(';'));
      const base64Data = imageDataUrl.substring(imageDataUrl.indexOf(',') + 1);
      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: base64Data
        }
      });
    }

    try {
      const response = await axios.post(url, {
        contents: [{ parts }]
      });

      if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return response.data.candidates[0].content.parts[0].text;
      }

      throw new Error(`Invalid or empty response from Gemini API (${model})`);

    } catch (error) {
      console.error('Gemini API Call Error:', error);
      if (error.response) {
        const errorMessage = error.response.data?.error?.message || error.response.statusText;
        throw new Error(`Gemini API Error (${error.response.status}): ${errorMessage}. Full error: ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        throw new Error('Network error: Unable to reach Gemini API. Please check your internet connection.');
      } else {
        throw error;
      }
    }
  }



  /**
   * Build comprehensive prompt with context
   */
  buildPrompt(userMessage, context) {
    const contextInfo = this.formatContext(context);
    
    return `
You are Lily's personal AI productivity assistant for her study tracking application. You have access to all her study data and can provide intelligent insights.

CONTEXT DATA:
${contextInfo}

USER REQUEST: ${userMessage}

Based on Lily's data, please provide a helpful, personalized response. You can:
1. Analyze productivity patterns and trends
2. Suggest daily/weekly planning strategies
3. Create roadmaps for subjects or skills
4. Identify areas for improvement
5. Recommend optimal study schedules
6. Track goal achievement progress

Please be specific, actionable, and reference her actual data when relevant. Format your response clearly with headings and bullet points when appropriate.
    `.trim();
  }

  /**
   * Format context data for AI consumption
   */
  formatContext(context) {
    let formattedContext = '';

    if (context.subjects && context.subjects.length > 0) {
      formattedContext += '**SUBJECTS (Most Recent 5):**\n';
      // Limit to most recent 5 subjects for brevity
      const recentSubjects = context.subjects.slice(-5);
      recentSubjects.forEach(subject => {
        formattedContext += `- ${subject.name} (${subject.category || 'Uncategorized'})\n`;
        formattedContext += `  Daily Goal: ${subject.dailyGoalHours}h\n`;
        if (subject.tasks && subject.tasks.length > 0) {
          formattedContext += `  Tasks: ${subject.tasks.length} total\n`;
          const completedTasks = subject.tasks.filter(t => t.completed).length;
          formattedContext += `  Completed: ${completedTasks}/${subject.tasks.length}\n`;
        }
        if (subject.notes) {
          formattedContext += `  Notes: ${subject.notes}\n`;
        }
      });
      formattedContext += '\n';
    }

    if (context.studySessions && context.studySessions.length > 0) {
      formattedContext += '**RECENT STUDY SESSIONS (Most Recent 5):**\n';
      // Limit to most recent 5 sessions for brevity
      const recentSessions = context.studySessions.slice(-5);
      recentSessions.forEach(session => {
        const subjectName = context.subjects?.find(s => s.id === session.subjectId)?.name || 'Unknown';
        formattedContext += `- ${subjectName}: ${Math.round(session.duration/60)}h on ${new Date(session.date).toLocaleDateString()}\n`;
      });
      formattedContext += '\n';
    }

    if (context.dailyGoals) {
      formattedContext += '**TODAY\'S PROGRESS:**\n';
      context.dailyGoals.forEach(goal => {
        const progress = ((goal.hoursStudied / goal.subject.dailyGoalHours) * 100).toFixed(1);
        formattedContext += `- ${goal.subject.name}: ${goal.hoursStudied.toFixed(1)}h / ${goal.subject.dailyGoalHours}h (${progress}%)\n`;
      });
      formattedContext += '\n';
    }

    if (context.weeklyStats) {
      formattedContext += '**THIS WEEK\'S STATS:**\n';
      formattedContext += `- Total Hours: ${context.weeklyStats.totalHours.toFixed(1)}h\n`;
      formattedContext += `- Sessions: ${context.weeklyStats.totalSessions}\n`;
      formattedContext += `- Active Days: ${context.weeklyStats.activeDays}/7\n\n`;
    }

    if (context.currentTime) {
      formattedContext += `**CURRENT TIME:** ${new Date(context.currentTime).toLocaleString()}\n\n`;
    }

    return formattedContext || 'No specific data available.';
  }

  /**
   * Routine memory persistence (localStorage)
   */
  getRoutineMemory() {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('routine_memory_v1') : null;
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  async updateRoutineMemory(routineData) {
    try {
      const current = this.getRoutineMemory();
      const updated = { ...current, ...routineData };
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('routine_memory_v1', JSON.stringify(updated));
      }
      return updated;
    } catch (e) {
      throw new Error('Failed to update routine memory');
    }
  }

  /**
   * Export all localStorage data as JSON string
   */
  exportData() {
    if (typeof localStorage === 'undefined') return null;
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      data[key] = localStorage.getItem(key);
    }
    return JSON.stringify(data, null, 2);
  }

  // Import data from JSON string into localStorage
  importData(jsonString) {
    if (typeof localStorage === 'undefined') return;
    try {
      const data = JSON.parse(jsonString);
      for (const key in data) {
        localStorage.setItem(key, data[key]);
      }
    } catch (e) {
      throw new Error('Invalid JSON data for import');
    }
  }

  // Clear all localStorage data (use with caution)
  clearData() {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  }

  /**
   * Analyze productivity patterns
   */
  async analyzeProductivity(subjects, studySessions, dailyGoals, classSchedule) {
    const context = {
      subjects,
      studySessions,
      dailyGoals,
      classSchedule,
      currentTime: new Date().toISOString()
    };

    const prompt = `Analyze my current productivity patterns and provide insights on:
1. My strongest and weakest study areas
2. Patterns in my study habits (time of day, consistency, etc.)
3. Areas where I'm exceeding or falling short of my goals
4. Specific recommendations for improvement
5. What I should prioritize this week`;

    return await this.generateResponse(prompt, context);
  }

  /**
   * Plan daily schedule
   */
  async planDay(subjects, studySessions, dailyGoals, classSchedule, preferences = {}) {
    const context = {
      subjects,
      studySessions,
      dailyGoals,
      classSchedule,
      currentTime: new Date().toISOString(),
      preferences
    };

    const prompt = `Create a personalized daily study plan for today based on my current progress and goals. I have the following classes today: ${JSON.stringify(classSchedule)}. Please schedule my study sessions in my free hours and do not overlap with my classes. Include:
1. Specific time blocks for each subject
2. Priority order based on my goals and deadlines
3. Recommended break intervals
4. Tasks I should focus on for each subject
5. Adjustment suggestions based on my recent performance`;

    return await this.generateResponse(prompt, context);
  }

  /**
   * Generate learning roadmap
   */
  async generateRoadmap(subject, currentLevel, targetLevel, timeframe) {
    const context = {
      currentTime: new Date().toISOString()
    };

    const prompt = `Create a detailed learning roadmap for ${subject}. 
Current Level: ${currentLevel}
Target Level: ${targetLevel}
Timeframe: ${timeframe}

Please provide a comprehensive roadmap with the following structured format:

1. GOAL CLARIFICATION
   - What achieving the target level means in practical terms
   - Key skills and knowledge that will be gained

2. LEARNING PHASES
   For each phase, provide:
   - Phase title (e.g., "Phase 1: Foundations")
   - Duration estimate
   - Key objectives
   - Milestones to track progress
   - List of specific tasks to complete (start each task with "- ")
   - Resources and materials for this phase

3. WEEKLY/MONTHLY BREAKDOWN
   - Week-by-week or month-by-month objectives
   - Practice exercises and projects
   - Time allocation suggestions (hours per week)

4. CORE TOPICS AND SKILLS
   - Topic name
   - Brief description
   - Estimated time to master
   - Difficulty level
   - Prerequisites

5. RESOURCES AND MATERIALS
   - Recommended books, courses, tutorials
   - Practice platforms and tools
   - Communities and forums for support
   - Documentation and reference materials

6. PRACTICAL APPLICATION
   - Hands-on projects to build
   - Real-world applications of the skills
   - Portfolio-building opportunities

7. ASSESSMENT AND PROGRESS TRACKING
   - Ways to test knowledge and skills
   - Checkpoints to evaluate progress
   - Criteria for moving to the next phase

8. POTENTIAL CHALLENGES AND SOLUTIONS
   - Common obstacles learners face
   - Strategies to overcome difficulties
   - Tips for staying motivated

Format your response with clear numbered headings and bullet points. Start each task with "- " for easy parsing.`;

    return await this.generateResponse(prompt, context);
  }

  isConfigured(provider = this.currentProvider) {
    if (provider === 'gemini') {
      return !!this.geminiApiKey;
    }
    return false;
  }

  async testConnection(provider = null) {
    const providerToTest = provider || this.currentProvider;
    const model = this.currentModel[providerToTest];

    if (!this.isConfigured(providerToTest)) {
      return { success: false, message: `API key for ${providerToTest} is not set.` };
    }

    try {
      let response;
      if (providerToTest === 'gemini') {
        const url = `${this.baseUrls.gemini}/${model}:generateContent?key=${this.geminiApiKey}`;
        response = await axios.post(url, {
          contents: [{ parts: [{ text: 'Hello' }] }]
        });
      }

      if (response.status === 200) {
        return { success: true, message: `Successfully connected to ${providerToTest} with model ${model}.` };
      } else {
        return { success: false, message: `Connection test failed for ${providerToTest} with status: ${response.status}.` };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      return { success: false, message: `Connection error for ${providerToTest}: ${errorMessage}`, error };
    }
  }
  async generateSubjectWithSubtopics(subjectName, description, level, timeframe) {
    const context = { currentTime: new Date().toISOString() };
    const prompt = `
    Analyze the following request and generate a structured learning plan for a subject. The output must be a JSON object with a "subtopics" array.

    **Subject:** ${subjectName}
    **Description:** ${description}
    **Current Level:** ${level}
    **Timeframe:** ${timeframe}

    **Instructions:**
    1.  Create a list of 5-10 main subtopics for this subject.
    2.  For each subtopic, provide a brief, one-sentence description.
    3.  The final output must be a single JSON object containing only the "subtopics" array.

    **JSON Structure Example:**
    {
      "subtopics": [
        { "name": "Subtopic 1", "description": "A brief description." },
        { "name": "Subtopic 2", "description": "Another brief description." }
      ]
    }
    `;

    const response = await this.generateResponse(prompt, context);
    return response;
  }

  async getTimetableObservations(schedule) {
    const prompt = `
      Analyze the following class schedule and provide a brief, human-readable summary of the user's weekly schedule. 
      The summary should highlight the busiest days and any large gaps between classes.

      Schedule:
      ${JSON.stringify(schedule, null, 2)}
    `;

    return await this.generateResponse(prompt);
  }

  async extractTimetable(imageDataUrl) {
    const prompt = `
      You are an extremely accurate AI designed to extract structured data from images. Your primary goal is to precisely extract class schedules from timetable images.

      Analyze the following timetable image with high accuracy and extract the class schedule. The output must be a JSON array of objects, where each object represents a single class session.

      **Instructions:**
      1. Carefully identify each class, its subject, the day of the week, the start time, and the end time.
      2. Pay close attention to the structure of the table, including merged cells.
      3. Handle different time formats (e.g., 10am, 14:30) and convert them to HH:MM format (24-hour clock).
      4. If a class occurs on multiple days at the same time, create a separate JSON object for each day.
      5. The final output must be only the JSON array, with no other text before or after it.

      **JSON Structure Example:**
      [
        { "subject": "Mathematics 101", "day": "Monday", "startTime": "10:00", "endTime": "11:00" },
        { "subject": "History of Art", "day": "Tuesday", "startTime": "14:30", "endTime": "16:00" },
        { "subject": "History of Art", "day": "Thursday", "startTime": "14:30", "endTime": "16:00" }
      ]
    `;

    const response = await this.generateResponse(prompt, {}, imageDataUrl);
    try {
      const jsonString = response.substring(response.indexOf('['), response.lastIndexOf(']') + 1);
      const schedule = JSON.parse(jsonString);
      return schedule;
    } catch (e) {
      console.error('Error parsing timetable from AI response:', e);
      return [];
    }
  }

  extractSubtopicsFromStructure(structure) {
    try {
      // Clean the response to extract only the JSON part
      const jsonString = structure.substring(structure.indexOf('{'), structure.lastIndexOf('}') + 1);
      const parsed = JSON.parse(jsonString);
      if (parsed.subtopics && Array.isArray(parsed.subtopics)) {
        return parsed.subtopics;
      }
      return [];
    } catch (error) {
      console.error('Error parsing subtopics from AI structure:', error);
      return [];
    }
  }

  extractRoadmapFromStructure(roadmapText) {
    const phases = [];
    const lines = roadmapText.split('\n');
    let currentPhase = null;

    for (const line of lines) {
        if (line.match(/^\d+\.\s+LEARNING PHASES/)) continue;
        if (line.match(/^\s*Phase \d+:/)) {
            if (currentPhase) phases.push(currentPhase);
            const name = line.replace(/^\s*Phase \d+:\s*/, '').trim();
            currentPhase = {
                id: `phase-${Date.now()}-${phases.length}`,
                name: name,
                tasks: []
            };
        } else if (currentPhase && line.match(/^\s*-\s+/)) {
            currentPhase.tasks.push({
                id: `task-${Date.now()}-${currentPhase.tasks.length}`,
                name: line.replace(/^\s*-\s*/, '').trim(),
                completed: false
            });
        }
    }
    if (currentPhase) phases.push(currentPhase);

    return phases;
}


  async getRecommendations(subjects, studySessions, dailyGoals, classSchedule) {
    const context = {
      subjects,
      studySessions,
      dailyGoals,
      classSchedule,
      currentTime: new Date().toISOString()
    };

    const prompt = `Based on my current study data, provide 3-5 actionable recommendations to improve my learning effectiveness. Focus on:
1. Time management and scheduling
2. Subject focus and balance
3. Goal adjustments
4. Potential burnout risks

Format the output as a JSON array of strings. For example: ["Recommendation 1", "Recommendation 2"]`;

    const response = await this.generateResponse(prompt, context);

    try {
      // Attempt to parse the response as JSON
      const recommendations = JSON.parse(response);
      return Array.isArray(recommendations) ? recommendations : [response];
    } catch (e) {
      // If parsing fails, return the raw response split by newlines
      return response.split('\n').filter(r => r.trim().length > 0 && isNaN(r.charAt(0)));
    }
  }

  getCurrentModel(provider = this.currentProvider) {
    return this.currentModel[provider];
  }
}

const aiService = new AIService();
export default aiService;