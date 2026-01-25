
import React, { useState, useRef, useEffect } from 'react';
import { Task, Priority, MentalLoad, TimeOfDay, TranslationDictionary } from '../types';
import { GlassCard } from './GlassCard';
import { X, Save, Plus, Trash2, Bell, Upload, Volume2, Play, Square } from 'lucide-react';

interface EditTaskModalProps {
  task: Task;
  onSave: (updatedTask: Task) => void;
  onCancel: () => void;
  t: TranslationDictionary;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, onSave, onCancel, t }) => {
  const [formData, setFormData] = useState<Task>({ ...task });
  const [newSubtask, setNewSubtask] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const isNew = task.id === 'new';

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
    };
  }, []);

  const handleChange = (field: keyof Task, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    setFormData(prev => ({
      ...prev,
      subtasks: [...(prev.subtasks || []), newSubtask]
    }));
    setNewSubtask('');
  };

  const handleRemoveSubtask = (index: number) => {
    setFormData(prev => ({
      ...prev,
      subtasks: (prev.subtasks || []).filter((_, i) => i !== index)
    }));
  };

  const togglePreview = () => {
    if (isPlaying) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
    } else {
      if (!formData.alarmSound) return;
      
      if (!previewAudioRef.current) {
        previewAudioRef.current = new Audio(formData.alarmSound);
        previewAudioRef.current.onended = () => setIsPlaying(false);
      } else {
        previewAudioRef.current.src = formData.alarmSound;
      }
      
      previewAudioRef.current.play().catch(e => console.error("Preview playback failed", e));
      setIsPlaying(true);
    }
  };

  const handleCustomAlarmUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
        alert("Audio file too large. Max 10MB.");
        return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
        // Stop currently playing
        if(isPlaying && previewAudioRef.current) {
            previewAudioRef.current.pause();
            setIsPlaying(false);
        }
        setFormData(prev => ({ 
            ...prev, 
            alarmSound: event.target?.result as string,
            alarmSoundName: file.name 
        }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <GlassCard className="w-full max-w-lg max-h-[90vh] overflow-y-auto !bg-[#1a1a1a]/90 border-glass-border">
        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
          <h2 className="text-xl font-bold text-white">{isNew ? t.newTask : 'Edit Task'}</h2>
          <button onClick={onCancel} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} className="text-white/70" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1">Title</label>
            <input 
              type="text" 
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., Prepare Q3 Report"
              className="w-full glass-input rounded-lg p-3 text-white focus:outline-none focus:border-accent-500 transition-colors"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Time */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1">Duration (min)</label>
              <input 
                type="number" 
                value={formData.estimated_time_minutes}
                onChange={(e) => handleChange('estimated_time_minutes', parseInt(e.target.value))}
                className="w-full glass-input rounded-lg p-3 text-white focus:outline-none focus:border-accent-500"
              />
            </div>
             {/* Deadline */}
             <div>
              <label className="block text-xs font-medium text-white/60 mb-1">Deadline</label>
              <input 
                type="date" 
                value={formData.deadline || ''}
                onChange={(e) => handleChange('deadline', e.target.value)}
                className="w-full glass-input rounded-lg p-3 text-white focus:outline-none focus:border-accent-500"
              />
            </div>
          </div>

          {/* ALARM SECTION */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
             <div className="flex justify-between items-center">
                 <label className="text-xs font-bold text-accent-400 uppercase tracking-wider flex items-center gap-2">
                    <Bell size={14} /> {t.alarm}
                 </label>
                 <div className="flex items-center gap-2">
                     <span className="text-xs text-white/50">{formData.isAlarmEnabled ? 'On' : 'Off'}</span>
                     <button 
                        onClick={() => handleChange('isAlarmEnabled', !formData.isAlarmEnabled)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${formData.isAlarmEnabled ? 'bg-accent-500' : 'bg-white/10'}`}
                     >
                         <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${formData.isAlarmEnabled ? 'translate-x-5' : ''}`} />
                     </button>
                 </div>
             </div>

             {formData.isAlarmEnabled && (
                 <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                    <div>
                        <label className="block text-[10px] font-medium text-white/60 mb-1">Trigger Time</label>
                        <input 
                            type="time" 
                            value={formData.alarmTime || formData.scheduled_start || ''}
                            onChange={(e) => handleChange('alarmTime', e.target.value)}
                            className="w-full glass-input rounded-lg p-2 text-white text-sm font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-medium text-white/60 mb-1">Sound</label>
                        <input 
                           type="file" 
                           ref={audioInputRef}
                           className="hidden"
                           accept="audio/*"
                           onChange={handleCustomAlarmUpload}
                        />
                         <div className="flex items-center gap-2">
                             <button 
                               onClick={() => audioInputRef.current?.click()}
                               className="w-full glass-input p-2 rounded-lg text-sm text-left text-white/70 hover:text-white transition-colors flex items-center justify-between min-w-0"
                             >
                               <span className="truncate pr-2">
                                  {formData.alarmSoundName ? formData.alarmSoundName : (formData.alarmSound ? 'Custom Tone' : 'Default')}
                               </span>
                               {formData.alarmSound ? <Volume2 size={12} className="text-accent-400 flex-shrink-0" /> : <Upload size={12} className="opacity-50 flex-shrink-0" />}
                             </button>

                             {/* Play/Stop Preview */}
                             {formData.alarmSound && (
                                <button
                                    onClick={togglePreview}
                                    className={`p-2 rounded-lg transition-colors flex-shrink-0 ${isPlaying ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}
                                    title={isPlaying ? "Stop Preview" : "Play Preview"}
                                >
                                    {isPlaying ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                                </button>
                             )}
                         </div>

                         {formData.alarmSound && (
                            <button 
                                onClick={() => {
                                    if (isPlaying && previewAudioRef.current) {
                                        previewAudioRef.current.pause();
                                        setIsPlaying(false);
                                    }
                                    setFormData(prev => ({...prev, alarmSound: undefined, alarmSoundName: undefined}));
                                }}
                                className="text-[10px] text-red-400 mt-1 hover:underline"
                            >
                                Reset to Default
                            </button>
                         )}
                    </div>
                 </div>
             )}
          </div>

          <div className="grid grid-cols-2 gap-4">
             {/* Scheduled Start Time */}
             <div>
              <label className="block text-xs font-medium text-white/60 mb-1">Scheduled Start</label>
              <input 
                type="time" 
                value={formData.scheduled_start || ''}
                onChange={(e) => handleChange('scheduled_start', e.target.value)}
                className="w-full glass-input rounded-lg p-3 text-white focus:outline-none focus:border-accent-500 font-mono"
              />
            </div>
             {/* Preferred Time */}
             <div>
              <label className="block text-xs font-medium text-white/60 mb-1">Time of Day Preference</label>
              <select 
                value={formData.preferred_time}
                onChange={(e) => handleChange('preferred_time', e.target.value)}
                className="w-full glass-input rounded-lg p-3 text-white focus:outline-none focus:border-accent-500"
              >
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
                <option value="Night">Night</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1">Priority</label>
              <select 
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="w-full glass-input rounded-lg p-3 text-white focus:outline-none focus:border-accent-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            {/* Mental Load */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1">Mental Load</label>
              <select 
                value={formData.mental_load}
                onChange={(e) => handleChange('mental_load', e.target.value)}
                className="w-full glass-input rounded-lg p-3 text-white focus:outline-none focus:border-accent-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          {/* Subtasks */}
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1">{t.subtasks}</label>
            <div className="flex gap-2 mb-2">
              <input 
                type="text" 
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                placeholder="Add step..."
                className="flex-1 glass-input rounded-lg p-2 text-sm text-white focus:outline-none focus:border-accent-500"
              />
              <button 
                onClick={handleAddSubtask}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                <Plus size={18} />
              </button>
            </div>
            <div className="space-y-2">
              {formData.subtasks?.map((sub, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white/5 p-2 rounded text-sm text-white/90 group">
                  <span>{sub}</span>
                  <button onClick={() => handleRemoveSubtask(idx)} className="text-white/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1">{t.notes}</label>
            <textarea 
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full glass-input rounded-lg p-3 text-white focus:outline-none focus:border-accent-500 min-h-[80px]"
              placeholder="Add extra details here..."
            />
          </div>

        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-white/70 hover:bg-white/10 transition-colors"
          >
            {t.cancel}
          </button>
          <button 
            onClick={() => onSave(formData)}
            className="px-4 py-2 rounded-lg bg-accent-500 hover:bg-accent-600 text-white font-medium flex items-center gap-2 transition-colors shadow-lg shadow-accent-500/20"
          >
            <Save size={18} />
            {isNew ? t.newTask : t.save}
          </button>
        </div>
      </GlassCard>
    </div>
  );
};
