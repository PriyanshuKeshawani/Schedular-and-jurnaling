import React from 'react';
import { Task, TranslationDictionary } from '../types';
import { GlassCard } from './GlassCard';
import { BarChart2, CheckCircle, Clock, Zap } from 'lucide-react';

interface AnalyticsViewProps {
  tasks: Task[];
  onGenerateReflection: () => void;
  reflectionText: string;
  isGeneratingReflection: boolean;
  t: TranslationDictionary;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ 
  tasks, 
  onGenerateReflection, 
  reflectionText, 
  isGeneratingReflection,
  t
}) => {
  const completedTasks = tasks.filter(t => t.completed);
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  
  const highLoadTasks = tasks.filter(t => t.mental_load === 'High');
  const highLoadCompleted = highLoadTasks.filter(t => t.completed).length;
  
  const totalMinutes = completedTasks.reduce((acc, t) => acc + t.estimated_time_minutes, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassCard className="flex items-center gap-4">
             <div className="p-3 bg-green-500/20 rounded-full text-green-300">
               <CheckCircle size={24} />
             </div>
             <div>
               <p className="text-muted text-sm">{t.completionRate}</p>
               <p className="text-2xl font-bold text-foreground">{completionRate}%</p>
             </div>
          </GlassCard>
          
          <GlassCard className="flex items-center gap-4">
             <div className="p-3 bg-blue-500/20 rounded-full text-blue-300">
               <Clock size={24} />
             </div>
             <div>
               <p className="text-muted text-sm">{t.focusTime}</p>
               <p className="text-2xl font-bold text-foreground">{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</p>
             </div>
          </GlassCard>

          <GlassCard className="flex items-center gap-4">
             <div className="p-3 bg-red-500/20 rounded-full text-red-300">
               <Zap size={24} />
             </div>
             <div>
               <p className="text-muted text-sm">{t.highLoadTasks}</p>
               <p className="text-2xl font-bold text-foreground">{highLoadCompleted} <span className="text-sm text-muted">/ {highLoadTasks.length}</span></p>
             </div>
          </GlassCard>
       </div>

       <GlassCard className="min-h-[200px] flex flex-col">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-xl font-semibold flex items-center gap-2 text-foreground">
               <BarChart2 size={20} /> {t.dailyReflection}
             </h3>
             <button 
               onClick={onGenerateReflection}
               disabled={isGeneratingReflection}
               className="text-xs bg-accent-500 hover:bg-accent-600 px-3 py-1 rounded-full text-white transition-colors disabled:opacity-50"
             >
               {isGeneratingReflection ? t.analyzing : t.generateInsights}
             </button>
          </div>
          
          <div className="flex-1 bg-foreground/5 rounded-xl p-4 text-foreground/80 leading-relaxed font-light">
             {reflectionText ? (
               <p>{reflectionText}</p>
             ) : (
               <p className="text-muted italic text-center mt-8">
                 Click '{t.generateInsights}' to analyze your daily performance patterns.
               </p>
             )}
          </div>
       </GlassCard>
    </div>
  );
};