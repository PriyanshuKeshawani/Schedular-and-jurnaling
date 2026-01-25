
export type Priority = 'Low' | 'Medium' | 'High';
export type MentalLoad = 'Low' | 'Medium' | 'High';
export type TimeOfDay = 'Morning' | 'Afternoon' | 'Evening' | 'Night';

export interface Task {
  id: string;
  title: string;
  category: string;
  estimated_time_minutes: number;
  mental_load: MentalLoad;
  priority: Priority;
  preferred_time: TimeOfDay;
  deadline?: string; // ISO string YYYY-MM-DD
  completed: boolean; // Current logical day status
  scheduled_start?: string; // HH:MM
  subtasks?: string[];
  notes?: string;
  // Alarm Features
  isAlarmEnabled?: boolean;
  alarmTime?: string; // HH:MM
  alarmSound?: string; // Data URL or URL for specific task
  alarmSoundName?: string; // Name of the custom audio file
  // History & Routine Features
  completion_history?: Record<string, boolean>; // Map of YYYY-MM-DD -> completion_status
  frequency?: 'Once' | 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
  created_at?: string; // ISO
}

export interface JournalEntry {
  id: string;
  date: string; // ISO Date YYYY-MM-DD
  content: string;
  mood?: string;
  ai_reflection?: string;
  tags?: string[];
  last_updated: number;
}

export type BackgroundEffectType = 'none' | 'snow' | 'rain' | 'embers' | 'matrix' | 'breathe';

export interface UIPreference {
  themeName: string;
  backgroundImage: string;
  backgroundType: 'image' | 'video';
  backgroundEffect: BackgroundEffectType;
  blurIntensity: number; // px
  transparency: number; // 0.0 to 1.0
  backgroundBrightness: number; // 0 to 100 (0 = black, 100 = white)
  accentColor: string;
  animationSpeed: 'slow' | 'normal' | 'fast';
  defaultAlarmSound?: string; // Data URL or URL for global default
  defaultAlarmSoundName?: string; // Name of the custom audio file
  language?: string; // Preferred language (e.g. "English", "Hinglish", "Spanish")
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: number;
}

export interface AIScheduleResponse {
  rationale: string;
  tasks: Task[];
  rescheduled_tasks: string[]; // IDs of tasks moved to tomorrow
}

export interface UITaskParsed {
  title: string;
  category: string;
  estimated_time_minutes: number;
  mental_load: MentalLoad;
  priority: Priority;
  preferred_time: TimeOfDay;
  deadline?: string;
  subtasks?: string[];
  notes?: string;
  frequency?: 'Once' | 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
}

export interface UICommandResponse {
  type: 'ui_update' | 'task_update' | 'chat' | 'routine_creation';
  description: string;
  uiConfig?: Partial<UIPreference>;
  tasksToCreate?: UITaskParsed[];
}

export interface TranslationDictionary {
  newTask: string;
  newEntry: string;
  dashboard: string;
  schedule: string;
  journal: string;
  history: string;
  settings: string;
  commandCenter: string;
  yourAgenda: string;
  personalJournal: string;
  taskHistory: string;
  overview: string;
  journalSubtitle: string;
  historySubtitle: string;
  allClear: string;
  optimizeDay: string;
  analyzing: string;
  save: string;
  cancel: string;
  applyTheme: string;
  morning: string;
  afternoon: string;
  evening: string;
  night: string;
  completed: string;
  subtasks: string;
  notes: string;
  alarm: string;
  completionRate: string;
  focusTime: string;
  highLoadTasks: string;
  dailyReflection: string;
  generateInsights: string;
  uiCustomization: string;
  themeName: string;
  aiLanguage: string;
  backgroundMedia: string;
  defaultAlarm: string;
  atmosphericEffect: string;
  blur: string;
  opacity: string;
  brightness: string;
  accentColor: string;
  motionSpeed: string;
  nexusAssistant: string;
  askNexus: string;
}
