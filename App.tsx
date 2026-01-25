import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Menu, Mic, Send, Sparkles, Layout, Settings, 
  Calendar, BarChart2, CheckSquare, Play, RefreshCw, MessageCircle, X, Plus, Book, BellRing, Square, LogOut, History,
  Cpu, Activity, Zap, Dumbbell, Briefcase, Coffee, Heart, Code
} from 'lucide-react';
import { supabase } from './services/supabaseClient';
import { Auth } from './components/Auth';
import { Task, UIPreference, ChatMessage, Priority, MentalLoad, TimeOfDay, JournalEntry, TranslationDictionary } from './types';
import { parseTaskInput, generateSchedule, interpretCommand, generateReflection, validateAndTranslateUI, normalizeTaskData } from './services/geminiService';
import { GlassCard } from './components/GlassCard';
import { TaskList } from './components/TaskList';
import { AnalyticsView } from './components/AnalyticsView';
import { JournalView } from './components/JournalView';
import { HistoryView } from './components/HistoryView';
import { EditTaskModal } from './components/EditTaskModal';
import { SettingsModal } from './components/SettingsModal';
import { BackgroundEffects } from './components/BackgroundEffects';

const INITIAL_UI: UIPreference = {
  themeName: 'Nexus Default',
  backgroundImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop',
  backgroundType: 'image',
  backgroundEffect: 'breathe',
  blurIntensity: 12,
  transparency: 0.15,
  backgroundBrightness: 35,
  accentColor: '#6366f1',
  animationSpeed: 'normal',
  language: 'English'
};

const DEFAULT_TRANSLATIONS: TranslationDictionary = {
  newTask: 'New Task',
  newEntry: 'New Entry',
  dashboard: 'Dashboard',
  schedule: 'Planner',
  journal: 'Journal',
  history: 'Timeline',
  settings: 'Settings',
  commandCenter: 'Command Center',
  yourAgenda: 'Your Agenda',
  personalJournal: 'Personal Journal',
  taskHistory: 'Timeline Records',
  overview: 'Daily Overview',
  journalSubtitle: 'Record thoughts and let AI reflect.',
  historySubtitle: 'Strategic logs and future planning.',
  allClear: 'All clear. Enjoy the void.',
  optimizeDay: 'Optimize Flow',
  analyzing: 'Analyzing...',
  save: 'Save',
  cancel: 'Cancel',
  applyTheme: 'Sync Theme',
  morning: 'Morning Phase',
  afternoon: 'Midday Phase',
  evening: 'Sunset Phase',
  night: 'Night Phase',
  completed: 'Archived',
  subtasks: 'Subtasks',
  notes: 'Intel',
  alarm: 'Neuro-Alert',
  completionRate: 'Success Rate',
  focusTime: 'Cognitive Load',
  highLoadTasks: 'Peak Challenges',
  dailyReflection: 'Neural Reflection',
  generateInsights: 'Generate Insights',
  uiCustomization: 'Interface Core',
  themeName: 'Identity',
  aiLanguage: 'Linguistics',
  backgroundMedia: 'Environment',
  defaultAlarm: 'Audio Cue',
  atmosphericEffect: 'Atmospheric FX',
  blur: 'Diffusion',
  opacity: 'Opacity',
  brightness: 'Luminance',
  accentColor: 'Core Color',
  motionSpeed: 'Temporal Speed',
  nexusAssistant: 'Nexus Core',
  askNexus: 'Input command...',
};

const EMPTY_TASK: Task = {
  id: 'new',
  title: '',
  category: 'General',
  estimated_time_minutes: 30,
  mental_load: 'Medium',
  priority: 'Medium',
  preferred_time: 'Morning',
  completed: false,
  completion_history: {}
};

const getProductivityDate = (date: Date = new Date()): string => {
  const d = new Date(date);
  if (d.getHours() < 4) {
    d.setDate(d.getDate() - 1);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const mapTaskToDb = (t: Task, userId: string) => ({
  id: t.id,
  user_id: userId,
  title: t.title || 'Untitled Task',
  category: t.category || 'General',
  estimated_time_minutes: t.estimated_time_minutes || 30,
  mental_load: t.mental_load || 'Medium',
  priority: t.priority || 'Medium',
  preferred_time: t.preferred_time || 'Morning',
  deadline: t.deadline || null,
  completed: t.completed || false,
  scheduled_start: t.scheduled_start || null,
  subtasks: t.subtasks || [],
  notes: t.notes || null,
  is_alarm_enabled: t.isAlarmEnabled || false,
  alarm_time: t.alarmTime || null,
  alarm_sound: t.alarmSound || null,
  alarm_sound_name: t.alarmSoundName || null,
  completion_history: t.completion_history || {},
  frequency: t.frequency || 'Once',
  created_at: t.created_at || new Date().toISOString()
});

const mapTaskFromDb = (d: any): Task => {
  const pDate = getProductivityDate();
  return {
    id: d.id,
    title: d.title,
    category: d.category,
    estimated_time_minutes: d.estimated_time_minutes,
    mental_load: d.mental_load,
    priority: d.priority,
    preferred_time: d.preferred_time,
    deadline: d.deadline,
    completed: !!d.completion_history?.[pDate],
    scheduled_start: d.scheduled_start,
    subtasks: d.subtasks,
    notes: d.notes,
    isAlarmEnabled: d.is_alarm_enabled,
    alarmTime: d.alarm_time,
    alarmSound: d.alarm_sound,
    alarmSoundName: d.alarm_sound_name,
    completion_history: d.completion_history || {},
    frequency: d.frequency || 'Once',
    created_at: d.created_at
  };
};

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [uiConfig, setUiConfig] = useState<UIPreference>(INITIAL_UI);
  const [translations, setTranslations] = useState<TranslationDictionary>(DEFAULT_TRANSLATIONS);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: '0', role: 'ai', content: 'Nexus Core online. Identity verified. Awaiting command parameters.', timestamp: Date.now() }]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'journal' | 'history'>('dashboard');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const [isReflecting, setIsReflecting] = useState(false);
  const [sysStatus, setSysStatus] = useState('Active');
  
  const latestUiConfig = useRef(uiConfig);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    latestUiConfig.current = uiConfig;
  }, [uiConfig]);

  useEffect(() => {
    if (uiConfig.backgroundImage === '(Local Data Asset)') {
      const localBg = localStorage.getItem('nexus_bg_data');
      if (localBg) {
        setUiConfig(prev => ({ ...prev, backgroundImage: localBg }));
      } else {
        setUiConfig(prev => ({ ...prev, backgroundImage: INITIAL_UI.backgroundImage }));
      }
    }
  }, [uiConfig.backgroundImage]);

  useEffect(() => {
    const lang = uiConfig.language?.toLowerCase() || 'english';
    if (lang !== 'english') {
      const translateUI = async () => {
        setSysStatus('Processing Linguistics');
        try {
          const result = await validateAndTranslateUI(uiConfig.language!, DEFAULT_TRANSLATIONS);
          if (result.translations) {
            setTranslations({ ...DEFAULT_TRANSLATIONS, ...result.translations });
          }
        } catch (e) {
          console.error("Translation failed, falling back to English", e);
          setTranslations(DEFAULT_TRANSLATIONS);
        } finally {
          setSysStatus('Active');
        }
      };
      translateUI();
    } else {
      setTranslations(DEFAULT_TRANSLATIONS);
    }
  }, [uiConfig.language]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isProcessing]);

  useEffect(() => {
    let mounted = true;
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) setSession(session);
      } catch (err) { console.warn("[Nexus] Offline Mode Initiated"); } finally { if (mounted) setLoadingAuth(false); }
    };
    initAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { if (mounted) setSession(session); });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!session) return;
    const loadData = async () => {
      try {
        const { data: taskData } = await supabase.from('tasks').select('*');
        if (taskData) setTasks(taskData.map(mapTaskFromDb));
        
        const { data: journalData } = await supabase.from('journal_entries').select('*');
        if (journalData) setJournals(journalData.map((j: any) => ({...j, tags: j.tags || []})));
        
        const { data: prefData } = await supabase.from('user_preferences').select('config').single();
        
        const localBg = localStorage.getItem('nexus_bg_data');
        const localAlarm = localStorage.getItem('nexus_alarm_data');
        
        if (prefData?.config) {
          const mergedConfig = { ...prefData.config };
          const isPlaceholder = mergedConfig.backgroundImage === '(Local Data Asset)';
          const isGenericData = mergedConfig.backgroundImage?.startsWith('data:');
          const isMissing = !mergedConfig.backgroundImage;

          if (localBg && (isPlaceholder || isGenericData || isMissing)) {
             mergedConfig.backgroundImage = localBg;
          }
          if (localAlarm && !mergedConfig.defaultAlarmSound) {
             mergedConfig.defaultAlarmSound = localAlarm;
          }
          setUiConfig(prev => ({ ...prev, ...mergedConfig }));
        } else if (localBg) {
           setUiConfig(prev => ({ ...prev, backgroundImage: localBg }));
        }
      } catch (e) { console.error("[Nexus] Data Recovery Fault", e); }
    };
    loadData();
  }, [session]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--glass-blur', `${uiConfig.blurIntensity ?? 16}px`);
    root.style.setProperty('--glass-opacity', `${uiConfig.transparency ?? 0.15}`);
    root.style.setProperty('--accent-color', uiConfig.accentColor ?? '#6366f1');
    const hex = (uiConfig.accentColor ?? '#6366f1').replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16), g = parseInt(hex.substring(2, 4), 16), b = parseInt(hex.substring(4, 6), 16);
    root.style.setProperty('--accent-rgb', `${r} ${g} ${b}`);
  }, [uiConfig]);

  const handleTaskToggle = useCallback(async (id: string, customDate?: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const pDate = customDate || getProductivityDate();
    const currentStatus = !!task.completion_history?.[pDate];
    const newHistory = { ...(task.completion_history || {}), [pDate]: !currentStatus };
    
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completion_history: newHistory, completed: !currentStatus } : t));
    
    if (session) {
      const { error } = await supabase.from('tasks').update({ completion_history: newHistory }).eq('id', id);
      if (error) {
        console.error("[Nexus] Sync Fault", error.message);
        setTasks(prev => prev.map(t => t.id === id ? { ...t, completion_history: task.completion_history, completed: currentStatus } : t));
      }
    }
  }, [tasks, session]);

  const handleSaveTask = useCallback(async (taskToSave: Task) => {
    const isNew = taskToSave.id === 'new';
    let finalTask: Task;
    
    if (isNew) {
      finalTask = { 
        ...taskToSave, 
        id: crypto.randomUUID(), 
        created_at: new Date().toISOString(),
        completion_history: {} 
      };
      setTasks(prev => [...prev, finalTask]);
    } else {
      const existing = tasks.find(t => t.id === taskToSave.id);
      finalTask = { 
        ...(existing || {}), 
        ...taskToSave 
      } as Task;
      setTasks(prev => prev.map(t => t.id === finalTask.id ? finalTask : t));
    }
    
    setEditingTask(null);
    if (session) {
      const { error } = await supabase.from('tasks').upsert(mapTaskToDb(finalTask, session.user.id));
      if (error) console.error("[Nexus] Write Operation Fault", error.message);
    }
  }, [tasks, session]);

  const handleDeleteTask = useCallback(async (id: string) => {
    const deletedTask = tasks.find(t => t.id === id);
    setTasks(prev => prev.filter(t => t.id !== id));
    if (session) {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) {
        console.error("[Nexus] Delete Operation Fault", error.message);
        if (deletedTask) setTasks(prev => [...prev, deletedTask]); 
      }
    }
  }, [tasks, session]);

  const handleSmartCommand = async () => {
    const input = chatInput.trim();
    if (!input) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsProcessing(true);
    setSysStatus('Cognitive Core Active');
    try {
      const currentUi = latestUiConfig.current; 
      const result = await interpretCommand(input, tasks, currentUi.language);
      
      if (result.actionType === 'routine_creation' && result.tasksToCreate && result.tasksToCreate.length > 0) {
        setSysStatus('Batch Seeding');
        const newTasks: Task[] = result.tasksToCreate.map(tp => ({ 
          ...EMPTY_TASK, 
          id: crypto.randomUUID(), 
          ...tp, 
          created_at: new Date().toISOString() 
        }));
        
        setTasks(prev => [...prev, ...newTasks]);
        
        if (session) {
          const dbPayload = newTasks.map(t => mapTaskToDb(t, session.user.id));
          const { error } = await supabase.from('tasks').insert(dbPayload);
          if (error) console.error("[Nexus] Routine Injection Fault:", error.message);
        }
        
        const futureDates = [...new Set(newTasks.map(t => t.deadline).filter(Boolean))];
        const msg = futureDates.length > 0 
          ? `Neural mapping complete. Manifested ${newTasks.length} objectives across ${futureDates.length} temporal points.` 
          : `Patterns synthesized. Registered ${newTasks.length} objectives in current cycle.`;
          
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: msg, timestamp: Date.now() }]);
      } else if (result.actionType === 'ui' && result.uiChange) {
        const newUi = { ...currentUi, ...result.uiChange };
        setUiConfig(newUi);
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: result.reply, timestamp: Date.now() }]);
        if (session) await supabase.from('user_preferences').upsert({ user_id: session.user.id, config: newUi });
      } else {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: result.reply, timestamp: Date.now() }]);
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { id: 'err', role: 'ai', content: "Core Logic Fault. Recalibrating...", timestamp: Date.now() }]);
    } finally { setIsProcessing(false); setSysStatus('Active'); }
  };

  const handleOptimizeSchedule = async () => {
    setIsProcessing(true);
    setSysStatus('Optimizing Entropy');
    const originalTasks = [...tasks];
    try {
      const pDate = getProductivityDate();
      const currentPendingTasks = tasks.filter(t => !t.completed && (!t.deadline || t.deadline === pDate));
      if (currentPendingTasks.length === 0) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: "All objectives clear. No optimization required.", timestamp: Date.now() }]);
        return;
      }
      const schedule = await generateSchedule(currentPendingTasks, uiConfig.language);
      const updatedTasks = tasks.map(pt => {
        const suggestion = schedule.tasks.find(st => st.id === pt.id);
        return suggestion ? { ...pt, scheduled_start: suggestion.scheduled_start } : pt;
      });
      setTasks(updatedTasks);
      if (session) {
        for (const st of schedule.tasks) {
          await supabase.from('tasks').update({ scheduled_start: st.scheduled_start }).eq('id', st.id);
        }
      }
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: schedule.rationale, timestamp: Date.now() }]);
    } catch (e: any) {
      setTasks(originalTasks); 
      setMessages(prev => [...prev, { id: 'err', role: 'ai', content: "Optimization Core Fault.", timestamp: Date.now() }]);
    } finally { setIsProcessing(false); setSysStatus('Active'); }
  };

  const handleGenerateReflection = async () => {
    setIsReflecting(true);
    try {
      const reflection = await generateReflection(tasks, uiConfig.language);
      setReflectionText(reflection);
    } catch (e) { console.error(e); } finally { setIsReflecting(false); }
  };

  const pDate = useMemo(() => getProductivityDate(), []);
  
  const currentTasksView = useMemo(() => tasks.map(t => {
    const isCompletedToday = !!t.completion_history?.[pDate];
    const wasEverCompleted = Object.values(t.completion_history || {}).some(v => v === true);
    const isActuallyDone = t.frequency === 'Once' ? wasEverCompleted : isCompletedToday;
    return { ...t, completed: isActuallyDone };
  }).filter(t => {
    if (t.deadline) return t.deadline === pDate;
    if (t.frequency && t.frequency !== 'Once') {
       const createdStr = t.created_at?.split('T')[0] || '1970-01-01';
       return createdStr <= pDate;
    }
    return true; 
  }), [tasks, pDate]);

  const morningTasks = useMemo(() => currentTasksView.filter(t => !t.completed && t.preferred_time === 'Morning'), [currentTasksView]);
  const afternoonTasks = useMemo(() => currentTasksView.filter(t => !t.completed && t.preferred_time === 'Afternoon'), [currentTasksView]);
  const eveningTasks = useMemo(() => currentTasksView.filter(t => !t.completed && t.preferred_time === 'Evening'), [currentTasksView]);
  const nightTasks = useMemo(() => currentTasksView.filter(t => !t.completed && t.preferred_time === 'Night'), [currentTasksView]);
  const completedTasks = useMemo(() => currentTasksView.filter(t => t.completed), [currentTasksView]);

  const renderContent = () => {
    switch (activeTab) {
      case 'journal': return <JournalView entries={journals} onSaveEntry={async (e) => { setJournals(prev => [e, ...prev.filter(j=>j.id!==e.id)]); if (session) await supabase.from('journal_entries').upsert({...e, user_id: session.user.id}); }} onDeleteEntry={() => {}} language={uiConfig.language} t={translations} />;
      case 'history': return <HistoryView tasks={tasks} translations={translations} onToggleTask={handleTaskToggle} onDeleteTask={handleDeleteTask} onEditTask={setEditingTask} onAddTask={(data) => setEditingTask({ ...EMPTY_TASK, ...data })} />;
      case 'calendar': return <div className="space-y-6 animate-in fade-in duration-500 pb-20 px-1"><h2 className="text-2xl font-bold mb-4 text-foreground">{translations.schedule}</h2><TaskList title={translations.yourAgenda} tasks={currentTasksView.filter(t => !t.completed).sort((a,b) => (a.scheduled_start || '23:59').localeCompare(b.scheduled_start || '23:59'))} onToggle={handleTaskToggle} onDelete={handleDeleteTask} onEdit={setEditingTask} t={translations} /></div>;
      default: return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-36 md:pb-24 px-1">
          <section><AnalyticsView tasks={currentTasksView} onGenerateReflection={handleGenerateReflection} reflectionText={reflectionText} isGeneratingReflection={isReflecting} t={translations} /></section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="space-y-4"><TaskList title={translations.morning} tasks={morningTasks} onToggle={handleTaskToggle} onDelete={handleDeleteTask} onEdit={setEditingTask} t={translations} /></div>
            <div className="space-y-4"><TaskList title={translations.afternoon} tasks={afternoonTasks} onToggle={handleTaskToggle} onDelete={handleDeleteTask} onEdit={setEditingTask} t={translations} /></div>
            <div className="space-y-4"><TaskList title={translations.evening} tasks={eveningTasks} onToggle={handleTaskToggle} onDelete={handleDeleteTask} onEdit={setEditingTask} t={translations} /></div>
            <div className="space-y-4"><TaskList title={translations.night} tasks={nightTasks} onToggle={handleTaskToggle} onDelete={handleDeleteTask} onEdit={setEditingTask} t={translations} /></div>
          </div>
          {completedTasks.length > 0 && <div className="mt-8 pt-8 border-t border-white/5 opacity-60"><TaskList title={translations.completed} tasks={completedTasks} onToggle={handleTaskToggle} onDelete={handleDeleteTask} onEdit={setEditingTask} t={translations} /></div>}
        </div>
      );
    }
  };

  if (loadingAuth) return <div className="bg-black h-screen flex items-center justify-center text-white font-mono uppercase tracking-[0.2em] animate-pulse">NEXUS_CORE_INITIALIZING...</div>;
  if (!session) return <Auth />;

  const bgImageValue = uiConfig.backgroundImage ?? INITIAL_UI.backgroundImage;
  const bgStyle = bgImageValue.startsWith('url') || bgImageValue.startsWith('data:') ? (bgImageValue.startsWith('url') ? bgImageValue : `url("${bgImageValue}")`) : `url("${bgImageValue}")`;

  const navItems = [
    { id: 'dashboard', icon: Layout, label: translations.dashboard },
    { id: 'calendar', icon: Calendar, label: translations.schedule },
    { id: 'history', icon: History, label: translations.history },
    { id: 'journal', icon: Book, label: translations.journal }
  ];

  return (
    <div className="w-full h-[100dvh] relative flex overflow-hidden font-sans bg-black text-foreground selection:bg-accent-500/30">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {uiConfig.backgroundType === 'video' && bgImageValue !== '(Local Data Asset)' ? (
          <video key={bgImageValue} src={bgImageValue} autoPlay loop muted playsInline className="w-full h-full object-cover transition-opacity duration-1000 scale-[1.02]" style={{ opacity: 1 }} />
        ) : (
          <div className="w-full h-full bg-cover bg-center transition-all duration-1000 scale-[1.02]" style={{ backgroundImage: bgStyle }} />
        )}
        <BackgroundEffects effect={uiConfig.backgroundEffect ?? 'none'} speed={uiConfig.animationSpeed ?? 'normal'} />
        <div className="absolute inset-0 transition-colors duration-700" style={{ backgroundColor: `rgba(0,0,0, ${0.1 + (100 - (uiConfig.backgroundBrightness ?? 35))/150})` }} /> 
      </div>
      
      <div className="relative z-10 w-full h-full flex overflow-hidden">
        {/* Sidebar for Desktop */}
        <nav className="w-20 lg:w-64 glass-panel border-r-0 flex flex-col justify-between p-4 z-20 hidden md:flex border-r-[1px] !border-r-white/5">
          <div className="space-y-8">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3 text-2xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-purple-400">
                <Sparkles className="text-accent-500" /> <span className="hidden lg:block">NEXUS</span>
              </div>
              <div className="hidden lg:flex items-center gap-2 text-[10px] text-accent-400/60 uppercase tracking-widest font-mono pl-1">
                <Activity size={10} className="animate-pulse" /> {sysStatus}
              </div>
            </div>
            <button onClick={() => setEditingTask({ ...EMPTY_TASK })} className="w-full bg-accent-500 hover:bg-accent-600 text-white p-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 group">
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" /> <span className="hidden lg:block font-medium">{translations.newTask}</span>
            </button>
            <div className="space-y-1">
              {navItems.map(item => (
                <button 
                  key={item.id} 
                  onClick={() => setActiveTab(item.id as any)} 
                  className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-white/10 text-white font-semibold' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
                >
                  <item.icon size={20} /> <span className="hidden lg:block">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-2 text-white/50 hover:text-white p-2 w-full transition-colors"><Settings size={18} /> <span className="hidden lg:block text-sm">{translations.settings}</span></button>
            <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-2 text-red-400/60 hover:text-red-400 p-2 w-full transition-colors"><LogOut size={18} /> <span className="hidden lg:block text-sm">Terminate Session</span></button>
          </div>
        </nav>

        {/* Bottom Nav for Mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 glass-panel z-50 flex justify-around items-center px-4 border-t !border-t-white/10 pb-4">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`flex flex-col items-center justify-center gap-1 transition-all flex-1 h-full ${activeTab === item.id ? 'text-accent-400' : 'text-white/40'}`}>
              <item.icon size={22} className={activeTab === item.id ? 'scale-110' : ''} />
              <span className="text-[9px] font-bold uppercase tracking-tight">{item.label}</span>
            </button>
          ))}
          <button onClick={() => setIsSettingsOpen(true)} className="flex flex-col items-center justify-center gap-1 text-white/40 flex-1 h-full">
            <Settings size={22} />
            <span className="text-[9px] font-bold uppercase tracking-tight">{translations.settings}</span>
          </button>
        </nav>

        <main className="flex-1 flex flex-col relative overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 lg:p-10 pt-8 md:pt-10 custom-scrollbar">
            <div className="max-w-6xl mx-auto">
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center justify-between w-full md:w-auto">
                  <div className="animate-in slide-in-from-left duration-500">
                    <h1 className="text-3xl md:text-4xl font-bold mb-1 text-white tracking-tight">{translations[activeTab as keyof TranslationDictionary] || translations.dashboard}</h1>
                    <p className="text-white/50 text-xs md:text-sm font-medium">{translations.overview}</p>
                  </div>
                  <div className="md:hidden flex items-center gap-3">
                    <button onClick={() => setEditingTask({ ...EMPTY_TASK })} className="p-3 bg-accent-500 rounded-full text-white shadow-xl active:scale-90 transition-transform"><Plus size={24}/></button>
                  </div>
                </div>
                {activeTab === 'dashboard' && (
                  <button 
                    onClick={handleOptimizeSchedule} 
                    disabled={isProcessing} 
                    className="flex items-center justify-center gap-3 bg-accent-500 hover:bg-accent-600 text-white px-6 py-3 rounded-xl transition-all disabled:opacity-50 text-sm md:text-base font-semibold shadow-lg shadow-accent-500/20 active:scale-95 animate-in slide-in-from-right duration-500"
                  >
                    {isProcessing ? <RefreshCw className="animate-spin" size={20} /> : <Zap size={20} fill="currentColor" />} {translations.optimizeDay}
                  </button>
                )}
              </header>
              {renderContent()}
            </div>
          </div>

          {/* Floating Assistant Button */}
          <button 
            onClick={() => setIsChatOpen(!isChatOpen)} 
            className={`fixed bottom-24 md:bottom-8 right-6 md:right-10 z-[60] p-5 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-90 ${isChatOpen ? 'bg-red-500 rotate-45' : 'bg-accent-500 hover:shadow-accent-500/40'}`}
          >
            {isChatOpen ? <X size={26} className="text-white" /> : <MessageCircle size={26} className="text-white" />}
          </button>

          {/* Assistant Chat Window */}
          {isChatOpen && (
            <div className="fixed inset-x-6 bottom-44 md:bottom-28 md:right-10 md:left-auto md:w-full md:max-w-[420px] z-[55] animate-in slide-in-from-bottom-6 fade-in duration-300">
              <GlassCard className="flex flex-col h-[50vh] md:h-[520px] p-0 !bg-black/90 border-white/10 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
                <div className="p-5 border-b border-white/5 flex items-center gap-4 bg-white/5">
                   <div className="w-10 h-10 rounded-full bg-accent-500 flex items-center justify-center text-white shadow-lg"><Cpu size={20} /></div>
                   <div>
                     <p className="text-sm font-bold text-white uppercase tracking-tighter">Nexus Intelligence</p>
                     <p className="text-[10px] text-accent-400 font-mono flex items-center gap-1.5"><Activity size={8} className="animate-pulse" /> Core Synchronized</p>
                   </div>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-gradient-to-b from-transparent to-black/20">
                  {messages.map(m => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${m.role === 'user' ? 'bg-accent-500 text-white shadow-lg' : 'bg-white/5 text-white/90 border border-white/10'}`}>{m.content}</div>
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="bg-white/5 text-white/50 border border-white/5 px-4 py-2.5 rounded-2xl text-xs flex items-center gap-3">
                        <RefreshCw size={12} className="animate-spin" /> Synthesizing parameters...
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-4 border-t border-white/5 flex gap-3 bg-white/[0.02]">
                  <input 
                    value={chatInput} 
                    onChange={e => setChatInput(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && handleSmartCommand()} 
                    placeholder={translations.askNexus} 
                    className="flex-1 bg-white/5 rounded-xl border border-white/5 outline-none text-white text-sm px-4 py-2 focus:border-accent-500 transition-colors"
                  />
                  <button 
                    onClick={handleSmartCommand} 
                    disabled={!chatInput.trim() || isProcessing} 
                    className="p-3 bg-accent-500 rounded-xl text-white disabled:opacity-30 hover:bg-accent-600 transition-all active:scale-95"
                  >
                    {isProcessing ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
                  </button>
                </div>
              </GlassCard>
            </div>
          )}

          {editingTask && <EditTaskModal task={editingTask} onSave={handleSaveTask} onCancel={() => setEditingTask(null)} t={translations} />}
          {isSettingsOpen && <SettingsModal config={uiConfig} onSave={async (c) => { 
            setUiConfig(c); 
            setIsSettingsOpen(false); 
            const configToSync = { ...c };
            if (c.backgroundImage?.startsWith('data:')) {
              localStorage.setItem('nexus_bg_data', c.backgroundImage);
              configToSync.backgroundImage = '(Local Data Asset)'; 
            } else { localStorage.removeItem('nexus_bg_data'); }
            if (c.defaultAlarmSound?.startsWith('data:')) {
              localStorage.setItem('nexus_alarm_data', c.defaultAlarmSound);
              configToSync.defaultAlarmSound = undefined; 
            } else { localStorage.removeItem('nexus_alarm_data'); }
            if (session) {
              try {
                const { error } = await supabase.from('user_preferences').upsert({ user_id: session.user.id, config: configToSync });
                if (error) console.error("[Nexus] Preferences Sync Fault", error.message);
              } catch (fetchErr) { console.warn("[Nexus] Cloud backup failed. Local persistence remains active.", fetchErr); }
            }
          }} onCancel={() => setIsSettingsOpen(false)} t={translations} />}
        </main>
      </div>
    </div>
  );
};

export default App;