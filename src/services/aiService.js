import axios from 'axios';

class AIService {
  constructor() {
    console.log("AIService constructor called, initializing...");
    this.geminiApiKey = null;
    this.groqApiKey = null;
    this.currentProvider = 'gemini'; // 'gemini' or 'groq'
    this.currentModel = {
      gemini: 'gemini-2.5-flash-lite',
      groq: 'llama3-8b-8192'
    };
    this.baseUrls = {
      gemini: 'https://generativelanguage.googleapis.com/v1beta/models',
      groq: 'https://api.groq.com/openai/v1/chat/completions'
    };
    this.availableModels = {
      gemini: [
        // Gemini Pro family
        { id: 'gemini-pro', name: 'Gemini Pro', description: 'Best for text generation and analysis' },
        { id: 'gemini-pro-vision', name: 'Gemini Pro Vision', description: 'Supports text and images' },
        // Gemini 1.5 family
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Latest and most capable model' },
        { id: 'gemini-1.5-pro-vision', name: 'Gemini 1.5 Pro Vision', description: 'Latest with vision capabilities' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Faster responses, optimized for speed' },
        { id: 'gemini-1.5-flash-vision', name: 'Gemini 1.5 Flash Vision', description: 'Fast responses with image support' },
        { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash 8B', description: 'Smaller 8B Flash model' },
        // Gemini 2.0 family
        { id: 'gemini-2.0-pro', name: 'Gemini 2.0 Pro', description: '2.0 Pro general model' },
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: '2.0 Flash for low-latency workloads' },
        { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', description: 'Lightweight 2.0 Flash (preview)' },
        { id: 'gemini-2.0-pro-exp', name: 'Gemini 2.0 Pro Experimental', description: 'Experimental Pro (preview)' },
        { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Experimental', description: 'Experimental Flash (preview)' },
        // Gemini 2.5 family
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Low-latency, high-volume tasks; latest 2.5 Flash' },
        { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', description: 'Lightweight 2.5 Flash model' },
      ],
      groq: [
        { id: 'llama3-8b-8192', name: 'Llama 3 8B', description: 'Fast and efficient for most tasks' },
      ]
    };
  }

  async generateComprehensiveTaskList(subjectName, level, timeframe, context = {}) {
    const notesContext = context.notes ? `\n\n**User Notes:**\n${context.notes}` : '';
    const extractedTextContext = context.extractedText ? `\n\n**Extracted Text from Files:**\n${context.extractedText}` : '';

    const prompt = `
      Create a comprehensive, structured list of **Topics** for learning **${subjectName}**.
      - **Current Level:** ${level}
      - **Target Timeframe:** ${timeframe}
      ${notesContext}
      ${extractedTextContext}

      **Instructions:**
      1.  Generate a list of 10-15 high-level **Topics** in a logical, sequential order.
      2.  The topics should cover all the key concepts of the subject, from beginner to advanced.
      3.  **CRITICAL:** If "User Notes" or "Extracted Text" are provided, you **MUST** prioritize generating topics that cover the content found in those notes/text.
      4.  For each topic, provide an estimated time in minutes for completion.
      5.  The output must be a simple list of topics, each on a new line, formatted as: 'Topic Name (Estimated Minutes: MM)'.

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
    const lines = response.split('\\n');

    for (const line of lines) {
      const trimmedLine = line.replace(/^-/, '').trim();
      const match = trimmedLine.match(/(.+?)\\s*\\(Estimated Minutes:\\s*(\\d+)\\)/);

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
    // Set Gemini model as requested
    if (provider === 'gemini' && this.availableModels[provider]?.find(m => m.id === modelId)) {
      this.currentModel[provider] = modelId;
      console.log(`AI model for ${provider} set to: ${modelId}`);
    } else if (this.availableModels[provider]?.find(m => m.id === modelId)) {
      this.currentModel[provider] = modelId;
      console.log(`AI model for ${provider} set to: ${modelId}`);
    } else {
      console.error(`Model ${modelId} is not available for provider ${provider}.`);
    }
  }

  // Set API keys for Gemini and Groq
  setApiKeys({ geminiApiKey, groqApiKey }) {
    if (geminiApiKey !== undefined) this.geminiApiKey = geminiApiKey;
    if (groqApiKey !== undefined) this.groqApiKey = groqApiKey;
  }

  setProvider(provider) {
    this.currentProvider = provider;
  }

  getAvailableModels(provider = this.currentProvider) {
    return this.availableModels[provider] || [];
  }

  async generateResponse(prompt, context = {}) {
    if (this.currentProvider === 'gemini') {
      return this.callGemini(prompt, context);
    } else if (this.currentProvider === 'groq') {
      return this.callGroq(prompt, context);
    }
    throw new Error('Invalid AI provider selected');
  }

  // Generate test questions from completed tasks
  async generateTestQuestions(subjectName, completedTaskNames, numQuestions = 5, difficulty = 'medium', questionType = 'both', context = {}) {
    // Use Gemini 2.5 Flash for test generation
    this.setModel('gemini', 'gemini-2.5-flash');
    const prompt = `Generate a short test (${numQuestions} questions, difficulty: ${difficulty}, type: ${questionType}) for the subject '${subjectName}'. Only use these completed topics: ${completedTaskNames.join(", ")}. Questions can be MCQs or open-ended. For MCQs, provide options and mark the correct one. For open-ended, just ask the question. Return as JSON: [{id, text, type, options?}].`;
    const response = await this.generateResponse(prompt, context);
    // Try to parse JSON
    try {
      const questions = JSON.parse(response);
      return questions;
    } catch {
      // Fallback: return empty array
      return [];
    }
  }
  async checkTestAnswers(subjectName, questions, answers) {
    const prompt = `
    You are an AI testing assistant. Evaluate the user's answers for a test on "${subjectName}".

    **Questions:**
    ${JSON.stringify(questions, null, 2)}

    **User's Answers:**
    ${JSON.stringify(answers, null, 2)}

    **Instructions:**
    1.  For each question, determine if the user's answer is correct.
    2.  Provide a brief, one-sentence explanation for any incorrect answers.
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

    try {
      // Clean the response to extract only the JSON part
      const jsonString = response.substring(response.indexOf('{'), response.lastIndexOf('}') + 1);
      const results = JSON.parse(jsonString);
      return results;
    } catch (e) {
      // Fallback for non-JSON responses
      return {
        answers: questions.map(() => ({ correct: false, explanation: "Could not parse AI response." })),
        mastery: 'Unknown'
      };
    }
  }


  async callGemini(prompt, context) {
    const model = this.currentModel.gemini;
    const url = `${this.baseUrls.gemini}/${model}:generateContent?key=${this.geminiApiKey}`;

    try {
      const response = await axios.post(url, {
        contents: [{
          parts: [{
            text: this.buildPrompt(prompt, context)
          }]
        }]
      });

      if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return response.data.candidates[0].content.parts[0].text;
      }

      throw new Error(`Invalid or empty response from Gemini API (${model})`);

    } catch (error) {
      if (error.response) {
        const errorMessage = error.response.data?.error?.message || error.response.statusText;
        throw new Error(`Gemini API Error (${error.response.status}): ${errorMessage}`);
      } else if (error.request) {
        throw new Error('Network error: Unable to reach Gemini API. Please check your internet connection.');
      } else {
        throw error;
      }
    }
  }

  /**
   * Call Groq API
   */
  async callGroq(prompt, context) {
    const model = this.currentModel.groq;

    try {
      const response = await axios.post(
        this.baseUrls.groq,
        {
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are an intelligent productivity assistant for a study tracking app. Help users analyze their study patterns, plan their day, and provide roadmaps for learning.'
            },
            {
              role: 'user',
              content: this.buildPrompt(prompt, context)
            }
          ],
          temperature: 0.7,
          max_tokens: 2048,
          top_p: 1,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.groqApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data?.choices?.[0]?.message?.content) {
        return response.data.choices[0].message.content;
      }

      throw new Error(`Invalid or empty response from Groq API (${model})`);

    } catch (error) {
      if (error.response) {
        // API returned an error response
        const errorMessage = error.response.data?.error?.message || error.response.statusText;
        throw new Error(`Groq API Error (${error.response.status}): ${errorMessage}`);
      } else if (error.request) {
        // Network error
        throw new Error('Network error: Unable to reach Groq API. Please check your internet connection.');
      } else {
        // Other error
        throw error;
      }
    }
  }

  /**
   * Build comprehensive prompt with context
   */
  buildPrompt(userMessage, context) {
    const contextInfo = this.formatContext(context);
    const username = context.username || 'User';

    return `
You are ${username}'s personal AI productivity assistant for their study tracking application. You have access to all their study data and can provide intelligent insights.

CONTEXT DATA:
${contextInfo}

USER REQUEST: ${userMessage}

Based on ${username}'s data, please provide a helpful, personalized response. You can:
1. Analyze productivity patterns and trends
2. Suggest daily/weekly planning strategies
3. Create roadmaps for subjects or skills
4. Identify areas for improvement
5. Recommend optimal study schedules
6. Track goal achievement progress

Please be specific, actionable, and reference their actual data when relevant. Format your response clearly with headings and bullet points when appropriate.
    `.trim();
  }

  /**
   * Format context data for AI consumption
   */
  formatContext(context) {
    let formattedContext = '';

    if (context.subjects && context.subjects.length > 0) {
      formattedContext += '**SUBJECTS:**\n';
      context.subjects.forEach(subject => {
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
      formattedContext += '**RECENT STUDY SESSIONS:**\n';
      const recentSessions = context.studySessions.slice(-10); // Last 10 sessions
      recentSessions.forEach(session => {
        const subjectName = context.subjects?.find(s => s.id === session.subjectId)?.name || 'Unknown';
        formattedContext += `- ${subjectName}: ${Math.round(session.duration / 60)}h on ${new Date(session.date).toLocaleDateString()}\n`;
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
  async analyzeProductivity(subjects, studySessions, dailyGoals, classSchedule, context = {}) {
    // Use Gemini 2.5 Flash Lite for all other features
    this.setModel('gemini', 'gemini-2.5-flash-lite');
    const fullContext = {
      subjects,
      studySessions,
      dailyGoals,
      classSchedule,
      currentTime: new Date().toISOString(),
      ...context
    };

    const prompt = `Analyze my current productivity patterns and provide insights on:
1. My strongest and weakest study areas
2. Patterns in my study habits (time of day, consistency, etc.)
3. Areas where I'm exceeding or falling short of my goals
4. Specific recommendations for improvement
5. What I should prioritize this week`;

    return await this.generateResponse(prompt, fullContext);
  }

  /**
   * Plan daily schedule
   */
  async planDay(subjects, studySessions, dailyGoals, classSchedule, context = {}) {
    this.setModel('gemini', 'gemini-2.5-flash-lite');
    const fullContext = {
      subjects,
      studySessions,
      dailyGoals,
      classSchedule,
      currentTime: new Date().toISOString(),
      ...context
    };

    const prompt = `Create a personalized daily study plan for today based on my current progress and goals. Include:
1. Specific time blocks for each subject
2. Priority order based on my goals and deadlines
3. Recommended break intervals
4. Tasks I should focus on for each subject
5. Adjustment suggestions based on my recent performance`;

    return await this.generateResponse(prompt, fullContext);
  }

  /**
   * Generate learning roadmap
   */
  async generateRoadmap(subject, currentLevel, targetLevel, timeframe) {
    this.setModel('gemini', 'gemini-2.5-flash-lite');
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
    if (provider === 'groq') {
      return !!this.groqApiKey;
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
      } else if (providerToTest === 'groq') {
        response = await axios.post(
          this.baseUrls.groq,
          {
            model: model,
            messages: [{ role: 'user', content: 'Hello' }]
          },
          {
            headers: {
              'Authorization': `Bearer ${this.groqApiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );
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
  async generateSubjectWithSubtopics(subjectName, description, level, timeframe, context = {}) {
    this.setModel('gemini', 'gemini-2.5-flash-lite');
    const fullContext = {
      currentTime: new Date().toISOString(),
      ...context
    };
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

    const response = await this.generateResponse(prompt, fullContext);
    return response;
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


  async getRecommendations(subjects, studySessions, dailyGoals, classSchedule, context = {}) {
    this.setModel('gemini', 'gemini-2.5-flash-lite');
    const fullContext = {
      subjects,
      studySessions,
      dailyGoals,
      classSchedule,
      currentTime: new Date().toISOString(),
      ...context
    };

    const prompt = `Based on my current study data, provide 3-5 actionable recommendations to improve my learning effectiveness. Focus on:
1. Time management and scheduling
2. Subject focus and balance
3. Goal adjustments
4. Potential burnout risks

Format the output as a JSON array of strings. For example: ["Recommendation 1", "Recommendation 2"]`;

    const response = await this.generateResponse(prompt, fullContext);

    try {
      // Attempt to parse the response as JSON
      const recommendations = JSON.parse(response);
      return Array.isArray(recommendations) ? recommendations : [response];
    } catch (e) {
      // If parsing fails, return the raw response split by newlines
      return response.split('\n').filter(r => r.trim().length > 0 && isNaN(r.charAt(0)));
    }
  }

  async generateFlashcards(subjectName, notes, count = 5, context = {}) {
    this.setModel('gemini', 'gemini-2.5-flash-lite');
    const fullContext = {
      currentTime: new Date().toISOString(),
      ...context
    };

    const prompt = `
    Create ${count} study flashcards for the subject "${subjectName}" based on the following notes/content:

    "${notes.substring(0, 5000)}"

    Return the response as a JSON object with a "flashcards" array. Each item should have "front" (question/term) and "back" (answer/definition).

    Example JSON:
    {
      "flashcards": [
        { "front": "What is React?", "back": "A JavaScript library for building user interfaces." },
        { "front": "Explain JSX", "back": "A syntax extension for JavaScript that looks like XML." }
      ]
    }
    `;

    const response = await this.generateResponse(prompt, fullContext);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.flashcards || [];
      }
      return [];
    } catch (e) {
      console.error("Failed to parse flashcards", e);
      return [];
    }
  }

  async generateTutorResponse(question, pageContent, subjectName, context = {}) {
    this.setModel('gemini', 'gemini-2.5-flash-lite');
    const fullContext = {
      currentTime: new Date().toISOString(),
      ...context
    };

    const prompt = `
    You are an expert AI Tutor teaching "${subjectName}".
    The student is currently reading a page with the following content:
    
    """
    ${pageContent}
    """

    The student asks: "${question}"

    Please answer the question clearly and concisely, using the provided page content as your primary source. Explain concepts simply as if you are a friendly teacher. If the answer isn't in the page content, you can use your general knowledge but mention that it's outside the current page's scope.
    `;

    return await this.generateResponse(prompt, fullContext);
  }

  getCurrentModel(provider = this.currentProvider) {
    return this.currentModel[provider];
  }
}

const aiService = new AIService();
export default aiService;