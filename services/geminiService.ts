
import { GoogleGenAI, Type } from "@google/genai";
import { Task, UITaskParsed, UIPreference, AIScheduleResponse, TranslationDictionary, Priority, MentalLoad, TimeOfDay } from "../types";

const modelFlash = 'gemini-2.5-flash';
const modelPro = 'gemini-2.5-flash'; // Downgrading to Flash to avoid Pro quota limits

/**
 * Normalizes and validates raw task data from AI to ensure it meets our internal schema.
 */
export const normalizeTaskData = (raw: any): UITaskParsed | null => {
  if (!raw || typeof raw.title !== 'string' || !raw.title.trim()) {
    return null;
  }

  const validPriorities: Priority[] = ['Low', 'Medium', 'High'];
  const validLoads: MentalLoad[] = ['Low', 'Medium', 'High'];
  const validTimes: TimeOfDay[] = ['Morning', 'Afternoon', 'Evening', 'Night'];

  return {
    title: raw.title.trim().substring(0, 200),
    category: typeof raw.category === 'string' ? raw.category : 'General',
    estimated_time_minutes: Math.max(1, Math.min(1440, parseInt(raw.estimated_time_minutes) || 30)),
    mental_load: validLoads.includes(raw.mental_load) ? raw.mental_load : 'Medium',
    priority: validPriorities.includes(raw.priority) ? raw.priority : 'Medium',
    preferred_time: validTimes.includes(raw.preferred_time) ? raw.preferred_time : 'Morning',
    deadline: typeof raw.deadline === 'string' ? raw.deadline : undefined,
    subtasks: Array.isArray(raw.subtasks) ? raw.subtasks.filter((s: any) => typeof s === 'string' && s.length > 0) : [],
    notes: typeof raw.notes === 'string' ? raw.notes.substring(0, 1000) : undefined,
    frequency: ['Once', 'Daily', 'Weekly', 'Monthly', 'Yearly'].includes(raw.frequency) ? raw.frequency : 'Once'
  };
};

export const parseTaskInput = async (input: string, language: string = 'English'): Promise<UITaskParsed> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: modelFlash,
      contents: `Extract task details from: "${input}". Language: ${language}.
      Infer load, duration (default 30m), priority, and frequency (Once, Daily, Weekly, Monthly, Yearly).
      Return JSON only.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            category: { type: Type.STRING },
            estimated_time_minutes: { type: Type.INTEGER },
            mental_load: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
            priority: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
            preferred_time: { type: Type.STRING, enum: ['Morning', 'Afternoon', 'Evening', 'Night'] },
            deadline: { type: Type.STRING },
            subtasks: { type: Type.ARRAY, items: { type: Type.STRING } },
            notes: { type: Type.STRING },
            frequency: { type: Type.STRING, enum: ['Once', 'Daily', 'Weekly', 'Monthly', 'Yearly'] }
          },
          required: ['title', 'category', 'estimated_time_minutes', 'mental_load', 'priority', 'preferred_time']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    const normalized = normalizeTaskData(parsed);
    if (!normalized) throw new Error("Validation failed for extracted task");
    return normalized;
  } catch (e) {
    console.error("[Gemini] Task parsing error", e);
    throw e;
  }
};

export const interpretCommand = async (command: string, currentTasks: Task[], language: string = 'English'): Promise<{
  actionType: 'ui' | 'task' | 'chat' | 'routine_creation';
  uiChange?: Partial<UIPreference>;
  tasksToCreate?: (UITaskParsed & { scheduled_start?: string })[];
  reply: string;
}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const now = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDayName = dayNames[now.getDay()];
  const currentDateISO = now.toISOString().split('T')[0];

  try {
    const response = await ai.models.generateContent({
      model: modelPro,
      contents: `
        User Command: "${command}"
        Today's Reference: ${currentDateISO} (${currentDayName})
        Language: ${language}.

        Intent Detection Rules:
        - 'routine_creation': Triggered when the user provides a TIMETABLE (daily/weekly), a structured schedule, or a bulk task list.
           * BULK PARSING: If the user pastes a weekly schedule (e.g., "Mon: ..., Tue: ..."), generate INDEPENDENT tasks for EACH day mention.
           * DATE CALCULATION: Map relative days (Today, Tomorrow, Wednesday) to their next occurring date starting from today (${currentDateISO}).
           * TIME CLASSIFICATION: 
             - Morning: 04:00 - 11:59
             - Afternoon: 12:00 - 16:59
             - Evening: 17:00 - 20:59
             - Night: 21:00 - 03:59
           * TIME EXTRACTION: Extract precise start times (HH:MM 24h format).
           * INDEPENDENCE: Each generated task MUST be a separate object in 'tasksToCreate'. Set 'frequency' to 'Once' for specific dated tasks.
           * EXCLUSIVITY: Tasks created for future dates must have the calculated 'deadline' (YYYY-MM-DD).
        - 'ui': Visual theme changes.
        - 'chat': General assistant feedback.

        Response Format: JSON only.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            actionType: { type: Type.STRING, enum: ['ui', 'task', 'chat', 'routine_creation'] },
            reply: { type: Type.STRING },
            tasksToCreate: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  category: { type: Type.STRING },
                  estimated_time_minutes: { type: Type.INTEGER },
                  mental_load: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
                  priority: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
                  preferred_time: { type: Type.STRING, enum: ['Morning', 'Afternoon', 'Evening', 'Night'] },
                  scheduled_start: { type: Type.STRING, description: "HH:MM 24h format" },
                  deadline: { type: Type.STRING, description: "YYYY-MM-DD format for specific date" },
                  notes: { type: Type.STRING },
                  frequency: { type: Type.STRING, enum: ['Once', 'Daily', 'Weekly', 'Monthly', 'Yearly'] },
                  subtasks: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['title', 'category', 'estimated_time_minutes']
              }
            },
            uiChange: {
              type: Type.OBJECT,
              properties: {
                backgroundImage: { type: Type.STRING },
                backgroundEffect: { type: Type.STRING, enum: ['none', 'snow', 'rain', 'embers', 'matrix', 'breathe'] },
                accentColor: { type: Type.STRING },
                blurIntensity: { type: Type.NUMBER },
                transparency: { type: Type.NUMBER },
                backgroundBrightness: { type: Type.NUMBER }
              }
            }
          },
          required: ['actionType', 'reply']
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    
    if (result.tasksToCreate) {
      result.tasksToCreate = result.tasksToCreate
        .map((t: any) => {
            const normalized = normalizeTaskData(t);
            if (!normalized) return null;
            return { ...normalized, scheduled_start: t.scheduled_start, deadline: t.deadline };
        })
        .filter((t: any) => t !== null);
    }

    return result;
  } catch (e) {
    console.error("[Gemini] Command interpretation error", e);
    return { actionType: 'chat', reply: "I encountered a processing issue with that schedule. Could you try providing it in smaller sections or clarify the dates?" };
  }
};

export const generateSchedule = async (tasks: Task[], language: string = 'English'): Promise<AIScheduleResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const taskData = JSON.stringify(tasks.map(t => ({ id: t.id, title: t.title, load: t.mental_load, time: t.estimated_time_minutes, priority: t.priority })));
    const prompt = `Planner for ${language}. Current tasks: ${taskData}. 
    Suggest start times (HH:MM) for these tasks to maximize productivity. Return JSON.`;
    
    const response = await ai.models.generateContent({
      model: modelPro,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rationale: { type: Type.STRING },
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  scheduled_start: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{"rationale": "No updates suggested.", "tasks": []}');
    const updatedTasks = tasks.map(t => {
      const suggestion = result.tasks?.find((st: any) => st.id === t.id);
      const timeMatch = suggestion?.scheduled_start?.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/);
      return (suggestion && timeMatch) ? { ...t, scheduled_start: suggestion.scheduled_start } : t;
    });

    return { rationale: result.rationale || "Plan optimized.", tasks: updatedTasks, rescheduled_tasks: [] };
  } catch (e) {
    console.error("[Gemini] Scheduling error", e);
    return { rationale: "Scheduling offline.", tasks, rescheduled_tasks: [] };
  }
};

export const generateReflection = async (tasks: Task[], language: string = 'English'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const taskData = JSON.stringify(tasks.map(t => ({ title: t.title, completed: t.completed })));
  const response = await ai.models.generateContent({
      model: modelPro,
      contents: `Analyze performance for ${language}: ${taskData}. Provide a 1-2 sentence reflection.`,
  });
  return response.text || "Every action creates your future.";
};

export const analyzeJournalEntry = async (content: string, language: string = 'English'): Promise<{ mood: string, reflection: string, tags: string[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: modelPro,
    contents: `Analyze this journal entry in ${language}: "${content}".`,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          mood: { type: Type.STRING },
          reflection: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["mood", "reflection", "tags"]
      }
    }
  });
  return JSON.parse(response.text || '{"mood": "Neutral", "reflection": "", "tags": []}');
};

export const validateAndTranslateUI = async (targetLanguage: string, baseDictionary: TranslationDictionary): Promise<{ isValid: boolean; translations?: TranslationDictionary }> => {
  if (targetLanguage.toLowerCase() === 'english') return { isValid: true, translations: baseDictionary };
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
      model: modelFlash,
      contents: `Translate UI labels to ${targetLanguage}. Labels: ${JSON.stringify(baseDictionary)}`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: Object.keys(baseDictionary).reduce((acc: any, key) => {
            acc[key] = { type: Type.STRING };
            return acc;
          }, {}),
          required: Object.keys(baseDictionary)
        }
      }
  });
  return { isValid: true, translations: JSON.parse(response.text || '{}') };
};
