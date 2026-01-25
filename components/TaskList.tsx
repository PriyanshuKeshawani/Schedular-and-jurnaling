import React, { memo } from 'react';
import { Task, TranslationDictionary } from '../types';
import { GlassCard } from './GlassCard';
import { 
  Clock, Brain, CheckCircle, CalendarDays, Pencil, Trash2, ListChecks, FileText,
  Dumbbell, Briefcase, Coffee, Heart, Code, Utensils, Music, BookOpen, Sparkles, Activity
} from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  title: string;
  t?: TranslationDictionary;
}

const formatTimeToAMPM = (timeStr: string) => {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = String(minutes).padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${period}`;
};

const getCategoryIcon = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('gym') || cat.includes('work') || cat.includes('fit') || cat.includes('sport')) return <Dumbbell size={14} />;
  if (cat.includes('work') || cat.includes('meet') || cat.includes('job') || cat.includes('office')) return <Briefcase size={14} />;
  if (cat.includes('coffee') || cat.includes('break') || cat.includes('rest') || cat.includes('relax')) return <Coffee size={14} />;
  if (cat.includes('health') || cat.includes('self') || cat.includes('med') || cat.includes('wellness')) return <Heart size={14} />;
  if (cat.includes('code') || cat.includes('dev') || cat.includes('tech') || cat.includes('build')) return <Code size={14} />;
  if (cat.includes('eat') || cat.includes('food') || cat.includes('lunch') || cat.includes('dinner') || cat.includes('cook')) return <Utensils size={14} />;
  if (cat.includes('music') || cat.includes('play') || cat.includes('song') || cat.includes('jam')) return <Music size={14} />;
  if (cat.includes('read') || cat.includes('study') || cat.includes('learn') || cat.includes('class')) return <BookOpen size={14} />;
  if (cat.includes('data') || cat.includes('stat') || cat.includes('report')) return <Activity size={14} />;
  return <Sparkles size={14} />;
};

export const TaskList: React.FC<TaskListProps> = memo(({ tasks, onToggle, onEdit, onDelete, title, t }) => {
  if (tasks.length === 0) return null;

  return (
    <div className="mb-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <h3 className="text-sm md:text-base font-bold text-white/50 mb-5 flex items-center gap-3 uppercase tracking-[0.15em] pl-1">
        {title}
        <span className="w-5 h-5 flex items-center justify-center text-[10px] bg-white/5 border border-white/10 rounded-full font-mono">{tasks.length}</span>
      </h3>
      <div className="space-y-4">
        {tasks.map((task) => (
          <GlassCard 
            key={task.id} 
            className={`flex flex-col gap-3 p-4 group transition-all duration-300 ${task.completed ? 'opacity-40 grayscale-[0.5]' : ''}`}
            hoverEffect={!task.completed}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <button 
                  onClick={() => onToggle(task.id)}
                  className={`
                    mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center
                    transition-all duration-300 flex-shrink-0 active:scale-90
                    ${task.completed ? 'bg-accent-500 border-accent-500 shadow-[0_0_15px_rgba(var(--accent-rgb),0.4)]' : 'border-white/20 hover:border-accent-500'}
                  `}
                >
                  {task.completed && <CheckCircle size={14} className="text-white" />}
                </button>
                
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm md:text-base text-white font-medium truncate tracking-tight transition-all duration-300 ${task.completed ? 'line-through opacity-50' : ''}`}>{task.title}</h4>
                  
                  {/* Metadata Row */}
                  <div className="flex items-center gap-3 text-[10px] text-white/40 mt-1.5 flex-wrap font-medium">
                    <span className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                      <Clock size={11} className="text-accent-400" /> {task.estimated_time_minutes}m
                    </span>
                    <span className={`
                      flex items-center gap-1.5 px-2 py-0.5 rounded-md border
                      ${task.mental_load === 'High' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}
                    `}>
                      {getCategoryIcon(task.category)} {task.category}
                    </span>
                    {task.deadline && (
                       <span className="flex items-center gap-1.5 text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                          <CalendarDays size={11} /> {task.deadline}
                       </span>
                    )}
                    {task.scheduled_start && (
                      <span className="text-accent-400 font-mono flex items-center gap-1.5 bg-accent-500/5 px-2 py-0.5 rounded-md border border-accent-500/10">
                        @ {formatTimeToAMPM(task.scheduled_start)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3 ml-1">
                 <span className={`
                    text-[9px] uppercase tracking-[0.1em] font-black px-2 py-0.5 rounded
                    ${task.priority === 'High' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/5 text-white/30 border border-white/5'}
                 `}>
                   {task.priority}
                 </span>
                 
                 {/* Actions - Modern Icon Buttons */}
                 <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                      className="p-1.5 hover:bg-white/10 rounded-lg text-white/30 hover:text-white transition-colors"
                      aria-label="Edit Object"
                    >
                      <Pencil size={14} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                      className="p-1.5 hover:bg-red-500/20 rounded-lg text-white/30 hover:text-red-400 transition-colors"
                      aria-label="Delete Object"
                    >
                      <Trash2 size={14} />
                    </button>
                 </div>
              </div>
            </div>

            {/* Expanded Content Display */}
            {( (task.subtasks && task.subtasks.length > 0) || task.notes) && !task.completed && (
               <div className="ml-10 pt-4 mt-2 border-t border-white/5 space-y-3 animate-in fade-in duration-300">
                  {task.subtasks && task.subtasks.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[9px] text-white/20 uppercase tracking-[0.2em] font-black">
                        <ListChecks size={11} /> {t?.subtasks || 'Execution Steps'}
                      </div>
                      <ul className="space-y-1.5">
                         {task.subtasks.map((sub, i) => (
                           <li key={i} className="text-[11px] md:text-xs text-white/60 pl-3 border-l-2 border-accent-500/30 py-0.5">{sub}</li>
                         ))}
                      </ul>
                    </div>
                  )}
                  {task.notes && (
                    <div className="space-y-1.5">
                       <div className="flex items-center gap-2 text-[9px] text-white/20 uppercase tracking-[0.2em] font-black">
                        <FileText size={11} /> {t?.notes || 'Core Intel'}
                      </div>
                      <p className="text-[11px] md:text-xs text-white/50 italic leading-relaxed pl-3 border-l-2 border-white/10">{task.notes}</p>
                    </div>
                  )}
               </div>
            )}
          </GlassCard>
        ))}
      </div>
    </div>
  );
});

TaskList.displayName = 'TaskList';