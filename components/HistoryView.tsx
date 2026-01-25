import React, { useState, useMemo } from 'react';
import { Task, TranslationDictionary } from '../types';
import { GlassCard } from './GlassCard';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Rocket, History, Info } from 'lucide-react';
import { TaskList } from './TaskList';

interface HistoryViewProps {
  tasks: Task[];
  translations: TranslationDictionary;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  onAddTask: (initialData?: Partial<Task>) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ 
  tasks, 
  translations,
  onToggleTask,
  onDeleteTask,
  onEditTask,
  onAddTask
}) => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    if (d.getHours() < 4) d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  
  const [viewMonth, setViewMonth] = useState(new Date());

  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay();

  const handlePrevMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && viewMonth.getMonth() === today.getMonth() && viewMonth.getFullYear() === today.getFullYear();
  };

  const isPlanningRange = (day: number) => {
    const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    return date > today && date <= nextWeek;
  };

  const isRestrictedFuture = (day: number) => {
    const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 14); // Allow 2 weeks planning max
    return date > nextWeek;
  };

  const timelineTasks = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const isFuture = selectedDate > todayStr;

    return tasks.map(t => ({
      ...t,
      completed: !!t.completion_history?.[selectedDate]
    })).filter(t => {
      if (t.deadline === selectedDate) return true;
      if (t.frequency === 'Daily') {
          const createdStr = t.created_at?.split('T')[0] || '1970-01-01';
          return createdStr <= selectedDate;
      }
      if (!isFuture) {
          if (!t.created_at) return true;
          const createdStr = t.created_at.split('T')[0];
          return createdStr <= selectedDate;
      }
      return false;
    });
  }, [tasks, selectedDate]);

  const completedCount = timelineTasks.filter(t => t.completed).length;
  const pendingCount = timelineTasks.filter(t => !t.completed).length;
  const todayISO = new Date().toISOString().split('T')[0];
  const isSelectedInFuture = selectedDate > todayISO;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-32 md:pb-24">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Calendar Picker - Polished for Mobile */}
        <div className="w-full lg:w-80 shrink-0">
          <GlassCard className="p-6 border-white/10 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-xs md:text-sm uppercase tracking-[0.2em] flex items-center gap-2 text-white/70">
                <CalendarIcon size={14} className="text-accent-400" />
                {viewMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex gap-2">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><ChevronLeft size={16}/></button>
                <button onClick={handleNextMonth} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><ChevronRight size={16}/></button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-white/20 mb-3 tracking-widest">
              {['S','M','T','W','T','F','S'].map(d => <div key={d}>{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth(viewMonth.getMonth(), viewMonth.getFullYear()) }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${viewMonth.getFullYear()}-${String(viewMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const active = selectedDate === dateStr;
                const planning = isPlanningRange(day);
                const restricted = isRestrictedFuture(day);

                return (
                  <button
                    key={day}
                    disabled={restricted}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`
                      aspect-square rounded-xl flex flex-col items-center justify-center text-xs md:text-sm transition-all duration-300 relative font-medium
                      ${active ? 'bg-accent-500 text-white shadow-[0_0_20px_rgba(var(--accent-rgb),0.4)] z-10 scale-105' : 'text-white/40 hover:bg-white/5 hover:text-white'}
                      ${isToday(day) && !active ? 'border border-accent-500/30 text-accent-400 font-bold' : ''}
                      ${planning && !active ? 'bg-accent-500/5' : ''}
                      ${restricted ? 'opacity-5 cursor-not-allowed grayscale' : ''}
                    `}
                  >
                    {day}
                    {planning && !active && <div className="absolute bottom-1 w-1 h-1 bg-accent-400 rounded-full" />}
                  </button>
                );
              })}
            </div>
            
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-[9px] text-white/30 uppercase tracking-widest font-bold">
              <Info size={10} /> Limited future seeding active
            </div>
          </GlassCard>
        </div>

        {/* Timeline Log Content */}
        <div className="flex-1 min-w-0">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-white/5 pb-6">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter">
                  {selectedDate === todayISO ? 'Phase: Present' : selectedDate}
                </h2>
                {isSelectedInFuture ? (
                  <span className="bg-accent-500/10 text-accent-400 text-[9px] px-3 py-1 rounded-full border border-accent-500/20 flex items-center gap-2 font-black uppercase tracking-[0.1em] shadow-sm">
                    <Rocket size={12} /> Strategic Seeding
                  </span>
                ) : selectedDate !== todayISO && (
                  <span className="bg-white/5 text-white/30 text-[9px] px-3 py-1 rounded-full border border-white/10 flex items-center gap-2 font-black uppercase tracking-[0.1em]">
                    <History size={12} /> Temporal Archive
                  </span>
                )}
              </div>
              <p className="text-white/40 text-[10px] md:text-xs uppercase tracking-[0.2em] font-medium">
                {isSelectedInFuture ? 'Mapping predictive cognitive load' : translations.historySubtitle}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <span className="text-[10px] bg-green-500/10 text-green-300 border border-green-500/20 px-3 py-1.5 rounded-lg font-bold">
                  {completedCount} Archived
                </span>
                <span className="text-[10px] bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-white/30 font-bold">
                  {timelineTasks.length} Operations
                </span>
              </div>
              <button 
                onClick={() => onAddTask({ deadline: selectedDate })}
                className="p-3 bg-accent-500 rounded-xl text-white hover:bg-accent-600 transition-all active:scale-90 shadow-xl shadow-accent-500/20 group"
                aria-label="Seed task for this date"
              >
                <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>
          </div>

          <div className="space-y-10">
             {timelineTasks.length > 0 ? (
               <div className="animate-in fade-in slide-in-from-right-2 duration-500">
                 <TaskList 
                    title={`${translations.completed} (${completedCount})`}
                    tasks={timelineTasks.filter(t => t.completed)}
                    onToggle={onToggleTask} 
                    onDelete={onDeleteTask}
                    onEdit={onEditTask}
                    t={translations}
                 />
                 <TaskList 
                    title={`${isSelectedInFuture ? 'Seeded Objectives' : 'Pending Operations'} (${pendingCount})`}
                    tasks={timelineTasks.filter(t => !t.completed)}
                    onToggle={onToggleTask}
                    onDelete={onDeleteTask}
                    onEdit={onEditTask}
                    t={translations}
                 />
               </div>
             ) : (
                 <div className="py-24 flex flex-col items-center justify-center text-white/10 text-center animate-in fade-in duration-700">
                    <CalendarIcon size={64} strokeWidth={1} className="mb-4 opacity-5" />
                    <p className="text-sm font-medium uppercase tracking-[0.2em]">
                      {isSelectedInFuture 
                        ? "Temporal void detected. Awaiting seeding."
                        : "No logs found in this cycle."}
                    </p>
                    <button 
                      onClick={() => onAddTask({ deadline: selectedDate })}
                      className="mt-6 text-accent-500 text-xs font-bold uppercase tracking-widest hover:text-accent-400 transition-colors"
                    >
                      Initialize Manual Seed +
                    </button>
                 </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};